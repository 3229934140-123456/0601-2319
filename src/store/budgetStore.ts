import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Department } from '@/types';
import { departments as mockDepartments } from '@/mock/data';

interface BudgetState {
  departments: Department[];
  pendingAmounts: Record<string, number>;
  getDepartments: () => Department[];
  getDepartmentBudget: (departmentId: string) => Department | undefined;
  addUsedBudget: (departmentId: string, amount: number) => void;
  reduceUsedBudget: (departmentId: string, amount: number) => void;
  addPendingBudget: (departmentId: string, amount: number) => void;
  reducePendingBudget: (departmentId: string, amount: number) => void;
  getBudgetInfo: (departmentId: string) => { budget: number; used: number; remaining: number; pending: number };
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      departments: mockDepartments.map(d => ({ ...d })),
      pendingAmounts: {},

      getDepartments: () => get().departments,

      getDepartmentBudget: (departmentId) =>
        get().departments.find(d => d.id === departmentId),

      addUsedBudget: (departmentId, amount) => {
        set(state => ({
          departments: state.departments.map(d =>
            d.id === departmentId
              ? { ...d, usedBudget: Math.min(d.monthlyBudget, d.usedBudget + amount) }
              : d
          ),
        }));
      },

      reduceUsedBudget: (departmentId, amount) => {
        set(state => ({
          departments: state.departments.map(d =>
            d.id === departmentId
              ? { ...d, usedBudget: Math.max(0, d.usedBudget - amount) }
              : d
          ),
        }));
      },

      addPendingBudget: (departmentId, amount) => {
        set(state => ({
          pendingAmounts: {
            ...state.pendingAmounts,
            [departmentId]: (state.pendingAmounts[departmentId] || 0) + amount,
          },
        }));
      },

      reducePendingBudget: (departmentId, amount) => {
        set(state => ({
          pendingAmounts: {
            ...state.pendingAmounts,
            [departmentId]: Math.max(0, (state.pendingAmounts[departmentId] || 0) - amount),
          },
        }));
      },

      getBudgetInfo: (departmentId) => {
        const dept = get().departments.find(d => d.id === departmentId);
        if (!dept) return { budget: 0, used: 0, remaining: 0, pending: 0 };
        const pending = get().pendingAmounts[departmentId] || 0;
        return {
          budget: dept.monthlyBudget,
          used: dept.usedBudget,
          remaining: dept.monthlyBudget - dept.usedBudget,
          pending,
        };
      },
    }),
    {
      name: 'budget-storage',
    }
  )
);
