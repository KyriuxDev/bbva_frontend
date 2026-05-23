import { api } from '@/src/lib/axios';
import type { LoginPayload, LoginResponse } from './auth.types';
export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}
