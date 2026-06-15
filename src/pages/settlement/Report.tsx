import { useState, useMemo } from 'react';
import { FileText, Download, Calendar, Building2 } from 'lucide-react';
import { departments, consumptions, materials } from '@/mock/data';
import { formatCurrency, exportToCSV } from '@/utils';

export default function Report() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const reportData = useMemo(() => {
    const filtered = consumptions.filter(c => {
      const matchMonth = c.consumeDate.startsWith(selectedMonth);
      const matchDept = !selectedDepartment || c.departmentId === selectedDepartment;
      return matchMonth && matchDept;
    });

    const materialMap = new Map<string, { category: string; name: string; unit: string; price: number; quantity: number; amount: number }>();

    filtered.forEach(c => {
      const mat = materials.find(m => m.id === c.materialId);
      const key = c.materialId;
      const existing = materialMap.get(key);
      if (existing) {
        existing.quantity += c.quantity;
        existing.amount += c.amount;
      } else {
        materialMap.set(key, {
          category: c.category,
          name: c.materialName,
          unit: mat?.unit || c.unit,
          price: mat?.price || 0,
          quantity: c.quantity,
          amount: c.amount,
        });
      }
    });

    const totalAmount = Array.from(materialMap.values()).reduce((sum, item) => sum + item.amount, 0);

    return Array.from(materialMap.values())
      .map(item => ({
        ...item,
        ratio: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [selectedMonth, selectedDepartment]);

  const totalQuantity = reportData.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0);

  const handleExport = () => {
    const deptName = selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : '全部科室';
    
    const exportData = reportData.map(item => ({
      月份: selectedMonth,
      科室: deptName,
      耗材类别: item.category,
      耗材名称: item.name,
      消耗数量: item.quantity,
      单位: item.unit,
      单价: formatCurrency(item.price),
      总金额: formatCurrency(item.amount),
      占比: `${item.ratio.toFixed(2)}%`,
    }));

    if (exportData.length > 0) {
      exportData.push({
        月份: selectedMonth,
        科室: deptName,
        耗材类别: '合计',
        耗材名称: '',
        消耗数量: totalQuantity,
        单位: '',
        单价: '',
        总金额: formatCurrency(totalAmount),
        占比: '100.00%',
      });
    }

    exportToCSV(exportData, `月度耗材消耗分析报表_${selectedMonth}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">结算报表</h1>
          <p className="text-sm text-slate-500 mt-1">月度结算报表</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出CSV
        </button>
      </div>

      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-end gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              月份
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="input-field w-48"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              科室
            </label>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="input-field w-48"
            >
              <option value="">全部科室</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="section-title">月度耗材消耗分析报表</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left">耗材类别</th>
                <th className="px-6 py-4 text-left">耗材名称</th>
                <th className="px-6 py-4 text-right">消耗数量</th>
                <th className="px-6 py-4 text-right">单价</th>
                <th className="px-6 py-4 text-right">总金额</th>
                <th className="px-6 py-4 text-right">占比</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                reportData.map((item, index) => (
                  <tr key={index} className="table-row">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-right font-mono text-primary-600 font-semibold">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                            style={{ width: `${item.ratio}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-slate-600 w-16 text-right">{item.ratio.toFixed(2)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-6 py-4 text-slate-800" colSpan={2}>合计</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-800">{totalQuantity}</td>
                  <td className="px-6 py-4 text-right"></td>
                  <td className="px-6 py-4 text-right font-mono text-primary-600">{formatCurrency(totalAmount)}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-800">100.00%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
