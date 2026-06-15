import { useEffect, useRef } from 'react';
import { useRequisitionStore } from '@/store/requisitionStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { useDashboardStore } from '@/store/dashboardStore';

const BackgroundTask = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const invState = useInventoryStore.getState();
    const result = invState.processAutoLockOnLoad();
    console.log(`[启动] 自动锁定 ${result.count} 个过期批次，生成 ${result.scrapCount} 个报废工单`);

    useDashboardStore.getState().refreshStats();

    const reqState = useRequisitionStore.getState();
    const timeoutResult = reqState.checkAndEscalateAllTimeouts();
    if (timeoutResult.requisitionCount > 0 || timeoutResult.purchaseCount > 0) {
      console.log(`[启动] 自动流转 ${timeoutResult.requisitionCount} 个申领单，${timeoutResult.purchaseCount} 个采购单`);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const reqState = useRequisitionStore.getState();
      const result = reqState.checkAndEscalateAllTimeouts();
      if (result.requisitionCount > 0 || result.purchaseCount > 0) {
        console.log(`[定时] 自动流转 ${result.requisitionCount} 个申领单，${result.purchaseCount} 个采购单`);
      }

      const invState = useInventoryStore.getState();
      invState.updateInventoryStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default BackgroundTask;
