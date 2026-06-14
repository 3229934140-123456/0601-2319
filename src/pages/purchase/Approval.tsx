import { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Package,
  User,
  Calendar,
} from 'lucide-react';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCurrency, formatDateTime, getStatusText, cn } from '@/utils';
import { currentUser } from '@/mock/data';
import type { PurchaseOrder } from '@/types';

function CountdownDisplay({ deadline, isUrgent }: { deadline: string; isUrgent: boolean }) {
  const { hours, minutes, seconds, expired } = useCountdown(deadline);
  const isUrgentNow = hours < 12;
  const displayUrgent = isUrgent || isUrgentNow;

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-danger">
        <Clock className="w-3 h-3" />
        已超时
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-mono font-medium',
        displayUrgent ? 'text-status-danger animate-pulse' : 'text-slate-600'
      )}
    >
      <Clock className={cn('w-3 h-3', displayUrgent && 'text-status-danger')} />
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </span>
  );
}

export default function Approval() {
  const { approveOrder, rejectOrder, getPendingApprovals } = usePurchaseStore();
  const [searchText, setSearchText] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState<'approve' | 'reject'>('approve');
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null);
  const [opinion, setOpinion] = useState('');

  const pendingOrders = getPendingApprovals(currentUser.role);

  const filteredOrders = pendingOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchText.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchText.toLowerCase()) ||
      o.creatorName.toLowerCase().includes(searchText.toLowerCase())
  );

  const isUrgentOrder = (order: PurchaseOrder) => {
    if (!order.deadline) return false;
    const diff = new Date(order.deadline).getTime() - Date.now();
    return diff < 12 * 60 * 60 * 1000;
  };

  const handleOpenModal = (order: PurchaseOrder, mode: 'approve' | 'reject') => {
    setCurrentOrder(order);
    setActionMode(mode);
    setOpinion('');
    setShowActionModal(true);
  };

  const handleConfirmAction = () => {
    if (!currentOrder) return;

    if (actionMode === 'approve') {
      approveOrder(currentOrder.id);
    } else {
      rejectOrder(currentOrder.id);
    }

    setShowActionModal(false);
    setCurrentOrder(null);
    setOpinion('');
  };

  const urgentCount = filteredOrders.filter((o) => isUrgentOrder(o)).length;
  const timeoutCount = filteredOrders.filter(
    (o) => o.deadline && new Date(o.deadline).getTime() <= Date.now()
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-status-warning to-orange-500 rounded-xl shadow-glow-blue">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">采购审批</h1>
            <p className="text-sm text-slate-500 mt-0.5">待审批采购订单列表，支持审批操作</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {timeoutCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-status-danger/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-status-danger" />
              <span className="text-sm font-medium text-status-danger">
                已超时 {timeoutCount} 单，需升级审批
              </span>
            </div>
          )}
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-status-danger/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-status-danger" />
              <span className="text-sm font-medium text-status-danger">紧急 {urgentCount} 单</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-status-warning/10 rounded-lg">
            <Clock className="w-4 h-4 text-status-warning" />
            <span className="text-sm font-medium text-status-warning">
              待审批 {filteredOrders.length} 单
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="搜索订单号、供应商、创建人..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3.5 text-left">订单号</th>
                <th className="px-4 py-3.5 text-left">供应商</th>
                <th className="px-4 py-3.5 text-left">创建人</th>
                <th className="px-4 py-3.5 text-right">总金额</th>
                <th className="px-4 py-3.5 text-left">创建时间</th>
                <th className="px-4 py-3.5 text-left">审批状态</th>
                <th className="px-4 py-3.5 text-left">剩余时间</th>
                <th className="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const urgent = isUrgentOrder(order);
                return (
                  <tr key={order.id} className={cn('table-row', urgent && 'bg-status-warning/5')}>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono font-medium text-slate-800">
                        {order.id.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        {order.supplierName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {order.creatorName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right">
                      <span className="data-number font-semibold text-primary-600">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDateTime(order.createTime)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="status-pending">{getStatusText(order.approvalStatus)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {order.deadline ? (
                        <CountdownDisplay deadline={order.deadline} isUrgent={urgent} />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 text-status-success hover:bg-status-success/10 rounded-lg transition-colors"
                          title="通过"
                          onClick={() => handleOpenModal(order, 'approve')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors"
                          title="驳回"
                          onClick={() => handleOpenModal(order, 'reject')}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    暂无待审批订单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showActionModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  actionMode === 'approve' ? 'bg-status-success/10' : 'bg-status-danger/10'
                )}
              >
                {actionMode === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-status-danger" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {actionMode === 'approve' ? '审批通过' : '审批驳回'}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">订单号：</span>
                  <span className="font-mono font-medium text-slate-800">
                    {currentOrder.id.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">供应商：</span>
                  <span className="font-medium text-slate-800">{currentOrder.supplierName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">总金额：</span>
                  <span className="font-mono font-semibold text-primary-600">
                    {formatCurrency(currentOrder.totalAmount)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  审批意见
                  <span className="text-slate-400 text-xs ml-1">
                    {actionMode === 'reject' ? '(必填)' : '(选填)'}
                  </span>
                </label>
                <textarea
                  className="input-field min-h-[100px] resize-none"
                  placeholder={
                    actionMode === 'approve'
                      ? '请输入审批意见（选填）'
                      : '请输入驳回原因（必填）'
                  }
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowActionModal(false);
                  setCurrentOrder(null);
                  setOpinion('');
                }}
              >
                取消
              </button>
              <button
                className={actionMode === 'approve' ? 'btn-success' : 'btn-danger'}
                onClick={handleConfirmAction}
                disabled={actionMode === 'reject' && !opinion.trim()}
              >
                确认{actionMode === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
