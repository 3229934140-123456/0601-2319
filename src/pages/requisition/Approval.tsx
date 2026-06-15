import { useState, useMemo } from 'react';
import { useRequisitionStore } from '@/store/requisitionStore';
import { useUserStore } from '@/store/userStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCurrency, formatDate, getRoleText } from '@/utils';
import type { Requisition } from '@/types';

interface ApprovalModalState {
  requisition: Requisition | null;
  type: 'approve' | 'reject' | null;
  opinion: string;
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const countdown = useCountdown(deadline);

  if (countdown.expired) {
    return (
      <span className="text-status-danger font-semibold text-sm">
        已超时
      </span>
    );
  }

  const isUrgent = countdown.hours < 12;

  return (
    <span className={`font-mono font-semibold text-sm ${isUrgent ? 'text-status-danger' : 'text-slate-700'}`}>
      {String(countdown.hours).padStart(2, '0')}:
      {String(countdown.minutes).padStart(2, '0')}:
      {String(countdown.seconds).padStart(2, '0')}
    </span>
  );
}

function getApprovalLevelText(level: number): string {
  const levelMap: Record<number, string> = {
    1: '科室主任（1级）',
    2: '设备科（2级）',
    3: '院长（3级）',
  };
  return levelMap[level] || `${level}级`;
}

export default function ApprovalCenter() {
  const { requisitions, getPendingApprovals, approveRequisition, rejectRequisition, getRequisitionById } =
    useRequisitionStore();
  const { currentUser } = useUserStore();

  const [approvalModal, setApprovalModal] = useState<ApprovalModalState>({
    requisition: null,
    type: null,
    opinion: '',
  });
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [detailRequisition, setDetailRequisition] = useState<Requisition | null>(null);

  const pendingApprovals = useMemo(() => {
    return getPendingApprovals(currentUser.role, currentUser.departmentId);
  }, [getPendingApprovals, currentUser]);

  const approvedCount = useMemo(() => {
    return requisitions.filter(r => r.status === 'approved' || r.status === 'completed').length;
  }, [requisitions]);

  const rejectedCount = useMemo(() => {
    return requisitions.filter(r => r.status === 'rejected').length;
  }, [requisitions]);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">审批中心</h1>
        <div className="text-sm text-slate-500">
          当前用户：{currentUser.name}（{getRoleText(currentUser.role)}）
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">待审批</p>
              <p className="text-3xl font-bold text-status-warning">{pendingApprovals.length}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-status-warning/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-status-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">需要您处理的申领单</span>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">已通过</p>
              <p className="text-3xl font-bold text-status-success">{approvedCount}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-status-success/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-status-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">已审批通过的申领单</span>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">已驳回</p>
              <p className="text-3xl font-bold text-status-danger">{rejectedCount}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-status-danger/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-status-danger"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">已驳回的申领单</span>
          </div>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="section-title">待审批列表</h2>
          <span className="text-sm text-slate-500">
            共 <span className="font-semibold text-status-warning">{pendingApprovals.length}</span> 条待处理
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-3 text-left">申领单号</th>
              <th className="px-6 py-3 text-left">科室</th>
              <th className="px-6 py-3 text-left">申请人</th>
              <th className="px-6 py-3 text-right">申请金额</th>
              <th className="px-6 py-3 text-center">当前审批级别</th>
              <th className="px-6 py-3 text-center">剩余时间</th>
              <th className="px-6 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {pendingApprovals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>暂无待审批的申领单</p>
                  </div>
                </td>
              </tr>
            ) : (
              pendingApprovals.map(req => (
                <tr key={req.id} className="table-row">
                  <td className="px-6 py-4">
                    <button
                      className="font-mono text-sm text-primary-600 hover:text-primary-700 hover:underline"
                      onClick={() => handleViewDetail(req.id)}
                    >
                      {req.id}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{req.departmentName}</td>
                  <td className="px-6 py-4 text-slate-700">{req.applicantName}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    {formatCurrency(req.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                      {getApprovalLevelText(req.approvalLevel)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {req.deadline ? <CountdownTimer deadline={req.deadline} /> : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="btn-success !px-4 !py-1.5 text-sm"
                        onClick={() => handleOpenApproval(req, 'approve')}
                      >
                        通过
                      </button>
                      <button
                        className="btn-danger !px-4 !py-1.5 text-sm"
                        onClick={() => handleOpenApproval(req, 'reject')}
                      >
                        驳回
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {approvalModal.requisition && approvalModal.type && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {approvalModal.type === 'approve' ? '审批通过' : '审批驳回'}
              </h2>
              <button
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                onClick={() => setApprovalModal({ requisition: null, type: null, opinion: '' })}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申领单号</span>
                  <span className="font-mono text-slate-800">{approvalModal.requisition.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申请科室</span>
                  <span className="text-slate-800">{approvalModal.requisition.departmentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申请人</span>
                  <span className="text-slate-800">{approvalModal.requisition.applicantName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">申请金额</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(approvalModal.requisition.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">当前审批级别</span>
                  <span className="text-slate-800">
                    {getApprovalLevelText(approvalModal.requisition.approvalLevel)}
                  </span>
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
                  className="input-field min-h-24 resize-none"
                  placeholder={
                    approvalModal.type === 'approve'
                      ? '请输入审批意见（选填）...'
                      : '请输入驳回原因...'
                  }
                  value={approvalModal.opinion}
                  onChange={e =>
                    setApprovalModal(prev => ({ ...prev, opinion: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setApprovalModal({ requisition: null, type: null, opinion: '' })}
              >
                取消
              </button>
              {approvalModal.type === 'approve' ? (
                <button className="btn-success" onClick={handleConfirmApproval}>
                  确认通过
                </button>
              ) : (
                <button
                  className="btn-danger"
                  onClick={handleConfirmApproval}
                  disabled={!approvalModal.opinion.trim()}
                >
                  确认驳回
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailRequisition && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
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
                  <span className="status-pending">审批中</span>
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
                  <p className="text-slate-800">{getApprovalLevelText(detailRequisition.approvalLevel)}</p>
                </div>
              </div>

              <div className="dashboard-card overflow-hidden">
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
                    {detailRequisition.items.map(item => (
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
