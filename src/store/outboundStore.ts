import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OutboundOrder } from '@/types';
import { generateId } from '@/utils';

interface OutboundState {
  orders: OutboundOrder[];
  getOrders: () => OutboundOrder[];
  getOrdersByDepartment: (departmentId: string) => OutboundOrder[];
  getOrderByRequisitionId: (requisitionId: string) => OutboundOrder | undefined;
  createOutboundOrder: (data: Omit<OutboundOrder, 'id' | 'createTime' | 'status'>) => OutboundOrder;
  completeOutboundOrder: (id: string, operatorId: string, operatorName: string) => void;
  cancelOutboundOrder: (id: string, operatorId: string, operatorName: string) => void;
}

export const useOutboundStore = create<OutboundState>()(
  persist(
    (set, get) => ({
      orders: [],

      getOrders: () => get().orders,

      getOrdersByDepartment: (departmentId) =>
        get().orders.filter(o => o.departmentId === departmentId),

      getOrderByRequisitionId: (requisitionId) =>
        get().orders.find(o => o.requisitionId === requisitionId),

      createOutboundOrder: (data) => {
        const newOrder: OutboundOrder = {
          id: generateId(),
          ...data,
          status: 'pending',
          createTime: new Date().toISOString(),
        };
        set(state => ({ orders: [newOrder, ...state.orders] }));
        return newOrder;
      },

      completeOutboundOrder: (id, operatorId, operatorName) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === id
              ? { ...o, status: 'completed', operatorId, operatorName }
              : o
          ),
        }));
      },

      cancelOutboundOrder: (id, operatorId, operatorName) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === id
              ? { ...o, status: 'cancelled', operatorId, operatorName }
              : o
          ),
        }));
      },
    }),
    {
      name: 'outbound-storage',
    }
  )
);
