import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApprovalRecord } from '@/types';
import { generateId } from '@/utils';
import { usePurchaseStore } from './purchaseStore';

interface ApprovalState {
  records: ApprovalRecord[];
  addRecord: (data: Omit<ApprovalRecord, 'id' | 'approveTime'>) => void;
  getRecordsByRequisitionId: (requisitionId: string) => ApprovalRecord[];
  checkAndEscalatePurchaseTimeouts: () => number;
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (data) => {
        const record: ApprovalRecord = {
          id: generateId(),
          ...data,
          approveTime: new Date().toISOString(),
        };
        set(state => ({ records: [record, ...state.records] }));
      },

      getRecordsByRequisitionId: (requisitionId) =>
        get().records.filter(r => r.requisitionId === requisitionId),

      checkAndEscalatePurchaseTimeouts: () => {
        const now = Date.now();
        const purchaseState = usePurchaseStore.getState();
        const pendingOrders = purchaseState.orders.filter(
          o => o.approvalStatus === 'pending' && o.deadline
        );
        let count = 0;

        for (const order of pendingOrders) {
          if (order.deadline && new Date(order.deadline).getTime() <= now) {
            get().addRecord({
              requisitionId: order.id,
              approverId: 'system',
              approverName: '系统自动',
              level: order.approvalLevel,
              result: 'timeout',
              opinion: '采购审批超时，自动升级至下一级',
            });
            if (purchaseState.escalatePurchaseTimeout(order.id)) {
              count++;
            }
          }
        }

        return count;
      },
    }),
    {
      name: 'approval-storage',
    }
  )
);
