import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OutboundOrder } from '@/types';
import { generateId } from '@/utils';
import { useInventoryStore } from './inventoryStore';
import { useBudgetStore } from './budgetStore';

interface OutboundState {
  orders: OutboundOrder[];
  getOrders: () => OutboundOrder[];
  getOrdersByDepartment: (departmentId: string) => OutboundOrder[];
  getOrderByRequisitionId: (requisitionId: string) => OutboundOrder | undefined;
  createOutboundOrder: (data: Omit<OutboundOrder, 'id' | 'createTime' | 'status'>) => OutboundOrder;
  completeOutboundOrder: (id: string, operatorId: string, operatorName: string) => { success: boolean; message?: string };
  cancelOutboundOrder: (id: string, operatorId: string, operatorName: string) => { success: boolean; message?: string };
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
        const order = get().orders.find(o => o.id === id);
        if (!order) return { success: false, message: '出库单不存在' };
        if (order.status !== 'pending') return { success: false, message: '当前状态不可操作' };

        set(state => ({
          orders: state.orders.map(o =>
            o.id === id
              ? { ...o, status: 'completed', operatorId, operatorName, operateTime: new Date().toISOString() }
              : o
          ),
        }));
        return { success: true };
      },

      cancelOutboundOrder: (id, operatorId, operatorName) => {
        const order = get().orders.find(o => o.id === id);
        if (!order) return { success: false, message: '出库单不存在' };
        if (order.status !== 'pending') {
          return { success: false, message: order.status === 'completed' ? '已确认出库的订单不可取消' : '当前状态不可取消' };
        }

        const invState = useInventoryStore.getState();
        for (const item of order.items) {
          const inv = invState.inventories.find(i => i.id === item.inventoryId);
          if (inv) {
            invState.updateInventory(item.inventoryId, inv.quantity + item.quantity);
          }
        }

        const budgetStore = useBudgetStore.getState();
        budgetStore.reduceUsedBudget(order.departmentId, order.totalAmount);

        set(state => ({
          orders: state.orders.map(o =>
            o.id === id
              ? { ...o, status: 'cancelled', operatorId, operatorName, operateTime: new Date().toISOString() }
              : o
          ),
        }));
        return { success: true, message: '已取消出库，库存已恢复' };
      },
    }),
    {
      name: 'outbound-storage',
    }
  )
);
