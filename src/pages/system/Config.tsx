import { useState } from 'react';
import { Settings, DollarSign, Calendar, Clock, Package, Save } from 'lucide-react';
import { useConfigStore } from '@/store/configStore';
import { cn } from '@/utils';

export default function Config() {
  const { config, updateConfig } = useConfigStore();
  const [formData, setFormData] = useState(config);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof typeof formData, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const configItems = [
    {
      key: 'approvalThreshold' as const,
      label: '审批金额阈值',
      description: '超过该金额的采购订单需要院长审批',
      unit: '元',
      icon: DollarSign,
      color: 'from-rose-500 to-pink-500',
      placeholder: '5000',
      min: 0,
      step: 1000,
    },
    {
      key: 'nearExpiryDays' as const,
      label: '近效期预警天数',
      description: '距离有效期少于该天数的耗材将标记为近效期',
      unit: '天',
      icon: Calendar,
      color: 'from-amber-500 to-orange-500',
      placeholder: '90',
      min: 1,
      step: 1,
    },
    {
      key: 'approvalTimeoutHours' as const,
      label: '审批超时时间',
      description: '审批申请超过该时间未处理将自动提醒',
      unit: '小时',
      icon: Clock,
      color: 'from-violet-500 to-purple-500',
      placeholder: '48',
      min: 1,
      step: 1,
    },
    {
      key: 'safetyStockRatio' as const,
      label: '安全库存比例',
      description: '实际库存低于安全库存乘以该比例时触发预警',
      unit: '倍',
      icon: Package,
      color: 'from-sky-500 to-blue-500',
      placeholder: '1.5',
      min: 0.1,
      step: 0.1,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">阈值配置</h1>
          <p className="text-sm text-slate-500 mt-1">配置系统各项预警阈值和审批规则</p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            "btn-primary flex items-center gap-2 transition-all",
            saved && "bg-gradient-to-r from-status-success to-green-500"
          )}
        >
          <Save className="w-4 h-4" />
          {saved ? '已保存' : '保存配置'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {configItems.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="dashboard-card p-6">
              <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", item.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.label}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={formData[item.key]}
                        onChange={e => handleChange(item.key, parseFloat(e.target.value) || 0)}
                        min={item.min}
                        step={item.step}
                        className="input-field pr-16"
                        placeholder={item.placeholder}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {item.unit}
                      </span>
                    </div>
                    {formData[item.key] !== config[item.key] && (
                      <span className="text-xs px-2 py-1 bg-status-warning/10 text-status-warning rounded-full font-medium">
                        已修改
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <Settings className="w-4 h-4" />
                    <span>系统默认：{item.placeholder} {item.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-primary-600" />
          <h2 className="section-title">配置说明</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
            <p><strong>审批金额阈值：</strong>当采购订单总金额超过此阈值时，需要设备科审核后提交院长进行最终审批。</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
            <p><strong>近效期预警天数：</strong>库存耗材的有效期距离当前日期少于该天数时，系统将自动标记为近效期并在预警页面展示。</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
            <p><strong>审批超时时间：</strong>请购单或采购订单提交审批后，超过该时间未处理的，系统将自动发送提醒通知给审批人。</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
            <p><strong>安全库存比例：</strong>当库存数量低于「安全库存 × 该比例」时，系统将自动生成采购建议。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
