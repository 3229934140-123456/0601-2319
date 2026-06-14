import { useState } from 'react';
import { Users, Shield, Pencil, X, Check } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { departments } from '@/mock/data';
import { getRoleText, cn } from '@/utils';
import type { UserRole } from '@/types';

export default function User() {
  const { allUsers } = useUserStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('nurse');
  const [users, setUsers] = useState(allUsers);

  const roles: { value: UserRole; label: string; color: string }[] = [
    { value: 'nurse', label: '护士站', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { value: 'director', label: '科室主任', color: 'bg-violet-50 text-violet-700 border-violet-200' },
    { value: 'equipment', label: '设备科', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'admin', label: '院长', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  const getRoleColor = (role: UserRole) => {
    return roles.find(r => r.value === role)?.color || 'bg-slate-50 text-slate-700';
  };

  const handleEdit = (userId: string, currentRole: UserRole) => {
    setEditingId(userId);
    setEditRole(currentRole);
  };

  const handleSave = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: editRole } : u
    ));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">权限管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理系统用户及角色权限分配</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roles.map(role => {
          const count = users.filter(u => u.role === role.value).length;
          return (
            <div key={role.value} className="dashboard-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{role.label}</p>
                  <p className="text-2xl font-bold text-slate-800 data-number mt-1">{count}</p>
                </div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", role.color)}>
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary-600" />
            <h2 className="section-title">用户列表</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left">姓名</th>
                <th className="px-6 py-4 text-left">角色</th>
                <th className="px-6 py-4 text-left">所属科室</th>
                <th className="px-6 py-4 text-left">状态</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as UserRole)}
                        className="input-field w-32 py-1.5 text-sm"
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border",
                        getRoleColor(user.role as UserRole)
                      )}>
                        {getRoleText(user.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {user.departmentName || departments.find(d => d.id === user.departmentId)?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="status-approved">
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
                      正常
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === user.id ? (
                        <>
                          <button
                            onClick={() => handleSave(user.id)}
                            className="p-2 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(user.id, user.role as UserRole)}
                          className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
