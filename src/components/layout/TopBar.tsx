import { useState, useEffect, useRef } from 'react';
import { Bell, Search, RefreshCw, User, ChevronDown, ClipboardList, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { getRoleText, cn } from '@/utils';
import { useRequisitionStore } from '@/store/requisitionStore';
import { usePurchaseStore } from '@/store/purchaseStore';

const TopBar = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const bellRef = useRef<HTMLDivElement>(null);

  const requisitionPendingCount = useRequisitionStore((state) => {
    if (currentUser.role === 'nurse') return 0;
    if (currentUser.role === 'director') {
      return state.getPendingApprovals('director', currentUser.departmentId).length;
    }
    if (currentUser.role === 'equipment') {
      return state.getPendingApprovals('equipment').length;
    }
    if (currentUser.role === 'admin') {
      return state.getPendingApprovals('admin').length;
    }
    return 0;
  });

  const purchasePendingCount = usePurchaseStore((state) => {
    if (currentUser.role === 'equipment') {
      return state.getPendingApprovals('equipment').length;
    }
    if (currentUser.role === 'admin') {
      return state.getPendingApprovals('admin').length;
    }
    return 0;
  });

  const totalPendingCount = requisitionPendingCount + purchasePendingCount;
  const showPurchaseItem = currentUser.role === 'equipment' || currentUser.role === 'admin';
  const showRequisitionItem = currentUser.role !== 'nurse';

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotification(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date());
    }, 1000);
  };

  const handleNavigate = (path: string) => {
    setShowNotification(false);
    navigate(path);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索耗材、申领单、订单..."
            className="w-80 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-500">
          数据更新：{lastUpdate.toLocaleTimeString('zh-CN')}
          <span className="ml-2 inline-flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            实时同步中
          </span>
        </div>

        <button
          onClick={handleRefresh}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-all"
          title="刷新数据"
        >
          <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
        </button>

        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowNotification(!showNotification)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-all"
          >
            <Bell className="w-5 h-5" />
            {totalPendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-status-danger text-white text-xs font-medium rounded-full flex items-center justify-center">
                {totalPendingCount > 99 ? '99+' : totalPendingCount}
              </span>
            )}
          </button>

          {showNotification && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-card py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-800">审批待办</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  共 {totalPendingCount} 条待处理
                </div>
              </div>
              <div className="py-1">
                {showRequisitionItem && (
                  <button
                    onClick={() => handleNavigate('/requisition/approval')}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-slate-800">申领审批待办</div>
                      </div>
                    </div>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      requisitionPendingCount > 0
                        ? 'bg-status-danger/10 text-status-danger'
                        : 'bg-slate-100 text-slate-500'
                    )}>
                      {requisitionPendingCount}条
                    </span>
                  </button>
                )}
                {showPurchaseItem && (
                  <button
                    onClick={() => handleNavigate('/purchase/approval')}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-slate-800">采购审批待办</div>
                      </div>
                    </div>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      purchasePendingCount > 0
                        ? 'bg-status-danger/10 text-status-danger'
                        : 'bg-slate-100 text-slate-500'
                    )}>
                      {purchasePendingCount}条
                    </span>
                  </button>
                )}
                {!showRequisitionItem && !showPurchaseItem && (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    暂无审批权限
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-800">{currentUser.name}</div>
              <div className="text-xs text-slate-500">{getRoleText(currentUser.role)}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-card py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-medium text-slate-800">{currentUser.name}</div>
                <div className="text-xs text-slate-500">{getRoleText(currentUser.role)}</div>
              </div>
              <button className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-colors">
                个人设置
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-status-danger hover:bg-red-50 transition-colors">
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
