import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

interface User { id: string; name: string; email: string; avatar?: string }

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(persist(
  (set) => ({
    user: null,
    token: null,
    isLoading: false,
    setToken: (token) => {
      localStorage.setItem('token', token);
      set({ token });
    },
    fetchMe: async () => {
      set({ isLoading: true });
      try {
        const { data } = await api.get('/auth/me');
        set({ user: data, isLoading: false });
      } catch {
        set({ user: null, token: null, isLoading: false });
      }
    },
    logout: () => {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    },
  }),
  { name: 'auth-store', partialize: (s) => ({ token: s.token }) }
));