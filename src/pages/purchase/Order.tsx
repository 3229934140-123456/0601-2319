import { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  Send,
  Truck,
  CircleCheckBig,
  Search,
  Filter,
  ChevronDown,
  Eye,
  ArrowRight,
  X,
  Package,
  User,
  Calendar,
} from 'lucide-react';
import { usePurchaseStore } from '@/store/purchaseStore';
import { formatCurrency, formatDateTime, getStatusText, cn } from '@/utils';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

const statusFlow: PurchaseOrderStatus[] = ['pending', 'approved', 'ordered', 'received', 'completed'];

const statusActionMap: Record<
  PurchaseOrderStatus,
  { nextStatus: PurchaseOrderStatus | null; label: string }
> = {
  pending: { nextStatus: null, label: '待审批' },
  approved: { nextStatus: 'ordered', label: '下单' },
  ordered: { nextStatus: 'received', label: '确认到货' },
  received: { nextStatus: 'completed', label: '完成' },
  completed: { nextStatus: null, label: '已完成' },
};

export default function Order() {
  const { orders, updateOrderStatus } = usePurchaseStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null);

  const stats = useMemo(() => {
    const result: Record<string, number> = {
      pending: 0,
      approved: 0,
      ordered: 0,
      received: 0,
      completed: 0,
    };
    orders.forEach((o) => {
      result[o.status] = (result[o.status] || 0) + 1;
    });
    return result;
  }, [orders]);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(searchText.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleViewDetail = (order: PurchaseOrder) => {
    setCurrentOrder(order);
    setShowDetailModal(true);
  };

  const handleStatusChange = (order: PurchaseOrder) => {
    const action = statusActionMap[order.status];
    if (!action.nextStatus) return;
    updateOrderStatus(order.id, action.nextStatus);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-normal';
      case 'ordered':
        return 'status-approved';
      case 'received':
        return 'status-approved';
      case 'completed':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-normal';
    }
  };

  const statCards = [
    {
      key: 'pending',
      label: '待审批',
      count: stats.pending,
      icon: Clock,
      color: 'from-status-warning to-orange-500',
      bg: 'bg-status-warning/10',
      text: 'text-status-warning',
    },
    {
      key: 'approved',
      label: '已批准',
      count: stats.approved,
      icon: CheckCircle2,
      color: 'from-status-info to-blue-500',
      bg: 'bg-status-info/10',
      text: 'text-status-info',
    },
    {
      key: 'ordered',
      label: '已下单',
      count: stats.ordered,
      icon: Send,
      color: 'from-primary-500 to-primary-600',
      bg: 'bg-primary-500/10',
      text: 'text-primary-600',
    },
    {
      key: 'received',
      label: '已到货',
      count: stats.received,
      icon: Truck,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-500/10',
      text: 'text-purple-600',
    },
    {
      key: 'completed',
      label: '已完成',
      count: stats.completed,
      icon: CircleCheckBig,
      color: 'from-status-success to-green-500',
      bg: 'bg-status-success/10',
      text: 'text-status-success',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-glow-blue">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">订单管理</h1>
            <p className="text-sm text-slate-500 mt-0.5">采购订单全生命周期管理</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isActive = statusFilter === stat.key;
          return (
            <div
              key={stat.key}
              className={cn(
                'dashboard-card p-4 cursor-pointer',
                isActive && 'ring-2 ring-primary-500 border-primary-300'
              )}
              onClick={() => setStatusFilter(isActive ? 'all' : stat.key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className={cn('text-2xl font-bold mt-1 data-number', stat.text)}>
                    {stat.count}
                  </p>
                </div>
                <div className={cn('p-2.5 rounded-lg', stat.bg)}>
                  <Icon className={cn('w-5 h-5', stat.text)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="搜索订单号、供应商..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              className="input-field pl-10 pr-10 appearance-none cursor-pointer min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">待审批</option>
              <option value="approved">已批准</option>
              <option value="ordered">已下单</option>
              <option value="received">已到货</option>
              <option value="completed">已完成</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                <th className="px-4 py-3.5 text-right">总金额</th>
                <th className="px-4 py-3.5 text-left">状态</th>
                <th className="px-4 py-3.5 text-left">创建时间</th>
                <th className="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const action = statusActionMap[order.status];
                return (
                  <tr key={order.id} className="table-row">
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
                    <td className="px-4 py-3.5 text-sm text-right">
                      <span className="data-number font-semibold text-primary-600">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={getStatusClass(order.status)}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDateTime(order.createTime)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="查看详情"
                          onClick={() => handleViewDetail(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {action.nextStatus && (
                          <button
                            className="p-1.5 text-status-success hover:bg-status-success/10 rounded-lg transition-colors"
                            title={action.label}
                            onClick={() => handleStatusChange(order)}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    暂无订单数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">订单详情</h3>
                  <p className="text-sm text-slate-500 font-mono">
                    {currentOrder.id.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => {
                  setShowDetailModal(false);
                  setCurrentOrder(null);
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">供应商</span>
                  <span className="text-sm font-medium text-slate-800">
                    {currentOrder.supplierName}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">创建人</span>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {currentOrder.creatorName}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">创建时间</span>
                  <span className="text-sm font-medium text-slate-800">
                    {formatDateTime(currentOrder.createTime)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">订单状态</span>
                  <span className={getStatusClass(currentOrder.status)}>
                    {getStatusText(currentOrder.status)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">订单明细</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th className="px-3 py-2.5 text-left text-xs">耗材名称</th>
                        <th className="px-3 py-2.5 text-left text-xs">规格</th>
                        <th className="px-3 py-2.5 text-right text-xs">单价</th>
                        <th className="px-3 py-2.5 text-right text-xs">数量</th>
                        <th className="px-3 py-2.5 text-left text-xs">单位</th>
                        <th className="px-3 py-2.5 text-right text-xs">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-3 py-2.5 text-sm text-slate-700">
                            {item.materialName}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-500">{item.spec}</td>
                          <td className="px-3 py-2.5 text-sm text-right data-number text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-right data-number font-medium text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-500">{item.unit}</td>
                          <td className="px-3 py-2.5 text-sm text-right data-number font-semibold text-primary-600">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td
                          colSpan={5}
                          className="px-3 py-2.5 text-sm font-semibold text-slate-700 text-right"
                        >
                          合计：
                        </td>
                        <td className="px-3 py-2.5 text-sm text-right data-number font-bold text-primary-600">
                          {formatCurrency(currentOrder.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">状态流转</h4>
                <div className="flex items-center justify-between gap-1">
                  {statusFlow.map((status, index) => {
                    const currentIndex = statusFlow.indexOf(currentOrder.status);
                    const stepIndex = index;
                    const isDone = stepIndex < currentIndex;
                    const isCurrent = stepIndex === currentIndex;

                    const StepIcon = [
                      Clock,
                      CheckCircle2,
                      Send,
                      Truck,
                      CircleCheckBig,
                    ][index];

                    return (
                      <div key={status} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                              isDone && 'bg-status-success text-white',
                              isCurrent && 'bg-primary-500 text-white shadow-glow-blue',
                              !isDone && !isCurrent && 'bg-slate-100 text-slate-400'
                            )}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={cn(
                              'text-xs mt-1.5 font-medium',
                              isCurrent ? 'text-primary-600' : isDone ? 'text-status-success' : 'text-slate-400'
                            )}
                          >
                            {getStatusText(status)}
                          </span>
                        </div>
                        {index < statusFlow.length - 1 && (
                          <div
                            className={cn(
                              'flex-1 h-0.5 mx-1 rounded-full',
                              stepIndex < currentIndex ? 'bg-status-success' : 'bg-slate-200'
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDetailModal(false);
                  setCurrentOrder(null);
                }}
              >
                关闭
              </button>
              {statusActionMap[currentOrder.status].nextStatus && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleStatusChange(currentOrder);
                    setShowDetailModal(false);
                    setCurrentOrder(null);
                  }}
                >
                  {statusActionMap[currentOrder.status].label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
