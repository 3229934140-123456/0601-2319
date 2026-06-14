import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/dashboard';
import RequisitionList from '@/pages/requisition/List';
import RequisitionApproval from '@/pages/requisition/Approval';
import InventoryList from '@/pages/inventory/List';
import InventoryWarning from '@/pages/inventory/Warning';
import InventoryExpiry from '@/pages/inventory/Expiry';
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
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'requisition', element: <RequisitionList /> },
      { path: 'requisition/approval', element: <RequisitionApproval /> },
      { path: 'inventory', element: <InventoryList /> },
      { path: 'inventory/warning', element: <InventoryWarning /> },
      { path: 'inventory/expiry', element: <InventoryExpiry /> },
      { path: 'purchase/suggestion', element: <PurchaseSuggestion /> },
      { path: 'purchase/approval', element: <PurchaseApproval /> },
      { path: 'purchase/order', element: <PurchaseOrder /> },
      { path: 'settlement/cost', element: <SettlementCost /> },
      { path: 'settlement/report', element: <SettlementReport /> },
      { path: 'settlement/detail', element: <SettlementDetail /> },
      { path: 'system/user', element: <SystemUser /> },
      { path: 'system/config', element: <SystemConfig /> },
      { path: 'system/basic', element: <SystemBasic /> },
    ],
  },
]);

export default router;
