import type {
  User,
  Department,
  Supplier,
  Material,
  Inventory,
  Requisition,
  PurchaseSuggestion,
  PurchaseOrder,
  Consumption,
  DashboardStats,
} from '@/types';

export const departments: Department[] = [
  { id: 'dept001', name: '心内科', monthlyBudget: 150000, usedBudget: 98500 },
  { id: 'dept002', name: '骨科', monthlyBudget: 200000, usedBudget: 145000 },
  { id: 'dept003', name: '普外科', monthlyBudget: 180000, usedBudget: 112000 },
  { id: 'dept004', name: '神经外科', monthlyBudget: 250000, usedBudget: 198000 },
  { id: 'dept005', name: '急诊科', monthlyBudget: 120000, usedBudget: 87000 },
  { id: 'dept006', name: 'ICU', monthlyBudget: 300000, usedBudget: 265000 },
  { id: 'dept007', name: '手术室', monthlyBudget: 280000, usedBudget: 210000 },
  { id: 'dept008', name: '妇产科', monthlyBudget: 100000, usedBudget: 65000 },
];

export const users: User[] = [
  { id: 'u001', name: '张护士长', role: 'nurse', departmentId: 'dept001', departmentName: '心内科' },
  { id: 'u002', name: '李主任', role: 'director', departmentId: 'dept001', departmentName: '心内科' },
  { id: 'u003', name: '王主任', role: 'director', departmentId: 'dept002', departmentName: '骨科' },
  { id: 'u004', name: '陈科长', role: 'equipment', departmentId: '', departmentName: '设备科' },
  { id: 'u005', name: '刘采购员', role: 'equipment', departmentId: '', departmentName: '设备科' },
  { id: 'u006', name: '赵院长', role: 'admin', departmentId: '', departmentName: '院领导' },
];

export const currentUser: User = users[3];

export const suppliers: Supplier[] = [
  { id: 's001', name: '国药控股医疗器械有限公司', contact: '周经理', phone: '13800138001' },
  { id: 's002', name: '上海医疗器械股份有限公司', contact: '吴经理', phone: '13800138002' },
  { id: 's003', name: '迈瑞医疗国际有限公司', contact: '郑经理', phone: '13800138003' },
  { id: 's004', name: '强生医疗器材有限公司', contact: '孙经理', phone: '13800138004' },
  { id: 's005', name: '西门子医疗系统有限公司', contact: '马经理', phone: '13800138005' },
];

export const materials: Material[] = [
  { id: 'm001', name: '一次性使用注射器', category: '注射类', spec: '5ml', unit: '支', price: 1.5, safetyStock: 500, currentStock: 1250 },
  { id: 'm002', name: '一次性使用输液器', category: '注射类', spec: '带针', unit: '套', price: 3.2, safetyStock: 300, currentStock: 180 },
  { id: 'm003', name: '医用外科口罩', category: '防护类', spec: '无菌', unit: '只', price: 0.8, safetyStock: 2000, currentStock: 3500 },
  { id: 'm004', name: '一次性医用手套', category: '防护类', spec: 'M号', unit: '副', price: 2.5, safetyStock: 1000, currentStock: 850 },
  { id: 'm005', name: '无菌手术缝合线', category: '手术类', spec: '4-0', unit: '包', price: 45.0, safetyStock: 100, currentStock: 320 },
  { id: 'm006', name: '一次性手术刀', category: '手术类', spec: '11号', unit: '把', price: 18.0, safetyStock: 200, currentStock: 85 },
  { id: 'm007', name: '心电电极片', category: '检查类', spec: '通用', unit: '片', price: 2.0, safetyStock: 800, currentStock: 420 },
  { id: 'm008', name: '一次性留置针', category: '注射类', spec: '20G', unit: '支', price: 12.5, safetyStock: 300, currentStock: 560 },
  { id: 'm009', name: '医用纱布', category: '敷料类', spec: '8*10cm', unit: '包', price: 5.5, safetyStock: 600, currentStock: 2100 },
  { id: 'm010', name: '一次性引流袋', category: '护理类', spec: '1000ml', unit: '个', price: 6.8, safetyStock: 400, currentStock: 156 },
  { id: 'm011', name: '中心静脉导管', category: '导管类', spec: '双腔', unit: '套', price: 285.0, safetyStock: 50, currentStock: 28 },
  { id: 'm012', name: '一次性吸痰管', category: '护理类', spec: '12号', unit: '支', price: 4.5, safetyStock: 500, currentStock: 680 },
  { id: 'm013', name: '人工股骨头', category: '植入类', spec: '标准型', unit: '个', price: 8500.0, safetyStock: 10, currentStock: 15 },
  { id: 'm014', name: '心脏支架', category: '植入类', spec: '药物洗脱', unit: '个', price: 6500.0, safetyStock: 15, currentStock: 8 },
  { id: 'm015', name: '一次性麻醉面罩', category: '麻醉类', spec: '成人型', unit: '个', price: 22.0, safetyStock: 150, currentStock: 95 },
];

