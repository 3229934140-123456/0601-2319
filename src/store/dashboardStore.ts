import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardFilter, DashboardStats } from '@/types';
import { dashboardStats as mockStats, consumptions, departments, materials, inventories, purchaseOrders, requisitions } from '@/mock/data';

interface DashboardState {
  filter: DashboardFilter;
  stats: DashboardStats;
  setFilter: (filter: Partial<DashboardFilter>) => void;
  refreshStats: () => void;
}

const getDateRangeDays = (range: DashboardFilter['dateRange']): number => {
  switch (range) {
    case '7d': return 7;
    case '15d': return 15;
    case '30d': return 30;
    case 'month': return 30;
    default: return 30;
  }
};

const generateStats = (filter: DashboardFilter): DashboardStats => {
  const days = getDateRangeDays(filter.dateRange);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  let filteredConsumptions = consumptions.filter(c => c.consumeDate >= startStr);
  if (filter.departmentId !== 'all') {
    filteredConsumptions = filteredConsumptions.filter(c => c.departmentId === filter.departmentId);
  }
  if (filter.category !== 'all') {
    filteredConsumptions = filteredConsumptions.filter(c => c.category === filter.category);
  }

  let filteredInventories = inventories.filter(inv => inv.status !== 'locked');
  if (filter.departmentId !== 'all') {
  }
  if (filter.category !== 'all') {
    filteredInventories = filteredInventories.filter(inv => inv.category === filter.category);
  }

  let filteredOrders = purchaseOrders;
  if (filter.departmentId !== 'all') {
  }

  const totalInventoryValue = filteredInventories.reduce((sum, inv) => sum + inv.totalValue, 0);
  const monthlyConsumption = filteredConsumptions.reduce((sum, c) => sum + c.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyPurchase = filteredOrders
    .filter(po => po.createTime.startsWith(thisMonth))
    .reduce((sum, po) => sum + po.totalAmount, 0);
  const nearExpiryCount = filteredInventories.filter(inv =>
    inv.status === 'near_expiry' || inv.status === 'expired'
  ).length;
  const warningCount = filteredInventories.filter(inv => inv.status === 'warning').length;
  const pendingApprovalCount = requisitions.filter(r => r.status === 'pending').length;

  const trendData: { date: string; amount: number; department: string }[] = [];
  const trendDays = Math.min(days, 7);
  const deptIds = filter.departmentId !== 'all'
    ? [filter.departmentId]
    : departments.slice(0, 4).map(d => d.id);

  for (let i = trendDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const shortDate = dateStr.slice(5);

    deptIds.forEach(deptId => {
      const dept = departments.find(d => d.id === deptId);
      const dayConsumption = filteredConsumptions
        .filter(c => c.consumeDate === dateStr && c.departmentId === deptId)
        .reduce((sum, c) => sum + c.amount, 0);
      trendData.push({
        date: shortDate,
        amount: dayConsumption,
        department: dept?.name || '',
      });
    });
  }

  const turnoverRate = departments
    .filter(d => filter.departmentId === 'all' || d.id === filter.departmentId)
    .map(dept => {
      const deptConsumption = filteredConsumptions
        .filter(c => c.departmentId === dept.id)
        .reduce((sum, c) => sum + c.amount, 0);
      const avgInventory = totalInventoryValue / departments.length;
      return {
        department: dept.name,
        rate: parseFloat(((deptConsumption / (avgInventory || 1)) * 100).toFixed(1)),
      };
    });

  const categoryMap = new Map<string, { count: number; total: number }>();
  filteredInventories.forEach(inv => {
    const cat = filter.category !== 'all' ? filter.category : inv.category;
    const existing = categoryMap.get(cat) || { count: 0, total: 0 };
    categoryMap.set(cat, {
      count: existing.count + (inv.status === 'near_expiry' || inv.status === 'expired' ? 1 : 0),
      total: existing.total + 1,
    });
  });
  const nearExpiryRatio = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    ratio: parseFloat(((data.count / (data.total || 1)) * 100).toFixed(1)),
    count: data.count,
  }));

  const statusCounts: Record<string, number> = {};
  filteredOrders.forEach(po => {
    statusCounts[po.status] = (statusCounts[po.status] || 0) + 1;
  });
  const totalPOs = Math.max(filteredOrders.length, 1);
  const statusLabels: Record<string, string> = {
    pending: '待审批',
    approved: '已批准',
    ordered: '已下单',
    received: '已到货',
    completed: '已完成',
  };
  const purchaseProgress = Object.entries(statusCounts).map(([status, count]) => ({
    status: statusLabels[status] || status,
    count,
    percentage: parseFloat(((count / totalPOs) * 100).toFixed(1)),
  }));

  const departmentConsumption = departments
    .filter(d => filter.departmentId === 'all' || d.id === filter.departmentId)
    .map(dept => ({
      department: dept.name,
      amount: filteredConsumptions
        .filter(c => c.departmentId === dept.id)
        .reduce((sum, c) => sum + c.amount, 0),
    }));

  return {
    totalInventoryValue,
    monthlyConsumption,
    monthlyPurchase,
    nearExpiryCount,
    warningCount,
    pendingApprovalCount,
    consumptionTrend: trendData,
    turnoverRate,
    nearExpiryRatio,
    purchaseProgress,
    departmentConsumption,
  };
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      filter: {
        departmentId: 'all',
        category: 'all',
        dateRange: '7d',
      },
      stats: mockStats,

      setFilter: (filter) => {
        const newFilter = { ...get().filter, ...filter };
        set({ filter: newFilter });
        get().refreshStats();
      },

      refreshStats: () => {
        const newStats = generateStats(get().filter);
        set({ stats: newStats });
      },
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({ filter: state.filter }),
    }
  )
);
