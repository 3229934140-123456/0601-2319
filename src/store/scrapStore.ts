import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScrapOrder } from '@/types';
import { generateId } from '@/utils';

interface ScrapState {
  orders: ScrapOrder[];
  getOrders: () => ScrapOrder[];
  getPendingOrders: () => ScrapOrder[];
  createScrapOrder: (data: Omit<ScrapOrder, 'id' | 'createTime' | 'status'>) => ScrapOrder;
  processScrapOrder: (id: string) => void;
  getScrapByInventoryId: (inventoryId: string) => ScrapOrder | undefined;
}

export const useScrapStore = create<ScrapState>()(
  persist(
    (set, get) => ({
      orders: [],

      getOrders: () => get().orders,

      getPendingOrders: () => get().orders.filter(o => o.status === 'pending'),

      getScrapByInventoryId: (inventoryId) =>
        get().orders.find(o => o.inventoryId === inventoryId && o.status !== 'cancelled'),

      createScrapOrder: (data) => {
        const existing = get().getScrapByInventoryId(data.inventoryId);
        if (existing) return existing;

        const newOrder: ScrapOrder = {
          id: generateId(),
          ...data,
          status: 'pending',
          createTime: new Date().toISOString(),
        };
        set(state => ({ orders: [newOrder, ...state.orders] }));
        return newOrder;
      },

      processScrapOrder: (id) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === id
              ? { ...o, status: 'processed', processTime: new Date().toISOString() }
              : o
          ),
        }));
      },
    }),
    {
      name: 'scrap-storage',
    }
  )
);
