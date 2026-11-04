import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckSquare,
  Square,
  KeyRound,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Input,
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
import { roleApi, getErrorMessage } from '@/api';
import type { Role, PermissionGroup, CreateRoleInput, UpdateRoleInput } from '@/types';

// Validation schema
const roleSchema = z.object({
  name: z
    .string()
    .min(2, 'Mã vai trò phải từ 2 ký tự')
    .max(50, 'Tối đa 50 ký tự')
    .regex(/^[a-z0-9_]+$/, 'Mã vai trò chỉ gồm chữ thường, số và dấu gạch dưới (vd: sales_lead)')
    .optional()
    .or(z.literal('')),
  display_name: z.string().min(2, 'Tên hiển thị phải từ 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  description: z.string().max(255, 'Tối đa 255 ký tự').optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  // Queries
  const {
    data: rolesRes,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    error: errorRoles,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.getAll(),
  });

  const {
    data: permissionsRes,
    isLoading: isLoadingPerms,
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleApi.getPermissions(),
  });

  const roles = rolesRes?.data || [];
  const permissionGroups: PermissionGroup[] = permissionsRes?.data || [];

  // All permission IDs flat list
  const allPermissionIds = useMemo(() => {
    const groups = permissionsRes?.data || [];
    return groups.flatMap((group) => group.permissions.map((p) => p.id));
  }, [permissionsRes?.data]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
    },
  });

  // Open modal create
  const handleOpenCreate = () => {
    setEditingRole(null);
    setSelectedPermissionIds([]);
    reset({
      name: '',
      display_name: '',
      description: '',
    });
    setModalOpen(true);
  };

  // Open modal edit
  const handleOpenEdit = async (role: Role) => {
    setEditingRole(role);
    // Fetch full role details with permissions
    try {
      const res = await roleApi.getById(role.id);
      const permIds = res.data.permissions?.map((p) => p.id) || [];
      setSelectedPermissionIds(permIds);
    } catch {
      const permIds = role.permissions?.map((p) => p.id) || [];
      setSelectedPermissionIds(permIds);
    }

    reset({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
    });
    setModalOpen(true);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRoleInput) => roleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showToast.success('Thành công', 'Đã tạo vai trò mới');
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể tạo vai trò', getErrorMessage(err));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleInput }) =>
      roleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showToast.success('Thành công', 'Đã cập nhật vai trò và phân quyền');
      setModalOpen(false);
    },
    onError: (err) => {
      showToast.error('Không thể cập nhật vai trò', getErrorMessage(err));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showToast.success('Thành công', 'Đã xóa vai trò');
      setDeletingRole(null);
    },
    onError: (err) => {
      showToast.error('Không thể xóa vai trò', getErrorMessage(err));
    },
  });

  // Submit form
  const onSubmit = (values: RoleFormData) => {
    if (editingRole) {
      updateMutation.mutate({
        id: editingRole.id,
        data: {
          display_name: values.display_name,
          description: values.description || '',
          permission_ids: selectedPermissionIds,
        },
      });
    } else {
      if (!values.name) {
        showToast.error('Lỗi dữ liệu', 'Vui lòng nhập mã định danh vai trò');
        return;
      }
      createMutation.mutate({
        name: values.name,
        display_name: values.display_name,
        description: values.description || '',
        permission_ids: selectedPermissionIds,
      });
    }
  };

  // Permission selection helpers
  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupPermIds = group.permissions.map((p) => p.id);
    const isAllSelected = groupPermIds.every((id) => selectedPermissionIds.includes(id));

    if (isAllSelected) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !groupPermIds.includes(id))
      );
    } else {
      setSelectedPermissionIds((prev) =>
        Array.from(new Set([...prev, ...groupPermIds]))
      );
    }
  };

  const selectAllPermissions = () => {
    if (selectedPermissionIds.length === allPermissionIds.length) {
      setSelectedPermissionIds([]);
    } else {
      setSelectedPermissionIds([...allPermissionIds]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-700" />
            <span>Vai Trò & Phân Quyền (RBAC)</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Thiết lập danh sách các vai trò và gán quyền thao tác chi tiết theo từng phân hệ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetchRoles()}
            className="flex items-center gap-1.5"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          <Can permission="role.create">
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm vai trò</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vai trò</TableHead>
              <TableHead>Mã định danh</TableHead>
              <TableHead>Mô tả nhiệm vụ</TableHead>
              <TableHead>Số lượng nhân viên</TableHead>
              <TableHead>Loại vai trò</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRoles ? (
              <TableSkeleton columns={6} rows={5} />
            ) : isErrorRoles ? (
              <TableError colSpan={6} message={getErrorMessage(errorRoles)} onRetry={() => refetchRoles()} />
            ) : roles.length === 0 ? (
              <TableEmpty
                colSpan={6}
                title="Chưa có vai trò nào"
                description="Hệ thống chưa nạp vai trò. Vui lòng kiểm tra lại cấu hình."
              />
            ) : (
              roles.map((role) => {
                const isSuperAdmin = role.name === 'super_admin';
                const hasUsers = (role.users_count || 0) > 0;

                return (
                  <TableRow key={role.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Display name */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSuperAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : role.is_system
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900 text-sm">
                            {role.display_name}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Code name */}
                    <TableCell>
                      <code className="text-xs font-mono bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-200">
                        {role.name}
                      </code>
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      <span className="text-xs text-stone-600 line-clamp-1 max-w-xs">
                        {role.description || '-'}
                      </span>
                    </TableCell>

                    {/* Users count */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>{role.users_count || 0} nhân viên</span>
                      </div>
                    </TableCell>

                    {/* Type badge */}
                    <TableCell>
                      {role.is_system ? (
                        <Badge variant="purple" size="sm">
                          Hệ thống
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Tùy chỉnh
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Role */}
                        <Can permission="role.update">
                          <button
                            type="button"
                            disabled={isSuperAdmin}
                            onClick={() => handleOpenEdit(role)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSuperAdmin
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={
                              isSuperAdmin
                                ? 'Vai trò Quản trị viên tối cao luôn có mọi quyền'
                                : 'Sửa vai trò & phân quyền'
                            }
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Can>

                        {/* Delete Role */}
                        <Can permission="role.delete">
                          <button
                            type="button"
                            disabled={role.is_system || hasUsers}
                            onClick={() => setDeletingRole(role)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              role.is_system || hasUsers
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title={
                              role.is_system
                                ? 'Không thể xóa vai trò mặc định của hệ thống'
                                : hasUsers
                                ? 'Không thể xóa vai trò đang có nhân viên sử dụng'
                                : 'Xóa vai trò'
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

      {/* Modal Add / Edit Role with Permission Matrix */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? `Phân quyền vai trò: ${editingRole.display_name}` : 'Thêm vai trò mới'}
        description="Đặt tên vai trò và đánh dấu các quyền được phép thực thi trong từng phân hệ"
        size="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          {/* Basic info row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Tên hiển thị <span className="text-rose-600">*</span>
              </label>
              <Input
                {...register('display_name')}
                placeholder="Ví dụ: Trưởng nhóm bán hàng"
                className="h-10"
              />
              {errors.display_name && (
                <p className="text-xs text-rose-600 mt-1">{errors.display_name.message}</p>
              )}
            </div>

            {/* Code Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Mã vai trò {!editingRole && <span className="text-rose-600">*</span>}
              </label>
              <Input
                {...register('name')}
                disabled={!!editingRole}
                placeholder="sales_lead"
                className="h-10 font-mono text-xs disabled:bg-stone-100 disabled:text-stone-500"
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Mô tả nhiệm vụ
              </label>
              <Input
                {...register('description')}
                placeholder="Mô tả tóm tắt trách nhiệm của vai trò này trong cửa hàng"
                className="h-10"
              />
              {errors.description && (
                <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Permission Matrix Section */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Ma trận phân quyền chi tiết</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Đã chọn {selectedPermissionIds.length} / {allPermissionIds.length} quyền
                </p>
              </div>

              {/* Master select all button */}
              <button
                type="button"
                onClick={selectAllPermissions}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer w-fit"
              >
                {selectedPermissionIds.length === allPermissionIds.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Bỏ chọn tất cả quyền</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Chọn tất cả quyền</span>
                  </>
                )}
              </button>
            </div>

            {/* Grouped permissions */}
            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {isLoadingPerms ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  Đang nạp danh sách quyền...
                </div>
              ) : (
                permissionGroups.map((group) => {
                  const groupPermIds = group.permissions.map((p) => p.id);
                  const isGroupAllSelected = groupPermIds.every((id) =>
                    selectedPermissionIds.includes(id)
                  );
                  const isGroupPartiallySelected =
                    !isGroupAllSelected &&
                    groupPermIds.some((id) => selectedPermissionIds.includes(id));

                  return (
                    <div
                      key={group.module}
                      className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-2.5"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isGroupAllSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = isGroupPartiallySelected;
                              }}
                              onChange={() => toggleGroup(group)}
                              className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                            />
                            <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                              {group.module_name}
                            </span>
                          </label>
                          <span className="text-[10px] text-stone-400 font-mono">
                            ({group.module})
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {group.permissions.filter((p) => selectedPermissionIds.includes(p.id)).length}/
                          {group.permissions.length}
                        </span>
                      </div>

                      {/* Group Checkboxes Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {group.permissions.map((perm) => {
                          const isChecked = selectedPermissionIds.includes(perm.id);

                          return (
                            <label
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                                isChecked
                                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                                  : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Handled by parent label click
                                className="mt-0.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer h-4 w-4 shrink-0"
                              />
                              <div className="text-xs flex-1">
                                <div className="font-semibold text-stone-900 leading-tight">
                                  {perm.name}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                  {perm.code}
                                </div>
                                {perm.description && (
                                  <div className="text-[11px] text-stone-500 mt-1 leading-snug">
                                    {perm.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Form Actions */}
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
              {editingRole ? 'Lưu phân quyền' : 'Tạo vai trò'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Role Dialog */}
      <ConfirmDialog
        isOpen={!!deletingRole}
        title="Xóa vai trò"
        message={`Bạn có chắc muốn XÓA vai trò "${deletingRole?.display_name}" (${deletingRole?.name})? Các quyền liên kết sẽ bị xóa khỏi vai trò này.`}
        confirmText="Xóa vai trò"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingRole) return;
          deleteMutation.mutate(deletingRole.id);
        }}
        onClose={() => setDeletingRole(null)}
      />
    </div>
  );
};