const generateExpiryDate = (daysLater: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysLater);
  return date.toISOString().split('T')[0];
};

const calculateStatus = (quantity: number, safetyStock: number, daysToExpiry: number) => {
  if (daysToExpiry <= 0) return 'expired';
  if (daysToExpiry <= 90) return 'near_expiry';
  if (quantity < safetyStock * 0.5) return 'warning';
  return 'normal';
};

export const inventories: Inventory[] = [
  { id: 'inv001', materialId: 'm001', materialName: '一次性使用注射器', category: '注射类', batchNo: 'B20260101', quantity: 1250, unit: '支', expiryDate: generateExpiryDate(365), status: 'normal', daysToExpiry: 365, unitPrice: 1.5, totalValue: 1875 },
  { id: 'inv002', materialId: 'm002', materialName: '一次性使用输液器', category: '注射类', batchNo: 'B20260201', quantity: 180, unit: '套', expiryDate: generateExpiryDate(180), status: 'warning', daysToExpiry: 180, unitPrice: 3.2, totalValue: 576 },
  { id: 'inv003', materialId: 'm003', materialName: '医用外科口罩', category: '防护类', batchNo: 'B20260301', quantity: 3500, unit: '只', expiryDate: generateExpiryDate(45), status: 'near_expiry', daysToExpiry: 45, unitPrice: 0.8, totalValue: 2800 },
  { id: 'inv004', materialId: 'm004', materialName: '一次性医用手套', category: '防护类', batchNo: 'B20260401', quantity: 850, unit: '副', expiryDate: generateExpiryDate(200), status: 'normal', daysToExpiry: 200, unitPrice: 2.5, totalValue: 2125 },
  { id: 'inv005', materialId: 'm005', materialName: '无菌手术缝合线', category: '手术类', batchNo: 'B20260501', quantity: 320, unit: '包', expiryDate: generateExpiryDate(540), status: 'normal', daysToExpiry: 540, unitPrice: 45.0, totalValue: 14400 },
  { id: 'inv006', materialId: 'm006', materialName: '一次性手术刀', category: '手术类', batchNo: 'B20260601', quantity: 85, unit: '把', expiryDate: generateExpiryDate(120), status: 'warning', daysToExpiry: 120, unitPrice: 18.0, totalValue: 1530 },
  { id: 'inv007', materialId: 'm007', materialName: '心电电极片', category: '检查类', batchNo: 'B20260701', quantity: 420, unit: '片', expiryDate: generateExpiryDate(60), status: 'near_expiry', daysToExpiry: 60, unitPrice: 2.0, totalValue: 840 },
  { id: 'inv008', materialId: 'm008', materialName: '一次性留置针', category: '注射类', batchNo: 'B20260801', quantity: 560, unit: '支', expiryDate: generateExpiryDate(300), status: 'normal', daysToExpiry: 300, unitPrice: 12.5, totalValue: 7000 },
  { id: 'inv009', materialId: 'm009', materialName: '医用纱布', category: '敷料类', batchNo: 'B20260901', quantity: 2100, unit: '包', expiryDate: generateExpiryDate(400), status: 'normal', daysToExpiry: 400, unitPrice: 5.5, totalValue: 11550 },
  { id: 'inv010', materialId: 'm010', materialName: '一次性引流袋', category: '护理类', batchNo: 'B20261001', quantity: 156, unit: '个', expiryDate: generateExpiryDate(-15), status: 'expired', daysToExpiry: -15, unitPrice: 6.8, totalValue: 1060.8 },
  { id: 'inv011', materialId: 'm011', materialName: '中心静脉导管', category: '导管类', batchNo: 'B20261101', quantity: 28, unit: '套', expiryDate: generateExpiryDate(75), status: 'near_expiry', daysToExpiry: 75, unitPrice: 285.0, totalValue: 7980 },
  { id: 'inv012', materialId: 'm012', materialName: '一次性吸痰管', category: '护理类', batchNo: 'B20261201', quantity: 680, unit: '支', expiryDate: generateExpiryDate(250), status: 'normal', daysToExpiry: 250, unitPrice: 4.5, totalValue: 3060 },
  { id: 'inv013', materialId: 'm013', materialName: '人工股骨头', category: '植入类', batchNo: 'B20261301', quantity: 15, unit: '个', expiryDate: generateExpiryDate(600), status: 'normal', daysToExpiry: 600, unitPrice: 8500.0, totalValue: 127500 },
  { id: 'inv014', materialId: 'm014', materialName: '心脏支架', category: '植入类', batchNo: 'B20261401', quantity: 8, unit: '个', expiryDate: generateExpiryDate(30), status: 'near_expiry', daysToExpiry: 30, unitPrice: 6500.0, totalValue: 52000 },
  { id: 'inv015', materialId: 'm015', materialName: '一次性麻醉面罩', category: '麻醉类', batchNo: 'B20261501', quantity: 95, unit: '个', expiryDate: generateExpiryDate(95), status: 'warning', daysToExpiry: 95, unitPrice: 22.0, totalValue: 2090 },
];

