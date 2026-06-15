import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PurchaseSuggestion, PurchaseOrder, PurchaseOrderItem } from '@/types';
import { purchaseSuggestions as mockSuggestions, purchaseOrders as mockOrders } from '@/mock/data';
import { generateId } from '@/utils';

interface PurchaseState {
  suggestions: PurchaseSuggestion[];
  orders: PurchaseOrder[];
  getSuggestions: () => PurchaseSuggestion[];
  getPendingSuggestions: () => PurchaseSuggestion[];
  getOrders: () => PurchaseOrder[];
  getPendingApprovals: (role: string) => PurchaseOrder[];
  addSuggestion: (data: Omit<PurchaseSuggestion, 'id' | 'status' | 'createTime'>) => PurchaseSuggestion | null;
  processSuggestion: (id: string) => void;
  ignoreSuggestion: (id: string) => void;
  createOrder: (data: Omit<PurchaseOrder, 'id' | 'status' | 'approvalStatus' | 'currentApprover' | 'approvalLevel' | 'createTime' | 'items' | 'totalAmount' | 'deadline'> & { items: Omit<PurchaseOrderItem, 'id' | 'subtotal'>[] }) => PurchaseOrder;
  approveOrder: (id: string, approverId?: string, approverName?: string) => void;
  rejectOrder: (id: string, approverId?: string, approverName?: string) => void;
  updateOrderStatus: (id: string, status: PurchaseOrder['status']) => void;
  getSuggestionByMaterialId: (materialId: string) => PurchaseSuggestion | undefined;
  escalatePurchaseTimeout: (id: string) => boolean;
}

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      suggestions: mockSuggestions,
      orders: mockOrders,

      getSuggestions: () => get().suggestions,

      getPendingSuggestions: () => get().suggestions.filter(s => s.status === 'pending'),

      getOrders: () => get().orders,

      getPendingApprovals: (role) => {
        const pending = get().orders.filter(o => o.approvalStatus === 'pending');
        if (role === 'equipment') return pending.filter(o => o.approvalLevel === 1);
        if (role === 'admin') return pending.filter(o => o.approvalLevel === 2);
        return [];
      },

      getSuggestionByMaterialId: (materialId) =>
        get().suggestions.find(
          s => s.materialId === materialId && s.status === 'pending'
        ),

      addSuggestion: (data) => {
        const existing = get().getSuggestionByMaterialId(data.materialId);
        if (existing) return null;

        const suggestion: PurchaseSuggestion = {
          id: generateId(),
          ...data,
          status: 'pending',
          createTime: new Date().toISOString(),
        };
        set(state => ({ suggestions: [suggestion, ...state.suggestions] }));
        return suggestion;
      },

      processSuggestion: (id) => {
        set(state => ({
          suggestions: state.suggestions.map(s =>
            s.id === id ? { ...s, status: 'processed' } : s
          ),
        }));
      },

      ignoreSuggestion: (id) => {
        set(state => ({
          suggestions: state.suggestions.map(s =>
            s.id === id ? { ...s, status: 'ignored' } : s
          ),
        }));
      },

      createOrder: (data) => {
        const items = data.items.map(item => ({
          ...item,
          id: generateId(),
          subtotal: item.quantity * item.unitPrice,
        }));
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

        const newOrder: PurchaseOrder = {
          id: generateId(),
          ...data,
          items,
          totalAmount,
          status: 'pending',
          approvalStatus: 'pending',
          currentApprover: '',
          approvalLevel: 1,
          createTime: new Date().toISOString(),
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        };

        set(state => ({ orders: [newOrder, ...state.orders] }));
        return newOrder;
      },

      approveOrder: (id, approverId, approverName) => {
        const order = get().orders.find(o => o.id === id);
        if (!order) return;

        const nextLevel = order.approvalLevel + 1;

        if (nextLevel > 2) {
          set(state => ({
            orders: state.orders.map(o =>
              o.id === id ? {
                ...o,
                approvalStatus: 'approved',
                status: 'approved',
                currentApprover: '',
                approvalLevel: 2,
              } : o
            ),
          }));
        } else {
          set(state => ({
            orders: state.orders.map(o =>
              o.id === id ? {
                ...o,
                approvalLevel: nextLevel,
                deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              } : o
            ),
          }));
        }
      },

      rejectOrder: (id, approverId, approverName) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === id ? { ...o, approvalStatus: 'rejected', currentApprover: '' } : o
          ),
        }));
      },

      escalatePurchaseTimeout: (id) => {
        const order = get().orders.find(o => o.id === id);
        if (!order || order.approvalStatus !== 'pending') return false;

        const nextLevel = order.approvalLevel + 1;

        if (nextLevel > 2) {
          set(state => ({
            orders: state.orders.map(o =>
              o.id === id ? {
                ...o,
                approvalStatus: 'approved',
                status: 'approved',
                currentApprover: '',
                approvalLevel: 2,
              } : o
            ),
          }));
          return true;
        }

        set(state => ({
          orders: state.orders.map(o =>
            o.id === id ? {
              ...o,
              approvalLevel: nextLevel,
              deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            } : o
          ),
        }));
        return true;
      },

      updateOrderStatus: (id, status) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === id ? { ...o, status } : o
          ),
        }));
      },
    }),
    {
      name: 'purchase-storage',
    }
  )
);
