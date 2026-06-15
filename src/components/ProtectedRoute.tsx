import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore, hasPermission } from '@/store/userStore';
import { useRequisitionStore } from '@/store/requisitionStore';
import { useInventoryStore } from '@/store/inventoryStore';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser } = useUserStore();
  const location = useLocation();

  if (!hasPermission(currentUser.role, allowedRoles)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[]
) => {
  return (props: P) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

export const useFilteredData = () => {
  const { currentUser } = useUserStore();

  const getFilteredRequisitions = () => {
    const state = useRequisitionStore.getState();
    if (currentUser.role === 'nurse' || currentUser.role === 'director') {
      return state.getRequisitionsByDepartment(currentUser.departmentId);
    }
    return state.getRequisitions();
  };

  const getFilteredInventories = () => {
    const state = useInventoryStore.getState();
    return state.getInventories();
  };

  return {
    getFilteredRequisitions,
    getFilteredInventories,
    currentUser,
  };
};

export default ProtectedRoute;
