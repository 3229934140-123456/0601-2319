import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/pages/dashboard';
import RequisitionList from '@/pages/requisition/List';
import RequisitionApproval from '@/pages/requisition/Approval';
import RequisitionOutbound from '@/pages/requisition/Outbound';
import InventoryList from '@/pages/inventory/List';
import InventoryWarning from '@/pages/inventory/Warning';
import InventoryExpiry from '@/pages/inventory/Expiry';
import ScrapList from '@/pages/inventory/Scrap';
import PurchaseSuggestion from '@/pages/purchase/Suggestion';
import PurchaseApproval from '@/pages/purchase/Approval';
import PurchaseOrder from '@/pages/purchase/Order';
import SettlementCost from '@/pages/settlement/Cost';
import SettlementReport from '@/pages/settlement/Report';
import SettlementDetail from '@/pages/settlement/Detail';
import SystemUser from '@/pages/system/User';
import SystemConfig from '@/pages/system/Config';
import SystemBasic from '@/pages/system/Basic';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute allowedRoles={['nurse', 'director', 'equipment', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requisition',
        element: (
          <ProtectedRoute allowedRoles={['nurse', 'director', 'equipment', 'admin']}>
            <RequisitionList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requisition/outbound',
        element: (
          <ProtectedRoute allowedRoles={['nurse', 'director', 'equipment', 'admin']}>
            <RequisitionOutbound />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requisition/approval',
        element: (
          <ProtectedRoute allowedRoles={['director', 'equipment', 'admin']}>
            <RequisitionApproval />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <InventoryList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/warning',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <InventoryWarning />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/expiry',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <InventoryExpiry />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/scrap',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <ScrapList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'purchase/suggestion',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <PurchaseSuggestion />
          </ProtectedRoute>
        ),
      },
      {
        path: 'purchase/approval',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <PurchaseApproval />
          </ProtectedRoute>
        ),
      },
      {
        path: 'purchase/order',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <PurchaseOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settlement/cost',
        element: (
          <ProtectedRoute allowedRoles={['director', 'equipment', 'admin']}>
            <SettlementCost />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settlement/report',
        element: (
          <ProtectedRoute allowedRoles={['director', 'equipment', 'admin']}>
            <SettlementReport />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settlement/detail',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <SettlementDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'system/user',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SystemUser />
          </ProtectedRoute>
        ),
      },
      {
        path: 'system/config',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SystemConfig />
          </ProtectedRoute>
        ),
      },
      {
        path: 'system/basic',
        element: (
          <ProtectedRoute allowedRoles={['equipment', 'admin']}>
            <SystemBasic />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
