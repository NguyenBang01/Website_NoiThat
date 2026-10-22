import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
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

  // Tự động chuyển vào Dashboard nếu đã có phiên hoặc có token truyền sang từ Storefront
  useEffect(() => {
    // 1. Nếu đã xác thực admin
    const currentState = useAuthStore.getState();
    if (currentState.isAuthenticated && currentState.user?.role === 'admin') {
      navigate('/', { replace: true });
      return;
    }

    // 2. Tìm token và user trong URL params hoặc trong redirect param
    let token = searchParams.get('token');
    let userStr = searchParams.get('user');

    const redirectVal = searchParams.get('redirect');
    if (!token && redirectVal) {
      try {
        const decoded = decodeURIComponent(redirectVal);
        const tMatch = decoded.match(/[?&]token=([^&]+)/);
        if (tMatch) token = decodeURIComponent(tMatch[1]);
        const uMatch = decoded.match(/[?&]user=([^&]+)/);
        if (uMatch) userStr = decodeURIComponent(uMatch[1]);
      } catch {}
    }

    if (token) {
      if (userStr) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userStr));
          if (parsedUser && parsedUser.role === 'admin') {
            setAuth(token, parsedUser, token);
            navigate('/', { replace: true });
            return;
          }
        } catch {}
      }

      // Nếu chỉ có token, gọi getMe để lấy thông tin admin
      setIsLoading(true);
      useAuthStore.getState().setAccessToken(token);
      authApi.getMe().then((meRes) => {
        if (meRes.data && meRes.data.role === 'admin') {
          setAuth(token, meRes.data, token);
          navigate('/', { replace: true });
        }
      }).catch(() => {}).finally(() => {
        setIsLoading(false);
      });
    }
  }, [searchParams, navigate, setAuth]);

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
        setServerError('Tài khoản này là tài khoản Khách hàng, vui lòng đăng nhập tại Website Cửa Hàng.');
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-warm-50 to-emerald-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200/90 p-8 sm:p-10 relative overflow-hidden">
        {/* Vầng sáng trang trí */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-700/5 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-emerald-700 text-white rounded-2xl flex items-center justify-center font-serif font-black text-2xl shadow-xs mb-3.5">
            G
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            GÓC NHÀ ĐẸP
          </h1>
          <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider mt-0.5">
            Quản Trị Cửa Hàng Nội Thất
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Khu vực bảo mật dành cho Quản trị viên</span>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          <Input
            label="Địa chỉ Email Quản trị"
            type="email"
            placeholder="admin@noithat.com"
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4 text-stone-400" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-stone-800">Mật khẩu</span>
              <a
                href="http://localhost:4321/login?tab=forgot"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4 text-stone-400" />}
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
            className="w-full h-12 mt-2 rounded-xl"
            isLoading={isLoading}
          >
            <span>Đăng nhập hệ thống</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-8 pt-5 border-t border-stone-100 flex flex-col gap-3 text-center text-xs text-stone-500 relative z-10">
          <div>
            Tài khoản mẫu: <span className="font-mono font-semibold text-stone-800">admin@noithat.com / Admin@123</span>
          </div>
          <div className="pt-2 border-t border-dashed border-stone-200">
            <a
              href="http://localhost:4321"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 transition py-2 px-4 rounded-xl hover:bg-emerald-50 border border-emerald-200/70"
            >
              <span>Về Website Bán Hàng (Storefront)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
