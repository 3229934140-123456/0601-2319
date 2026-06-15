import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Lock,
  ArrowUpCircle,
  FileText,
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { formatCurrency, formatDate, getStatusText, getDaysDiff } from '@/utils';
import type { Inventory } from '@/types';

type TabType = 'near' | 'expired' | 'all';

const statusColorMap: Record<string, string> = {
  normal: 'bg-status-success/10 text-status-success',
  warning: 'bg-status-warning/10 text-status-warning',
  near_expiry: 'bg-status-warning/10 text-status-warning',
  expired: 'bg-status-danger/10 text-status-danger',
  locked: 'bg-slate-500/10 text-slate-500',
};

export default function InventoryExpiry() {
  const navigate = useNavigate();
  const { inventories, processAutoLockOnLoad } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<TabType>('near');
  const [tipMessage, setTipMessage] = useState<string | null>(null);

  const tabs: { key: TabType; label: string; icon: typeof Clock }[] = [
    { key: 'near', label: '近效期', icon: Clock },
    { key: 'expired', label: '已过期', icon: AlertCircle },
    { key: 'all', label: '全部', icon: CheckCircle },
  ];

  useEffect(() => {
    const result = processAutoLockOnLoad();
    if (result.count > 0) {
      setTipMessage(`已自动锁定 ${result.count} 个批次，生成 ${result.scrapCount} 个报废工单`);
      setTimeout(() => setTipMessage(null), 3000);
    }
  }, [processAutoLockOnLoad]);

  const processedInventories = useMemo(() => {
    return inventories.map((inv) => ({
      ...inv,
      daysToExpiry: getDaysDiff(inv.expiryDate),
    }));
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    let list: (Inventory & { daysToExpiry: number })[] = [];
    switch (activeTab) {
      case 'near':
        list = processedInventories.filter((inv) => inv.status === 'near_expiry');
        break;
      case 'expired':
        list = processedInventories.filter((inv) => inv.status === 'expired');
        break;
      case 'all':
        list = processedInventories;
        break;
    }
    return list.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [processedInventories, activeTab]);

  const tabCounts = useMemo(() => {
    const near = processedInventories.filter((inv) => inv.status === 'near_expiry').length;
    const expired = processedInventories.filter((inv) => inv.status === 'expired').length;
    const all = processedInventories.length;
    return { near, expired, all };
  }, [processedInventories]);

  const stats = useMemo(() => {
    const nearList = processedInventories.filter((inv) => inv.status === 'near_expiry');
    const expiredList = processedInventories.filter((inv) => inv.status === 'expired');
    const lockedList = processedInventories.filter((inv) => inv.status === 'locked');
    return {
      near: {
        batches: nearList.length,
        quantity: nearList.reduce((sum, inv) => sum + inv.quantity, 0),
      },
      expired: {
        batches: expiredList.length,
        quantity: expiredList.reduce((sum, inv) => sum + inv.quantity, 0),
      },
      locked: {
        batches: lockedList.length,
        quantity: lockedList.reduce((sum, inv) => sum + inv.quantity, 0),
      },
    };
  }, [processedInventories]);

  const getDaysColor = (days: number) => {
    if (days <= 0) return 'text-status-danger';
    if (days < 30) return 'text-status-danger font-bold';
    if (days < 60) return 'text-status-warning font-semibold';
    if (days < 90) return 'text-yellow-600';
    return 'text-slate-600';
  };

  const getDaysBgColor = (days: number, status: string) => {
    if (status === 'locked') return 'bg-slate-50';
    if (days <= 0) return 'bg-status-danger/5';
    if (days < 30) return 'bg-status-danger/5';
    if (days < 60) return 'bg-status-warning/5';
    if (days < 90) return 'bg-yellow-50';
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">效期管理</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory/scrap')}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            报废工单
          </button>
        </div>
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
              <p className="text-sm text-slate-500 mb-2">近效期</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-status-warning data-number">
                  {stats.near.quantity.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">数量</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {stats.near.batches} 个批次
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
              <p className="text-sm text-slate-500 mb-2">已过期</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-status-danger data-number">
                  {stats.expired.quantity.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">数量</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {stats.expired.batches} 个批次
              </div>
            </div>
            <div className="bg-status-danger/10 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-status-danger" />
            </div>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">已锁定</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-700 data-number">
                  {stats.locked.quantity.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">数量</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {stats.locked.batches} 个批次
              </div>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl">
              <Lock className="w-6 h-6 text-slate-500" />
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
                <th className="text-left px-5 py-4 font-semibold">耗材名称</th>
                <th className="text-left px-5 py-4 font-semibold">批号</th>
                <th className="text-right px-5 py-4 font-semibold">库存数量</th>
                <th className="text-left px-5 py-4 font-semibold">有效期</th>
                <th className="text-right px-5 py-4 font-semibold">距效期天数</th>
                <th className="text-left px-5 py-4 font-semibold">状态</th>
                <th className="text-right px-5 py-4 font-semibold">总价值</th>
                <th className="text-left px-5 py-4 font-semibold">标记</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                filteredInventories.map((inv) => {
                  const daysColor = getDaysColor(inv.daysToExpiry);
                  const rowBg = getDaysBgColor(inv.daysToExpiry, inv.status);
                  const isLocked = inv.status === 'locked';
                  const isExpired = inv.status === 'expired';
                  const isNearExpiry = inv.status === 'near_expiry';

                  return (
                    <tr key={inv.id} className={`table-row ${rowBg}`}>
                      <td className="px-5 py-4 text-slate-800 font-medium">
                        {inv.materialName}
                        {isLocked && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-mono text-sm">
                        {inv.batchNo}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-800 font-mono font-semibold">
                        {inv.quantity.toLocaleString()} {inv.unit}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(inv.expiryDate)}</td>
                      <td className={`px-5 py-4 text-right font-mono ${daysColor}`}>
                        {inv.daysToExpiry > 0
                          ? `${inv.daysToExpiry} 天`
                          : `已过期 ${Math.abs(inv.daysToExpiry)} 天`}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`status-badge ${statusColorMap[inv.status] || 'bg-slate-100 text-slate-600'}`}
                        >
                          {isNearExpiry
                            ? '近效期'
                            : isExpired
                            ? '已过期'
                            : isLocked
                            ? '已锁定'
                            : getStatusText(inv.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-800 font-mono font-semibold">
                        {formatCurrency(inv.totalValue)}
                      </td>
                      <td className="px-5 py-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-500">
                            <Lock className="w-3.5 h-3.5" />
                            不可出库
                          </span>
                        ) : isNearExpiry ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-warning/15 text-status-warning">
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            优先出库
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-danger/15 text-status-danger">
                            <AlertCircle className="w-3.5 h-3.5" />
                            已过期
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-status-warning"></span>
              <span>近效期</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-status-danger"></span>
              <span>已过期</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-500"></span>
              <span>已锁定</span>
            </div>
          </div>
          <span className="text-sm text-slate-500">共 {filteredInventories.length} 条记录</span>
        </div>
      </div>
    </div>
  );
}
