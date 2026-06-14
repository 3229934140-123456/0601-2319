import { useState, useMemo } from 'react';
import { useRequisitionStore } from '@/store/requisitionStore';
import { useUserStore } from '@/store/userStore';
import { materials, departments } from '@/mock/data';
import { formatCurrency, formatDate, getStatusText } from '@/utils';
import type { Requisition, Material } from '@/types';

interface RequisitionFormItem {
  materialId: string;
  materialName: string;
  spec: string;
  unit: string;
  quantity: number;
  recommendQty: number;
  unitPrice: number;
}

export default function RequisitionList() {
  const { requisitions, createRequisition, getRequisitionById } = useRequisitionStore();
  const { currentUser } = useUserStore();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [detailRequisition, setDetailRequisition] = useState<Requisition | null>(null);

  const [formItems, setFormItems] = useState<RequisitionFormItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (dateFilter && r.applyDate !== dateFilter) return false;
      if (searchText) {
        const keyword = searchText.toLowerCase();
        const matchId = r.id.toLowerCase().includes(keyword);
        const matchDept = r.departmentName.toLowerCase().includes(keyword);
        const matchApplicant = r.applicantName.toLowerCase().includes(keyword);
        if (!matchId && !matchDept && !matchApplicant) return false;
      }
      return true;
    });
  }, [requisitions, statusFilter, dateFilter, searchText]);

  const totalAmount = useMemo(() => {
    return formItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [formItems]);

  const currentDepartment = useMemo(() => {
    return departments.find(d => d.id === currentUser.departmentId);
  }, [currentUser]);

  const budgetUsage = useMemo(() => {
    if (!currentDepartment) return { used: 0, total: 0, remaining: 0, percentage: 0 };
    const used = currentDepartment.usedBudget + totalAmount;
    const remaining = currentDepartment.monthlyBudget - used;
    const percentage = (used / currentDepartment.monthlyBudget) * 100;
    return {
      used,
      total: currentDepartment.monthlyBudget,
      remaining,
      percentage,
    };
  }, [currentDepartment, totalAmount]);

  const handleAddMaterial = () => {
    if (!selectedMaterialId) return;
    const material = materials.find(m => m.id === selectedMaterialId) as Material;
    if (!material) return;

    const alreadyExists = formItems.some(item => item.materialId === material.id);
    if (alreadyExists) return;

    const recommendQty = Math.max(
      material.safetyStock - material.currentStock,
      Math.ceil(material.safetyStock * 0.5)
    );

    const newItem: RequisitionFormItem = {
      materialId: material.id,
      materialName: material.name,
      spec: material.spec,
      unit: material.unit,
      quantity: recommendQty,
      recommendQty,
      unitPrice: material.price,
    };

    setFormItems([...formItems, newItem]);
    setSelectedMaterialId('');
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    setFormItems(items =>
      items.map(item =>
        item.materialId === materialId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const handleRemoveItem = (materialId: string) => {
    setFormItems(items => items.filter(item => item.materialId !== materialId));
  };

  const handleSubmitRequisition = () => {
    if (formItems.length === 0) return;

    createRequisition({
      departmentId: currentUser.departmentId,
      departmentName: currentUser.departmentName || '',
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applyDate: new Date().toISOString().split('T')[0],
      items: formItems.map(item => ({
        materialId: item.materialId,
        materialName: item.materialName,
        spec: item.spec,
        unit: item.unit,
        quantity: item.quantity,
        recommendQty: item.recommendQty,
        unitPrice: item.unitPrice,
      })),
    });

    setFormItems([]);
    setShowCreateModal(false);
  };

  const handleViewDetail = (id: string) => {
    const req = getRequisitionById(id);
    if (req) {
      setDetailRequisition(req);
      setShowDetailModal(true);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
      case 'completed':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-normal';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">科室申领管理</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建申领
        </button>
      </div>

      <div className="dashboard-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">状态：</label>
            <select
              className="input-field w-32"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">全部</option>
              <option value="draft">草稿</option>
              <option value="pending">审批中</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">日期：</label>
            <input
              type="date"
              className="input-field w-40"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-64">
            <input
              type="text"
              className="input-field"
              placeholder="搜索单号、科室、申请人..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-3 text-left">单号</th>
              <th className="px-6 py-3 text-left">科室</th>
              <th className="px-6 py-3 text-left">申请人</th>
              <th className="px-6 py-3 text-left">申请日期</th>
              <th className="px-6 py-3 text-right">总金额</th>
              <th className="px-6 py-3 text-center">状态</th>
              <th className="px-6 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequisitions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredRequisitions.map(req => (
                <tr key={req.id} className="table-row">
                  <td className="px-6 py-4 font-mono text-sm text-slate-700">{req.id}</td>
                  <td className="px-6 py-4 text-slate-700">{req.departmentName}</td>
                  <td className="px-6 py-4 text-slate-700">{req.applicantName}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(req.applyDate)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    {formatCurrency(req.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={getStatusClass(req.status)}>
                      {getStatusText(req.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      onClick={() => handleViewDetail(req.id)}
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">新建申领单</h2>
              <button
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormItems([]);
                }}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">申请科室</label>
                  <input
                    type="text"
                    className="input-field bg-slate-50"
                    value={currentUser.departmentName || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">申请人</label>
                  <input
                    type="text"
                    className="input-field bg-slate-50"
                    value={currentUser.name}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">选择耗材</label>
                <div className="flex gap-2">
                  <select
                    className="input-field flex-1"
                    value={selectedMaterialId}
                    onChange={e => setSelectedMaterialId(e.target.value)}
                  >
                    <option value="">请选择耗材...</option>
                    {materials
                      .filter(m => !formItems.some(item => item.materialId === m.id))
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} - {m.spec}（库存：{m.currentStock}{m.unit}）
                        </option>
                      ))}
                  </select>
                  <button className="btn-secondary" onClick={handleAddMaterial}>
                    添加
                  </button>
                </div>
              </div>

              {formItems.length > 0 && (
                <div className="dashboard-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th className="px-4 py-2.5 text-left text-xs">耗材名称</th>
                        <th className="px-4 py-2.5 text-center text-xs">规格</th>
                        <th className="px-4 py-2.5 text-center text-xs">推荐数量</th>
                        <th className="px-4 py-2.5 text-center text-xs">申领数量</th>
                        <th className="px-4 py-2.5 text-right text-xs">单价</th>
                        <th className="px-4 py-2.5 text-right text-xs">小计</th>
                        <th className="px-4 py-2.5 text-center text-xs">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.map(item => (
                        <tr key={item.materialId} className="table-row">
                          <td className="px-4 py-3 text-sm text-slate-700">{item.materialName}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">{item.spec}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">
                            {item.recommendQty} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              className="input-field w-24 py-1.5 text-center"
                              value={item.quantity}
                              onChange={e =>
                                handleQuantityChange(item.materialId, parseInt(e.target.value) || 1)
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              className="text-status-danger hover:text-red-700 text-sm font-medium"
                              onClick={() => handleRemoveItem(item.materialId)}
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-700">
                          合计：
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">
                          {formatCurrency(totalAmount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {currentDepartment && (
                <div className="dashboard-card p-4">
                  <h3 className="section-title mb-3">预算占用情况</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">月度预算</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(currentDepartment.monthlyBudget)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">已使用</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(currentDepartment.usedBudget)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">本次申领</span>
                      <span className="font-semibold text-primary-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                      <span className="text-slate-600">剩余预算</span>
                      <span
                        className={`font-bold ${
                          budgetUsage.remaining >= 0 ? 'text-status-success' : 'text-status-danger'
                        }`}
                      >
                        {formatCurrency(budgetUsage.remaining)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          budgetUsage.percentage >= 100
                            ? 'bg-status-danger'
                            : budgetUsage.percentage >= 80
                            ? 'bg-status-warning'
                            : 'bg-status-success'
                        }`}
                        style={{ width: `${Math.min(budgetUsage.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      使用率：{budgetUsage.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormItems([]);
                }}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitRequisition}
                disabled={formItems.length === 0}
              >
                提交申领
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailRequisition && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">申领单详情</h2>
              <button
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">单号</label>
                  <p className="font-mono text-slate-800">{detailRequisition.id}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">状态</label>
                  <span className={getStatusClass(detailRequisition.status)}>
                    {getStatusText(detailRequisition.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">申请科室</label>
                  <p className="text-slate-800">{detailRequisition.departmentName}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">申请人</label>
                  <p className="text-slate-800">{detailRequisition.applicantName}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">申请日期</label>
                  <p className="text-slate-800">{formatDate(detailRequisition.applyDate)}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">审批级别</label>
                  <p className="text-slate-800">
                    {detailRequisition.approvalLevel === 0
                      ? '无需审批'
                      : `${detailRequisition.approvalLevel}级`}
                  </p>
                </div>
              </div>

              <div className="dashboard-card overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-700">申领明细</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-2.5 text-left text-xs">耗材名称</th>
                      <th className="px-4 py-2.5 text-center text-xs">规格</th>
                      <th className="px-4 py-2.5 text-center text-xs">推荐数量</th>
                      <th className="px-4 py-2.5 text-center text-xs">申领数量</th>
                      <th className="px-4 py-2.5 text-right text-xs">单价</th>
                      <th className="px-4 py-2.5 text-right text-xs">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRequisition.items.map(item => (
                      <tr key={item.id} className="table-row">
                        <td className="px-4 py-3 text-sm text-slate-700">{item.materialName}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.spec}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {item.recommendQty} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-700">
                        合计：
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">
                        {formatCurrency(detailRequisition.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
