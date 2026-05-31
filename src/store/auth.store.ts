import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface AdminPayload { id: number; email: string; nombre: string; }

interface AuthState {
  accessToken:     string | null;
  admin:           AdminPayload | null;
  isAuthenticated: boolean;
  isLocked:        boolean;
  isHydrated:      boolean;
  hydrate: () => Promise<void>;
  login:   (token: string, admin: AdminPayload) => Promise<void>;
  logout:  () => Promise<void>;
  lock:    () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, admin: null,
  isAuthenticated: false,
  isLocked: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const raw   = await SecureStore.getItemAsync('admin_payload');
      const admin = raw ? JSON.parse(raw) as AdminPayload : null;
      // Si hay token, arranca bloqueado (pide huella), no autenticado directo
      set({
        accessToken:     token,
        admin,
        isAuthenticated: false,   // ← siempre false al arrancar
        isLocked:        !!token, // ← si hay token, arranca bloqueado
        isHydrated:      true,
      });
    } catch (e) {
      set({ isAuthenticated: false, isLocked: false, isHydrated: true });
    }
  },

  login: async (accessToken, admin) => {
    try {
      await SecureStore.setItemAsync('access_token',  accessToken);
      await SecureStore.setItemAsync('admin_payload', JSON.stringify(admin));
    } catch (e) {}
    set({ accessToken, admin, isAuthenticated: true, isLocked: false });
  },

  lock: () => set({ isAuthenticated: false, isLocked: true }),

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('admin_payload');
    } catch (e) {}
    set({ accessToken: null, admin: null, isAuthenticated: false, isLocked: false });
  },
}));
