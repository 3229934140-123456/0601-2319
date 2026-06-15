import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Requisition, RequisitionItem, Department, Inventory, OutboundItem } from '@/types';
import { requisitions as mockRequisitions, departments } from '@/mock/data';
import { generateId } from '@/utils';
import { useInventoryStore } from './inventoryStore';
import { useOutboundStore } from './outboundStore';
import { useApprovalStore } from './approvalStore';

interface RequisitionState {
  requisitions: Requisition[];
  getRequisitions: () => Requisition[];
  getRequisitionById: (id: string) => Requisition | undefined;
  getPendingApprovals: (role: string, departmentId?: string) => Requisition[];
  getRequisitionsByDepartment: (departmentId: string) => Requisition[];
  createRequisition: (data: Omit<Requisition, 'id' | 'status' | 'currentApprover' | 'approvalLevel' | 'createTime' | 'items' | 'totalAmount' | 'deadline'> & { items: Omit<RequisitionItem, 'id' | 'subtotal'>[] }) => { success: boolean; message?: string; requisition?: Requisition };
  approveRequisition: (id: string, approverId: string, approverName: string, level: number, opinion?: string) => { success: boolean; message?: string };
  rejectRequisition: (id: string, approverId: string, approverName: string, opinion?: string) => void;
  escalateTimeout: (id: string) => boolean;
  checkAndEscalateAllTimeouts: () => { requisitionCount: number; purchaseCount: number };
}

const getDepartmentBudget = (departmentId: string): { budget: number; used: number; remaining: number } => {
  const dept = departments.find(d => d.id === departmentId);
  if (!dept) return { budget: 0, used: 0, remaining: 0 };
  return {
    budget: dept.monthlyBudget,
    used: dept.usedBudget,
    remaining: dept.monthlyBudget - dept.usedBudget,
  };
};

const allocateStock = (materialId: string, quantity: number, inventories: Inventory[]): { items: OutboundItem[]; success: boolean; message?: string } => {
  const available = inventories
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
    });

  let remaining = quantity;
  const items: OutboundItem[] = [];

  for (const inv of available) {
    if (remaining <= 0) break;
    const takeQty = Math.min(remaining, inv.quantity);
    items.push({
      id: generateId(),
      materialId: inv.materialId,
      materialName: inv.materialName,
      spec: '',
      unit: inv.unit,
      quantity: takeQty,
      unitPrice: inv.unitPrice,
      subtotal: takeQty * inv.unitPrice,
      inventoryId: inv.id,
      batchNo: inv.batchNo,
    });
    remaining -= takeQty;
  }

  if (remaining > 0) {
    return { items: [], success: false, message: `库存不足，缺少 ${remaining} 件` };
  }

  return { items, success: true };
};

