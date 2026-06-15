import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { BudgetFlowRecord, BudgetFlowType, Department } from '@/types';
import { formatCurrency, formatDateTime, cn } from '@/utils';

interface BudgetFlowModalProps {
  department: Department;
  records: BudgetFlowRecord[];
  budget: number;
  used: number;
  pending: number;
  onClose: () => void;
}

const typeConfig: Record<BudgetFlowType, { label: string; className: string }> = {
  requisition_submit: {
    label: '申领提交',
    className: 'bg-sky-100 text-sky-700',
  },
  requisition_approve: {
    label: '审批通过',
    className: 'bg-green-100 text-green-700',
  },
  requisition_reject: {
    label: '审批驳回',
    className: 'bg-slate-100 text-slate-600',
  },
  requisition_timeout: {
    label: '超时通过',
    className: 'bg-amber-100 text-amber-700',
  },
  outbound_cancel: {
    label: '出库取消',
    className: 'bg-purple-100 text-purple-700',
  },
};

const formatAmountChange = (type: BudgetFlowType, amount: number) => {
  if (amount > 0) {
    return (
      <span className="font-mono font-semibold text-amber-600">
        +{formatCurrency(amount)}
      </span>
    );
  }
  if (amount < 0) {
    return (
      <span className="font-mono font-semibold text-green-600">
        {formatCurrency(amount)}
      </span>
    );
  }
  return <span className="font-mono text-slate-500">内部转移</span>;
};

const formatRelatedDoc = (record: BudgetFlowRecord) => {
  if (!record.relatedId || !record.relatedType) return '-';
  const prefix = record.relatedType === 'requisition' ? '申领单 #' : '出库单 #';
  return (
    <span className="font-mono text-primary-600 hover:underline cursor-pointer">
      {prefix}{record.relatedId.slice(0, 8)}
    </span>
  );
};

export default function BudgetFlowModal({
  department,
  records,
  budget,
  used,
  pending,
  onClose,
}: BudgetFlowModalProps) {
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  }, []);

  const available = budget - used - pending;
  const usageRate = budget > 0 ? (used / budget) * 100 : 0;
  const isOverBudget = usageRate > 100;

  const filteredRecords = useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    return records.filter(r => r.createTime.startsWith(currentMonthStr));
  }, [records]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {department.name} - 预算流水
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{currentMonth}</p>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">月度预算</p>
              <p className="text-xl font-bold font-mono text-slate-800">
                {formatCurrency(budget)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">当前已用</p>
              <p className={cn(
                'text-xl font-bold font-mono',
                isOverBudget ? 'text-status-danger' : 'text-slate-800'
              )}>
                {formatCurrency(used)}
                <span className="text-sm font-normal ml-1">
                  ({usageRate.toFixed(1)}%)
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">审批中占用</p>
              <p className="text-xl font-bold font-mono text-amber-600">
                {formatCurrency(pending)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">可用额度</p>
              <p className={cn(
                'text-xl font-bold font-mono',
                available < 0 ? 'text-status-danger' : 'text-status-success'
              )}>
                {formatCurrency(available)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="table-header sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left whitespace-nowrap">时间</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">类型</th>
                <th className="px-6 py-3 text-left">说明</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">关联单据</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">金额变化</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">已用预算</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">审批中占用</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">操作人</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    暂无预算流水记录
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const cfg = typeConfig[record.type];
                  return (
                    <tr key={record.id} className="table-row">
                      <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {formatDateTime(record.createTime)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          cfg.className
                        )}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700">
                        {record.remark}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap">
                        {formatRelatedDoc(record)}
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        {formatAmountChange(record.type, record.amount)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-mono text-slate-700 whitespace-nowrap">
                        {formatCurrency(record.afterUsed)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-mono text-amber-600 whitespace-nowrap">
                        {formatCurrency(record.afterPending)}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {record.operatorName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button className="btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
