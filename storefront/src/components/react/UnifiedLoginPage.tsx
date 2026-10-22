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
  Award,
  Truck,
  Heart,
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

  // Tự động kiểm tra nếu người dùng đã đăng nhập sẵn
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
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Bỏ qua nếu dữ liệu không đúng format
    }
  }, []);

  // Đếm ngược OTP gửi lại
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

  // Lấy đường dẫn đích sau khi đăng nhập (luôn mặc định về trang chủ '/')
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

  // Điền nhanh thông tin tài khoản mẫu cho việc kiểm thử
  const handleFillAdmin = () => {
    setTab('login');
    setLoginEmail('admin@noithat.com');
    setLoginPassword('Admin@123');
    setErrorMessage(null);
    toast.info('Đã điền thông tin tài khoản quản trị mẫu.');
  };

  // Xử lý đăng nhập email & password
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
          throw new Error('Dữ liệu phản hồi từ máy chủ không hợp lệ.');
        }

        setAuth(token, user);

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

  // Xử lý đăng ký tài khoản khách hàng mới
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

  // Gửi OTP quên mật khẩu
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = forgotEmail.trim();
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
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

  // Xác nhận OTP và đặt lại mật khẩu mới
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
        const msg = res.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
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

  // Callback sau khi đăng nhập Google thành công
  const handleGoogleAuthSuccess = () => {
    const targetUrl = getTargetRedirectUrl();
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 400);
  };

  // MÀN HÌNH KHI NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP SẴN
  if (isAlreadyLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white rounded-3xl shadow-xl border border-warm-200/90 p-8 sm:p-10 text-center animate-fadeIn">
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
          <span>Đang chuyển hướng về trang chủ...</span>
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
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto my-6 sm:my-10 bg-white rounded-3xl shadow-elevated border border-warm-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
      {/* CỘT TRÁI: SHOWROOM LIFESTYLE & ĐẶC QUYỀN THÀNH VIÊN (Hiện trên Desktop & Tablet lớn) */}
      <div className="lg:col-span-5 relative bg-brand-950 text-white p-8 sm:p-10 hidden md:flex flex-col justify-between overflow-hidden">
        {/* Ảnh nền không gian nội thất đẳng cấp */}
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=85"
          alt="Góc Nhà Đẹp - Không gian sống tinh tế"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />

        {/* Lớp phủ chuyển màu Emerald / Warm sang trọng */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/80 to-brand-900/60" />

        {/* Header Thương hiệu Cột trái */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-700 text-white flex items-center justify-center font-serif font-black text-xl shadow-xs">
            G
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-white">
              GÓC NHÀ ĐẸP
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-200 font-medium">
              Nội Thất Sang Trọng & Tinh Tế
            </span>
          </div>
        </div>

        {/* Nội dung trung tâm: Câu chuyện & Đặc quyền người dùng */}
        <div className="relative z-10 my-auto py-8 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-brand-200 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Không Gian Sống Tinh Tế</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-snug">
              Mỗi không gian,
              <span className="block text-brand-200 font-normal italic">
                một câu chuyện riêng
              </span>
            </h2>

            <p className="text-warm-200 text-xs sm:text-sm leading-relaxed">
              Trở thành thành viên của Góc Nhà Đẹp để tận hưởng trọn vẹn đặc quyền mua sắm nội thất cao cấp và chăm sóc không gian sống.
            </p>
          </div>

          {/* 3 Lợi ích thành viên */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/10 mt-0.5">
                <Award className="w-4 h-4 text-brand-300" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-white text-sm">Ưu đãi thành viên độc quyền</span>
                <span className="text-warm-300 text-[11px] leading-relaxed block">Tích lũy điểm mua hàng và nhận voucher ưu đãi cho các bộ sưu tập mới.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/10 mt-0.5">
                <Truck className="w-4 h-4 text-brand-300" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-white text-sm">Theo dõi tiến độ đơn hàng</span>
                <span className="text-warm-300 text-[11px] leading-relaxed block">Cập nhật chi tiết quy trình gia công, vận chuyển và lắp đặt tại nhà 24/7.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/10 mt-0.5">
                <Heart className="w-4 h-4 text-brand-300" />
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-white text-sm">Bộ sưu tập yêu thích</span>
                <span className="text-warm-300 text-[11px] leading-relaxed block">Lưu trữ các mẫu sofa, bàn ăn, giường ngủ yêu thích trên mọi thiết bị.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chân cột trái */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-brand-200/80">
          <span>Hotline hỗ trợ: <strong>0931.883.988</strong></span>
          <span>8:00 - 21:00</span>
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ (Giao diện tinh gọn, thanh lịch) */}
      <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
        {/* Header trên Mobile (Ẩn trên Desktop) */}
        <div className="md:hidden flex items-center gap-3 mb-6 pb-4 border-b border-warm-100">
          <div className="w-10 h-10 rounded-xl bg-brand-700 text-white flex items-center justify-center font-serif font-black text-xl shadow-xs">
            G
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg tracking-tight text-brand-900">
              GÓC NHÀ ĐẸP
            </span>
            <span className="text-[10px] uppercase tracking-widest text-warm-500 font-medium">
              Nội Thất Sang Trọng & Tinh Tế
            </span>
          </div>
        </div>

        {/* Tab Switcher: Đăng nhập / Đăng ký */}
        {tab === 'forgot' ? (
          <div className="flex items-center justify-between border-b border-warm-200 pb-4 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setForgotStep(1);
              }}
              className="px-3 py-1.5 rounded-xl text-warm-700 hover:text-brand-800 hover:bg-warm-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Đăng nhập</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-700" />
              <span>Khôi phục mật khẩu</span>
            </span>
          </div>
        ) : (
          <div className="flex p-1 bg-warm-100 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-brand-900 shadow-sm font-bold'
                  : 'text-warm-600 hover:text-warm-900'
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
              className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-brand-900 shadow-sm font-bold'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-brand-700" />
              <span>Đăng ký mới</span>
            </button>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-xs sm:text-sm text-rose-700 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* TAB 1: FORM ĐĂNG NHẬP */}
        {tab === 'login' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-warm-900 tracking-tight">
                Đăng nhập tài khoản
              </h1>
              <p className="text-xs sm:text-sm text-warm-500 mt-1.5">
                Chào mừng bạn quay lại với không gian sống đẳng cấp
              </p>
            </div>

            {/* Nút Đăng nhập bằng Google (đặt ở vị trí ưu tiên cao) */}
            <GoogleAuthButton mode="login" onSuccess={handleGoogleAuthSuccess} />

            {/* Dải phân cách nhẹ nhàng */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-warm-400 font-semibold text-[11px] tracking-wider">
                  Hoặc bằng địa chỉ Email
                </span>
              </div>
            </div>

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
                    placeholder="vidu@email.com"
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

              {/* Nút Đăng nhập tone Emerald sang trọng */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Chuyển sang Đăng ký */}
              <div className="text-center pt-3 text-xs text-warm-600">
                <span>Bạn chưa có tài khoản thành viên? </span>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-brand-700 hover:text-brand-900 hover:underline cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </div>

              {/* Nút kín đáo cho kiểm thử */}
              <div className="pt-4 text-center border-t border-warm-100">
                <button
                  type="button"
                  onClick={handleFillAdmin}
                  className="text-[11px] text-warm-400 hover:text-brand-800 transition cursor-pointer"
                >
                  Dành cho quản trị: Điền tài khoản thử nghiệm
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: FORM ĐĂNG KÝ THÀNH VIÊN MỚI */}
        {tab === 'register' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-warm-900 tracking-tight">
                Tạo tài khoản mới
              </h1>
              <p className="text-xs sm:text-sm text-warm-500 mt-1.5">
                Gia nhập Góc Nhà Đẹp để nhận ưu đãi và trải nghiệm mua sắm tốt nhất
              </p>
            </div>

            {/* Nút Đăng ký nhanh bằng Google */}
            <GoogleAuthButton mode="register" onSuccess={handleGoogleAuthSuccess} />

            {/* Dải phân cách */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-warm-400 font-semibold text-[11px] tracking-wider">
                  Hoặc điền thông tin bên dưới
                </span>
              </div>
            </div>

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

              {/* Nút Tạo tài khoản thành viên */}
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

              <div className="text-center pt-2 text-xs text-warm-600">
                <span>Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-brand-700 hover:text-brand-900 hover:underline cursor-pointer"
                >
                  Đăng nhập tại đây
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: KHÔI PHỤC MẬT KHẨU */}
        {tab === 'forgot' && (
          <div className="space-y-4 animate-in fade-in">
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="p-4 bg-brand-50/70 border border-brand-200/80 rounded-2xl text-xs sm:text-sm text-brand-950 leading-relaxed">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-brand-900">
                    <KeyRound className="w-4 h-4 text-brand-700" />
                    <span>Khôi phục mật khẩu tài khoản</span>
                  </div>
                  Vui lòng nhập địa chỉ email đã đăng ký của bạn. Hệ thống sẽ gửi mã xác thực bảo mật <strong>OTP 6 số</strong> đến email của bạn.
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
                      <span>Đang gửi mã OTP đến email...</span>
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
                    <CheckCircle2 className="w-4 h-4 text-brand-700" />
                    <span>Đã gửi mã OTP thành công!</span>
                  </div>
                  Vui lòng kiểm tra hộp thư đến của <strong>{forgotEmail}</strong> và nhập mã OTP cùng mật khẩu mới của bạn:
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
                      <CheckCircle2 className="w-4 h-4" />
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

        {/* Footer liên kết nhanh trang chủ */}
        <div className="mt-8 pt-5 border-t border-warm-200 flex items-center justify-between text-xs text-warm-500">
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
            <span>Xem tất cả sản phẩm</span>
          </a>
        </div>
      </div>
    </div>
  );
}
