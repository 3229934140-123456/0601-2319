import { useState } from 'react';
import { Database, Package, Building2, Truck, Phone, User } from 'lucide-react';
import { materials, departments, suppliers } from '@/mock/data';
import { formatCurrency, cn } from '@/utils';

type TabType = 'materials' | 'departments' | 'suppliers';

export default function Basic() {
  const [activeTab, setActiveTab] = useState<TabType>('materials');

  const tabs = [
    { key: 'materials' as const, label: '耗材档案', icon: Package, count: materials.length },
    { key: 'departments' as const, label: '科室信息', icon: Building2, count: departments.length },
    { key: 'suppliers' as const, label: '供应商管理', icon: Truck, count: suppliers.length },
  ];

  const getUsageRate = (used: number, budget: number) => {
    return budget > 0 ? (used / budget) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">基础数据</h1>
        <p className="text-sm text-slate-500 mt-1">管理耗材、科室、供应商等基础数据</p>
      </div>

      <div className="dashboard-card p-2">
        <div className="flex items-center gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all",
                  isActive
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  isActive ? "bg-white/20" : "bg-slate-200 text-slate-600"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'materials' && (
        <div className="dashboard-card overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-primary-600" />
              <h2 className="section-title">耗材档案</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-4 text-left">耗材名称</th>
                  <th className="px-6 py-4 text-left">类别</th>
                  <th className="px-6 py-4 text-left">规格</th>
                  <th className="px-6 py-4 text-left">单位</th>
                  <th className="px-6 py-4 text-right">单价</th>
                  <th className="px-6 py-4 text-right">安全库存</th>
                  <th className="px-6 py-4 text-right">当前库存</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(mat => {
                  const isLow = mat.currentStock < mat.safetyStock;
                  return (
                    <tr key={mat.id} className="table-row">
                      <td className="px-6 py-4 font-medium text-slate-800">{mat.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
                          {mat.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{mat.spec}</td>
                      <td className="px-6 py-4 text-slate-600">{mat.unit}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-700">{formatCurrency(mat.price)}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">{mat.safetyStock}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "font-mono font-semibold",
                          isLow ? "text-status-danger" : "text-slate-800"
                        )}>
                          {mat.currentStock}
                          {isLow && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-status-danger/10 text-status-danger rounded-full">
                              低库存
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="dashboard-card overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h2 className="section-title">科室信息</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-4 text-left">科室名称</th>
                  <th className="px-6 py-4 text-right">月度预算</th>
                  <th className="px-6 py-4 text-right">已用预算</th>
                  <th className="px-6 py-4 text-left w-72">预算使用率</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => {
                  const rate = getUsageRate(dept.usedBudget, dept.monthlyBudget);
                  const remaining = dept.monthlyBudget - dept.usedBudget;
                  const isOver = rate > 100;
                  const isWarn = rate >= 80 && rate <= 100;
                  return (
                    <tr key={dept.id} className="table-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-slate-800">{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-700">{formatCurrency(dept.monthlyBudget)}</td>
                      <td className="px-6 py-4 text-right font-mono text-primary-600 font-semibold">{formatCurrency(dept.usedBudget)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isOver ? "bg-gradient-to-r from-status-danger to-red-500" :
                                  isWarn ? "bg-gradient-to-r from-status-warning to-amber-500" :
                                  "bg-gradient-to-r from-primary-500 to-primary-600"
                                )}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={cn(
                                "text-sm font-mono font-semibold",
                                isOver ? "text-status-danger" : isWarn ? "text-status-warning" : "text-slate-600"
                              )}>
                                {rate.toFixed(1)}%
                              </span>
                              <span className={cn(
                                "text-xs font-medium",
                                remaining < 0 ? "text-status-danger" : "text-slate-500"
                              )}>
                                剩余 {formatCurrency(remaining)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="dashboard-card overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-primary-600" />
              <h2 className="section-title">供应商管理</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-4 text-left">供应商名称</th>
                  <th className="px-6 py-4 text-left">联系人</th>
                  <th className="px-6 py-4 text-left">联系电话</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(sup => (
                  <tr key={sup.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-slate-800">{sup.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{sup.contact}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-slate-700">{sup.phone}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
