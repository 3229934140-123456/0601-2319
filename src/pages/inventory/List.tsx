import { useState, useMemo } from 'react';
import {
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { materials } from '@/mock/data';
import { formatCurrency, formatDate, getStatusText, getDaysDiff } from '@/utils';
import type { InventoryStatus } from '@/types';

const statusColorMap: Record<string, string> = {
  normal: 'bg-status-success/10 text-status-success',
  warning: 'bg-status-warning/10 text-status-warning',
  near_expiry: 'bg-status-warning/10 text-status-warning',
  expired: 'bg-status-danger/10 text-status-danger',
  locked: 'bg-slate-500/10 text-slate-500',
};

export default function InventoryList() {
  const { inventories } = useInventoryStore();

  const [searchName, setSearchName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<InventoryStatus | ''>('');
  const [filterExpiryStart, setFilterExpiryStart] = useState('');
  const [filterExpiryEnd, setFilterExpiryEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(materials.map((m) => m.category));
    return Array.from(cats);
  }, []);

  const stats = useMemo(() => {
    const totalSKU = inventories.length;
    const totalValue = inventories.reduce((sum, inv) => sum + inv.totalValue, 0);
    const warningCount = inventories.filter((inv) => inv.status === 'warning').length;
    const nearExpiryCount = inventories.filter(
      (inv) => inv.status === 'near_expiry' || inv.status === 'expired'
    ).length;
    return { totalSKU, totalValue, warningCount, nearExpiryCount };
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    return inventories.filter((inv) => {
      if (searchName && !inv.materialName.includes(searchName)) return false;
      if (filterCategory && inv.category !== filterCategory) return false;
      if (filterStatus && inv.status !== filterStatus) return false;
      if (filterExpiryStart) {
        const days = getDaysDiff(inv.expiryDate);
        if (days < parseInt(filterExpiryStart)) return false;
      }
      if (filterExpiryEnd) {
        const days = getDaysDiff(inv.expiryDate);
        if (days > parseInt(filterExpiryEnd)) return false;
      }
      return true;
    });
  }, [inventories, searchName, filterCategory, filterStatus, filterExpiryStart, filterExpiryEnd]);

  const resetFilters = () => {
    setSearchName('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterExpiryStart('');
    setFilterExpiryEnd('');
  };

  const statCards = [
    {
      label: '总库存SKU数',
      value: stats.totalSKU,
      unit: '个',
      icon: Package,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-500',
    },
    {
      label: '总库存价值',
      value: formatCurrency(stats.totalValue),
      unit: '',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-status-success',
    },
    {
      label: '库存预警数量',
      value: stats.warningCount,
      unit: '个',
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-status-warning',
    },
    {
      label: '近效期数量',
      value: stats.nearExpiryCount,
      unit: '个',
      icon: Clock,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-status-danger',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">库存总览</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="dashboard-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2">{card.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800 data-number">
                    {card.value}
                  </span>
                  <span className="text-sm text-slate-500">{card.unit}</span>
                </div>
              </div>
              <div className={`${card.bgColor} p-3 rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-card">
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索耗材名称..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm text-slate-600 mb-1">类别</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">全部类别</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">状态</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as InventoryStatus | '')}
                  className="input-field"
                >
                  <option value="">全部状态</option>
                  <option value="normal">正常</option>
                  <option value="warning">库存预警</option>
                  <option value="near_expiry">近效期</option>
                  <option value="expired">已过期</option>
                  <option value="locked">已锁定</option>

                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">效期天数(起)</label>
                <input
                  type="number"
                  placeholder="最小天数"
                  value={filterExpiryStart}
                  onChange={(e) => setFilterExpiryStart(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">效期天数(止)</label>
                <input
                  type="number"
                  placeholder="最大天数"
                  value={filterExpiryEnd}
                  onChange={(e) => setFilterExpiryEnd(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {showFilters && (
            <div className="mt-4 flex justify-end">
              <button onClick={resetFilters} className="btn-secondary">
                重置筛选
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-5 py-4 font-semibold">耗材名称</th>
                <th className="text-left px-5 py-4 font-semibold">类别</th>
                <th className="text-left px-5 py-4 font-semibold">批号</th>
                <th className="text-right px-5 py-4 font-semibold">库存数量</th>
                <th className="text-left px-5 py-4 font-semibold">单位</th>
                <th className="text-left px-5 py-4 font-semibold">有效期</th>
                <th className="text-left px-5 py-4 font-semibold">状态</th>
                <th className="text-right px-5 py-4 font-semibold">库存价值</th>
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
                filteredInventories.map((inv) => (
                  <tr key={inv.id} className="table-row">
                    <td className="px-5 py-4 text-slate-800 font-medium">{inv.materialName}</td>
                    <td className="px-5 py-4 text-slate-600">{inv.category}</td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-sm">{inv.batchNo}</td>
                    <td className="px-5 py-4 text-right text-slate-800 font-mono font-semibold">
                      {inv.quantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{inv.unit}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(inv.expiryDate)}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 text-sm text-slate-500">
          共 {filteredInventories.length} 条记录
        </div>
      </div>
    </div>
  );
}
