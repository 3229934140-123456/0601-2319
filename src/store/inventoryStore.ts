import { create } from 'zustand';
import type { Inventory } from '@/types';
import { inventories as mockInventories } from '@/mock/data';

interface InventoryState {
  inventories: Inventory[];
  getInventories: () => Inventory[];
  getWarningInventories: () => Inventory[];
  getNearExpiryInventories: () => Inventory[];
  getExpiredInventories: () => Inventory[];
  updateInventory: (id: string, quantity: number) => void;
  lockExpiredInventory: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventories: mockInventories,

  getInventories: () => get().inventories,

  getWarningInventories: () => get().inventories.filter(inv => inv.status === 'warning'),

  getNearExpiryInventories: () => get().inventories.filter(inv => inv.status === 'near_expiry'),

  getExpiredInventories: () => get().inventories.filter(inv => inv.status === 'expired'),

  updateInventory: (id, quantity) => {
    set(state => ({
      inventories: state.inventories.map(inv =>
        inv.id === id ? { ...inv, quantity, totalValue: quantity * inv.unitPrice } : inv
      ),
    }));
  },

  lockExpiredInventory: () => {
    set(state => ({
      inventories: state.inventories.map(inv =>
        inv.status === 'expired' ? { ...inv, status: 'locked' } : inv
      ),
    }));
  },
}));
