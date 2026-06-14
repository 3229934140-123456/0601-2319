import { useState, useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Lock,
  ArrowUpCircle,
  AlertTriangle,
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
  const { inventories, lockExpiredInventory } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<TabType>('near');

  const tabs: { key: TabType; label: string; icon: typeof Clock }[] = [
    { key: 'near', label: '近效期(90天内)', icon: Clock },
    { key: 'expired', label: '已过期', icon: AlertCircle },
    { key: 'all', label: '全部', icon: CheckCircle },
  ];

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
        list = processedInventories.filter(
          (inv) => inv.daysToExpiry > 0 && inv.daysToExpiry <= 90
        );
        break;
      case 'expired':
        list = processedInventories.filter((inv) => inv.daysToExpiry <= 0);
        break;
      case 'all':
        list = processedInventories;
        break;
    }
    return list.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [processedInventories, activeTab]);

  const tabCounts = useMemo(() => {
    const near = processedInventories.filter(
      (inv) => inv.daysToExpiry > 0 && inv.daysToExpiry <= 90
    ).length;
    const expired = processedInventories.filter((inv) => inv.daysToExpiry <= 0).length;
    const all = processedInventories.length;
    return { near, expired, all };
  }, [processedInventories]);

  const getDaysColor = (days: number) => {
    if (days <= 0) return 'text-status-danger';
    if (days < 30) return 'text-status-danger font-bold';
    if (days < 60) return 'text-status-warning font-semibold';
    if (days < 90) return 'text-yellow-600';
    return 'text-slate-600';
  };

  const getDaysBgColor = (days: number) => {
    if (days <= 0) return 'bg-status-danger/5';
    if (days < 30) return 'bg-status-danger/5';
    if (days < 60) return 'bg-status-warning/5';
    if (days < 90) return 'bg-yellow-50';
    return '';
  };

  const isPriorityOutbound = (days: number, status: string) => {
    return days > 0 && days < 60 && status !== 'locked';
  };

  const handleLockExpired = () => {
    lockExpiredInventory();
  };

  const expiredUnlockedCount = useMemo(
    () =>
      processedInventories.filter(
        (inv) => inv.daysToExpiry <= 0 && inv.status !== 'locked'
      ).length,
    [processedInventories]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">效期管理</h1>
        {expiredUnlockedCount > 0 && (
          <button onClick={handleLockExpired} className="btn-danger flex items-center gap-2">
            <Lock className="w-4 h-4" />
            锁定已过期库存 ({expiredUnlockedCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">近效期(30天内)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-status-danger data-number">
                  {processedInventories.filter((inv) => inv.daysToExpiry > 0 && inv.daysToExpiry < 30).length}
                </span>
                <span className="text-sm text-slate-500">个</span>
              </div>
            </div>
            <div className="bg-status-danger/10 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-status-danger" />
            </div>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">近效期(60天内)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-status-warning data-number">
                  {processedInventories.filter((inv) => inv.daysToExpiry >= 30 && inv.daysToExpiry < 60).length}
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
              <p className="text-sm text-slate-500 mb-2">近效期(90天内)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-yellow-600 data-number">
                  {processedInventories.filter((inv) => inv.daysToExpiry >= 60 && inv.daysToExpiry <= 90).length}
                </span>
                <span className="text-sm text-slate-500">个</span>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">已过期</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-700 data-number">
                  {processedInventories.filter((inv) => inv.daysToExpiry <= 0).length}
                </span>
                <span className="text-sm text-slate-500">个</span>
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
                  const rowBg = getDaysBgColor(inv.daysToExpiry);
                  const priority = isPriorityOutbound(inv.daysToExpiry, inv.status);
                  const isLocked = inv.status === 'locked';

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
                          {getStatusText(inv.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-800 font-mono font-semibold">
                        {formatCurrency(inv.totalValue)}
                      </td>
                      <td className="px-5 py-4">
                        {priority ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-warning/15 text-status-warning">
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            优先出库
                          </span>
                        ) : isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-500">
                            <Lock className="w-3.5 h-3.5" />
                            已锁定
                          </span>
                        ) : inv.daysToExpiry <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-danger/15 text-status-danger">
                            <AlertCircle className="w-3.5 h-3.5" />
                            待锁定
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
              <span className="w-3 h-3 rounded-full bg-status-danger"></span>
              <span>&lt;30天</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-status-warning"></span>
              <span>&lt;60天</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span>&lt;90天</span>
            </div>
          </div>
          <span className="text-sm text-slate-500">共 {filteredInventories.length} 条记录</span>
        </div>
      </div>
    </div>
  );
}
