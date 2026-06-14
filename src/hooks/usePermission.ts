import { useUserStore, hasPermission } from '@/store/userStore';

export const usePermission = () => {
  const { currentUser } = useUserStore();

  const check = (allowedRoles: string[]) => {
    return hasPermission(currentUser.role, allowedRoles);
  };

  const isNurse = currentUser.role === 'nurse';
  const isDirector = currentUser.role === 'director';
  const isEquipment = currentUser.role === 'equipment';
  const isAdmin = currentUser.role === 'admin';

  return {
    currentUser,
    check,
    isNurse,
    isDirector,
    isEquipment,
    isAdmin,
  };
};
