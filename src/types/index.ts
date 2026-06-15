export type UserRole = 'nurse' | 'director' | 'equipment' | 'admin';

export type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';

export type PurchaseOrderStatus = 'pending' | 'approved' | 'ordered' | 'received' | 'completed';

export type InventoryStatus = 'normal' | 'warning' | 'near_expiry' | 'expired' | 'locked';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  departmentId: string;
  departmentName?: string;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  monthlyBudget: number;
  usedBudget: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  price: number;
  safetyStock: number;
  currentStock: number;
}

export interface Inventory {
  id: string;
  materialId: string;
  materialName: string;
  category: string;
  batchNo: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: InventoryStatus;
  daysToExpiry?: number;
  unitPrice: number;
  totalValue: number;
}

export interface RequisitionItem {
  id: string;
  materialId: string;
  materialName: string;
  spec: string;
  unit: string;
  quantity: number;
  recommendQty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Requisition {
  id: string;
  departmentId: string;
  departmentName: string;
  applicantId: string;
  applicantName: string;
  applyDate: string;
  totalAmount: number;
  status: RequisitionStatus;
  currentApprover: string;
  approvalLevel: number;
  items: RequisitionItem[];
  createTime: string;
  deadline?: string;
}

export interface PurchaseSuggestion {
  id: string;
  materialId: string;
  materialName: string;
  category: string;
  currentStock: number;
  safetyStock: number;
  suggestQty: number;
  unit: string;
  reason: string;
  status: 'pending' | 'processed' | 'ignored';
  createTime: string;
}

export interface PurchaseOrderItem {
  id: string;
  materialId: string;
  materialName: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  creatorId: string;
  creatorName: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  currentApprover: string;
  approvalLevel: number;
  items: PurchaseOrderItem[];
  createTime: string;
  deadline?: string;
}

export interface Consumption {
  id: string;
  departmentId: string;
  departmentName: string;
  materialId: string;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  amount: number;
  consumeDate: string;
}

export interface Settlement {
  id: string;
  departmentId: string;
  departmentName: string;
  month: string;
  totalCost: number;
  budget: number;
  usedBudget: number;
  remainingBudget: number;
  items: Consumption[];
}

export interface DashboardStats {
  totalInventoryValue: number;
  monthlyConsumption: number;
  monthlyPurchase: number;
  nearExpiryCount: number;
  warningCount: number;
  pendingApprovalCount: number;
  consumptionTrend: { date: string; amount: number; department: string }[];
  turnoverRate: { department: string; rate: number }[];
  nearExpiryRatio: { category: string; ratio: number; count: number }[];
  purchaseProgress: { status: string; count: number; percentage: number }[];
  departmentConsumption: { department: string; amount: number }[];
  inventoryFilterNote: string;
  purchaseFilterNote: string;
}

export interface SystemConfig {
  approvalThreshold: number;
  nearExpiryDays: number;
  approvalTimeoutHours: number;
  safetyStockRatio: number;
}

export interface ApprovalRecord {
  id: string;
  requisitionId: string;
  approverId: string;
  approverName: string;
  level: number;
  result: 'approved' | 'rejected' | 'timeout';
  opinion?: string;
  approveTime: string;
}

export interface OutboundOrder {
  id: string;
  requisitionId: string;
  departmentId: string;
  departmentName: string;
  items: OutboundItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createTime: string;
  operatorId?: string;
  operatorName?: string;
}

export interface OutboundItem {
  id: string;
  materialId: string;
  materialName: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  inventoryId: string;
  batchNo: string;
}

export interface ScrapOrder {
  id: string;
  inventoryId: string;
  materialId: string;
  materialName: string;
  batchNo: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  reason: string;
  status: 'pending' | 'processed' | 'cancelled';
  createTime: string;
  processTime?: string;
}

export interface DashboardFilter {
  departmentId: string | 'all';
  category: string | 'all';
  dateRange: '7d' | '15d' | '30d' | 'month';
}

export type BudgetFlowType =
  | 'requisition_submit'
  | 'requisition_approve'
  | 'requisition_reject'
  | 'requisition_timeout'
  | 'outbound_cancel';

export interface BudgetFlowRecord {
  id: string;
  departmentId: string;
  departmentName: string;
  type: BudgetFlowType;
  amount: number;
  beforeUsed: number;
  afterUsed: number;
  beforePending: number;
  afterPending: number;
  relatedId?: string;
  relatedType?: 'requisition' | 'outbound';
  operatorName: string;
  remark: string;
  createTime: string;
}
