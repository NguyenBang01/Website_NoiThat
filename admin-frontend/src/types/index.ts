export * from './models';
export * from './rbac';
export * from './trash';
export * from './shipping';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  detail?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'customer';
  status: 'active' | 'blocked' | 'locked';
  role_id?: number | null;
  role_detail?: import('./rbac').Role;
  permissions?: string[];
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponseData {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
  permissions?: string[];
  role_detail?: import('./rbac').Role;
}

export interface RefreshResponseData {
  access_token?: string;
  token?: string;
  refresh_token?: string;
}
