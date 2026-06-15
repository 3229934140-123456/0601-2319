import { useMemo, useState } from 'react';
import { PieChart, Building2, Wallet, TrendingUp } from 'lucide-react';
import { consumptions } from '@/mock/data';
import { useBudgetStore } from '@/store/budgetStore';
import { useBudgetFlowStore } from '@/store/budgetFlowStore';
import { formatCurrency, cn } from '@/utils';
import type { Department } from '@/types';
import BudgetFlowModal from '@/components/BudgetFlowModal';

export default function Cost() {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const departments = useBudgetStore(state => state.getDepartments());
  const pendingAmounts = useBudgetStore(state => state.pendingAmounts);
  const getRecordsByDepartment = useBudgetFlowStore(state => state.getRecordsByDepartment);

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showBudgetFlowModal, setShowBudgetFlowModal] = useState(false);

  const handleRowClick = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowBudgetFlowModal(true);
  };

  const stats = useMemo(() => {
    const monthlyConsumptions = consumptions.filter(c => c.consumeDate.startsWith(thisMonth));
    const totalConsumption = monthlyConsumptions.reduce((sum, c) => sum + c.amount, 0);
    const totalBudget = departments.reduce((sum, d) => sum + d.monthlyBudget, 0);
    const totalUsed = departments.reduce((sum, d) => sum + d.usedBudget, 0);

    return {
      totalConsumption,
      totalAllocated: totalUsed,
      departmentCount: departments.length,
      totalBudget,
    };
  }, [thisMonth, departments]);

  const departmentCosts = useMemo(() => {
    return departments.map(dept => {
      const deptConsumption = consumptions
        .filter(c => c.consumeDate.startsWith(thisMonth) && c.departmentId === dept.id)
        .reduce((sum, c) => sum + c.amount, 0);
      const remaining = dept.monthlyBudget - dept.usedBudget;
      const usageRate = dept.monthlyBudget > 0 ? (dept.usedBudget / dept.monthlyBudget) * 100 : 0;

      return {
        ...dept,
        actualConsumption: deptConsumption,
        remaining,
        usageRate,
        isOverBudget: usageRate > 100,
        isWarning: usageRate >= 80 && usageRate <= 100,
      };
    });
  }, [thisMonth, departments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">成本分摊</h1>
          <p className="text-sm text-slate-500 mt-1">月度消耗自动分摊至各科室成本中心</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="dashboard-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">当月总消耗</p>
              <p className="text-2xl font-bold text-slate-800 data-number mt-1">{formatCurrency(stats.totalConsumption)}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-status-success to-green-500 flex items-center justify-center text-white">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已分摊金额</p>
              <p className="text-2xl font-bold text-slate-800 data-number mt-1">{formatCurrency(stats.totalAllocated)}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-status-warning to-amber-500 flex items-center justify-center text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">科室数量</p>
              <p className="text-2xl font-bold text-slate-800 data-number mt-1">{stats.departmentCount}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-status-info to-sky-500 flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">月度总预算</p>
              <p className="text-2xl font-bold text-slate-800 data-number mt-1">{formatCurrency(stats.totalBudget)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="section-title">各科室成本分摊</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left">科室名称</th>
                <th className="px-6 py-4 text-right">月度预算</th>
                <th className="px-6 py-4 text-right">已用预算</th>
                <th className="px-6 py-4 text-right">实际消耗</th>
                <th className="px-6 py-4 text-right">预算剩余</th>
                <th className="px-6 py-4 text-left w-64">使用率</th>
              </tr>
            </thead>
            <tbody>
              {departmentCosts.map(dept => (
                <tr
                  key={dept.id}
                  className="table-row cursor-pointer hover:bg-primary-50/60 transition-colors"
                  onClick={() => handleRowClick(dept)}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{dept.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">{formatCurrency(dept.monthlyBudget)}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">{formatCurrency(dept.usedBudget)}</td>
                  <td className="px-6 py-4 text-right font-mono text-primary-600 font-semibold">{formatCurrency(dept.actualConsumption)}</td>
                  <td className={cn(
                    "px-6 py-4 text-right font-mono font-semibold",
                    dept.remaining < 0 ? "text-status-danger" : "text-status-success"
                  )}>
                    {formatCurrency(dept.remaining)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            dept.isOverBudget ? "bg-gradient-to-r from-status-danger to-red-500" :
                            dept.isWarning ? "bg-gradient-to-r from-status-warning to-amber-500" :
                            "bg-gradient-to-r from-primary-500 to-primary-600"
                          )}
                          style={{ width: `${Math.min(dept.usageRate, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-sm font-mono font-semibold whitespace-nowrap",
                        dept.isOverBudget ? "text-status-danger" :
                        dept.isWarning ? "text-status-warning" : "text-slate-600"
                      )}>
                        {dept.usageRate.toFixed(1)}%
                      </span>
                      {dept.isOverBudget && (
                        <span className="text-xs px-2 py-0.5 bg-status-danger/10 text-status-danger rounded-full font-medium">
                          超预算
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBudgetFlowModal && selectedDepartment && (
        <BudgetFlowModal
          department={selectedDepartment}
          records={getRecordsByDepartment(selectedDepartment.id)}
          budget={selectedDepartment.monthlyBudget}
          used={selectedDepartment.usedBudget}
          pending={pendingAmounts[selectedDepartment.id] || 0}
          onClose={() => setShowBudgetFlowModal(false)}
        />
      )}
    </div>
  );
}
