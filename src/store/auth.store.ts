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

      if (token && admin) {
        // Sesión previa existe → autenticar directo, sin pedir huella al arranque.
        // El botón "Bloquear pantalla" del dashboard activa isLocked manualmente.
        set({
          accessToken:     token,
          admin,
          isAuthenticated: true,
          isLocked:        false,
          isHydrated:      true,
        });
      } else {
        set({ isAuthenticated: false, isLocked: false, isHydrated: true });
      }
    } catch {
      set({ isAuthenticated: false, isLocked: false, isHydrated: true });
    }
  },

  login: async (accessToken, admin) => {
    try {
      await SecureStore.setItemAsync('access_token',  accessToken);
      await SecureStore.setItemAsync('admin_payload', JSON.stringify(admin));
    } catch {}
    set({ accessToken, admin, isAuthenticated: true, isLocked: false });
  },

  lock: () => set({ isAuthenticated: false, isLocked: true }),

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('admin_payload');
    } catch {}
    set({ accessToken: null, admin: null, isAuthenticated: false, isLocked: false });
  },
}));