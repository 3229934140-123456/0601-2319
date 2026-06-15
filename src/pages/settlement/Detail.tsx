import { useState, useMemo } from 'react';
import { ClipboardList, Download, Calendar, Building2, Clock } from 'lucide-react';
import { suppliers, purchaseOrders } from '@/mock/data';
import { formatCurrency, formatDateTime, exportToCSV, getStatusText, cn } from '@/utils';
import type { PurchaseOrderStatus } from '@/types';

export default function Detail() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PurchaseOrderStatus | ''>('');

  const allItems = useMemo(() => {
    return purchaseOrders
      .filter(po => {
        const createDate = po.createTime.split('T')[0];
        const matchDate = createDate >= startDate && createDate <= endDate;
        const matchSupplier = !selectedSupplier || po.supplierId === selectedSupplier;
        const matchStatus = !selectedStatus || po.status === selectedStatus;
        return matchDate && matchSupplier && matchStatus;
      })
      .flatMap(po =>
        po.items.map(item => ({
          ...item,
          orderId: po.id,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          status: po.status,
          createTime: po.createTime,
        }))
      );
  }, [startDate, endDate, selectedSupplier, selectedStatus]);

  const handleExport = () => {
    const today = new Date().toISOString().split('T')[0];
    const exportData = allItems.map(item => ({
      订单号: item.orderId,
      供应商: item.supplierName,
      耗材名称: item.materialName,
      规格: item.spec,
      单位: item.unit,
      数量: item.quantity,
      单价: formatCurrency(item.unitPrice),
      小计: formatCurrency(item.subtotal),
      下单时间: formatDateTime(item.createTime),
      状态: getStatusText(item.status),
    }));
    exportToCSV(exportData, `采购明细_${today}`);
  };

  const statusOptions: { value: PurchaseOrderStatus; label: string }[] = [
    { value: 'pending', label: '待审批' },
    { value: 'approved', label: '已批准' },
    { value: 'ordered', label: '已下单' },
    { value: 'received', label: '已到货' },
    { value: 'completed', label: '已完成' },
  ];

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'ordered': return 'status-normal';
      case 'received': return 'status-normal';
      case 'completed': return 'status-approved';
      default: return 'status-normal';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">采购明细</h1>
          <p className="text-sm text-slate-500 mt-1">采购订单明细查询与导出</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出明细
        </button>
      </div>

      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-end gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              开始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field w-48"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field w-48"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              供应商
            </label>
            <select
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
              className="input-field w-56"
            >
              <option value="">全部供应商</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              状态
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as PurchaseOrderStatus | '')}
              className="input-field w-40"
            >
              <option value="">全部状态</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-primary-600" />
              <h2 className="section-title">采购明细列表</h2>
            </div>
            <span className="text-sm text-slate-500">共 {allItems.length} 条记录</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left">订单号</th>
                <th className="px-6 py-4 text-left">供应商</th>
                <th className="px-6 py-4 text-left">耗材名称</th>
                <th className="px-6 py-4 text-left">规格</th>
                <th className="px-6 py-4 text-right">数量</th>
                <th className="px-6 py-4 text-right">单价</th>
                <th className="px-6 py-4 text-right">小计</th>
                <th className="px-6 py-4 text-left">下单时间</th>
                <th className="px-6 py-4 text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              {allItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                allItems.map((item, index) => (
                  <tr key={index} className="table-row">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-primary-600 font-medium">{item.orderId}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-sm">{item.supplierName}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.materialName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.spec}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-mono text-primary-600 font-semibold">{formatCurrency(item.subtotal)}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{formatDateTime(item.createTime)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(getStatusColor(item.status as PurchaseOrderStatus))}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
