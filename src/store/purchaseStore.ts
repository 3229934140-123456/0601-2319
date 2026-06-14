import { create } from 'zustand';
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
  processSuggestion: (id: string) => void;
  ignoreSuggestion: (id: string) => void;
  createOrder: (data: Omit<PurchaseOrder, 'id' | 'status' | 'approvalStatus' | 'currentApprover' | 'createTime' | 'items' | 'totalAmount' | 'deadline'> & { items: Omit<PurchaseOrderItem, 'id' | 'subtotal'>[] }) => void;
  approveOrder: (id: string) => void;
  rejectOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: PurchaseOrder['status']) => void;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  suggestions: mockSuggestions,
  orders: mockOrders,

  getSuggestions: () => get().suggestions,

  getPendingSuggestions: () => get().suggestions.filter(s => s.status === 'pending'),

  getOrders: () => get().orders,

  getPendingApprovals: (role) => {
    const pending = get().orders.filter(o => o.approvalStatus === 'pending');
    if (role === 'equipment') return pending;
    if (role === 'admin') return pending;
    return [];
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
      createTime: new Date().toISOString(),
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };

    set(state => ({ orders: [newOrder, ...state.orders] }));
  },

  approveOrder: (id) => {
    set(state => ({
      orders: state.orders.map(o =>
        o.id === id ? { ...o, approvalStatus: 'approved', status: 'approved', currentApprover: '' } : o
      ),
    }));
  },

  rejectOrder: (id) => {
    set(state => ({
      orders: state.orders.map(o =>
        o.id === id ? { ...o, approvalStatus: 'rejected', currentApprover: '' } : o
      ),
    }));
  },

  updateOrderStatus: (id, status) => {
    set(state => ({
      orders: state.orders.map(o =>
        o.id === id ? { ...o, status } : o
      ),
    }));
  },
}));
