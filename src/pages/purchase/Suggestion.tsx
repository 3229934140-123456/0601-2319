import { useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react';
import { usePurchaseStore } from '@/store/purchaseStore';
import { materials, suppliers } from '@/mock/data';
import { getStatusText, cn } from '@/utils';
import type { PurchaseSuggestion } from '@/types';

export default function Suggestion() {
  const { suggestions, processSuggestion, ignoreSuggestion, createOrder } = usePurchaseStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'single' | 'batch'>('single');
  const [currentSuggestion, setCurrentSuggestion] = useState<PurchaseSuggestion | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  const filteredSuggestions = suggestions.filter((s) => {
    const matchSearch =
      s.materialName.toLowerCase().includes(searchText.toLowerCase()) ||
      s.category.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingSuggestions = filteredSuggestions.filter((s) => s.status === 'pending');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingSuggestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingSuggestions.map((s) => s.id));
    }
  };

  const handleProcessSingle = (suggestion: PurchaseSuggestion) => {
    setCurrentSuggestion(suggestion);
    setCreateMode('single');
    setSelectedSupplierId('');
    setShowCreateModal(true);
  };

  const handleBatchProcess = () => {
    if (selectedIds.length === 0) return;
    setCreateMode('batch');
    setSelectedSupplierId('');
    setShowCreateModal(true);
  };

  const handleIgnore = (id: string) => {
    ignoreSuggestion(id);
  };

  const handleConfirmCreateOrder = () => {
    if (!selectedSupplierId) {
      alert('请选择供应商');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    let targetSuggestions: PurchaseSuggestion[] = [];
    if (createMode === 'single' && currentSuggestion) {
      targetSuggestions = [currentSuggestion];
    } else if (createMode === 'batch') {
      targetSuggestions = suggestions.filter((s) => selectedIds.includes(s.id));
    }

    const items = targetSuggestions.map((s) => {
      const material = materials.find((m) => m.id === s.materialId);
      return {
        materialId: s.materialId,
        materialName: s.materialName,
        spec: material?.spec || '',
        unit: s.unit,
        quantity: s.suggestQty,
        unitPrice: material?.price || 0,
      };
    });

    createOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      creatorId: 'u005',
      creatorName: '刘采购员',
      items,
    });

    targetSuggestions.forEach((s) => processSuggestion(s.id));

    setShowCreateModal(false);
    setSelectedIds([]);
    setCurrentSuggestion(null);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'processed':
        return 'status-approved';
      case 'ignored':
        return 'status-rejected';
      default:
        return 'status-normal';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-glow-blue">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">采购建议</h1>
            <p className="text-sm text-slate-500 mt-0.5">系统自动生成的采购建议，支持批量处理</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-status-warning/10 rounded-lg">
            <Lightbulb className="w-4 h-4 text-status-warning" />
            <span className="text-sm font-medium text-status-warning">
              待处理 {pendingSuggestions.length} 条
            </span>
          </div>
          <button
            className={cn(
              'btn-primary flex items-center gap-2',
              selectedIds.length === 0 && 'opacity-50 cursor-not-allowed'
            )}
            onClick={handleBatchProcess}
            disabled={selectedIds.length === 0}
          >
            <ShoppingCart className="w-4 h-4" />
            批量生成订单 ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="搜索耗材名称、类别..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              className="input-field pl-10 pr-10 appearance-none cursor-pointer min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processed">已处理</option>
              <option value="ignored">已忽略</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3.5 text-left w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={selectedIds.length === pendingSuggestions.length && pendingSuggestions.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3.5 text-left">耗材名称</th>
                <th className="px-4 py-3.5 text-left">类别</th>
                <th className="px-4 py-3.5 text-right">当前库存</th>
                <th className="px-4 py-3.5 text-right">安全库存</th>
                <th className="px-4 py-3.5 text-right">建议采购量</th>
                <th className="px-4 py-3.5 text-left">单位</th>
                <th className="px-4 py-3.5 text-left">建议原因</th>
                <th className="px-4 py-3.5 text-left">状态</th>
                <th className="px-4 py-3.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuggestions.map((suggestion) => (
                <tr key={suggestion.id} className="table-row">
                  <td className="px-4 py-3.5">
                    {suggestion.status === 'pending' && (
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        checked={selectedIds.includes(suggestion.id)}
                        onChange={() => toggleSelect(suggestion.id)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
                    {suggestion.materialName}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{suggestion.category}</td>
                  <td className="px-4 py-3.5 text-sm text-right">
                    <span
                      className={cn(
                        'data-number',
                        suggestion.currentStock < suggestion.safetyStock && 'text-status-danger'
                      )}
                    >
                      {suggestion.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right data-number text-slate-600">
                    {suggestion.safetyStock}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right data-number font-semibold text-primary-600">
                    {suggestion.suggestQty}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{suggestion.unit}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[200px] truncate">
                    {suggestion.reason}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={getStatusClass(suggestion.status)}>
                      {getStatusText(suggestion.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {suggestion.status === 'pending' && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 text-status-success hover:bg-status-success/10 rounded-lg transition-colors"
                          title="生成订单"
                          onClick={() => handleProcessSingle(suggestion)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors"
                          title="忽略"
                          onClick={() => handleIgnore(suggestion.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSuggestions.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {createMode === 'single' ? '生成采购订单' : '批量生成采购订单'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  选择供应商
                </label>
                <div className="relative">
                  <select
                    className="input-field pr-10 appearance-none cursor-pointer"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                  >
                    <option value="">请选择供应商</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              {createMode === 'single' && currentSuggestion && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">耗材：</span>
                    <span className="font-medium text-slate-800">
                      {currentSuggestion.materialName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">建议采购量：</span>
                    <span className="font-medium text-primary-600">
                      {currentSuggestion.suggestQty} {currentSuggestion.unit}
                    </span>
                  </div>
                </div>
              )}
              {createMode === 'batch' && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-500 mb-2">
                    已选择 {selectedIds.length} 条建议：
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {suggestions
                      .filter((s) => selectedIds.includes(s.id))
                      .map((s) => (
                        <div key={s.id} className="text-sm text-slate-700 flex justify-between">
                          <span>{s.materialName}</span>
                          <span className="text-primary-600 font-medium">
                            {s.suggestQty} {s.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setCurrentSuggestion(null);
                }}
              >
                取消
              </button>
              <button className="btn-primary" onClick={handleConfirmCreateOrder}>
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
