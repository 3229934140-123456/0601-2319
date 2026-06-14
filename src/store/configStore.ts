import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemConfig } from '@/types';
import { systemConfig as mockConfig } from '@/mock/data';

interface ConfigState {
  config: SystemConfig;
  updateConfig: (config: Partial<SystemConfig>) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: mockConfig,
      updateConfig: (newConfig) =>
        set((state) => ({ config: { ...state.config, ...newConfig } })),
    }),
    {
      name: 'config-storage',
    }
  )
);
