import { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  User,
  Calendar,
  Shield,
  Inbox,
  Building2,
  Eye,
} from 'lucide-react';
import { useRequisitionStore } from '@/store/requisitionStore';
import { useUserStore } from '@/store/userStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCurrency, formatDate, getRoleText, cn } from '@/utils';
import type { Requisition } from '@/types';

interface ApprovalModalState {
  requisition: Requisition | null;
  type: 'approve' | 'reject' | null;
  opinion: string;
}

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
  const levelMap: Record<number, { text: string; className: string }> = {
    1: { text: '科室主任审批', className: 'bg-primary-100 text-primary-700' },
    2: { text: '设备科审批', className: 'bg-orange-100 text-orange-700' },
    3: { text: '院长审批', className: 'bg-purple-100 text-purple-700' },
  };
  const info = levelMap[level] || { text: `${level}级审批`, className: 'bg-slate-100 text-slate-700' };

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', info.className)}>
      <Shield className="w-3 h-3" />
      {info.text}
    </span>
  );
}

function StatusBadge({ requisition, isTimeout }: { requisition: Requisition; isTimeout: boolean }) {
  if (requisition.status === 'approved' || requisition.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success/10 text-status-success">
        <CheckCircle2 className="w-3 h-3" />
        已通过
      </span>
    );
  }
  if (requisition.status === 'rejected') {
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
  const { approveRequisition, rejectRequisition, getRequisitionById } =
    useRequisitionStore();
  const { currentUser } = useUserStore();

  const [approvalModal, setApprovalModal] = useState<ApprovalModalState>({
    requisition: null,
    type: null,
    opinion: '',
  });
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [detailRequisition, setDetailRequisition] = useState<Requisition | null>(null);
  const [searchText, setSearchText] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hasPermission = ['director', 'equipment', 'admin'].includes(currentUser.role);

  const pendingApprovals = useRequisitionStore((state) => {
    if (!hasPermission) return [];
    return state.getPendingApprovals(currentUser.role, currentUser.departmentId);
  });

  const filteredApprovals = pendingApprovals.filter(
    (r) =>
      r.id.toLowerCase().includes(searchText.toLowerCase()) ||
      r.departmentName.toLowerCase().includes(searchText.toLowerCase()) ||
      r.applicantName.toLowerCase().includes(searchText.toLowerCase())
  );

  const isTimeout = (requisition: Requisition) => {
    if (!requisition.deadline) return false;
    return new Date(requisition.deadline).getTime() <= now.getTime();
  };

  const timeoutCount = filteredApprovals.filter((r) => isTimeout(r)).length;

  const handleOpenApproval = (requisition: Requisition, type: 'approve' | 'reject') => {
    setApprovalModal({
      requisition,
      type,
      opinion: '',
    });
  };

  const handleConfirmApproval = () => {
    if (!approvalModal.requisition || !approvalModal.type) return;

    const { requisition, type, opinion } = approvalModal;

    if (type === 'approve') {
      approveRequisition(requisition.id, currentUser.id, currentUser.name, requisition.approvalLevel, opinion);
    } else {
      rejectRequisition(requisition.id, currentUser.id, currentUser.name, opinion);
    }

    setApprovalModal({ requisition: null, type: null, opinion: '' });
  };

  const handleViewDetail = (id: string) => {
    const req = getRequisitionById(id);
    if (req) {
      setDetailRequisition(req);
      setShowDetailModal(true);
    }
  };

  if (!hasPermission) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Inbox className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">暂无审批权限</h3>
          <p className="text-sm text-slate-500">您的角色没有申领审批权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-glow-blue">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">申领审批</h1>
            <p className="text-sm text-slate-500 mt-0.5">待审批申领单列表，支持审批操作</p>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          当前用户：{currentUser.name}（{getRoleText(currentUser.role)}）
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">待审批</p>
              <p className="text-3xl font-bold text-status-warning">{filteredApprovals.length}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-status-warning/10 flex items-center justify-center">
              <Clock className="w-7 h-7 text-status-warning" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">需要您处理的申领单</span>
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
              placeholder="搜索申领单号、科室、申请人..."
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
                <th className="px-4 py-3.5 text-left">申领单号</th>
                <th className="px-4 py-3.5 text-left">科室</th>
                <th className="px-4 py-3.5 text-left">申请人</th>
                <th className="px-4 py-3.5 text-right">申请金额</th>
                <th className="px-4 py-3.5 text-left">申请日期</th>
                <th className="px-4 py-3.5 text-left">审批级别</th>
                <th className="px-4 py-3.5 text-left">审批状态</th>
                <th className="px-4 py-3.5 text-left">剩余时间</th>
                <th className="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map((req) => {
                const timeout = isTimeout(req);
                return (
                  <tr key={req.id} className={cn('table-row', timeout && 'bg-status-danger/5')}>
                    <td className="px-4 py-3.5">
                      <button
                        className="font-mono text-sm text-primary-600 hover:text-primary-700 hover:underline"
                        onClick={() => handleViewDetail(req.id)}
                      >
                        {req.id}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {req.departmentName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {req.applicantName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right">
                      <span className="data-number font-semibold text-primary-600">
                        {formatCurrency(req.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(req.applyDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <ApprovalLevelBadge level={req.approvalLevel} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge requisition={req} isTimeout={timeout} />
                    </td>
                    <td className="px-4 py-3.5">
                      {req.deadline ? (
                        <CountdownDisplay deadline={req.deadline} />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="查看详情"
                          onClick={() => handleViewDetail(req.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-status-success hover:bg-status-success/10 rounded-lg transition-colors"
                          title="通过"
                          onClick={() => handleOpenApproval(req, 'approve')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors"
                          title="驳回"
                          onClick={() => handleOpenApproval(req, 'reject')}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredApprovals.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-400">暂无待审批申领单</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {approvalModal.requisition && approvalModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  approvalModal.type === 'approve' ? 'bg-status-success/10' : 'bg-status-danger/10'
                )}
              >
                {approvalModal.type === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-status-danger" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {approvalModal.type === 'approve' ? '审批通过' : '审批驳回'}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申领单号：</span>
                  <span className="font-mono font-medium text-slate-800">{approvalModal.requisition.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申请科室：</span>
                  <span className="font-medium text-slate-800">{approvalModal.requisition.departmentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申请人：</span>
                  <span className="font-medium text-slate-800">{approvalModal.requisition.applicantName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申请金额：</span>
                  <span className="font-mono font-semibold text-primary-600">
                    {formatCurrency(approvalModal.requisition.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">当前审批级别：</span>
                  <ApprovalLevelBadge level={approvalModal.requisition.approvalLevel} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  审批意见
                  {approvalModal.type === 'reject' && (
                    <span className="text-status-danger ml-1">* 必填</span>
                  )}
                </label>
                <textarea
                  className="input-field min-h-[100px] resize-none"
                  placeholder={
                    approvalModal.type === 'approve'
                      ? '请输入审批意见（选填）'
                      : '请输入驳回原因（必填）'
                  }
                  value={approvalModal.opinion}
                  onChange={(e) =>
                    setApprovalModal((prev) => ({ ...prev, opinion: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="btn-secondary"
                onClick={() => setApprovalModal({ requisition: null, type: null, opinion: '' })}
              >
                取消
              </button>
              <button
                className={approvalModal.type === 'approve' ? 'btn-success' : 'btn-danger'}
                onClick={handleConfirmApproval}
                disabled={approvalModal.type === 'reject' && !approvalModal.opinion.trim()}
              >
                确认{approvalModal.type === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailRequisition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">申领单详情</h2>
              <button
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">单号</label>
                  <p className="font-mono text-slate-800">{detailRequisition.id}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">状态</label>
                  <StatusBadge requisition={detailRequisition} isTimeout={isTimeout(detailRequisition)} />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">申请科室</label>
                  <p className="text-slate-800">{detailRequisition.departmentName}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">申请人</label>
                  <p className="text-slate-800">{detailRequisition.applicantName}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">申请日期</label>
                  <p className="text-slate-800">{formatDate(detailRequisition.applyDate)}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">当前审批级别</label>
                  <ApprovalLevelBadge level={detailRequisition.approvalLevel} />
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-700">申领明细</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-2.5 text-left text-xs">耗材名称</th>
                      <th className="px-4 py-2.5 text-center text-xs">规格</th>
                      <th className="px-4 py-2.5 text-center text-xs">推荐数量</th>
                      <th className="px-4 py-2.5 text-center text-xs">申领数量</th>
                      <th className="px-4 py-2.5 text-right text-xs">单价</th>
                      <th className="px-4 py-2.5 text-right text-xs">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRequisition.items.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="px-4 py-3 text-sm text-slate-700">{item.materialName}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.spec}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {item.recommendQty} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-700">
                        合计：
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">
                        {formatCurrency(detailRequisition.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                关闭
              </button>
              {detailRequisition.status === 'pending' && (
                <>
                  <button
                    className="btn-success"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenApproval(detailRequisition, 'approve');
                    }}
                  >
                    通过
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenApproval(detailRequisition, 'reject');
                    }}
                  >
                    驳回
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
