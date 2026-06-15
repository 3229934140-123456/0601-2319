import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  Warehouse,
  AlertTriangle,
  CalendarClock,
  Lightbulb,
  ShoppingCart,
  Receipt,
  DollarSign,
  FileSpreadsheet,
  Users,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  Heart,
  Package,
  Trash2,
} from 'lucide-react';
import { cn, getRoleText } from '@/utils';
import { useUserStore } from '@/store/userStore';

const menuConfig = [
  { path: '/dashboard', name: '首页大屏', icon: LayoutDashboard, roles: ['nurse', 'director', 'equipment', 'admin'] },
  { path: '/requisition', name: '科室申领', icon: ClipboardList, roles: ['nurse', 'director', 'equipment', 'admin'] },
  { path: '/requisition/outbound', name: '出库单记录', icon: Package, roles: ['nurse', 'director', 'equipment', 'admin'] },
  { path: '/requisition/approval', name: '审批中心', icon: ClipboardCheck, roles: ['director', 'equipment', 'admin'] },
  { path: '/inventory', name: '库存总览', icon: Warehouse, roles: ['equipment', 'admin'] },
  { path: '/inventory/warning', name: '库存预警', icon: AlertTriangle, roles: ['equipment', 'admin'] },
  { path: '/inventory/expiry', name: '效期管理', icon: CalendarClock, roles: ['equipment', 'admin'] },
  { path: '/inventory/scrap', name: '报废工单', icon: Trash2, roles: ['equipment', 'admin'] },
  { path: '/purchase/suggestion', name: '采购建议', icon: Lightbulb, roles: ['equipment', 'admin'] },
  { path: '/purchase/approval', name: '采购审批', icon: ShoppingCart, roles: ['equipment', 'admin'] },
  { path: '/purchase/order', name: '订单管理', icon: Receipt, roles: ['equipment', 'admin'] },
  { path: '/settlement/cost', name: '成本分摊', icon: DollarSign, roles: ['director', 'equipment', 'admin'] },
  { path: '/settlement/report', name: '结算报表', icon: FileSpreadsheet, roles: ['director', 'equipment', 'admin'] },
  { path: '/settlement/detail', name: '采购明细', icon: Database, roles: ['equipment', 'admin'] },
  { path: '/system/user', name: '权限管理', icon: Users, roles: ['admin'] },
  { path: '/system/config', name: '阈值配置', icon: Settings, roles: ['admin'] },
  { path: '/system/basic', name: '基础数据', icon: Database, roles: ['equipment', 'admin'] },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useUserStore();
  const navigate = useNavigate();

  const filteredMenu = menuConfig.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-gradient-to-b from-medical-dark to-primary-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center gap-3 px-5 py-5 border-b border-white/10', collapsed && 'justify-center px-2')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow-blue flex-shrink-0">
          <Heart className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-lg font-bold whitespace-nowrap">医用耗材管理</span>
            <span className="text-xs text-slate-400 whitespace-nowrap">智慧管理平台</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm whitespace-nowrap">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={cn('border-t border-white/10 p-3', collapsed && 'px-2')}>
        {!collapsed && (
          <div className="mb-3 px-2">
            <div className="text-sm font-medium">{currentUser.name}</div>
            <div className="text-xs text-slate-400">{getRoleText(currentUser.role)}{currentUser.departmentName && ` · ${currentUser.departmentName}`}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
