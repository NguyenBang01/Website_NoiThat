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
  const [isLoading, setIsLoading] = useState(false);

  // Lấy Google Client ID từ biến môi trường hoặc fallback
  const rawClientId =
    import.meta.env.PUBLIC_GOOGLE_CLIENT_ID ||
    (typeof window !== 'undefined' ? window.__GOOGLE_CLIENT_ID__ : '') ||
    '169312903386-cslsqt049mv7gbkjb11kaq7kbj3agb0r.apps.googleusercontent.com';
  const googleClientId = typeof rawClientId === 'string' ? rawClientId.trim() : '';

  // Xử lý gửi token về backend khi đăng nhập thành công
  const handleAuthSuccess = async (tokenString: string) => {
    setIsLoading(true);
    try {
      const res = await clientFetch<any>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          token: tokenString,
          id_token: tokenString,
          access_token: tokenString,
        }),
      });

      if (res.success && res.data) {
        const token = res.data.access_token || res.data.token;
        const user = res.data.user;

        if (token && user) {
          setAuth(token, user);
          closeAuthModal();

          if (user.role !== 'customer') {
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

            // Chuyển hướng sau khi đăng nhập
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
          toast.error('Dữ liệu xác thực không hợp lệ từ máy chủ.');
        }
      } else {
        toast.error(res.message || 'Xác thực tài khoản Google thất bại.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể kết nối đến máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Kiểm tra nếu trang được redirect về kèm theo #access_token=... trong URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.location.hash.includes('access_token=')) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      if (token) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        handleAuthSuccess(token);
      }
    }
  }, []);

  // 2. Tự động nạp Google Identity Services SDK nếu chưa có
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.google?.accounts && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // 3. Xử lý khi người dùng nhấn nút Đăng nhập Google
  const handleGoogleClick = () => {
    if (!googleClientId) {
      toast.error('Chưa cấu hình Google Client ID trong file .env');
      return;
    }

    setIsLoading(true);

    // Cách 1: Sử dụng Google Identity Services OAuth2 Token Client (Khuyên dùng)
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              await handleAuthSuccess(tokenResponse.access_token);
            } else if (tokenResponse?.error) {
              setIsLoading(false);
              toast.error(`Đăng nhập Google thất bại: ${tokenResponse.error_description || tokenResponse.error}`);
            } else {
              setIsLoading(false);
            }
          },
          error_callback: (err: any) => {
            setIsLoading(false);
            if (err?.type === 'popup_closed') {
              toast.info('Bạn đã đóng cửa sổ chọn tài khoản Google.');
            } else if (err?.type === 'popup_failed_to_open') {
              toast.error('Trình duyệt đang chặn cửa sổ bật lên (Pop-up)! Vui lòng bấm vào biểu tượng dấu X đỏ ở góc phải thanh địa chỉ URL để cho phép Pop-up.');
            } else {
              // Thử mở popup trực tiếp nếu tokenClient bị lỗi
              openDirectGooglePopup();
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Lỗi khi gọi initTokenClient, chuyển sang mở popup trực tiếp:', err);
      }
    }

    // Cách 2: Mở trực tiếp cửa sổ OAuth2 của Google
    openDirectGooglePopup();
  };

  // Mở cửa sổ popup Google OAuth 2.0 trực tiếp
  const openDirectGooglePopup = () => {
    try {
      const redirectUri = window.location.origin;
      const oauthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        new URLSearchParams({
          client_id: googleClientId,
          redirect_uri: redirectUri,
          response_type: 'token',
          scope: 'email profile openid',
          prompt: 'select_account',
        }).toString();

      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        oauthUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsLoading(false);
        toast.error('Trình duyệt đang chặn cửa sổ Pop-up! Hãy nhìn vào góc phải thanh địa chỉ URL và chọn "Luôn cho phép" để tiếp tục.');
        return;
      }

      // Lắng nghe token trả về trong URL hash của popup
      const pollTimer = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(pollTimer);
            setIsLoading(false);
            return;
          }

          if (popup.location && popup.location.origin === window.location.origin) {
            const hash = popup.location.hash;
            if (hash && hash.includes('access_token=')) {
              const params = new URLSearchParams(hash.substring(1));
              const accessToken = params.get('access_token');
              if (accessToken) {
                clearInterval(pollTimer);
                popup.close();
                handleAuthSuccess(accessToken);
                return;
              }
            }
          }
        } catch (e) {
          // Bỏ qua Cross-Origin DOMException khi popup đang ở accounts.google.com
        }
      }, 400);
    } catch (err: any) {
      setIsLoading(false);
      toast.error('Không thể mở cửa sổ đăng nhập Google: ' + (err?.message || 'Lỗi không xác định'));
    }
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleGoogleClick}
        className="w-full h-11 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 font-semibold text-xs rounded-xl border border-neutral-300 shadow-xs hover:shadow transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-neutral-300 border-t-brand-700 rounded-full animate-spin" />
        ) : (
          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
        <span>
          {isLoading
            ? 'Đang kết nối Google...'
            : mode === 'register'
            ? 'Đăng ký nhanh bằng Google'
            : 'Đăng nhập với Google'}
        </span>
      </button>
    </div>
  );
}
