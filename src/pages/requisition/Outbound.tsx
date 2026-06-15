import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutboundStore } from '@/store/outboundStore';
import { useUserStore } from '@/store/userStore';
import { formatCurrency, formatDateTime } from '@/utils';
import type { OutboundOrder } from '@/types';

export default function RequisitionOutbound() {
  const navigate = useNavigate();
  const { getOrders, getOrdersByDepartment, completeOutboundOrder, cancelOutboundOrder } = useOutboundStore();
  const { currentUser } = useUserStore();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [detailOrder, setDetailOrder] = useState<OutboundOrder | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const allOrders = useMemo(() => {
    if (currentUser.role === 'nurse' || currentUser.role === 'director') {
      return getOrdersByDepartment(currentUser.departmentId);
    }
    return getOrders();
  }, [currentUser, getOrders, getOrdersByDepartment]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (searchText) {
        const keyword = searchText.toLowerCase();
        const matchId = o.id.toLowerCase().includes(keyword);
        const matchReqId = o.requisitionId.toLowerCase().includes(keyword);
        const matchDept = o.departmentName.toLowerCase().includes(keyword);
        if (!matchId && !matchReqId && !matchDept) return false;
      }
      return true;
    });
  }, [allOrders, statusFilter, searchText]);

  const stats = useMemo(() => {
    const pending = allOrders.filter(o => o.status === 'pending').length;
    const completed = allOrders.filter(o => o.status === 'completed').length;
    const cancelled = allOrders.filter(o => o.status === 'cancelled').length;
    return { pending, completed, cancelled };
  }, [allOrders]);

  const handleViewDetail = (order: OutboundOrder) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  const handleComplete = (id: string) => {
    if (confirm('确认出库？')) {
      completeOutboundOrder(id, currentUser.id, currentUser.name);
      setSuccessMessage('出库成功');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleCancel = (id: string) => {
    if (confirm('确认取消该出库单？')) {
      const result = cancelOutboundOrder(id, currentUser.id, currentUser.name);
      if (result.success) {
        setSuccessMessage(result.message || '已取消');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-approved';
      case 'cancelled':
        return 'status-rejected';
      default:
        return 'status-normal';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待出库';
      case 'completed':
        return '已出库';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">出库单管理</h1>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          className="px-6 py-3 font-medium text-slate-500 hover:text-slate-700 transition-colors"
          onClick={() => navigate('/requisition')}
        >
          申领单列表
        </button>
        <button
          className="px-6 py-3 font-medium text-primary-600 border-b-2 border-primary-600 transition-colors"
        >
          出库单记录
        </button>
      </div>

      {successMessage && (
        <div className="dashboard-card p-4 bg-green-50 border-green-200">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">待出库</p>
              <p className="text-3xl font-bold text-status-warning">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">已出库</p>
              <p className="text-3xl font-bold text-status-success">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">已取消</p>
              <p className="text-3xl font-bold text-status-danger">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">状态：</label>
            <select
              className="input-field w-32"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">全部</option>
              <option value="pending">待出库</option>
              <option value="completed">已出库</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div className="flex-1 min-w-64">
            <input
              type="text"
              className="input-field"
              placeholder="搜索出库单号、申领单号、科室..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-3 text-left">出库单号</th>
              <th className="px-6 py-3 text-left">关联申领单号</th>
              <th className="px-6 py-3 text-left">科室</th>
              <th className="px-6 py-3 text-left">创建时间</th>
              <th className="px-6 py-3 text-center">状态</th>
              <th className="px-6 py-3 text-right">总金额</th>
              <th className="px-6 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} className="table-row">
                  <td className="px-6 py-4 font-mono text-sm text-slate-700">{order.id}</td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{order.requisitionId}</td>
                  <td className="px-6 py-4 text-slate-700">{order.departmentName}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDateTime(order.createTime)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={getStatusClass(order.status)}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        onClick={() => handleViewDetail(order)}
                      >
                        查看详情
                      </button>
                      {(currentUser.role === 'equipment' || currentUser.role === 'admin') && order.status === 'pending' && (
                        <button
                          className="text-status-success hover:text-green-700 font-medium text-sm"
                          onClick={() => handleComplete(order.id)}
                        >
                          确认出库
                        </button>
                      )}
                      {(currentUser.role === 'equipment' || currentUser.role === 'admin') && (
                        <div className="relative group">
                          <button
                            className={`font-medium text-sm ${
                              order.status === 'completed'
                                ? 'text-slate-400 cursor-not-allowed'
                                : order.status === 'pending'
                                ? 'text-status-danger hover:text-red-700'
                                : 'text-slate-400 cursor-not-allowed'
                            }`}
                            onClick={() => order.status === 'pending' && handleCancel(order.id)}
                            disabled={order.status === 'completed'}
                          >
                            取消
                          </button>
                          {order.status === 'completed' && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              已确认出库，不可取消
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetailModal && detailOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">出库单详情</h2>
              <button
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">出库单号</label>
                  <p className="font-mono text-slate-800">{detailOrder.id}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">关联申领单号</label>
                  <p className="font-mono text-slate-800">{detailOrder.requisitionId}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">科室</label>
                  <p className="text-slate-800">{detailOrder.departmentName}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">创建时间</label>
                  <p className="text-slate-800">{formatDateTime(detailOrder.createTime)}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">状态</label>
                  <span className={getStatusClass(detailOrder.status)}>
                    {getStatusText(detailOrder.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">总金额</label>
                  <p className="text-lg font-bold text-primary-600">{formatCurrency(detailOrder.totalAmount)}</p>
                </div>
              </div>

              <div className="dashboard-card overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-700">出库明细</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-2.5 text-left text-xs">耗材名称</th>
                      <th className="px-4 py-2.5 text-center text-xs">规格</th>
                      <th className="px-4 py-2.5 text-center text-xs">单位</th>
                      <th className="px-4 py-2.5 text-center text-xs">数量</th>
                      <th className="px-4 py-2.5 text-right text-xs">单价</th>
                      <th className="px-4 py-2.5 text-right text-xs">小计</th>
                      <th className="px-4 py-2.5 text-center text-xs">批次号</th>
                      <th className="px-4 py-2.5 text-center text-xs">库存ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailOrder.items.map(item => (
                      <tr key={item.id} className="table-row">
                        <td className="px-4 py-3 text-sm text-slate-700">{item.materialName}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.spec}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.unit}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600 font-mono">{item.batchNo}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600 font-mono">{item.inventoryId}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-700">
                        合计：
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">
                        {formatCurrency(detailOrder.totalAmount)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              {(currentUser.role === 'equipment' || currentUser.role === 'admin') && detailOrder.status === 'pending' && (
                <button
                  className="btn-success"
                  onClick={() => {
                    handleComplete(detailOrder.id);
                    setShowDetailModal(false);
                  }}
                >
                  确认出库
                </button>
              )}
              {(currentUser.role === 'equipment' || currentUser.role === 'admin') && (
                <div className="relative group">
                  <button
                    className={`btn-danger ${detailOrder.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (detailOrder.status === 'pending') {
                        handleCancel(detailOrder.id);
                        setShowDetailModal(false);
                      }
                    }}
                    disabled={detailOrder.status === 'completed'}
                  >
                    取消出库单
                  </button>
                  {detailOrder.status === 'completed' && (
                    <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      已确认出库，不可取消
                    </div>
                  )}
                </div>
              )}
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
