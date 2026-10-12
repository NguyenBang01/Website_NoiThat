import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, Armchair, AlertCircle } from 'lucide-react';
import { Button, Input, showToast } from '@/components/ui';
import { authApi, getErrorMessage } from '@/api';
import { useAuthStore } from '@/lib/authStore';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Định dạng email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@noithat.com',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await authApi.login(data);
      const { access_token, user } = res.data;

      // Kiểm tra vai trò admin
      if (user.role !== 'admin') {
        setServerError('Tài khoản không có quyền quản trị.');
        try {
          await authApi.logout();
        } catch {
          // Bỏ qua
        }
        return;
      }

      // Lưu xác thực
      setAuth(access_token, user, access_token);
      showToast.success('Đăng nhập thành công', `Chào mừng ${user.full_name || 'Quản trị viên'}!`);

      // Chuyển hướng tới trang trước đó hoặc trang chủ
      const redirectUrl = searchParams.get('redirect') || '/';
      navigate(redirectUrl, { replace: true });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setServerError(msg);
      showToast.error('Đăng nhập thất bại', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 sm:p-10">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-amber-700 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Armchair className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Nội Thất Admin
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Đăng nhập vào bảng điều khiển quản lý cửa hàng
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Địa chỉ Email"
            type="email"
            placeholder="admin@noithat.com"
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu..."
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Đăng nhập hệ thống
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
          Cửa hàng Nội Thất • Tài khoản mặc định: <span className="font-mono text-stone-600">admin@noithat.com</span>
        </div>
      </div>
    </div>
  );
};
