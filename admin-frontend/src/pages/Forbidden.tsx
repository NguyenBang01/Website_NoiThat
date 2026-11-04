import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-6 shadow-sm">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold tracking-widest text-rose-600 uppercase mb-2">
        Mã lỗi 403 - Cấm truy cập
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mb-3">
        Bạn không có quyền truy cập
      </h1>

      <p className="max-w-md text-sm text-stone-600 mb-8 leading-relaxed">
        Tài khoản của bạn không có đủ quyền để truy cập vào trang hoặc chức năng này.
        Vui lòng liên hệ với Quản trị viên cấp cao (Super Admin) để được cấp quyền tương ứng.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang trước</span>
        </Button>

        <Button
          variant="primary"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          <Home className="w-4 h-4" />
          <span>Về trang Tổng quan</span>
        </Button>
      </div>
    </div>
  );
};
