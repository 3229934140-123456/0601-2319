import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  FileText,
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { materials } from '@/mock/data';
import { formatCurrency } from '@/utils';
import type { Inventory } from '@/types';

interface WarningItem extends Inventory {
  safetyStock: number;
  gapQuantity: number;
  suggestQuantity: number;
}

export default function InventoryWarning() {
  const { inventories } = useInventoryStore();
  const [showTip, setShowTip] = useState(false);

  const warningItems = useMemo<WarningItem[]>(() => {
    return inventories
      .map((inv) => {
        const material = materials.find((m) => m.id === inv.materialId);
        const safetyStock = material?.safetyStock || 0;
        const gapQuantity = Math.max(0, safetyStock - inv.quantity);
        const suggestQuantity = Math.max(safetyStock * 2 - inv.quantity, 0);
        return {
          ...inv,
          safetyStock,
          gapQuantity,
          suggestQuantity,
        };
      })
      .filter((item) => item.quantity < item.safetyStock)
      .sort((a, b) => b.gapQuantity - a.gapQuantity);
  }, [inventories]);

  const totalGap = useMemo(
    () => warningItems.reduce((sum, item) => sum + item.gapQuantity, 0),
    [warningItems]
  );

  const totalSuggestValue = useMemo(
    () => warningItems.reduce((sum, item) => sum + item.suggestQuantity * item.unitPrice, 0),
    [warningItems]
  );

  const getGapLevel = (gap: number, safetyStock: number) => {
    if (safetyStock === 0) return 'normal';
    const ratio = gap / safetyStock;
    if (ratio >= 0.7) return 'danger';
    if (ratio >= 0.4) return 'warning';
    return 'normal';
  };

  const handleGenerateSuggestion = () => {
    setShowTip(true);
    setTimeout(() => setShowTip(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">库存预警</h1>
        <button onClick={handleGenerateSuggestion} className="btn-primary flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          一键生成采购建议
        </button>
      </div>

      {showTip && (
        <div className="fixed top-6 right-6 bg-status-success text-white px-6 py-3 rounded-lg shadow-glow-green z-50 animate-fade-in flex items-center gap-2">
          <FileText className="w-5 h-5" />
          采购建议已生成，可前往采购建议页面查看
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">预警耗材数量</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-800 data-number">
                  {warningItems.length}
                </span>
                <span className="text-sm text-slate-500">个</span>
              </div>
            </div>
            <div className="bg-status-warning/10 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-status-warning" />
            </div>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">总缺口数量</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-status-danger data-number">
                  {totalGap.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">单位</span>
              </div>
            </div>
            <div className="bg-status-danger/10 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-status-danger" />
            </div>
          </div>
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-2">建议采购总金额</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-800 data-number">
                  {formatCurrency(totalSuggestValue)}
                </span>
              </div>
            </div>
            <div className="bg-primary-50 p-3 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="section-title">库存预警列表</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-status-danger"></span>
                <span className="text-slate-600">缺口 ≥70%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-status-warning"></span>
                <span className="text-slate-600">缺口 ≥40%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-status-info"></span>
                <span className="text-slate-600">缺口 &lt;40%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-5 py-4 font-semibold">耗材名称</th>
                <th className="text-left px-5 py-4 font-semibold">类别</th>
                <th className="text-right px-5 py-4 font-semibold">当前库存</th>
                <th className="text-right px-5 py-4 font-semibold">安全库存</th>
                <th className="text-right px-5 py-4 font-semibold">缺口数量</th>
                <th className="text-right px-5 py-4 font-semibold">建议采购量</th>
                <th className="text-right px-5 py-4 font-semibold">单价</th>
                <th className="text-left px-5 py-4 font-semibold">状态</th>
              </tr>
            </thead>
            <tbody>
              {warningItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    暂无库存预警数据
                  </td>
                </tr>
              ) : (
                warningItems.map((item) => {
                  const gapLevel = getGapLevel(item.gapQuantity, item.safetyStock);
                  const rowClass =
                    gapLevel === 'danger'
                      ? 'bg-status-danger/5 hover:bg-status-danger/10'
                      : gapLevel === 'warning'
                      ? 'bg-status-warning/5 hover:bg-status-warning/10'
                      : '';

                  return (
                    <tr key={item.id} className={`table-row ${rowClass}`}>
                      <td className="px-5 py-4 text-slate-800 font-medium">{item.materialName}</td>
                      <td className="px-5 py-4 text-slate-600">{item.category}</td>
                      <td className="px-5 py-4 text-right text-slate-800 font-mono">
                        {item.quantity.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-600 font-mono">
                        {item.safetyStock.toLocaleString()} {item.unit}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-mono font-semibold ${
                          gapLevel === 'danger'
                            ? 'text-status-danger'
                            : gapLevel === 'warning'
                            ? 'text-status-warning'
                            : 'text-status-info'
                        }`}
                      >
                        -{item.gapQuantity.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-800 font-mono font-semibold">
                        {item.suggestQuantity.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-600 font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`status-badge ${
                            gapLevel === 'danger'
                              ? 'bg-status-danger/10 text-status-danger'
                              : gapLevel === 'warning'
                              ? 'bg-status-warning/10 text-status-warning'
                              : 'bg-status-info/10 text-status-info'
                          }`}
                        >
                          {gapLevel === 'danger' ? '紧急' : gapLevel === 'warning' ? '警告' : '提醒'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 text-sm text-slate-500">
          共 {warningItems.length} 条预警记录
        </div>
      </div>
    </div>
  );
}
