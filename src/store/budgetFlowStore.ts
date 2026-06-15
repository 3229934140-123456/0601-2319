import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BudgetFlowRecord } from '@/types';
import { generateId } from '@/utils';

interface BudgetFlowState {
  records: BudgetFlowRecord[];
  addRecord: (data: Omit<BudgetFlowRecord, 'id' | 'createTime'>) => void;
  getRecordsByDepartment: (departmentId: string) => BudgetFlowRecord[];
  getAllRecords: () => BudgetFlowRecord[];
}

export const useBudgetFlowStore = create<BudgetFlowState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (data) => {
        const record: BudgetFlowRecord = {
          ...data,
          id: generateId(),
          createTime: new Date().toISOString(),
        };
        set(state => ({
          records: [record, ...state.records],
        }));
      },

      getRecordsByDepartment: (departmentId) =>
        get().records.filter(r => r.departmentId === departmentId),

      getAllRecords: () => get().records,
    }),
    {
      name: 'budget-flow-storage',
    }
  )
);
