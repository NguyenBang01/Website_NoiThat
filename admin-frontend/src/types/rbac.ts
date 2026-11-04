import type { User } from './index';

export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string;
  created_at?: string;
}

export interface PermissionGroup {
  module: string;
  module_name: string;
  permissions: Permission[];
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_system: boolean;
  permissions?: Permission[];
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Staff {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  role_id?: number | null;
  role_detail?: Role;
  status: 'active' | 'locked' | 'blocked';
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target?: string;
  details?: string;
  ip: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

export interface CreateStaffInput {
  full_name: string;
  email: string;
  phone?: string;
  password?: string;
  role_id: number;
}

export interface UpdateStaffInput {
  full_name: string;
  phone?: string;
  role_id: number;
}

export interface CreateRoleInput {
  name: string;
  display_name: string;
  description?: string;
  permission_ids?: number[];
}

export interface UpdateRoleInput {
  display_name: string;
  description?: string;
  permission_ids?: number[];
}

export interface StaffFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role_id?: number | string;
  status?: string;
}

export interface AuditLogFilterParams {
  page?: number;
  limit?: number;
  action?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
}
