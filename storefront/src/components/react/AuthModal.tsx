import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import {
  $isAuthModalOpen,
  $authModalTab,
  closeAuthModal,
  setAuth,
  openAuthModal,
} from '../../stores/authStore';
import { clientFetch } from '../../lib/api';
import { toast } from 'sonner';

export default function AuthModal() {
  const isOpen = useStore($isAuthModalOpen);
  const currentTab = useStore($authModalTab);

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

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
          toast.success(`Đăng nhập thành công! Chào mừng ${user.full_name || 'quý khách'}`);
          setLoginPassword('');
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

        {/* Tab Switcher: Đăng nhập / Đăng ký */}
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
                  onClick={() => toast.info('Vui lòng liên hệ hotline 0931.883.988 để được hỗ trợ cấp lại mật khẩu.')}
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
      </div>
    </div>
  );
}