export const useRequisitionStore = create<RequisitionState>()(
  persist(
    (set, get) => ({
      requisitions: mockRequisitions,

      getRequisitions: () => get().requisitions,

      getRequisitionById: (id) => get().requisitions.find(r => r.id === id),

      getPendingApprovals: (role, departmentId) => {
        const all = get().requisitions.filter(r => r.status === 'pending');
        if (role === 'director') {
          return all.filter(r => r.departmentId === departmentId && r.approvalLevel === 1);
        }
        if (role === 'equipment') {
          return all.filter(r => r.approvalLevel === 2);
        }
        if (role === 'admin') {
          return all.filter(r => r.approvalLevel === 3);
        }
        return all;
      },

      getRequisitionsByDepartment: (departmentId) =>
        get().requisitions.filter(r => r.departmentId === departmentId),

      createRequisition: (data) => {
        const items = data.items.map(item => ({
          ...item,
          id: generateId(),
          subtotal: item.quantity * item.unitPrice,
        }));
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

        const budget = getDepartmentBudget(data.departmentId);
        const needsApproval = totalAmount > budget.remaining;

        const newRequisition: Requisition = {
          id: generateId(),
          ...data,
          items,
          totalAmount,
          status: needsApproval ? 'pending' : 'approved',
          currentApprover: needsApproval ? '' : '',
          approvalLevel: needsApproval ? 1 : 0,
          createTime: new Date().toISOString(),
          deadline: needsApproval ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : undefined,
        };

        if (!needsApproval) {
          const invState = useInventoryStore.getState();
          const outboundState = useOutboundStore.getState();

          const outboundItems: OutboundItem[] = [];
          for (const item of items) {
            const alloc = allocateStock(item.materialId, item.quantity, invState.inventories);
            if (!alloc.success) {
              return { success: false, message: alloc.message };
            }
            outboundItems.push(...alloc.items);
          }

          for (const oi of outboundItems) {
            invState.updateInventory(oi.inventoryId,
              invState.inventories.find(i => i.id === oi.inventoryId)!.quantity - oi.quantity
            );
          }

          outboundState.createOutboundOrder({
            requisitionId: newRequisition.id,
            departmentId: newRequisition.departmentId,
            departmentName: newRequisition.departmentName,
            items: outboundItems,
            totalAmount,
          });
        }

        set(state => ({ requisitions: [newRequisition, ...state.requisitions] }));

        return {
          success: true,
          message: needsApproval ? '已提交，等待审批' : '已通过，已生成出库单',
          requisition: newRequisition,
        };
      },

      approveRequisition: (id, approverId, approverName, level, opinion) => {
        const req = get().getRequisitionById(id);
        if (!req) return { success: false, message: '申领单不存在' };

        const approvalState = useApprovalStore.getState();
        approvalState.addRecord({
          requisitionId: id,
          approverId,
          approverName,
          level,
          result: 'approved',
          opinion,
        });

        const nextLevel = level + 1;

        if (nextLevel > 3) {
          const invState = useInventoryStore.getState();
          const outboundState = useOutboundStore.getState();

          const outboundItems: OutboundItem[] = [];
          for (const item of req.items) {
            const alloc = allocateStock(item.materialId, item.quantity, invState.inventories);
            if (!alloc.success) {
              return { success: false, message: alloc.message };
            }
            outboundItems.push(...alloc.items);
          }

          for (const oi of outboundItems) {
            const inv = invState.inventories.find(i => i.id === oi.inventoryId);
            if (inv) {
              invState.updateInventory(oi.inventoryId, inv.quantity - oi.quantity);
            }
          }

          outboundState.createOutboundOrder({
            requisitionId: req.id,
            departmentId: req.departmentId,
            departmentName: req.departmentName,
            items: outboundItems,
            totalAmount: req.totalAmount,
          });

          set(state => ({
            requisitions: state.requisitions.map(r =>
              r.id === id ? { ...r, status: 'approved', currentApprover: '', approvalLevel: 3 } : r
            ),
          }));

          return { success: true, message: '审批通过，已生成出库单' };
        }

        set(state => ({
          requisitions: state.requisitions.map(r =>
            r.id === id ? {
              ...r,
              approvalLevel: nextLevel,
              deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            } : r
          ),
        }));

        return { success: true };
      },

      rejectRequisition: (id, approverId, approverName, opinion) => {
        const approvalState = useApprovalStore.getState();
        approvalState.addRecord({
          requisitionId: id,
          approverId,
          approverName,
          level: 0,
          result: 'rejected',
          opinion,
        });

        set(state => ({
          requisitions: state.requisitions.map(r =>
            r.id === id ? { ...r, status: 'rejected', currentApprover: '' } : r
          ),
        }));
      },

      escalateTimeout: (id) => {
        const req = get().getRequisitionById(id);
        if (!req || req.status !== 'pending') return false;

        const approvalState = useApprovalStore.getState();
        const nextLevel = req.approvalLevel + 1;

        approvalState.addRecord({
          requisitionId: id,
          approverId: 'system',
          approverName: '系统自动',
          level: req.approvalLevel,
          result: 'timeout',
          opinion: '审批超时，自动升级至下一级',
        });

        if (nextLevel > 3) {
          const invState = useInventoryStore.getState();
          const outboundState = useOutboundStore.getState();

          const outboundItems: OutboundItem[] = [];
          for (const item of req.items) {
            const alloc = allocateStock(item.materialId, item.quantity, invState.inventories);
            if (!alloc.success) {
              set(state => ({
                requisitions: state.requisitions.map(r =>
                  r.id === id ? { ...r, status: 'rejected', currentApprover: '' } : r
                ),
              }));
              return false;
            }
            outboundItems.push(...alloc.items);
          }

          for (const oi of outboundItems) {
            const inv = invState.inventories.find(i => i.id === oi.inventoryId);
            if (inv) {
              invState.updateInventory(oi.inventoryId, inv.quantity - oi.quantity);
            }
          }

          outboundState.createOutboundOrder({
            requisitionId: req.id,
            departmentId: req.departmentId,
            departmentName: req.departmentName,
            items: outboundItems,
            totalAmount: req.totalAmount,
          });

          set(state => ({
            requisitions: state.requisitions.map(r =>
              r.id === id ? { ...r, status: 'approved', currentApprover: '', approvalLevel: 3 } : r
            ),
          }));
          return true;
        }

        set(state => ({
          requisitions: state.requisitions.map(r =>
            r.id === id ? {
              ...r,
              approvalLevel: nextLevel,
              deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            } : r
          ),
        }));
        return true;
      },

      checkAndEscalateAllTimeouts: () => {
        const now = Date.now();
        const reqs = get().requisitions.filter(r => r.status === 'pending' && r.deadline);
        let reqCount = 0;

        for (const req of reqs) {
          if (req.deadline && new Date(req.deadline).getTime() <= now) {
            if (get().escalateTimeout(req.id)) {
              reqCount++;
            }
          }
        }

        const approvalState = useApprovalStore.getState();
        const purchaseCount = approvalState.checkAndEscalatePurchaseTimeouts();

        return { requisitionCount: reqCount, purchaseCount };
      },
    }),
    {
      name: 'requisition-storage',
    }
  )
);
