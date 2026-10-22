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
  ShoppingBag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { clientFetch } from '../../lib/api';
import { setAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import GoogleAuthButton from './GoogleAuthButton';

export default function UnifiedLoginPage() {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trạng thái nếu khách hàng đã đăng nhập từ trước
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

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

  // Kiểm tra nếu người dùng đã đăng nhập thì tự động chuyển hướng về trang chủ
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('token');
      const rawUser = localStorage.getItem('user');

      if (token && rawUser) {
        const parsed = JSON.parse(rawUser);
        setIsAlreadyLoggedIn(true);
        setLoggedInUser(parsed);

        const params = new URLSearchParams(window.location.search);
        const redirectParam = params.get('redirect');
        const targetUrl =
          redirectParam &&
          !redirectParam.includes('/login') &&
          !redirectParam.includes('/dang-nhap')
            ? redirectParam
            : '/';

        const timer = setTimeout(() => {
          window.location.href = targetUrl;
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // Bỏ qua lỗi parse JSON nếu có
    }
  }, []);

  // Đếm ngược gửi lại OTP
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Đọc query params: ?tab=register hoặc ?tab=forgot
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

  // Lấy URL chuyển hướng an toàn (luôn ưu tiên về trang chủ nếu không có tham số redirect)
  const getTargetRedirectUrl = () => {
    if (typeof window === 'undefined') return '/';
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    if (
      redirectParam &&
      !redirectParam.includes('/login') &&
      !redirectParam.includes('/dang-nhap')
    ) {
      return redirectParam;
    }
    return '/';
  };

  // Nút hỗ trợ điền nhanh tài khoản Admin thử nghiệm
  const handleFillAdmin = () => {
    setTab('login');
    setLoginEmail('admin@noithat.com');
    setLoginPassword('Admin@123');
    setErrorMessage(null);
    toast.info('Đã điền thông tin tài khoản Quản trị viên mẫu.');
  };

  // Xử lý submit Đăng nhập thường (Email + Mật khẩu)
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
            description: 'Đang chuyển hướng đến Bảng Điều Khiển Quản Trị...',
          });

          const userEncoded = encodeURIComponent(JSON.stringify(user));
          setTimeout(() => {
            window.location.href = `http://localhost:1234/?token=${encodeURIComponent(token)}&user=${userEncoded}`;
          }, 400);
        } else {
          toast.success(`Chào mừng ${user.full_name || 'quý khách'}!`, {
            description: 'Đăng nhập tài khoản thành công.',
          });

          const targetUrl = getTargetRedirectUrl();
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 400);
        }
      } else {
        const msg = res.message || 'Email hoặc mật khẩu không chính xác.';
        setErrorMessage(msg);
        toast.error('Đăng nhập không thành công', { description: msg });
      }
    } catch (err: any) {
      const msg = err?.message || 'Không thể kết nối đến máy chủ API.';
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

          const targetUrl = getTargetRedirectUrl();
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 400);
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

  // Callback khi đăng nhập / đăng ký thành công bằng Google
  const handleGoogleAuthSuccess = () => {
    const targetUrl = getTargetRedirectUrl();
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 400);
  };

  // Giao diện khi người dùng ĐÃ ĐĂNG NHẬP SẴN
  if (isAlreadyLoggedIn) {
    return (
      <div className="min-h-[75vh] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-warm-200/90 p-8 sm:p-10 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-brand-700" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-warm-900 mb-2">
            Bạn đã đăng nhập!
          </h2>

          <p className="text-sm text-warm-600 mb-6 leading-relaxed">
            Xin chào <strong className="text-brand-800">{loggedInUser?.full_name || 'quý khách'}</strong>.
            Hệ thống đang tự động chuyển tiếp bạn về trang chủ...
          </p>

          <div className="flex items-center justify-center gap-2 mb-8 text-xs text-warm-500 font-medium">
            <span className="w-4 h-4 border-2 border-brand-700/30 border-t-brand-700 rounded-full animate-spin" />
            <span>Đang chuyển hướng...</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/"
              className="flex-1 py-3 px-4 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Về trang chủ</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/products"
              className="py-3 px-4 bg-warm-100 hover:bg-warm-200 text-warm-800 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Xem sản phẩm</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-b from-warm-50 via-warm-100/50 to-warm-100">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-warm-200/80 overflow-hidden">
        {/* Banner Top Header mang phong cách thương hiệu Góc Nhà Đẹp */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white p-7 sm:p-9 text-center relative overflow-hidden">
          {/* Vầng sáng trang trí mềm mại */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo badge 'G' đồng bộ 100% với Header trang web */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-serif font-black text-2xl mb-3 shadow-inner">
            G
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
            GÓC NHÀ ĐẸP
          </h1>
          <p className="text-brand-100/90 text-xs sm:text-sm mt-1 font-medium tracking-wide">
            Nội Thất Sang Trọng &amp; Không Gian Sống Tinh Tế
          </p>
        </div>

        {/* Tab Switcher: Đăng nhập / Đăng ký mới hoặc Quên mật khẩu */}
        {tab === 'forgot' ? (
          <div className="flex items-center justify-between border-b border-warm-200 bg-warm-50/80 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setForgotStep(1);
              }}
              className="px-3 py-1.5 rounded-xl text-warm-700 hover:text-brand-800 hover:bg-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-700" />
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
                  ? 'bg-white text-brand-900 shadow-xs border border-warm-200/80 font-bold'
                  : 'text-warm-600 hover:text-brand-900 hover:bg-white/50'
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
                  ? 'bg-white text-brand-900 shadow-xs border border-warm-200/80 font-bold'
                  : 'text-warm-600 hover:text-brand-900 hover:bg-white/50'
              }`}
            >
              <UserPlus className="w-4 h-4 text-brand-700" />
              <span>Đăng ký mới</span>
            </button>
          </div>
        )}

        {/* Thân Form */}
        <div className="p-6 sm:p-8">
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-xs sm:text-sm text-rose-700 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
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
                    placeholder="email@cuaban.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
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
                    className="text-xs font-medium text-brand-700 hover:text-brand-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-brand-700" />
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
                    className="w-full pl-10 pr-10 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
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

              {/* Nút Đăng nhập chính - cùng tone màu Emerald Brand với Website */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xác thực thông tin...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Dải phân cách tinh tế */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-warm-400 font-semibold text-[11px] tracking-wider">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              {/* Nút Đăng nhập bằng Google */}
              <GoogleAuthButton mode="login" onSuccess={handleGoogleAuthSuccess} />

              {/* Ghi chú kín đáo dành cho Quản trị viên thử nghiệm */}
              <div className="mt-5 pt-3 text-center border-t border-warm-100">
                <button
                  type="button"
                  onClick={handleFillAdmin}
                  className="text-[11px] text-warm-400 hover:text-brand-800 transition cursor-pointer"
                >
                  Dành cho Quản trị viên: Điền tài khoản thử nghiệm
                </button>
              </div>
            </form>
          )}

          {tab === 'register' && (
            /* TAB 2: FORM ĐĂNG KÝ KHÁCH HÀNG MỚI */
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
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
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
                      className="w-full pl-10 pr-8 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Nút Tạo tài khoản - đồng bộ màu Emerald Brand với Website */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-3 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

              {/* Dải phân cách */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-warm-400 font-semibold text-[11px] tracking-wider">
                    Hoặc đăng ký nhanh với
                  </span>
                </div>
              </div>

              {/* Nút Đăng ký bằng Google */}
              <GoogleAuthButton mode="register" onSuccess={handleGoogleAuthSuccess} />
            </form>
          )}

          {/* TAB 3: FORM QUÊN MẬT KHẨU / OTP RESET */}
          {tab === 'forgot' && (
            <div className="space-y-4 animate-in fade-in">
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="p-4 bg-brand-50/70 border border-brand-200/80 rounded-2xl text-xs sm:text-sm text-brand-950 leading-relaxed">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-brand-900">
                      <KeyRound className="w-4 h-4 text-brand-700" />
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
                        placeholder="email@cuaban.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                  <div className="p-4 bg-brand-50/80 border border-brand-200 rounded-2xl text-xs sm:text-sm text-brand-950 leading-relaxed">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-brand-900">
                      <ShieldCheck className="w-4 h-4 text-brand-700" />
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
                        className="text-[11px] text-warm-500 hover:text-brand-800 underline cursor-pointer"
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
                      className="w-full h-12 text-center font-mono font-black text-xl tracking-[0.4em] bg-warm-50 border-2 border-warm-300 rounded-xl focus:outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-200 transition"
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
                        className="w-full pl-10 pr-10 py-2.5 bg-warm-50/50 border border-warm-300 rounded-xl text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 focus:bg-white transition"
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
                    className="w-full h-12 mt-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                        Gửi lại mã OTP sau <strong className="text-brand-800 font-mono">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleForgotPasswordSubmit}
                        className="text-xs font-semibold text-brand-800 hover:underline cursor-pointer"
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
                  className="text-xs font-medium text-warm-600 hover:text-brand-900 cursor-pointer inline-flex items-center gap-1.5"
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
              className="hover:text-brand-800 transition flex items-center gap-1 font-medium"
            >
              <span>← Về trang chủ</span>
            </a>
            <a
              href="/products"
              className="hover:text-brand-800 transition flex items-center gap-1 font-medium"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-700" />
              <span>Xem sản phẩm</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
