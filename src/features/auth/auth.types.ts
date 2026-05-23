export interface LoginPayload  { email: string; password: string; }
export interface LoginResponse {
  token: string;
  admin: { id: number; email: string; nombre: string; };
}
