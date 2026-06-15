import { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { useScrapStore } from '@/store/scrapStore';
import { formatCurrency, formatDateTime, getStatusText } from '@/utils';
import type { ScrapOrder } from '@/types';

type TabType = 'all' | 'pending' | 'processed';

const statusColorMap: Record<string, string> = {
  pending: 'bg-status-warning/10 text-status-warning',
  processed: 'bg-status-success/10 text-status-success',
  cancelled: 'bg-slate-500/10 text-slate-500',
};

export default function ScrapList() {
  const { orders, getPendingOrders, processScrapOrder } = useScrapStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<ScrapOrder | null>(null);
  const [tipMessage, setTipMessage] = useState<string | null>(null);

  const tabs: { key: TabType; label: string; icon: typeof Clock }[] = [
    { key: 'all', label: '全部', icon: FileText },
    { key: 'pending', label: '待处理', icon: Clock },
    { key: 'processed', label: '已处理', icon: CheckCircle },
  ];

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const processed = orders.filter((o) => o.status === 'processed').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    return { pending, processed, cancelled, total: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return orders.filter((o) => o.status === 'pending');
      case 'processed':
        return orders.filter((o) => o.status === 'processed' || o.status === 'cancelled');
      case 'all':
      default:
        return orders;
    }
  }, [orders, activeTab]);

  const tabCounts = useMemo(() => {
    const all = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const processed = orders.filter(
      (o) => o.status === 'processed' || o.status === 'cancelled'
    ).length;
    return { all, pending, processed };
  }, [orders]);

  const handleViewDetail = (order: ScrapOrder) => {
    setCurrentOrder(order);
    setShowDetailModal(true);
  };

  const handleProcessClick = (order: ScrapOrder) => {
    setCurrentOrder(order);
    setShowProcessModal(true);
  };

  const handleConfirmProcess = () => {
    if (!currentOrder) return;
    processScrapOrder(currentOrder.id);
    setShowProcessModal(false);
    setCurrentOrder(null);
    setTipMessage('报废工单已处理完成');
    setTimeout(() => setTipMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">报废工单</h1>
      </div>

      {tipMessage && (
        <div className="fixed top-6 right-6 bg-status-success text-white px-6 py-3 rounded-lg shadow-glow-green z-50 animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {tipMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">待处理</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-status-warning data-number">
                  {stats.pending}
                </span>
                <span className="text-sm text-slate-500">个</span>
              </div>
            </div>
            <div className="bg-status-warning/10 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-status-warning" />
            </div>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">已处理</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-status-success data-number">
                  {stats.processed}
                </span>
                <span className="text-sm text-slate-500">个</span>
              </div>
            </div>
            <div className="bg-status-success/10 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-status-success" />
            </div>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">已取消</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-600 data-number">
                  {stats.cancelled}
                </span>
                <span className="text-sm text-slate-500">个</span>
              </div>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="border-b border-slate-100">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600 font-semibold bg-primary-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-5 py-4 font-semibold">工单编号</th>
                <th className="text-left px-5 py-4 font-semibold">耗材名称</th>
                <th className="text-left px-5 py-4 font-semibold">批次号</th>
                <th className="text-right px-5 py-4 font-semibold">数量</th>
                <th className="text-left px-5 py-4 font-semibold">单位</th>
                <th className="text-right px-5 py-4 font-semibold">单价</th>
                <th className="text-right px-5 py-4 font-semibold">总价值</th>
                <th className="text-left px-5 py-4 font-semibold">报废原因</th>
                <th className="text-left px-5 py-4 font-semibold">状态</th>
                <th className="text-left px-5 py-4 font-semibold">创建时间</th>
                <th className="text-center px-5 py-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-slate-400">
                    暂无报废工单数据
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="px-5 py-4 text-slate-800 font-mono text-sm">
                      {order.id}
                    </td>
                    <td className="px-5 py-4 text-slate-800 font-medium">
                      {order.materialName}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-sm">
                      {order.batchNo}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-800 font-mono font-semibold">
                      {order.quantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{order.unit}</td>
                    <td className="px-5 py-4 text-right text-slate-600 font-mono">
                      {formatCurrency(order.unitPrice)}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-800 font-mono font-semibold">
                      {formatCurrency(order.totalValue)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-[200px] truncate">
                      {order.reason}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`status-badge ${statusColorMap[order.status] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {formatDateTime(order.createTime)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="查看详情"
                          onClick={() => handleViewDetail(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            className="p-1.5 text-status-success hover:bg-status-success/10 rounded-lg transition-colors"
                            title="处理报废"
                            onClick={() => handleProcessClick(order)}
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 text-sm text-slate-500">
          共 {filteredOrders.length} 条记录
        </div>
      </div>

      {showDetailModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">报废工单详情</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setCurrentOrder(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单编号</p>
                  <p className="font-mono text-slate-800">{currentOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">状态</p>
                  <span
                    className={`status-badge ${statusColorMap[currentOrder.status] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {getStatusText(currentOrder.status)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">耗材名称</p>
                  <p className="text-slate-800 font-medium">{currentOrder.materialName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">批次号</p>
                  <p className="font-mono text-slate-800">{currentOrder.batchNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">数量</p>
                  <p className="text-slate-800 font-semibold">
                    {currentOrder.quantity.toLocaleString()} {currentOrder.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">单价</p>
                  <p className="text-slate-800 font-mono">
                    {formatCurrency(currentOrder.unitPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">总价值</p>
                  <p className="text-slate-800 font-mono font-semibold">
                    {formatCurrency(currentOrder.totalValue)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">报废原因</p>
                <p className="text-slate-800">{currentOrder.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">创建时间</p>
                  <p className="text-slate-800 text-sm">
                    {formatDateTime(currentOrder.createTime)}
                  </p>
                </div>
                {currentOrder.processTime && (
                  <div>
                    <p className="text-sm text-slate-500">处理时间</p>
                    <p className="text-slate-800 text-sm">
                      {formatDateTime(currentOrder.processTime)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDetailModal(false);
                  setCurrentOrder(null);
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showProcessModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-status-warning/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-status-warning" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">确认处理报废</h3>
            </div>
            <p className="text-slate-600 mb-4">
              确认要处理以下报废工单吗？处理后将标记为已处理状态。
            </p>
            <div className="p-4 bg-slate-50 rounded-lg space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">工单编号：</span>
                <span className="font-mono text-slate-800">{currentOrder.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">耗材名称：</span>
                <span className="text-slate-800 font-medium">{currentOrder.materialName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">数量：</span>
                <span className="text-slate-800 font-semibold">
                  {currentOrder.quantity.toLocaleString()} {currentOrder.unit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">总价值：</span>
                <span className="text-slate-800 font-mono font-semibold">
                  {formatCurrency(currentOrder.totalValue)}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowProcessModal(false);
                  setCurrentOrder(null);
                }}
              >
                取消
              </button>
              <button className="btn-primary" onClick={handleConfirmProcess}>
                确认处理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
