import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings as SettingsIcon, Save, Mail, Send } from 'lucide-react';
import { Button, Input, showToast } from '@/components/ui';
import { settingsApi, getErrorMessage } from '@/api';

const settingsSchema = z.object({
  shop_name: z.string().min(1, 'Tên cửa hàng không được để trống'),
  hotline: z.string().min(1, 'Số hotline không được để trống'),
  email: z.string().email('Địa chỉ email không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ cửa hàng không được để trống'),
  default_shipping_fee: z.string(),
  free_shipping_threshold: z.string(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: settingsRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['store-settings'],
    queryFn: settingsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shop_name: '',
      hotline: '',
      email: '',
      address: '',
      default_shipping_fee: '30000',
      free_shipping_threshold: '5000000',
    },
  });

  useEffect(() => {
    if (settingsRes?.data) {
      const s = settingsRes.data;
      reset({
        shop_name: s.shop_name || '',
        hotline: s.hotline || '',
        email: s.email || '',
        address: s.address || '',
        default_shipping_fee: s.default_shipping_fee || '30000',
        free_shipping_threshold: s.free_shipping_threshold || '5000000',
      });
    }
  }, [settingsRes, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: SettingsFormData) => settingsApi.update(data),
    onSuccess: () => {
      showToast.success('Cập nhật cấu hình cửa hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
    },
    onError: (err) => {
      showToast.error('Không thể lưu cài đặt', getErrorMessage(err));
    },
  });

  const [testEmailRecipient, setTestEmailRecipient] = useState('tngu8425@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      showToast.error('Vui lòng nhập địa chỉ email nhận thử nghiệm');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await settingsApi.testEmail(testEmailRecipient.trim());
      if (res.success) {
        showToast.success('Đã gửi email thử nghiệm thành công!', `Kiểm tra hộp thư ${testEmailRecipient}`);
      } else {
        showToast.error('Gửi thử nghiệm thất bại', res.message);
      }
    } catch (err: any) {
      showToast.error('Lỗi khi gửi email', getErrorMessage(err));
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-amber-700" />
          <span>Cài đặt Cửa hàng</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Cấu hình thông tin liên hệ, hotline và chính sách phí vận chuyển cho toàn website.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-2xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400">Đang tải cấu hình...</div>
        ) : isError ? (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs">
            {getErrorMessage(error)}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
                Thông tin chung
              </h2>

              <Input
                label="Tên cửa hàng / Thương hiệu *"
                placeholder="VD: Cửa hàng Nội Thất Bergen"
                error={errors.shop_name?.message}
                {...register('shop_name')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Số điện thoại Hotline *"
                  placeholder="VD: 0900 123 456"
                  error={errors.hotline?.message}
                  {...register('hotline')}
                />

                <Input
                  label="Email liên hệ / Hỗ trợ *"
                  type="email"
                  placeholder="contact@noithat.vn"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <Input
                label="Địa chỉ showroom / Kho hàng *"
                placeholder="VD: 123 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP. HCM"
                error={errors.address?.message}
                {...register('address')}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
                Chính sách vận chuyển
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phí giao hàng mặc định (VND)"
                  type="number"
                  placeholder="30000"
                  helperText="Áp dụng cho các đơn hàng tiêu chuẩn"
                  error={errors.default_shipping_fee?.message}
                  {...register('default_shipping_fee')}
                />

                <Input
                  label="Hạn mức Miễn phí vận chuyển (VND)"
                  type="number"
                  placeholder="5000000"
                  helperText="Đơn hàng đạt giá trị này sẽ được miễn phí ship"
                  error={errors.free_shipping_threshold?.message}
                  {...register('free_shipping_threshold')}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting || saveMutation.isPending}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Lưu cấu hình
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Khối Cấu hình & Kiểm tra Gửi Email SMTP */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
        <div>
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-700" />
            <span>Hệ thống Máy chủ Email SMTP (Gmail)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Hệ thống đang sử dụng tài khoản Gmail <strong>tngu8425@gmail.com</strong> qua Mật khẩu ứng dụng Google để tự động gửi thông báo đơn hàng và mã OTP khôi phục mật khẩu.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <span className="text-stone-500 block mb-0.5">Tài khoản gửi (SMTP User):</span>
            <strong className="font-mono text-stone-900 text-xs">tngu8425@gmail.com</strong>
          </div>
          <div>
            <span className="text-stone-500 block mb-0.5">Máy chủ & Cổng kết nối:</span>
            <strong className="font-mono text-stone-900 text-xs">smtp.gmail.com:587 (TLS/STARTTLS)</strong>
          </div>
          <div>
            <span className="text-stone-500 block mb-0.5">Mật khẩu ứng dụng (App Password):</span>
            <span className="font-mono bg-amber-200/60 text-amber-950 px-2 py-0.5 rounded text-[11px] font-bold">
              zufr •••• •••• kwtx (Đã kết nối)
            </span>
          </div>
          <div>
            <span className="text-stone-500 block mb-0.5">Tên hiển thị thương hiệu:</span>
            <strong className="text-stone-900 text-xs">Nội Thất Góc Nhà Đẹp</strong>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100">
          <label className="text-xs font-semibold text-stone-700 block mb-2">
            Gửi email thử nghiệm (Test SMTP):
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              placeholder="Nhập email nhận thử nghiệm (VD: your_email@gmail.com)"
              className="flex-1 h-10 px-3.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
            />
            <Button
              type="button"
              variant="secondary"
              isLoading={isSendingTest}
              onClick={handleSendTestEmail}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Gửi thử nghiệm
            </Button>
          </div>
          <p className="text-[11px] text-stone-400 mt-1.5">
            Nhấn "Gửi thử nghiệm" để gửi một email HTML xác thực trực tiếp qua cổng SMTP Google tới email bạn chỉ định.
          </p>
        </div>
      </div>
    </div>
  );
};