export const requisitions: Requisition[] = [
  {
    id: 'req001', departmentId: 'dept001', departmentName: '心内科', applicantId: 'u001', applicantName: '张护士长',
    applyDate: new Date().toISOString().split('T')[0], totalAmount: 8560, status: 'pending', currentApprover: 'u002', approvalLevel: 1,
    items: [
      { id: 'ri001', materialId: 'm007', materialName: '心电电极片', spec: '通用', unit: '片', quantity: 500, recommendQty: 400, unitPrice: 2.0, subtotal: 1000 },
      { id: 'ri002', materialId: 'm014', materialName: '心脏支架', spec: '药物洗脱', unit: '个', quantity: 5, recommendQty: 8, unitPrice: 6500.0, subtotal: 32500 },
    ],
    createTime: new Date().toISOString(),
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req002', departmentId: 'dept002', departmentName: '骨科', applicantId: 'u001', applicantName: '王护士长',
    applyDate: new Date().toISOString().split('T')[0], totalAmount: 46800, status: 'pending', currentApprover: 'u003', approvalLevel: 1,
    items: [
      { id: 'ri003', materialId: 'm013', materialName: '人工股骨头', spec: '标准型', unit: '个', quantity: 5, recommendQty: 5, unitPrice: 8500.0, subtotal: 42500 },
      { id: 'ri004', materialId: 'm005', materialName: '无菌手术缝合线', spec: '4-0', unit: '包', quantity: 80, recommendQty: 60, unitPrice: 45.0, subtotal: 3600 },
    ],
    createTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req003', departmentId: 'dept006', departmentName: 'ICU', applicantId: 'u001', applicantName: '刘护士长',
    applyDate: new Date().toISOString().split('T')[0], totalAmount: 5680, status: 'approved', currentApprover: '', approvalLevel: 3,
    items: [
      { id: 'ri005', materialId: 'm011', materialName: '中心静脉导管', spec: '双腔', unit: '套', quantity: 15, recommendQty: 15, unitPrice: 285.0, subtotal: 4275 },
      { id: 'ri006', materialId: 'm010', materialName: '一次性引流袋', spec: '1000ml', unit: '个', quantity: 200, recommendQty: 180, unitPrice: 6.8, subtotal: 1360 },
    ],
    createTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req004', departmentId: 'dept003', departmentName: '普外科', applicantId: 'u001', applicantName: '孙护士长',
    applyDate: new Date().toISOString().split('T')[0], totalAmount: 2340, status: 'completed', currentApprover: '', approvalLevel: 0,
    items: [
      { id: 'ri007', materialId: 'm006', materialName: '一次性手术刀', spec: '11号', unit: '把', quantity: 50, recommendQty: 50, unitPrice: 18.0, subtotal: 900 },
      { id: 'ri008', materialId: 'm009', materialName: '医用纱布', spec: '8*10cm', unit: '包', quantity: 200, recommendQty: 150, unitPrice: 5.5, subtotal: 1100 },
      { id: 'ri009', materialId: 'm004', materialName: '一次性医用手套', spec: 'M号', unit: '副', quantity: 100, recommendQty: 100, unitPrice: 2.5, subtotal: 250 },
    ],
    createTime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req005', departmentId: 'dept005', departmentName: '急诊科', applicantId: 'u001', applicantName: '周护士长',
    applyDate: new Date().toISOString().split('T')[0], totalAmount: 12580, status: 'rejected', currentApprover: '', approvalLevel: 2,
    items: [
      { id: 'ri010', materialId: 'm002', materialName: '一次性使用输液器', spec: '带针', unit: '套', quantity: 500, recommendQty: 300, unitPrice: 3.2, subtotal: 1600 },
      { id: 'ri011', materialId: 'm001', materialName: '一次性使用注射器', spec: '5ml', unit: '支', quantity: 800, recommendQty: 500, unitPrice: 1.5, subtotal: 1200 },
    ],
    createTime: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

export const purchaseSuggestions: PurchaseSuggestion[] = [
  { id: 'ps001', materialId: 'm002', materialName: '一次性使用输液器', category: '注射类', currentStock: 180, safetyStock: 300, suggestQty: 500, unit: '套', reason: '库存低于安全线', status: 'pending', createTime: new Date().toISOString() },
  { id: 'ps002', materialId: 'm006', materialName: '一次性手术刀', category: '手术类', currentStock: 85, safetyStock: 200, suggestQty: 300, unit: '把', reason: '库存低于安全线', status: 'pending', createTime: new Date().toISOString() },
  { id: 'ps003', materialId: 'm010', materialName: '一次性引流袋', category: '护理类', currentStock: 156, safetyStock: 400, suggestQty: 600, unit: '个', reason: '库存低于安全线且有过期', status: 'pending', createTime: new Date().toISOString() },
  { id: 'ps004', materialId: 'm011', materialName: '中心静脉导管', category: '导管类', currentStock: 28, safetyStock: 50, suggestQty: 80, unit: '套', reason: '库存低于安全线', status: 'pending', createTime: new Date().toISOString() },
  { id: 'ps005', materialId: 'm014', materialName: '心脏支架', category: '植入类', currentStock: 8, safetyStock: 15, suggestQty: 25, unit: '个', reason: '库存低于安全线且近效期', status: 'pending', createTime: new Date().toISOString() },
  { id: 'ps006', materialId: 'm015', materialName: '一次性麻醉面罩', category: '麻醉类', currentStock: 95, safetyStock: 150, suggestQty: 200, unit: '个', reason: '库存低于安全线', status: 'processed', createTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po001', supplierId: 's001', supplierName: '国药控股医疗器械有限公司', creatorId: 'u005', creatorName: '刘采购员',
    totalAmount: 58200, status: 'pending', approvalStatus: 'pending', currentApprover: 'u004',
    items: [
      { id: 'poi001', materialId: 'm002', materialName: '一次性使用输液器', spec: '带针', unit: '套', quantity: 500, unitPrice: 3.2, subtotal: 1600 },
      { id: 'poi002', materialId: 'm006', materialName: '一次性手术刀', spec: '11号', unit: '把', quantity: 300, unitPrice: 18.0, subtotal: 5400 },
      { id: 'poi003', materialId: 'm011', materialName: '中心静脉导管', spec: '双腔', unit: '套', quantity: 80, unitPrice: 285.0, subtotal: 22800 },
      { id: 'poi004', materialId: 'm015', materialName: '一次性麻醉面罩', spec: '成人型', unit: '个', quantity: 200, unitPrice: 22.0, subtotal: 4400 },
    ],
    createTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'po002', supplierId: 's004', supplierName: '强生医疗器材有限公司', creatorId: 'u005', creatorName: '刘采购员',
    totalAmount: 292500, status: 'approved', approvalStatus: 'approved', currentApprover: '',
    items: [
      { id: 'poi005', materialId: 'm013', materialName: '人工股骨头', spec: '标准型', unit: '个', quantity: 30, unitPrice: 8500.0, subtotal: 255000 },
      { id: 'poi006', materialId: 'm005', materialName: '无菌手术缝合线', spec: '4-0', unit: '包', quantity: 500, unitPrice: 45.0, subtotal: 22500 },
      { id: 'poi007', materialId: 'm014', materialName: '心脏支架', spec: '药物洗脱', unit: '个', quantity: 5, unitPrice: 6500.0, subtotal: 32500 },
    ],
    createTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'po003', supplierId: 's003', supplierName: '迈瑞医疗国际有限公司', creatorId: 'u005', creatorName: '刘采购员',
    totalAmount: 15600, status: 'ordered', approvalStatus: 'approved', currentApprover: '',
    items: [
      { id: 'poi008', materialId: 'm010', materialName: '一次性引流袋', spec: '1000ml', unit: '个', quantity: 600, unitPrice: 6.8, subtotal: 4080 },
      { id: 'poi009', materialId: 'm007', materialName: '心电电极片', spec: '通用', unit: '片', quantity: 1000, unitPrice: 2.0, subtotal: 2000 },
      { id: 'poi010', materialId: 'm003', materialName: '医用外科口罩', spec: '无菌', unit: '只', quantity: 3000, unitPrice: 0.8, subtotal: 2400 },
    ],
    createTime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'po004', supplierId: 's002', supplierName: '上海医疗器械股份有限公司', creatorId: 'u005', creatorName: '刘采购员',
    totalAmount: 8500, status: 'received', approvalStatus: 'approved', currentApprover: '',
    items: [
      { id: 'poi011', materialId: 'm001', materialName: '一次性使用注射器', spec: '5ml', unit: '支', quantity: 2000, unitPrice: 1.5, subtotal: 3000 },
      { id: 'poi012', materialId: 'm008', materialName: '一次性留置针', spec: '20G', unit: '支', quantity: 200, unitPrice: 12.5, subtotal: 2500 },
    ],
    createTime: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'po005', supplierId: 's001', supplierName: '国药控股医疗器械有限公司', creatorId: 'u005', creatorName: '刘采购员',
    totalAmount: 12800, status: 'completed', approvalStatus: 'approved', currentApprover: '',
    items: [
      { id: 'poi013', materialId: 'm004', materialName: '一次性医用手套', spec: 'M号', unit: '副', quantity: 2000, unitPrice: 2.5, subtotal: 5000 },
      { id: 'poi014', materialId: 'm012', materialName: '一次性吸痰管', spec: '12号', unit: '支', quantity: 1000, unitPrice: 4.5, subtotal: 4500 },
    ],
    createTime: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
  },
];

const generateConsumptions = (): Consumption[] => {
  const result: Consumption[] = [];
  const today = new Date();
  departments.forEach(dept => {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      materials.slice(0, 8).forEach(mat => {
        if (Math.random() > 0.3) {
          const qty = Math.floor(Math.random() * 50) + 10;
          result.push({
            id: `c_${dept.id}_${dateStr}_${mat.id}`,
            departmentId: dept.id,
            departmentName: dept.name,
            materialId: mat.id,
            materialName: mat.name,
            category: mat.category,
            quantity: qty,
            unit: mat.unit,
            amount: qty * mat.price,
            consumeDate: dateStr,
          });
        }
      });
    }
  });
  return result;
};

export const consumptions: Consumption[] = generateConsumptions();

const generateDashboardStats = (): DashboardStats => {
  const totalInventoryValue = inventories.reduce((sum, inv) => sum + inv.totalValue, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyConsumptions = consumptions.filter(c => c.consumeDate.startsWith(thisMonth));
  const monthlyConsumption = monthlyConsumptions.reduce((sum, c) => sum + c.amount, 0);
  const monthlyPurchase = purchaseOrders
    .filter(po => po.createTime.startsWith(thisMonth))
    .reduce((sum, po) => sum + po.totalAmount, 0);
  const nearExpiryCount = inventories.filter(inv => inv.status === 'near_expiry' || inv.status === 'expired').length;
  const warningCount = inventories.filter(inv => inv.status === 'warning').length;
  const pendingApprovalCount = requisitions.filter(r => r.status === 'pending').length;

  const trendData: { date: string; amount: number; department: string }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    departments.slice(0, 4).forEach(dept => {
      const dayConsumption = consumptions
        .filter(c => c.consumeDate === dateStr && c.departmentId === dept.id)
        .reduce((sum, c) => sum + c.amount, 0);
      trendData.push({ date: dateStr.slice(5), amount: dayConsumption, department: dept.name });
    });
  }

  const turnoverRate = departments.map(dept => {
    const deptConsumption = monthlyConsumptions
      .filter(c => c.departmentId === dept.id)
      .reduce((sum, c) => sum + c.amount, 0);
    const avgInventory = totalInventoryValue / departments.length;
    return { department: dept.name, rate: parseFloat(((deptConsumption / avgInventory) * 100).toFixed(1)) };
  });

  const categoryMap = new Map<string, { count: number; total: number }>();
  inventories.forEach(inv => {
    const existing = categoryMap.get(inv.category) || { count: 0, total: 0 };
    categoryMap.set(inv.category, {
      count: existing.count + (inv.status === 'near_expiry' || inv.status === 'expired' ? 1 : 0),
      total: existing.total + 1,
    });
  });
  const nearExpiryRatio = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    ratio: parseFloat(((data.count / data.total) * 100).toFixed(1)),
    count: data.count,
  }));

  const statusCounts: Record<string, number> = {};
  purchaseOrders.forEach(po => {
    statusCounts[po.status] = (statusCounts[po.status] || 0) + 1;
  });
  const totalPOs = purchaseOrders.length;
  const statusLabels: Record<string, string> = {
    pending: '待审批',
    approved: '已批准',
    ordered: '已下单',
    received: '已到货',
    completed: '已完成',
  };
  const purchaseProgress = Object.entries(statusCounts).map(([status, count]) => ({
    status: statusLabels[status] || status,
    count,
    percentage: parseFloat(((count / totalPOs) * 100).toFixed(1)),
  }));

  const departmentConsumption = departments.map(dept => ({
    department: dept.name,
    amount: monthlyConsumptions
      .filter(c => c.departmentId === dept.id)
      .reduce((sum, c) => sum + c.amount, 0),
  }));

  return {
    totalInventoryValue,
    monthlyConsumption,
    monthlyPurchase,
    nearExpiryCount,
    warningCount,
    pendingApprovalCount,
    consumptionTrend: trendData,
    turnoverRate,
    nearExpiryRatio,
    purchaseProgress,
    departmentConsumption,
  };
};

export const dashboardStats: DashboardStats = generateDashboardStats();

export const systemConfig = {
  approvalThreshold: 5000,
  nearExpiryDays: 90,
  approvalTimeoutHours: 48,
  safetyStockRatio: 1.5,
};
