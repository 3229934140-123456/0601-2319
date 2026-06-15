import { useState, useEffect } from 'react';
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
  Shield,
  Inbox,
} from 'lucide-react';
import { usePurchaseStore } from '@/store/purchaseStore';
import { useUserStore } from '@/store/userStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCurrency, formatDateTime, cn } from '@/utils';
import type { PurchaseOrder } from '@/types';

function CountdownDisplay({ deadline }: { deadline: string }) {
  const { days, hours, minutes, expired } = useCountdown(deadline);

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-danger">
        <Clock className="w-3 h-3" />
        已超时
      </span>
    );
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  parts.push(`${minutes}分`);

  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-600">
      <Clock className="w-3 h-3" />
      {parts.join('')}
    </span>
  );
}

function ApprovalLevelBadge({ level }: { level: number }) {
  const levelText = level === 1 ? '设备科审批' : '院长审批';
  const levelClass = level === 1 ? 'bg-primary-100 text-primary-700' : 'bg-orange-100 text-orange-700';

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', levelClass)}>
      <Shield className="w-3 h-3" />
      {levelText}
    </span>
  );
}

function StatusBadge({ order, isTimeout }: { order: PurchaseOrder; isTimeout: boolean }) {
  if (order.approvalStatus === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success/10 text-status-success">
        <CheckCircle2 className="w-3 h-3" />
        已通过
      </span>
    );
  }
  if (order.approvalStatus === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
        <XCircle className="w-3 h-3" />
        已驳回
      </span>
    );
  }
  if (isTimeout) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-danger/10 text-status-danger">
        <AlertTriangle className="w-3 h-3" />
        已超时，自动升级中
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
      <Clock className="w-3 h-3" />
      待审批
    </span>
  );
}

export default function Approval() {
  const { approveOrder, rejectOrder } = usePurchaseStore();
  const { currentUser } = useUserStore();
  const [searchText, setSearchText] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState<'approve' | 'reject'>('approve');
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null);
  const [opinion, setOpinion] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hasPermission = currentUser.role === 'equipment' || currentUser.role === 'admin';

  const pendingOrders = usePurchaseStore((state) => {
    if (!hasPermission) return [];
    return state.getPendingApprovals(currentUser.role);
  });

  const filteredOrders = pendingOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchText.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchText.toLowerCase()) ||
      o.creatorName.toLowerCase().includes(searchText.toLowerCase())
  );

  const isTimeoutOrder = (order: PurchaseOrder) => {
    if (!order.deadline) return false;
    return new Date(order.deadline).getTime() <= now.getTime();
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
      approveOrder(currentOrder.id, currentUser.id, currentUser.name);
    } else {
      rejectOrder(currentOrder.id, currentUser.id, currentUser.name);
    }

    setShowActionModal(false);
    setCurrentOrder(null);
    setOpinion('');
  };

  const timeoutCount = filteredOrders.filter((o) => isTimeoutOrder(o)).length;

  if (!hasPermission) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Inbox className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">暂无审批权限</h3>
          <p className="text-sm text-slate-500">您的角色没有采购审批权限</p>
        </div>
      </div>
    );
  }

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">待审批</p>
              <p className="text-3xl font-bold text-status-warning">{filteredOrders.length}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-status-warning/10 flex items-center justify-center">
              <Clock className="w-7 h-7 text-status-warning" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">需要您处理的采购订单</span>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">已超时</p>
              <p className="text-3xl font-bold text-status-danger">{timeoutCount}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-status-danger/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-status-danger" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">超时将自动升级至下一级审批</span>
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
                <th className="px-4 py-3.5 text-left">审批级别</th>
                <th className="px-4 py-3.5 text-left">审批状态</th>
                <th className="px-4 py-3.5 text-left">剩余时间</th>
                <th className="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const timeout = isTimeoutOrder(order);
                return (
                  <tr key={order.id} className={cn('table-row', timeout && 'bg-status-danger/5')}>
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
                      <ApprovalLevelBadge level={order.approvalLevel} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge order={order} isTimeout={timeout} />
                    </td>
                    <td className="px-4 py-3.5">
                      {order.deadline ? (
                        <CountdownDisplay deadline={order.deadline} />
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
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-400">暂无待审批订单</p>
                    </div>
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
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">当前审批级别：</span>
                  <ApprovalLevelBadge level={currentOrder.approvalLevel} />
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
