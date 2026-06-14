import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { currentUser, users } from '@/mock/data';

interface UserState {
  currentUser: User;
  allUsers: User[];
  setCurrentUser: (user: User) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser,
      allUsers: users,
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: 'user-storage',
    }
  )
);

export const hasPermission = (userRole: string, allowedRoles: string[]): boolean => {
  return allowedRoles.includes(userRole);
};
