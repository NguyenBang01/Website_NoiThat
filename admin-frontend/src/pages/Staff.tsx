import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  Lock,
  Unlock,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  ConfirmDialog,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
  TableError,
  showToast,
} from '@/components/ui';
import { Can } from '@/components/auth/Can';
import { useAuthStore } from '@/lib/authStore';
import { staffApi, roleApi, trashApi, getErrorMessage } from '@/api';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import type { Staff, CreateStaffInput, UpdateStaffInput } from '@/types';

// Validation schemas
const staffSchema = z.object({
  full_name: z.string().min(2, 'Họ và tên ít nhất 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().optional(),
  password: z.string().optional(),
  role_id: z.coerce.number().min(1, 'Vui lòng chọn vai trò'),
});

type StaffFormData = z.infer<typeof staffSchema>;

const resetPasswordSchema = z.object({
  new_password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const StaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [togglingStaff, setTogglingStaff] = useState<Staff | null>(null);
  const [resettingStaff, setResettingStaff] = useState<Staff | null>(null);

  // Queries
  const {
    data: staffRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff', { search, roleFilter, statusFilter }],
    queryFn: () =>
      staffApi.getAll({
        search: search.trim() || undefined,
        role_id: roleFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: rolesRes } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.getAll(),
  });

  const staffList = staffRes?.data || [];
  const roles = rolesRes?.data || [];

  // Form for Add / Edit Staff
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role_id: 0,
    },
  });

  // Form for Reset Password
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    reset: resetResetForm,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
    },
  });

  // Open modal create
  const handleOpenCreate = () => {
    setEditingStaff(null);
    reset({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role_id: roles[0]?.id || 0,
    });
    setModalOpen(true);
  };

  // Open modal edit
  const handleOpenEdit = (staff: Staff) => {
    setEditingStaff(staff);
    reset({
      full_name: staff.full_name,
      email: staff.email,
      phone: staff.phone || '',
      password: '',
      role_id: staff.role_id || staff.role_detail?.id || 0,
    });
    setModalOpen(true);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStaffInput) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      showToast.success('Thành công', 'Đã thêm tài khoản nhân viên mới');
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể tạo nhân viên', getErrorMessage(err));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStaffInput }) =>
      staffApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      showToast.success('Thành công', 'Đã cập nhật thông tin nhân viên');
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể cập nhật nhân viên', getErrorMessage(err));
    },
  });

  // Submit form create/edit
  const onSubmitStaff = (values: StaffFormData) => {
    if (editingStaff) {
      updateMutation.mutate({
        id: editingStaff.id,
        data: {
          full_name: values.full_name,
          phone: values.phone || '',
          role_id: Number(values.role_id),
        },
      });
    } else {
      if (!values.password || values.password.length < 6) {
        showToast.error('Lỗi dữ liệu', 'Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      createMutation.mutate({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role_id: Number(values.role_id),
      });
    }
  };

  // Change Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'locked' }) =>
      staffApi.changeStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      showToast.success(
        'Đã đổi trạng thái',
        variables.status === 'locked' ? 'Đã khóa tài khoản nhân viên' : 'Đã mở khóa tài khoản nhân viên'
      );
      setTogglingStaff(null);
    },
    onError: (err) => {
      showToast.error('Không thể đổi trạng thái', getErrorMessage(err));
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      staffApi.resetPassword(id, newPassword),
    onSuccess: () => {
      showToast.success('Thành công', 'Đã đặt lại mật khẩu cho nhân viên');
      setResettingStaff(null);
      resetResetForm();
    },
    onError: (err) => {
      showToast.error('Không thể đặt lại mật khẩu', getErrorMessage(err));
    },
  });

  const onSubmitResetPassword = (values: ResetPasswordFormData) => {
    if (!resettingStaff) return;
    resetPasswordMutation.mutate({
      id: resettingStaff.id,
      newPassword: values.new_password,
    });
  };

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: (id: number) => trashApi.restore('staff', id),
    onSuccess: () => {
      toast.success('Đã khôi phục tài khoản nhân viên thành công');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['admin-trash'] });
    },
    onError: (err) => {
      toast.error('Không thể khôi phục tài khoản: ' + getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => staffApi.delete(id),
    onSuccess: (_res, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['admin-trash'] });
      toast.success('Đã chuyển tài khoản nhân viên vào thùng rác', {
        action: {
          label: 'Hoàn tác',
          onClick: () => restoreMutation.mutate(deletedId),
        },
        duration: 7000,
      });
      setDeletingStaff(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa', getErrorMessage(err));
    },
  });

  // Role badge helper
  const renderRoleBadge = (roleDetail?: { name: string; display_name: string }) => {
    if (!roleDetail) {
      return <Badge variant="neutral">Chưa có vai trò</Badge>;
    }
    switch (roleDetail.name) {
      case 'super_admin':
        return <Badge variant="purple">{roleDetail.display_name}</Badge>;
      case 'manager':
        return <Badge variant="info">{roleDetail.display_name}</Badge>;
      case 'sales':
        return <Badge variant="success">{roleDetail.display_name}</Badge>;
      case 'warehouse':
        return <Badge variant="warning">{roleDetail.display_name}</Badge>;
      case 'content':
        return <Badge variant="neutral">{roleDetail.display_name}</Badge>;
      default:
        return <Badge variant="neutral">{roleDetail.display_name}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-700" />
            <span>Quản Lý Nhân Viên</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Quản lý tài khoản, chức vụ, vai trò và phân quyền nhân viên trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          <Can permission="staff.create">
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhân viên</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="pl-10 h-10 w-full"
          />
        </div>

        {/* Filter by Role */}
        <div className="w-full md:w-56">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10"
          >
            <option value="">Tất cả vai trò</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.display_name}
              </option>
            ))}
          </Select>
        </div>

        {/* Filter by Status */}
        <div className="w-full md:w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã bị khóa</option>
          </Select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Lần đăng nhập cuối</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : isError ? (
              <TableError colSpan={6} message={getErrorMessage(error)} onRetry={() => refetch()} />
            ) : staffList.length === 0 ? (
              <TableEmpty
                colSpan={6}
                title="Chưa có nhân viên nào"
                description={
                  search || roleFilter || statusFilter
                    ? 'Không tìm thấy nhân viên phù hợp với bộ lọc tìm kiếm'
                    : 'Hãy nhấn nút "Thêm nhân viên" để tạo tài khoản đầu tiên.'
                }
              />
            ) : (
              staffList.map((staff) => {
                const isSelf = currentUser?.id === staff.id;
                const isSuperAdminRole = staff.role_detail?.name === 'super_admin' || staff.role_id === 1;

                return (
                  <TableRow key={staff.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* User Profile */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
                          {staff.full_name ? staff.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                            <span>{staff.full_name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span>{staff.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      {staff.phone ? (
                        <div className="flex items-center gap-1 text-xs text-stone-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{staff.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">-</span>
                      )}
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      {renderRoleBadge(staff.role_detail)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {staff.status === 'active' ? (
                        <Badge variant="success" dot>
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="danger" dot>
                          Đã khóa
                        </Badge>
                      )}
                    </TableCell>

                    {/* Last Login */}
                    <TableCell>
                      <div className="text-xs text-stone-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{staff.last_login_at ? formatDateTime(staff.last_login_at) : 'Chưa đăng nhập'}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Button */}
                        <Can permission="staff.update">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Can>

                        {/* Reset Password Button */}
                        <Can permission="staff.reset_password">
                          <button
                            type="button"
                            onClick={() => {
                              setResettingStaff(staff);
                              resetResetForm({ new_password: '' });
                            }}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </Can>

                        {/* Toggle Status (Lock/Unlock) */}
                        <Can permission="staff.update_status">
                          <button
                            type="button"
                            disabled={isSelf || (isSuperAdminRole && staff.status === 'active')}
                            onClick={() => setTogglingStaff(staff)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelf || (isSuperAdminRole && staff.status === 'active')
                                ? 'text-stone-300 cursor-not-allowed'
                                : staff.status === 'active'
                                ? 'text-stone-600 hover:text-rose-700 hover:bg-rose-50'
                                : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={
                              isSelf
                                ? 'Không thể tự khóa tài khoản của chính mình'
                                : isSuperAdminRole && staff.status === 'active'
                                ? 'Không thể khóa Quản trị viên tối cao'
                                : staff.status === 'active'
                                ? 'Khóa tài khoản'
                                : 'Mở khóa tài khoản'
                            }
                          >
                            {staff.status === 'active' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        </Can>

                        {/* Delete Button */}
                        <Can permission="staff.delete">
                          <button
                            type="button"
                            disabled={isSelf || isSuperAdminRole}
                            onClick={() => setDeletingStaff(staff)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelf || isSuperAdminRole
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title={
                              isSelf
                                ? 'Không thể tự xóa tài khoản của chính mình'
                                : isSuperAdminRole
                                ? 'Không thể xóa Quản trị viên tối cao'
                                : 'Xóa tài khoản'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Add / Edit Staff */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStaff ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
        description={
          editingStaff
            ? `Chỉnh sửa thông tin cho ${editingStaff.full_name} (${editingStaff.email})`
            : 'Tạo tài khoản quản trị và gán vai trò tương ứng trong hệ thống'
        }
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmitStaff)} className="space-y-4 pt-2">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Họ và tên <span className="text-rose-600">*</span>
            </label>
            <Input
              {...register('full_name')}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="h-10"
            />
            {errors.full_name && (
              <p className="text-xs text-rose-600 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Địa chỉ Email <span className="text-rose-600">*</span>
            </label>
            <Input
              type="email"
              disabled={!!editingStaff}
              {...register('email')}
              placeholder="nhanvien@noithat.com"
              className="h-10 disabled:bg-stone-100 disabled:text-stone-500"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
            )}
            {editingStaff && (
              <p className="text-[11px] text-stone-400 mt-1">
                Không thể sửa email sau khi tài khoản đã tạo.
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Số điện thoại
            </label>
            <Input
              {...register('phone')}
              placeholder="Ví dụ: 0912345678"
              className="h-10"
            />
            {errors.phone && (
              <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Password (only on create) */}
          {!editingStaff && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Mật khẩu khởi tạo <span className="text-rose-600">*</span>
              </label>
              <Input
                type="password"
                {...register('password')}
                placeholder="Tối thiểu 6 ký tự"
                className="h-10"
              />
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Role select */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Vai trò / Chức vụ <span className="text-rose-600">*</span>
            </label>
            <Select
              {...register('role_id')}
              disabled={editingStaff?.id === currentUser?.id}
              className="h-10"
            >
              <option value="0">-- Chọn vai trò --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.display_name} ({r.name})
                </option>
              ))}
            </Select>
            {errors.role_id && (
              <p className="text-xs text-rose-600 mt-1">{errors.role_id.message}</p>
            )}
            {editingStaff?.id === currentUser?.id && (
              <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Không thể tự thay đổi vai trò của chính bạn.</span>
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {editingStaff ? 'Lưu thay đổi' : 'Tạo nhân viên'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={!!resettingStaff}
        onClose={() => setResettingStaff(null)}
        title="Đặt lại mật khẩu nhân viên"
        description={`Cấp mật khẩu mới cho ${resettingStaff?.full_name} (${resettingStaff?.email})`}
        size="sm"
      >
        <form onSubmit={handleSubmitReset(onSubmitResetPassword)} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Mật khẩu mới <span className="text-rose-600">*</span>
            </label>
            <Input
              type="password"
              {...registerReset('new_password')}
              placeholder="Nhập ít nhất 6 ký tự"
              className="h-10"
            />
            {resetErrors.new_password && (
              <p className="text-xs text-rose-600 mt-1">
                {resetErrors.new_password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setResettingStaff(null)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={resetPasswordMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Lock / Unlock Dialog */}
      <ConfirmDialog
        isOpen={!!togglingStaff}
        title={togglingStaff?.status === 'active' ? 'Khóa tài khoản nhân viên' : 'Mở khóa tài khoản nhân viên'}
        message={
          togglingStaff?.status === 'active'
            ? `Bạn có chắc muốn KHÓA tài khoản của "${togglingStaff?.full_name}"? Nhân viên này sẽ bị ngắt phiên đăng nhập và không thể truy cập hệ thống.`
            : `Bạn có chắc muốn MỞ KHÓA cho tài khoản "${togglingStaff?.full_name}"?`
        }
        confirmText={togglingStaff?.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa ngay'}
        cancelText="Hủy"
        variant={togglingStaff?.status === 'active' ? 'danger' : 'primary'}
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!togglingStaff) return;
          statusMutation.mutate({
            id: togglingStaff.id,
            status: togglingStaff.status === 'active' ? 'locked' : 'active',
          });
        }}
        onClose={() => setTogglingStaff(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingStaff}
        title="Chuyển tài khoản vào thùng rác"
        message={`Bạn có chắc muốn chuyển tài khoản "${deletingStaff?.full_name}" (${deletingStaff?.email}) vào thùng rác? Bạn có thể khôi phục lại trong Thùng rác sau này.`}
        confirmText="Chuyển vào thùng rác"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingStaff) return;
          deleteMutation.mutate(deletingStaff.id);
        }}
        onClose={() => setDeletingStaff(null)}
      />
    </div>
  );
};
