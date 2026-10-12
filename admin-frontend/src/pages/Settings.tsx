import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings as SettingsIcon, Save } from 'lucide-react';
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
    </div>
  );
};
