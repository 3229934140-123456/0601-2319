import { useState, useEffect, useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Warehouse,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Filter,
  Building2,
  Package,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { dashboardStats, departments } from '@/mock/data';
import { formatCurrency, formatNumber, cn } from '@/utils';
import type { DashboardStats } from '@/types';

const materialCategories = ['全部', '注射类', '防护类', '手术类', '检查类', '敷料类', '护理类', '导管类', '植入类', '麻醉类'];

const useCountUp = (target: number, duration: number = 1000) => {
  const [value, setValue] = useState(0);
  const previousRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startValue = previousRef.current;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (target - startValue) * easeProgress;
      setValue(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        previousRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration]);

  return value;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  formatter,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  formatter: (val: number) => string;
  color: string;
}) => {
  const animatedValue = useCountUp(value, 1200);

  return (
    <div
      className={cn(
        'relative group rounded-2xl p-5 overflow-hidden cursor-pointer',
        'bg-gradient-to-br from-primary-900/60 to-primary-950/80',
        'border border-primary-700/40 backdrop-blur-xl',
        'transition-all duration-500 hover:-translate-y-1',
        'hover:border-primary-500/60 hover:shadow-glow-blue'
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full -translate-y-10 translate-x-10 blur-2xl"
        style={{ background: color }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20`, color }}
          >
            <Icon size={22} />
          </div>
          <span className="text-xs text-primary-400/80 flex items-center gap-1">
            <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
            实时
          </span>
        </div>
        <p className="text-sm text-primary-300/80 mb-1">{label}</p>
        <p className="text-3xl font-bold font-mono tracking-tight text-white">
          {formatter(animatedValue)}
        </p>
      </div>
    </div>
  );
};

const FilterToolbar = ({
  filters,
  onChange,
}: {
  filters: { department: string; category: string; dateRange: string };
  onChange: (filters: { department: string; category: string; dateRange: string }) => void;
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-primary-300">
        <Filter size={18} />
        <span className="text-sm font-medium">筛选</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'dept' ? null : 'dept')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-900/50 border border-primary-700/50 text-white text-sm hover:border-primary-500/70 hover:bg-primary-800/50 transition-all"
        >
          <Building2 size={16} className="text-primary-400" />
          <span>{filters.department || '全部科室'}</span>
          <ChevronDown size={14} className="text-primary-400" />
        </button>
        {openDropdown === 'dept' && (
          <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-primary-950/95 border border-primary-700/50 backdrop-blur-xl shadow-xl z-50 py-2 max-h-64 overflow-y-auto">
            <button
              onClick={() => { onChange({ ...filters, department: '' }); setOpenDropdown(null); }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-primary-800/60 transition-colors"
            >
              全部科室
            </button>
            {departments.map((d) => (
              <button
                key={d.id}
                onClick={() => { onChange({ ...filters, department: d.name }); setOpenDropdown(null); }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  filters.department === d.name
                    ? 'bg-primary-600/40 text-white'
                    : 'text-primary-200 hover:bg-primary-800/60 text-white'
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'cat' ? null : 'cat')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-900/50 border border-primary-700/50 text-white text-sm hover:border-primary-500/70 hover:bg-primary-800/50 transition-all"
        >
          <Package size={16} className="text-primary-400" />
          <span>{filters.category}</span>
          <ChevronDown size={14} className="text-primary-400" />
        </button>
        {openDropdown === 'cat' && (
          <div className="absolute top-full left-0 mt-2 w-44 rounded-xl bg-primary-950/95 border border-primary-700/50 backdrop-blur-xl shadow-xl z-50 py-2 max-h-64 overflow-y-auto">
            {materialCategories.map((c) => (
              <button
                key={c}
                onClick={() => { onChange({ ...filters, category: c }); setOpenDropdown(null); }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  filters.category === c
                    ? 'bg-primary-600/40 text-white'
                    : 'text-primary-200 hover:bg-primary-800/60 text-white'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-900/50 border border-primary-700/50 text-white text-sm hover:border-primary-500/70 hover:bg-primary-800/50 transition-all"
        >
          <Calendar size={16} className="text-primary-400" />
          <span>{filters.dateRange}</span>
          <ChevronDown size={14} className="text-primary-400" />
        </button>
        {openDropdown === 'date' && (
          <div className="absolute top-full left-0 mt-2 w-40 rounded-xl bg-primary-950/95 border border-primary-700/50 backdrop-blur-xl shadow-xl z-50 py-2">
            {['最近7天', '最近15天', '最近30天', '本月'].map((d) => (
              <button
                key={d}
                onClick={() => { onChange({ ...filters, dateRange: d }); setOpenDropdown(null); }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  filters.dateRange === d
                    ? 'bg-primary-600/40 text-white'
                    : 'text-primary-200 hover:bg-primary-800/60 text-white'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(dashboardStats);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filters, setFilters] = useState({
    department: '',
    category: '全部',
    dateRange: '最近7天',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const randomize = (val: number, range: number = 0.05) =>
        val * (1 + (Math.random() - 0.5) * range * 2);

      setStats({
        ...dashboardStats,
        totalInventoryValue: randomize(dashboardStats.totalInventoryValue),
        monthlyConsumption: randomize(dashboardStats.monthlyConsumption),
        monthlyPurchase: randomize(dashboardStats.monthlyPurchase),
        nearExpiryCount: Math.max(0, Math.round(randomize(dashboardStats.nearExpiryCount, 0.1))),
        consumptionTrend: dashboardStats.consumptionTrend.map((t) => ({
          ...t,
          amount: randomize(t.amount, 0.15),
        })),
        turnoverRate: dashboardStats.turnoverRate.map((t) => ({
          ...t,
          rate: randomize(t.rate, 0.1),
        })),
        departmentConsumption: dashboardStats.departmentConsumption.map((d) => ({
          ...d,
          amount: randomize(d.amount, 0.1),
        })),
      });
      setLastRefresh(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const lineColors = ['#1E6FD9', '#34C759', '#FF9500', '#5AC8FA', '#FF3B30', '#BF5AF2'];

  const trendOption = useMemo(() => {
    const depts = [...new Set(stats.consumptionTrend.map((t) => t.department))];
    const dates = [...new Set(stats.consumptionTrend.map((t) => t.date))].sort();

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(13, 33, 55, 0.95)',
        borderColor: 'rgba(30, 111, 217, 0.5)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any[]) => {
          let html = `<div class="font-semibold mb-2">${params[0].axisValue}</div>`;
          params.forEach((p) => {
            html += `<div class="flex items-center gap-2 my-1">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
              <span>${p.seriesName}</span>
              <span class="font-mono font-bold ml-auto">${formatCurrency(p.value)}</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: depts,
        top: 0,
        right: 0,
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: '3%', right: '3%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)', type: 'dashed' } },
        axisLabel: {
          color: '#94A3B8',
          fontSize: 11,
          formatter: (v: number) => formatNumber(v),
        },
      },
      series: depts.map((dept, idx) => ({
        name: dept,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: lineColors[idx % lineColors.length] },
        itemStyle: { color: lineColors[idx % lineColors.length], borderWidth: 2, borderColor: '#0D2137' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${lineColors[idx % lineColors.length]}30` },
              { offset: 1, color: `${lineColors[idx % lineColors.length]}00` },
            ],
          },
        },
        data: dates.map(
          (d) => stats.consumptionTrend.find((t) => t.date === d && t.department === dept)?.amount || 0
        ),
      })),
    };
  }, [stats.consumptionTrend]);

  const barOption = useMemo(() => {
    const sorted = [...stats.turnoverRate].sort((a, b) => b.rate - a.rate);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(13, 33, 55, 0.95)',
        borderColor: 'rgba(30, 111, 217, 0.5)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any[]) => `${params[0].name}<br/>周转率: <b>${params[0].value}%</b>`,
      },
      grid: { left: '3%', right: '5%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sorted.map((s) => s.department),
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { color: '#94A3B8', fontSize: 11, interval: 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)', type: 'dashed' } },
        axisLabel: { color: '#94A3B8', fontSize: 11, formatter: '{value}%' },
      },
      series: [
        {
          type: 'bar',
          barWidth: '45%',
          data: sorted.map((s) => ({
            value: s.rate,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#4389F2' },
                  { offset: 1, color: '#1E6FD9' },
                ],
              },
              borderRadius: [6, 6, 0, 0],
            },
          })),
        },
      ],
    };
  }, [stats.turnoverRate]);

  const pieOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(13, 33, 55, 0.95)',
        borderColor: 'rgba(30, 111, 217, 0.5)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: '{b}: {d}% ({c}项)',
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#0D2137',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, color: '#fff', fontSize: 12, fontWeight: 'bold' },
            scaleSize: 6,
          },
          data: stats.nearExpiryRatio.map((r, i) => ({
            name: r.category,
            value: r.count,
            itemStyle: { color: lineColors[i % lineColors.length] },
          })),
        },
      ],
    };
  }, [stats.nearExpiryRatio]);

  const rankOption = useMemo(() => {
    const sorted = [...stats.departmentConsumption].sort((a, b) => a.amount - b.amount);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(13, 33, 55, 0.95)',
        borderColor: 'rgba(30, 111, 217, 0.5)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any[]) => `${params[0].name}<br/>消耗金额: <b>${formatCurrency(params[0].value)}</b>`,
      },
      grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)', type: 'dashed' } },
        axisLabel: {
          color: '#94A3B8',
          fontSize: 11,
          formatter: (v: number) => formatNumber(v),
        },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((s) => s.department),
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barWidth: '55%',
          data: sorted.map((s, i) => ({
            value: s.amount,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: lineColors[i % lineColors.length] + '90' },
                  { offset: 1, color: lineColors[i % lineColors.length] },
                ],
              },
              borderRadius: [0, 6, 6, 0],
            },
          })),
        },
      ],
    };
  }, [stats.departmentConsumption]);

  return (
    <div className="min-h-screen bg-medical-deeper relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              医疗耗材智能管理
              <span className="text-primary-400 ml-2 text-base font-normal">可视化大屏</span>
            </h1>
            <p className="text-sm text-primary-400/70 mt-1">
              最后更新: {lastRefresh.toLocaleTimeString('zh-CN')}
              <span className="ml-3 inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
                数据实时同步中
              </span>
            </p>
          </div>
          <FilterToolbar filters={filters} onChange={setFilters} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Warehouse}
            label="总库存价值"
            value={stats.totalInventoryValue}
            formatter={formatCurrency}
            color="#1E6FD9"
          />
          <StatCard
            icon={TrendingDown}
            label="当月消耗金额"
            value={stats.monthlyConsumption}
            formatter={formatCurrency}
            color="#34C759"
          />
          <StatCard
            icon={ShoppingCart}
            label="当月采购金额"
            value={stats.monthlyPurchase}
            formatter={formatCurrency}
            color="#FF9500"
          />
          <StatCard
            icon={AlertTriangle}
            label="近效期耗材数量"
            value={stats.nearExpiryCount}
            formatter={(v) => formatNumber(Math.round(v)) + ' 项'}
            color="#FF3B30"
          />
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div
            className={cn(
              'col-span-12 lg:col-span-8 rounded-2xl p-5',
              'bg-gradient-to-br from-primary-900/50 to-primary-950/70',
              'border border-primary-700/40 backdrop-blur-xl',
              'transition-all duration-500 hover:-translate-y-0.5 hover:border-primary-500/60'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">科室消耗趋势</h3>
              <span className="text-xs text-primary-400/80">最近7天</span>
            </div>
            <div style={{ height: '320px' }}>
              <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>

          <div
            className={cn(
              'col-span-12 lg:col-span-4 rounded-2xl p-5',
              'bg-gradient-to-br from-primary-900/50 to-primary-950/70',
              'border border-primary-700/40 backdrop-blur-xl',
              'transition-all duration-500 hover:-translate-y-0.5 hover:border-primary-500/60'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">近效期占比</h3>
              <span className="text-xs text-primary-400/80">按类别</span>
            </div>
            <div style={{ height: '320px' }}>
              <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div
            className={cn(
              'col-span-12 lg:col-span-5 rounded-2xl p-5',
              'bg-gradient-to-br from-primary-900/50 to-primary-950/70',
              'border border-primary-700/40 backdrop-blur-xl',
              'transition-all duration-500 hover:-translate-y-0.5 hover:border-primary-500/60'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">库存周转率</h3>
              <span className="text-xs text-primary-400/80">各科室</span>
            </div>
            <div style={{ height: '280px' }}>
              <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>

          <div
            className={cn(
              'col-span-12 lg:col-span-7 rounded-2xl p-5',
              'bg-gradient-to-br from-primary-900/50 to-primary-950/70',
              'border border-primary-700/40 backdrop-blur-xl',
              'transition-all duration-500 hover:-translate-y-0.5 hover:border-primary-500/60'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">各科室耗材消耗排名</h3>
              <span className="text-xs text-primary-400/80">本月</span>
            </div>
            <div style={{ height: '280px' }}>
              <ReactECharts option={rankOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </div>

        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-gradient-to-br from-primary-900/50 to-primary-950/70',
            'border border-primary-700/40 backdrop-blur-xl',
            'transition-all duration-500 hover:-translate-y-0.5 hover:border-primary-500/60'
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-base">采购执行进度</h3>
            <span className="text-xs text-primary-400/80">采购订单状态分布</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.purchaseProgress.map((item, idx) => (
              <div
                key={item.status}
                className="rounded-xl p-4 bg-primary-950/50 border border-primary-800/40 hover:border-primary-600/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-primary-200 font-medium">{item.status}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-mono font-bold"
                    style={{ background: `${lineColors[idx % lineColors.length]}20`, color: lineColors[idx % lineColors.length] }}
                  >
                    {item.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-primary-900/60 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${item.percentage}%`,
                      background: `linear-gradient(90deg, ${lineColors[idx % lineColors.length]}90, ${lineColors[idx % lineColors.length]})`,
                    }}
                  />
                </div>
                <p className="text-white text-lg font-mono font-bold">
                  {item.count}
                  <span className="text-xs text-primary-400/80 font-normal ml-1">单</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
