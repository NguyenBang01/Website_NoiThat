export type TrashModule = 'product' | 'category' | 'voucher' | 'review' | 'staff';

export interface TrashItem {
  id: number;
  module: string;
  title: string;
  code: string;
  deleted_at: string;
  deleted_by?: number;
  deleted_by_name: string;
  deleted_by_email: string;
  days_remaining: number;
  extra?: Record<string, unknown>;
}

export interface TrashFilterParams {
  module?: TrashModule;
  page?: number;
  limit?: number;
  search?: string;
  from_date?: string;
  to_date?: string;
  deleted_by?: number;
}

export interface RestoreBatchRequest {
  ids: number[];
}

export interface RestoreResponse {
  success_count: number;
  failed_count: number;
  errors?: string[];
}
