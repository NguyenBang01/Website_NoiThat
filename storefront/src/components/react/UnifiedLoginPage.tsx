import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { clientFetch } from '../../lib/api';
import { setAuth } from '../../stores/authStore';
import { toast } from 'sonner';

export default function UnifiedLoginPage() {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Đăng nhập
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form Đăng ký
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Form Quên mật khẩu
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Đọc query params: ?tab=register hoặc ?tab=forgot hoặc ?redirect=...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qTab = params.get('tab');
    if (qTab === 'register') {
      setTab('register');
    } else if (qTab === 'forgot') {
      setTab('forgot');
    }
  }, []);

  // Nút điền nhanh tài khoản Admin để tiện kiểm thử
  const handleFillAdmin = () => {
    setTab('login');
    setLoginEmail('admin@noithat.com');
    setLoginPassword('Admin@123');
    setErrorMessage(null);
    toast.info('Đã điền thông tin tài khoản Quản trị viên mẫu.');
  };

  // Xử lý submit Đăng nhập
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ địa chỉ Email và Mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await clientFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        const token = res.data.access_token || res.data.token;
        const user = res.data.user;

        if (!token || !user) {
          throw new Error('Dữ liệu xác thực không hợp lệ từ máy chủ.');
        }

        // Lưu thông tin xác thực vào Storefront
        setAuth(token, user);

        // Phân quyền theo vai trò (Role):
        if (user.role === 'admin') {
          toast.success('Đăng nhập Quản trị viên thành công!', {
            description: 'Đang tự động chuyển hướng đến Bảng Điều Khiển Quản Trị...',
          });

          // Tự động chuyển hướng sang Admin Dashboard (cổng 5173) kèm token và user an toàn
          const userEncoded = encodeURIComponent(JSON.stringify(user));
          setTimeout(() => {
            window.location.href = `http://localhost:5173/?token=${encodeURIComponent(token)}&user=${userEncoded}`;
          }, 600);
        } else {
          toast.success(`Chào mừng ${user.full_name || 'quý khách'}!`, {
            description: 'Đăng nhập tài khoản khách hàng thành công.',
          });

          // Lấy đường dẫn chuyển hướng nếu có
          const params = new URLSearchParams(window.location.search);
          const redirectUrl = params.get('redirect') || '/';

          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 700);
        }
      } else {
        const msg = res.message || 'Email hoặc mật khẩu không chính xác.';
        setErrorMessage(msg);
        toast.error('Đăng nhập không thành công', { description: msg });
      }
    } catch (err: any) {
      const msg = err?.message || 'Không thể kết nối đến máy chủ API (Port 8080).';
      setErrorMessage(msg);
      toast.error('Lỗi kết nối', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý submit Đăng ký (dành cho Khách hàng mới)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullName = registerName.trim();
    const email = registerEmail.trim();
    const phone = registerPhone.trim();
    const password = registerPassword;

    if (!fullName || !email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ các mục thông tin bắt buộc (*).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu bảo mật phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== registerConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await clientFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || undefined,
          password,
        }),
      });

      if (res.success && res.data) {
        const token = res.data.access_token || res.data.token;
        const user = res.data.user;

        if (token && user) {
          setAuth(token, user);
          toast.success('Đăng ký tài khoản thành công!', {
            description: `Chào mừng bạn đến với Góc Nhà Đẹp, ${user.full_name}!`,
          });

          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        } else {
          toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
          setTab('login');
          setLoginEmail(email);
          setLoginPassword('');
        }
      } else {
        const msg = res.message || 'Đăng ký không thành công. Email này có thể đã được sử dụng.';
        setErrorMessage(msg);
        toast.error('Lỗi đăng ký', { description: msg });
      }
    } catch (err: any) {
      const msg = err?.message || 'Lỗi khi gửi yêu cầu đăng ký lên máy chủ.';
      setErrorMessage(msg);
      toast.error('Lỗi kết nối', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý gửi OTP khôi phục mật khẩu qua Email
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = forgotEmail.trim();
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email tài khoản của bạn.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        toast.success('Mã OTP 6 số đã được gửi qua Email!', {
          description: `Vui lòng kiểm tra hộp thư đến của ${email}.`,
        });
        setForgotStep(2);
        setCountdown(60);
      } else {
        const msg = res.message || 'Không tìm thấy tài khoản với email này.';
        setErrorMessage(msg);
        toast.error('Gửi OTP thất bại', { description: msg });
      }
    } catch (err: any) {
      const msg = err?.message || 'Không thể kết nối đến máy chủ API.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý xác nhận OTP và đặt lại mật khẩu mới
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = forgotEmail.trim();
    const otp = forgotOtp.trim();
    const newPassword = forgotNewPassword;

    if (!otp || !newPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ mã OTP 6 số và mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword,
        }),
      });

      if (res.success) {
        toast.success('Đặt lại mật khẩu thành công!', {
          description: 'Bây giờ bạn có thể đăng nhập bằng mật khẩu mới vừa đổi.',
        });
        setLoginEmail(email);
        setLoginPassword('');
        setForgotOtp('');
        setForgotNewPassword('');
        setTab('login');
      } else {
        const msg = res.message || 'Mã OTP không hợp lệ hoặc đã hết hạn (10 phút).';
        setErrorMessage(msg);
        toast.error('Đặt lại mật khẩu thất bại', { description: msg });
      }
    } catch (err: any) {
      const msg = err?.message || 'Không thể kết nối đến máy chủ API.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-b from-warm-50 via-amber-50/20 to-warm-100">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-warm-200/80 overflow-hidden">
        {/* Banner Top Header */}
        <div className="bg-gradient-to-r from-warm-900 via-brand-950 to-warm-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-brand-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl" />

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            GÓC NHÀ ĐẸP
          </h1>
          <p className="text-warm-300 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            Cổng đăng nhập hệ thống nội thất cao cấp
          </p>

          {/* Role badge indicator */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full text-[11px] text-warm-200">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hệ thống tự nhận diện: <strong>Khách hàng</strong> &amp; <strong>Quản trị / Người bán</strong></span>
          </div>
        </div>

        {/* Tab Switcher: Đăng nhập / Đăng ký hoặc Khôi phục mật khẩu */}
        {tab === 'forgot' ? (
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50/80 p-2.5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setForgotStep(1);
              }}
              className="px-3 py-1.5 rounded-xl text-amber-900 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Đăng nhập</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 pr-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>Khôi phục mật khẩu</span>
            </span>
          </div>
        ) : (
          <div className="flex border-b border-warm-200 bg-warm-50/70 p-1.5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-warm-900 shadow-sm border border-warm-200/60'
                  : 'text-warm-600 hover:text-warm-900 hover:bg-white/50'
              }`}
            >
              <LogIn className="w-4 h-4 text-brand-700" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-warm-900 shadow-sm border border-warm-200/60'
                  : 'text-warm-600 hover:text-warm-900 hover:bg-white/50'
              }`}
            >
              <UserPlus className="w-4 h-4 text-amber-700" />
              <span>Đăng ký mới</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-xs sm:text-sm text-rose-700 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {tab === 'login' && (
            /* TAB 1: FORM ĐĂNG NHẬP */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-warm-800 mb-1.5">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="vidu@noithat.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-warm-800">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setForgotStep(1);
                      if (loginEmail) setForgotEmail(loginEmail);
                      setErrorMessage(null);
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quên mật khẩu?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-warm-400 hover:text-warm-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nút đăng nhập */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xác thực thông tin...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Hướng dẫn tự động chuyển quyền */}
              <div className="rounded-2xl bg-warm-50 border border-warm-200/80 p-4 mt-6 text-xs text-warm-700 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-warm-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Cơ chế nhận diện tài khoản:</span>
                </div>
                <ul className="space-y-1 text-warm-600 pl-6 list-disc text-[11px] sm:text-xs">
                  <li>
                    <strong>Tài khoản Quản trị / Người bán:</strong> Tự động chuyển thẳng tới Bảng điều khiển quản trị (Admin Dashboard).
                  </li>
                  <li>
                    <strong>Tài khoản Khách hàng:</strong> Đăng nhập mua sắm, quản lý giỏ hàng và theo dõi đơn hàng.
                  </li>
                </ul>

                {/* Nút thử nghiệm nhanh Admin */}
                <div className="pt-2 border-t border-warm-200 flex items-center justify-between">
                  <span className="text-[11px] text-warm-500 font-mono">admin@noithat.com / Admin@123</span>
                  <button
                    type="button"
                    onClick={handleFillAdmin}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 underline hover:no-underline cursor-pointer"
                  >
                    Điền nhanh Admin
                  </button>
                </div>
              </div>
            </form>
          )}

          {tab === 'register' && (
            /* TAB 2: FORM ĐĂNG KÝ KHÁCH HÀNG */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-warm-800 mb-1">
                  Họ và tên của bạn <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-800 mb-1">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="email@cuaban.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-800 mb-1">
                  Số điện thoại <span className="text-warm-400 font-normal">(không bắt buộc)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-warm-800 mb-1">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-8 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-2.5 top-3 text-warm-400 hover:text-warm-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-800 mb-1">
                    Nhập lại mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo tài khoản thành viên</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORM QUÊN MẬT KHẨU / OTP RESET */}
          {tab === 'forgot' && (
            <div className="space-y-4 animate-in fade-in">
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs sm:text-sm text-amber-950 leading-relaxed">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-900">
                      <KeyRound className="w-4 h-4 text-amber-700" />
                      <span>Khôi phục mật khẩu tài khoản</span>
                    </div>
                    Vui lòng nhập địa chỉ email đã đăng ký của bạn. Hệ thống sẽ tự động gửi mã xác thực bảo mật <strong>OTP 6 số</strong> đến hòm thư Gmail của bạn.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-warm-800 mb-1.5">
                      Địa chỉ Email tài khoản <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="vidu@noithat.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang gửi mã OTP đến Gmail...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>GỬI MÃ OTP QUA EMAIL</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Đã gửi mã OTP thành công!</span>
                    </div>
                    Vui lòng kiểm tra hộp thư đến của <strong>{forgotEmail}</strong> và nhập mã xác thực cùng mật khẩu mới của bạn bên dưới:
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-warm-800">
                        Mã xác thực OTP (6 số) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="text-[11px] text-warm-500 hover:text-amber-800 underline cursor-pointer"
                      >
                        Đổi email khác
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="w-full h-12 text-center font-mono font-black text-xl tracking-[0.4em] bg-amber-50/30 border-2 border-amber-300 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-warm-800 mb-1.5">
                      Mật khẩu mới (Tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-warm-400" />
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-warm-50/60 border border-warm-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3 top-3 text-warm-400 hover:text-warm-700 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang xác thực &amp; đổi mật khẩu...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>XÁC NHẬN ĐỔI MẬT KHẨU</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    {countdown > 0 ? (
                      <span className="text-xs text-warm-500">
                        Gửi lại mã OTP sau <strong className="text-amber-800 font-mono">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleForgotPasswordSubmit}
                        className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                      >
                        Chưa nhận được mã? Gửi lại OTP
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="text-center pt-3 border-t border-warm-100">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setForgotStep(1);
                    setErrorMessage(null);
                  }}
                  className="text-xs font-medium text-warm-600 hover:text-warm-900 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại trang Đăng nhập</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer liên kết nhanh */}
          <div className="mt-6 pt-5 border-t border-warm-200 flex items-center justify-between text-xs text-warm-500">
            <a
              href="/"
              className="hover:text-warm-900 transition flex items-center gap-1 font-medium"
            >
              <span>← Về trang chủ</span>
            </a>
            <a
              href="/products"
              className="hover:text-brand-800 transition flex items-center gap-1 font-medium"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Xem sản phẩm</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
