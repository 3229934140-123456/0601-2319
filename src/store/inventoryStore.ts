import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Inventory, Material, PurchaseSuggestion } from '@/types';
import { inventories as mockInventories, materials } from '@/mock/data';
import { generateId, getDaysDiff } from '@/utils';
import { useScrapStore } from './scrapStore';
import { usePurchaseStore } from './purchaseStore';

interface InventoryState {
  inventories: Inventory[];
  getInventories: () => Inventory[];
  getAvailableInventories: () => Inventory[];
  getWarningInventories: () => Inventory[];
  getNearExpiryInventories: () => Inventory[];
  getExpiredInventories: () => Inventory[];
  getLockedInventories: () => Inventory[];
  updateInventory: (id: string, quantity: number) => void;
  lockInventory: (id: string) => void;
  unlockInventory: (id: string) => void;
  lockExpiredInventory: () => { count: number; scrapCount: number };
  processAutoLockOnLoad: () => { count: number; scrapCount: number };
  updateInventoryStatus: () => void;
  generatePurchaseSuggestions: () => { count: number; newCount: number };
  calculateMaterialStock: (materialId: string) => { total: number; available: number; locked: number };
  getAvailableInventoryByMaterial: (materialId: string) => Inventory[];
}

const computeInventoryStatus = (inv: Inventory): Inventory['status'] => {
  const daysToExpiry = getDaysDiff(inv.expiryDate);
  
  if (inv.status === 'locked') return 'locked';
  if (daysToExpiry <= 0) return 'expired';
  if (daysToExpiry <= 90) return 'near_expiry';
  
  const mat = materials.find(m => m.id === inv.materialId);
  if (mat && inv.quantity < mat.safetyStock * 0.5) return 'warning';
  
  return 'normal';
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      inventories: mockInventories.map(inv => ({
        ...inv,
        daysToExpiry: getDaysDiff(inv.expiryDate),
        status: computeInventoryStatus(inv),
      })),

      getInventories: () => get().inventories,

      getAvailableInventories: () =>
        get().inventories.filter(inv =>
          inv.status !== 'locked' && inv.status !== 'expired' && inv.quantity > 0
        ),

      getWarningInventories: () =>
        get().inventories.filter(inv => {
          const mat = materials.find(m => m.id === inv.materialId);
          return mat && inv.quantity < mat.safetyStock && inv.status !== 'locked';
        }),

      getNearExpiryInventories: () =>
        get().inventories.filter(inv => {
          const days = getDaysDiff(inv.expiryDate);
          return days > 0 && days <= 90 && inv.status !== 'locked';
        }),

      getExpiredInventories: () =>
        get().inventories.filter(inv => {
          const days = getDaysDiff(inv.expiryDate);
          return days <= 0 && inv.status !== 'locked';
        }),

      getLockedInventories: () =>
        get().inventories.filter(inv => inv.status === 'locked'),

      updateInventory: (id, quantity) => {
        set(state => ({
          inventories: state.inventories.map(inv => {
            if (inv.id !== id) return inv;
            const newInv = {
              ...inv,
              quantity,
              totalValue: quantity * inv.unitPrice,
              daysToExpiry: getDaysDiff(inv.expiryDate),
            };
            return { ...newInv, status: computeInventoryStatus(newInv) };
          }),
        }));
      },

      lockInventory: (id) => {
        set(state => ({
          inventories: state.inventories.map(inv =>
            inv.id === id ? { ...inv, status: 'locked' } : inv
          ),
        }));
      },

      unlockInventory: (id) => {
        set(state => ({
          inventories: state.inventories.map(inv => {
            if (inv.id !== id) return inv;
            const newInv = { ...inv, daysToExpiry: getDaysDiff(inv.expiryDate) };
            return { ...newInv, status: computeInventoryStatus(newInv) };
          }),
        }));
      },

      lockExpiredInventory: () => {
        const scrapStore = useScrapStore.getState();
        const expired = get().getExpiredInventories();
        let scrapCount = 0;

        expired.forEach(inv => {
          const existing = scrapStore.getScrapByInventoryId(inv.id);
          if (!existing) {
            scrapStore.createScrapOrder({
              inventoryId: inv.id,
              materialId: inv.materialId,
              materialName: inv.materialName,
              batchNo: inv.batchNo,
              quantity: inv.quantity,
              unit: inv.unit,
              unitPrice: inv.unitPrice,
              totalValue: inv.totalValue,
              reason: '耗材过期自动报废',
            });
            scrapCount++;
          }
        });

        set(state => ({
          inventories: state.inventories.map(inv => {
            const days = getDaysDiff(inv.expiryDate);
            if (days <= 0 && inv.status !== 'locked') {
              return { ...inv, status: 'locked', daysToExpiry: days };
            }
            return { ...inv, daysToExpiry: days };
          }),
        }));

        return { count: expired.length, scrapCount };
      },

      processAutoLockOnLoad: () => {
        get().updateInventoryStatus();
        return get().lockExpiredInventory();
      },

      updateInventoryStatus: () => {
        set(state => ({
          inventories: state.inventories.map(inv => {
            if (inv.status === 'locked') return inv;
            const daysToExpiry = getDaysDiff(inv.expiryDate);
            const status = computeInventoryStatus({ ...inv, daysToExpiry });
            return { ...inv, daysToExpiry, status };
          }),
        }));
      },

      generatePurchaseSuggestions: () => {
        const purchaseStore = usePurchaseStore.getState();
        const warnings = get().getWarningInventories();
        const existingSuggestions = purchaseStore.getSuggestions();
        let count = 0;
        let newCount = 0;

        const materialStockMap = new Map<string, { total: number; safetyStock: number; mat: Material }>();

        for (const inv of warnings) {
          const mat = materials.find(m => m.id === inv.materialId);
          if (!mat) continue;

          const existing = materialStockMap.get(inv.materialId) || { total: 0, safetyStock: mat.safetyStock, mat };
          existing.total += inv.quantity;
          materialStockMap.set(inv.materialId, existing);
        }

        for (const [materialId, data] of materialStockMap) {
          const existingPending = existingSuggestions.find(
            s => s.materialId === materialId && s.status === 'pending'
          );
          if (existingPending) {
            count++;
            continue;
          }

          const suggestQty = Math.max(
            data.safetyStock * 2 - data.total,
            data.safetyStock
          );

          purchaseStore.addSuggestion({
            materialId,
            materialName: data.mat.name,
            category: data.mat.category,
            currentStock: data.total,
            safetyStock: data.safetyStock,
            suggestQty,
            unit: data.mat.unit,
            reason: '库存低于安全线，系统自动生成采购建议',
          });
          newCount++;
          count++;
        }

        return { count, newCount };
      },

      calculateMaterialStock: (materialId) => {
        const invs = get().inventories.filter(inv => inv.materialId === materialId);
        return {
          total: invs.reduce((sum, inv) => sum + inv.quantity, 0),
          available: invs.filter(inv => inv.status !== 'locked' && inv.status !== 'expired')
            .reduce((sum, inv) => sum + inv.quantity, 0),
          locked: invs.filter(inv => inv.status === 'locked')
            .reduce((sum, inv) => sum + inv.quantity, 0),
        };
      },

      getAvailableInventoryByMaterial: (materialId) =>
        get().inventories
          .filter(inv =>
            inv.materialId === materialId &&
            inv.quantity > 0 &&
            inv.status !== 'locked' &&
            inv.status !== 'expired'
          )
          .sort((a, b) => {
            const daysA = a.daysToExpiry ?? 9999;
            const daysB = b.daysToExpiry ?? 9999;
            return daysA - daysB;
          }),
    }),
    {
      name: 'inventory-storage',
    }
  )
);
