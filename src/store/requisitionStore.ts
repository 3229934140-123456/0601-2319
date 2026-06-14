import { create } from 'zustand';
import type { Requisition, RequisitionItem } from '@/types';
import { requisitions as mockRequisitions } from '@/mock/data';
import { generateId } from '@/utils';

interface RequisitionState {
  requisitions: Requisition[];
  getRequisitions: () => Requisition[];
  getRequisitionById: (id: string) => Requisition | undefined;
  getPendingApprovals: (role: string, departmentId?: string) => Requisition[];
  createRequisition: (data: Omit<Requisition, 'id' | 'status' | 'currentApprover' | 'approvalLevel' | 'createTime' | 'items' | 'totalAmount' | 'deadline'> & { items: Omit<RequisitionItem, 'id' | 'subtotal'>[] }) => void;
  approveRequisition: (id: string, approverId: string, level: number, opinion?: string) => void;
  rejectRequisition: (id: string, approverId: string, opinion?: string) => void;
}

const calculateApprovalLevel = (totalAmount: number, departmentBudget: number): { level: number; needsApproval: boolean } => {
  if (totalAmount <= departmentBudget * 0.5) {
    return { level: 0, needsApproval: false };
  }
  return { level: 1, needsApproval: true };
};

export const useRequisitionStore = create<RequisitionState>((set, get) => ({
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

  createRequisition: (data) => {
    const items = data.items.map(item => ({
      ...item,
      id: generateId(),
      subtotal: item.quantity * item.unitPrice,
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const { level, needsApproval } = calculateApprovalLevel(totalAmount, 150000);

    const newRequisition: Requisition = {
      id: generateId(),
      ...data,
      items,
      totalAmount,
      status: needsApproval ? 'pending' : 'approved',
      currentApprover: needsApproval ? (data.applicantId) : '',
      approvalLevel: level,
      createTime: new Date().toISOString(),
      deadline: needsApproval ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : undefined,
    };

    set(state => ({ requisitions: [newRequisition, ...state.requisitions] }));
  },

  approveRequisition: (id, approverId, level, opinion) => {
    set(state => ({
      requisitions: state.requisitions.map(r => {
        if (r.id !== id) return r;
        const nextLevel = level + 1;
        if (nextLevel > 3) {
          return { ...r, status: 'approved', currentApprover: '', approvalLevel: 3 };
        }
        return {
          ...r,
          approvalLevel: nextLevel,
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        };
      }),
    }));
  },

  rejectRequisition: (id, approverId, opinion) => {
    set(state => ({
      requisitions: state.requisitions.map(r =>
        r.id === id ? { ...r, status: 'rejected', currentApprover: '' } : r
      ),
    }));
  },
}));
