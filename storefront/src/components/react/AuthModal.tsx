import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, LogIn, UserPlus, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  $isAuthModalOpen,
  $authModalTab,
  closeAuthModal,
  setAuth,
  openAuthModal,
} from '../../stores/authStore';
import { clientFetch } from '../../lib/api';
import { toast } from 'sonner';
import GoogleAuthButton from './GoogleAuthButton';

export default function AuthModal() {
  const isOpen = useStore($isAuthModalOpen);
  const currentTab = useStore($authModalTab);

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    setTab(currentTab);
  }, [currentTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      if (res.success && res.data) {
        const token = res.data.access_token || res.data.token;
        const user = res.data.user;
        if (token && user) {
          setAuth(token, user);
          closeAuthModal();
          setLoginPassword('');

          if (user.role === 'admin') {
            toast.success('Đăng nhập Quản trị viên thành công!', {
              description: 'Đang tự động chuyển hướng đến Bảng Điều Khiển Quản Trị...',
            });
            const userEncoded = encodeURIComponent(JSON.stringify(user));
            setTimeout(() => {
              window.location.href = `http://localhost:1234/?token=${encodeURIComponent(token)}&user=${userEncoded}`;
            }, 600);
          } else {
            toast.success(`Đăng nhập thành công! Chào mừng ${user.full_name || 'quý khách'}`);
          }
        } else {
          toast.error('Dữ liệu phản hồi không hợp lệ.');
        }
      } else {
        toast.error(res.message || 'Email hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: registerName.trim(),
          email: registerEmail.trim(),
          phone: registerPhone.trim() || undefined,
          password: registerPassword,
        }),
      });

      if (res.success && res.data) {
        const token = res.data.access_token || res.data.token;
        const user = res.data.user;
        if (token && user) {
          setAuth(token, user);
          closeAuthModal();
          toast.success(`Tạo tài khoản thành công! Chào mừng ${user.full_name}`);
          setRegisterPassword('');
        } else {
          toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
          setTab('login');
        }
      } else {
        toast.error(res.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      if (res.success) {
        toast.success('Mã OTP đã được gửi đến email của bạn!', {
          description: 'Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) để nhận mã 6 số.',
        });
        setForgotStep(2);
        setCountdown(60);
      } else {
        toast.error(res.message || 'Không tìm thấy tài khoản với email này.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !forgotNewPassword.trim()) {
      toast.error('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới!');
      return;
    }

    if (forgotNewPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          new_password: forgotNewPassword,
        }),
      });

      if (res.success) {
        toast.success('Đặt lại mật khẩu thành công!', {
          description: 'Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.',
        });
        setLoginEmail(forgotEmail.trim());
        setLoginPassword('');
        setForgotOtp('');
        setForgotNewPassword('');
        setTab('login');
      } else {
        toast.error(res.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-100 overflow-hidden transform transition-all animate-in zoom-in-95">
        {/* Nút đóng modal góc phải */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Header */}
        <div className="text-center space-y-1 mb-6">
          <span className="font-serif font-black text-xl tracking-wider text-brand-900 block">
            GÓC NHÀ ĐẸP
          </span>
          <p className="text-xs text-neutral-500">
            Nội thất sang trọng cho không gian sống hiện đại
          </p>
        </div>

        {/* Tab Switcher: Đăng nhập / Đăng ký hoặc Khôi phục mật khẩu */}
        {tab === 'forgot' ? (
          <div className="flex items-center justify-between p-2.5 bg-amber-50/80 rounded-xl mb-6 border border-amber-200/60">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setForgotStep(1);
              }}
              className="px-2.5 py-1 rounded-lg text-amber-900 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại đăng nhập</span>
            </button>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 pr-2">
              Khôi phục mật khẩu
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 p-1 bg-neutral-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              ĐĂNG NHẬP
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              ĐĂNG KÝ
            </button>
          </div>
        )}

        {/* FORM 1: ĐĂNG NHẬP */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 block">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 block">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setForgotStep(1);
                    if (loginEmail) setForgotEmail(loginEmail);
                  }}
                  className="text-[11px] text-brand-700 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút bấm Đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP NGAY'}
            </button>
            {/* Dải phân cách */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <GoogleAuthButton mode="login" />


            <div className="text-center pt-2">
              <p className="text-xs text-neutral-500">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="font-bold text-brand-700 hover:underline cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </form>
        )}

        {/* FORM 2: ĐĂNG KÝ */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Họ và tên */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 block">
                Họ và tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  autoFocus
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 block">
                Địa chỉ Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 block">
                Số điện thoại (tùy chọn)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="0931 883 988"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                />
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 block">
                Mật khẩu (Tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút bấm Tạo tài khoản */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isLoading ? 'Đang khởi tạo...' : 'TẠO TÀI KHOẢN'}
            </button>
            {/* Dải phân cách */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider">
                  Hoặc đăng ký nhanh với
                </span>
              </div>
            </div>

            <GoogleAuthButton mode="register" />


            <div className="text-center pt-2">
              <p className="text-xs text-neutral-500">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="font-bold text-brand-700 hover:underline cursor-pointer"
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </form>
        )}

        {/* FORM 3: QUÊN MẬT KHẨU / OTP RESET */}
        {tab === 'forgot' && (
          <div className="space-y-4 animate-in fade-in">
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-xs text-amber-900 leading-relaxed">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-800">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    <span>Lấy lại mật khẩu qua Email</span>
                  </div>
                  Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ tự động gửi một mã xác thực bảo mật <strong>OTP 6 số</strong> đến hộp thư của bạn.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Địa chỉ Email của bạn *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoFocus
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  {isLoading ? 'Đang gửi mã OTP...' : 'GỬI MÃ OTP QUA EMAIL'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Mã OTP đã được gửi thành công!</span>
                  </div>
                  Vui lòng kiểm tra hộp thư <strong>{forgotEmail}</strong> và nhập mã xác thực cùng mật khẩu mới của bạn:
                </div>

                {/* Mã OTP */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 block">
                      Mã xác thực OTP (6 chữ số) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[11px] text-neutral-500 hover:text-brand-700 underline cursor-pointer"
                    >
                      Đổi email khác
                    </button>
                  </div>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full h-12 text-center font-mono font-black text-xl tracking-[0.4em] rounded-xl border-2 border-amber-300 text-neutral-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 transition bg-amber-50/20"
                  />
                </div>

                {/* Mật khẩu mới */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Mật khẩu mới (Tối thiểu 6 ký tự) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition"
                    />
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nút Đổi mật khẩu */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isLoading ? 'Đang xác thực & đổi mật khẩu...' : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
                </button>

                {/* Gửi lại mã OTP */}
                <div className="text-center pt-1">
                  {countdown > 0 ? (
                    <span className="text-xs text-neutral-400">
                      Gửi lại mã OTP sau <strong className="text-amber-800 font-mono">{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleForgotPasswordSubmit}
                      className="text-xs font-bold text-brand-700 hover:underline cursor-pointer"
                    >
                      Chưa nhận được mã? Gửi lại OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="text-center pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setForgotStep(1);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại trang Đăng nhập</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
