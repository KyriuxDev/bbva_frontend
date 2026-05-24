import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface AdminPayload { id: number; email: string; nombre: string; }

interface AuthState {
  accessToken:     string | null;
  admin:           AdminPayload | null;
  isAuthenticated: boolean;
  isHydrated:      boolean;
  hydrate: () => Promise<void>;
  login:   (token: string, admin: AdminPayload) => Promise<void>;
  logout:  () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, admin: null, isAuthenticated: false, isHydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const raw   = await SecureStore.getItemAsync('admin_payload');
      const admin = raw ? JSON.parse(raw) as AdminPayload : null;
      set({ accessToken: token, admin, isAuthenticated: !!token, isHydrated: true });
    } catch (e) {
      console.warn("SecureStore.getItemAsync falló, intentando localStorage:", e);
      let token = null;
      let admin = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          token = window.localStorage.getItem('access_token');
          const raw = window.localStorage.getItem('admin_payload');
          admin = raw ? JSON.parse(raw) as AdminPayload : null;
        }
      } catch (err) {}
      set({ accessToken: token, admin, isAuthenticated: !!token, isHydrated: true });
    }
  },

  login: async (accessToken, admin) => {
    try {
      await SecureStore.setItemAsync('access_token',  accessToken);
      await SecureStore.setItemAsync('admin_payload', JSON.stringify(admin));
    } catch (e) {
      console.warn("SecureStore.setItemAsync falló, usando localStorage fallback:", e);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('access_token', accessToken);
          window.localStorage.setItem('admin_payload', JSON.stringify(admin));
        }
      } catch (err) {}
    }
    set({ accessToken, admin, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('admin_payload');
    } catch (e) {
      console.warn("SecureStore.deleteItemAsync falló, limpiando localStorage:", e);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('admin_payload');
        }
      } catch (err) {}
    }
    set({ accessToken: null, admin: null, isAuthenticated: false });
  },
}));
