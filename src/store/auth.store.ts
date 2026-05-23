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
    const token = await SecureStore.getItemAsync('access_token');
    const raw   = await SecureStore.getItemAsync('admin_payload');
    const admin = raw ? JSON.parse(raw) as AdminPayload : null;
    set({ accessToken: token, admin, isAuthenticated: !!token, isHydrated: true });
  },

  login: async (accessToken, admin) => {
    await SecureStore.setItemAsync('access_token',  accessToken);
    await SecureStore.setItemAsync('admin_payload', JSON.stringify(admin));
    set({ accessToken, admin, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('admin_payload');
    set({ accessToken: null, admin: null, isAuthenticated: false });
  },
}));
