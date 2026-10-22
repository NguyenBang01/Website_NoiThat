import React, { useEffect, useRef, useState } from 'react';
import { setAuth, closeAuthModal } from '../../stores/authStore';
import { clientFetch } from '../../lib/api';
import { toast } from 'sonner';

interface GoogleAuthButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: () => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
    __GOOGLE_CLIENT_ID__?: string;
  }
}

export default function GoogleAuthButton({
  mode = 'login',
  onSuccess,
  className = '',
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy Google Client ID từ biến môi trường hoặc window (trim sạch khoảng trắng thừa)
  const rawClientId =
    import.meta.env.PUBLIC_GOOGLE_CLIENT_ID ||
    (typeof window !== 'undefined' ? window.__GOOGLE_CLIENT_ID__ : '') ||
    '169312903386-cslsqt049mv7gbkjb11kaq7kbj3agb0r.apps.googleusercontent.com';
  const googleClientId = typeof rawClientId === 'string' ? rawClientId.trim() : '';

  // Xử lý khi nhận được Credential (ID Token) từ Google
  const handleCredentialResponse = async (response: any) => {
    const idToken = response?.credential;
    if (!idToken) {
      toast.error('Không nhận được mã xác thực từ Google');
      return;
    }

    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ id_token: idToken }),
      });

      if (res.success && res.data) {
        const token = res.data.access_token;
        const user = res.data.user;

        if (token && user) {
          setAuth(token, user);
          closeAuthModal();

          if (user.role === 'admin') {
            toast.success('Đăng nhập Quản trị viên thành công!', {
              description: 'Đang chuyển hướng đến Bảng Điều Khiển Quản Trị...',
            });
            const userEncoded = encodeURIComponent(JSON.stringify(user));
            setTimeout(() => {
              window.location.href = `http://localhost:1234/?token=${encodeURIComponent(token)}&user=${userEncoded}`;
            }, 500);
          } else {
            toast.success(
              mode === 'register'
                ? `Chào mừng ${user.full_name || 'quý khách'} gia nhập Góc Nhà Đẹp!`
                : `Đăng nhập thành công! Chào mừng ${user.full_name || 'quý khách'}`
            );

            // Luôn tự động chuyển hướng về trang chủ hoặc trang đích (không bao giờ ở lại trang login)
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect');
            const isLoginPage =
              typeof window !== 'undefined' &&
              (window.location.pathname.includes('/login') ||
               window.location.pathname.includes('/dang-nhap'));

            const targetUrl = redirectUrl && !redirectUrl.includes('/login') && !redirectUrl.includes('/dang-nhap')
              ? redirectUrl
              : (isLoginPage ? '/' : window.location.pathname);

            setTimeout(() => {
              window.location.href = targetUrl;
            }, 400);
          }

          if (onSuccess) onSuccess();
        } else {
          toast.error('Dữ liệu xác thực không hợp lệ.');
        }
      } else {
        toast.error(res.message || 'Xác thực tài khoản Google thất bại.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động nạp Google Identity Services SDK và render button ngầm
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Tự động chèn script Google GIS nếu trang chưa có
    if (!window.google?.accounts?.id && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let checkInterval: any = null;
    let attempts = 0;

    const tryInitAndRender = () => {
      attempts++;
      if (window.google?.accounts?.id && googleClientId && containerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          containerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(containerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: mode === 'register' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 400,
            locale: 'vi',
          });

          if (checkInterval) clearInterval(checkInterval);
          return true;
        } catch (e) {
          console.warn('Lỗi cấu hình Google Sign-In:', e);
        }
      }
      return false;
    };

    if (!tryInitAndRender()) {
      checkInterval = setInterval(() => {
        if (tryInitAndRender() || attempts > 20) {
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 400);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, mode]);

  // Click vào nút khi Google iframe chưa sẵn sàng
  const handleCustomButtonClick = () => {
    if (!googleClientId) {
      toast.info('Chưa cấu hình Google Client ID', {
        description: 'Vui lòng kiểm tra GOOGLE_CLIENT_ID trong file .env để kích hoạt.',
      });
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className={`w-full relative group ${className}`}>
      {/* 1. Giao diện Nút Custom: Sang trọng, đồng bộ 100% với tone màu thương hiệu Góc Nhà Đẹp */}
      <button
        type="button"
        disabled={isLoading}
        onClick={handleCustomButtonClick}
        className="w-full h-12 px-5 bg-white hover:bg-warm-50 active:bg-warm-100 text-warm-900 font-semibold text-sm rounded-xl border border-warm-200/90 hover:border-brand-600/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3.5 cursor-pointer relative overflow-hidden"
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-warm-300 border-t-brand-700 rounded-full animate-spin" />
        ) : (
          /* Biểu tượng Google 4 màu sắc nét */
          <div className="w-5 h-5 shrink-0 flex items-center justify-center drop-shadow-xs transition-transform duration-200 group-hover:scale-110">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
        )}

        {/* Chữ hiển thị bắt mắt, căn giữa hoàn hảo */}
        <span className="font-semibold text-warm-900 text-sm tracking-wide">
          {mode === 'register' ? 'Đăng ký nhanh bằng Google' : 'Đăng nhập với Google'}
        </span>
      </button>

      {/* 2. Lớp phủ Iframe Google GIS trong suốt: Phủ toàn bộ bề mặt nút để bắt click chuẩn 100% */}
      <div
        className="absolute inset-0 opacity-[0.001] overflow-hidden cursor-pointer flex items-center justify-center rounded-xl z-10 pointer-events-auto"
        title={mode === 'register' ? 'Đăng ký nhanh bằng Google' : 'Đăng nhập với Google'}
      >
        <div ref={containerRef} className="w-[500px] h-[60px] scale-[1.3] cursor-pointer" />
      </div>
    </div>
  );
}
