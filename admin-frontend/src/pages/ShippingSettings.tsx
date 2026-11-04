import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  MapPin,
  Save,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  RefreshCw,
  X,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { shippingApi } from '@/api';
import { formatCurrency } from '@/lib/format';
import { usePermission } from '@/hooks/usePermission';
import { WarehouseMapPicker } from '@/components/shipping/WarehouseMapPicker';
import type {
  ShippingSetting,
  ShippingTier,
  ShippingEstimateResponse,
} from '@/types';

export const ShippingSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const canManage = can('shipping.manage');

  // Form states cho Settings
  const [formData, setFormData] = useState<Partial<ShippingSetting>>({});
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Modal thêm/sửa bậc giá
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ShippingTier | null>(null);
  const [tierFromKm, setTierFromKm] = useState<number>(0);
  const [tierToKm, setTierToKm] = useState<number>(10);
  const [tierBaseFee, setTierBaseFee] = useState<number>(50000);
  const [tierPricePerKm, setTierPricePerKm] = useState<number>(10000);

  // State Khung tính thử cước phí
  const [simAddress, setSimAddress] = useState<string>('615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh');
  const [simLat, setSimLat] = useState<number | null>(null);
  const [simLng, setSimLng] = useState<number | null>(null);
  const [simSubtotal, setSimSubtotal] = useState<number>(2500000);
  const [simBulkyCount, setSimBulkyCount] = useState<number>(1);
  const [simFloor, setSimFloor] = useState<number>(0);
  const [simAssembly, setSimAssembly] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<ShippingEstimateResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simError, setSimError] = useState<string>('');

  // 1. Lấy cài đặt chung
  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['shipping-settings'],
    queryFn: async () => {
      const res = await shippingApi.getSettings();
      return res.data;
    },
  });

  // Đồng bộ formData khi query settings thành công
  useEffect(() => {
    if (settingsData) {
      setFormData(settingsData);
      setIsFormDirty(false);
    }
  }, [settingsData]);

  // 2. Lấy danh sách bậc cước
  const {
    data: tiersData,
    isLoading: isLoadingTiers,
    refetch: refetchTiers,
  } = useQuery({
    queryKey: ['shipping-tiers'],
    queryFn: async () => {
      const res = await shippingApi.listTiers();
      return res.data;
    },
  });

  // 3. Kiểm tra tính liên tục (Validation) của các bậc cước
  const { data: validationData, refetch: refetchValidation } = useQuery({
    queryKey: ['shipping-tiers-validation'],
    queryFn: async () => {
      const res = await shippingApi.validateTiers();
      return res.data;
    },
  });

  // Mutation cập nhật Settings
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<ShippingSetting>) => shippingApi.updateSettings(data),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình vận chuyển thành công!');
      setIsFormDirty(false);
      queryClient.invalidateQueries({ queryKey: ['shipping-settings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu cài đặt');
    },
  });

  // Mutation thêm/sửa bậc giá
  const saveTierMutation = useMutation({
    mutationFn: async (data: {
      id?: number;
      from_km: number;
      to_km: number;
      base_fee: number;
      price_per_km: number;
      step_order: number;
    }) => {
      if (data.id) {
        return shippingApi.updateTier(data.id, data);
      }
      return shippingApi.createTier(data);
    },
    onSuccess: () => {
      toast.success(editingTier ? 'Đã cập nhật bậc giá!' : 'Đã thêm bậc giá mới!');
      setIsTierModalOpen(false);
      setEditingTier(null);
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers-validation'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Lỗi lưu bậc giá');
    },
  });

  // Mutation xóa bậc giá
  const deleteTierMutation = useMutation({
    mutationFn: (id: number) => shippingApi.deleteTier(id),
    onSuccess: () => {
      toast.success('Đã xóa bậc giá');
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers-validation'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Lỗi xóa bậc giá');
    },
  });

  // Mutation sắp xếp bậc giá
  const reorderTiersMutation = useMutation({
    mutationFn: (tierIds: number[]) => shippingApi.reorderTiers(tierIds),
    onSuccess: () => {
      toast.success('Đã cập nhật thứ tự bậc giá');
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers-validation'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Lỗi sắp xếp bậc giá');
    },
  });

  const handleInputChange = (field: keyof ShippingSetting, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsFormDirty(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error('Bạn không có quyền thay đổi cài đặt vận chuyển.');
      return;
    }
    updateSettingsMutation.mutate(formData);
  };

  const openAddTierModal = () => {
    setEditingTier(null);
    const lastTier = tiersData && tiersData.length > 0 ? tiersData[tiersData.length - 1] : null;
    const nextFrom = lastTier ? lastTier.to_km : 0;
    setTierFromKm(nextFrom);
    setTierToKm(nextFrom + 10);
    setTierBaseFee(lastTier ? lastTier.base_fee : 50000);
    setTierPricePerKm(lastTier ? lastTier.price_per_km : 10000);
    setIsTierModalOpen(true);
  };

  const openEditTierModal = (tier: ShippingTier) => {
    setEditingTier(tier);
    setTierFromKm(tier.from_km);
    setTierToKm(tier.to_km);
    setTierBaseFee(tier.base_fee);
    setTierPricePerKm(tier.price_per_km);
    setIsTierModalOpen(true);
  };

  const handleSubmitTierModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (tierFromKm >= tierToKm) {
      toast.error('Khoảng cách bắt đầu (Từ km) phải nhỏ hơn khoảng cách kết thúc (Đến km)');
      return;
    }

    saveTierMutation.mutate({
      id: editingTier ? editingTier.id : undefined,
      from_km: Number(tierFromKm),
      to_km: Number(tierToKm),
      base_fee: Number(tierBaseFee),
      price_per_km: Number(tierPricePerKm),
      step_order: editingTier ? editingTier.step_order : (tiersData?.length || 0) + 1,
    });
  };

  const handleMoveTier = (index: number, direction: 'up' | 'down') => {
    if (!tiersData) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tiersData.length) return;

    const newTiers = [...tiersData];
    const [moved] = newTiers.splice(index, 1);
    newTiers.splice(targetIndex, 0, moved);

    const reorderedIds = newTiers.map((t) => t.id);
    reorderTiersMutation.mutate(reorderedIds);
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimError('');
    setSimResult(null);

    try {
      const mockItems = simBulkyCount > 0
        ? Array.from({ length: simBulkyCount }).map((_, i) => ({
            variant_id: i + 1,
            quantity: 1,
          }))
        : [];

      const res = await shippingApi.estimateShipping({
        address: simAddress.trim(),
        latitude: simLat,
        longitude: simLng,
        sub_total: Number(simSubtotal),
        floor: Number(simFloor),
        needs_assembly: simAssembly,
        items: mockItems,
      });

      if (res.success && res.data) {
        setSimResult(res.data);
      } else {
        setSimError(res.message || 'Không thể tính toán chi phí.');
      }
    } catch (err: any) {
      setSimError(err.response?.data?.message || err.message || 'Lỗi khi gọi API tính cước');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm text-stone-500">Đang tải cấu hình vận chuyển...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                CẤU HÌNH PHÍ VẬN CHUYỂN THEO KHOẢNG CÁCH
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Định vị kho hàng xuất phát, bảng cước bậc thang theo km (OSRM/Nominatim) và phụ phí đặc thù đồ nội thất.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              refetchSettings();
              refetchTiers();
              refetchValidation();
              toast.success('Đã tải lại dữ liệu mới nhất!');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending || !isFormDirty}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{updateSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cảnh báo chưa lưu */}
      {isFormDirty && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Bạn có thay đổi chưa lưu. Vui lòng bấm <strong>"Lưu thay đổi"</strong> để áp dụng.</span>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition"
            >
              Lưu ngay
            </button>
          )}
        </div>
      )}

      {/* Grid 2 Cột */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (7 CỘT): Bản đồ kho hàng & Bảng giá bậc thang */}
        <div className="lg:col-span-7 space-y-8">
          {/* Card 1: Vị trí kho & Showroom */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                1. Điểm xuất phát (Kho hàng & Showroom)
              </h2>
              <span className="text-xs text-stone-500 font-mono">
                {formData.warehouse_lat?.toFixed(4)}, {formData.warehouse_lng?.toFixed(4)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Tên kho / Showroom
                </label>
                <input
                  type="text"
                  value={formData.warehouse_name || ''}
                  onChange={(e) => handleInputChange('warehouse_name', e.target.value)}
                  placeholder="Ví dụ: Kho chính TP.HCM - Góc Nhà Đẹp"
                  disabled={!canManage}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 disabled:bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Số điện thoại kho vận
                </label>
                <input
                  type="text"
                  value={formData.warehouse_phone || ''}
                  onChange={(e) => handleInputChange('warehouse_phone', e.target.value)}
                  placeholder="Ví dụ: 0931883988"
                  disabled={!canManage}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 disabled:bg-stone-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Địa chỉ kho xuất phát
              </label>
              <input
                type="text"
                value={formData.warehouse_address || ''}
                onChange={(e) => handleInputChange('warehouse_address', e.target.value)}
                placeholder="Ví dụ: Số 68 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                disabled={!canManage}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 disabled:bg-stone-50"
              />
            </div>

            {/* Bản đồ Leaflet chọn vị trí kho */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Bản đồ định vị kho xuất phát (OpenStreetMap + Leaflet miễn phí)
              </label>
              <WarehouseMapPicker
                lat={Number(formData.warehouse_lat || 10.7769)}
                lng={Number(formData.warehouse_lng || 106.7009)}
                onChange={(newLat, newLng) => {
                  handleInputChange('warehouse_lat', newLat);
                  handleInputChange('warehouse_lng', newLng);
                }}
                disabled={!canManage}
              />
            </div>
          </div>

          {/* Card 2: Bảng cước bậc thang */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  2. Bảng cước vận chuyển theo bậc thang (km)
                </h2>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {tiersData?.length || 0} bậc
                </span>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={openAddTierModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bậc giá</span>
                </button>
              )}
            </div>

            {/* Cảnh báo khoảng hở hoặc trùng lặp bậc km */}
            {validationData && !validationData.valid && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Cảnh báo cấu hình bậc thang: {validationData.message}</span>
                </div>
                {validationData.overlaps && validationData.overlaps.length > 0 && (
                  <p className="text-[11px] pl-6">
                    <strong>Trùng lặp:</strong> {validationData.overlaps.join('; ')}
                  </p>
                )}
                {validationData.gaps && validationData.gaps.length > 0 && (
                  <p className="text-[11px] pl-6">
                    <strong>Khoảng trống (gap):</strong> {validationData.gaps.join('; ')}
                  </p>
                )}
              </div>
            )}

            {validationData && validationData.valid && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Các bậc cước liên tục hoàn chỉnh, không có khoảng trống hoặc trùng lặp km.</span>
              </div>
            )}

            {/* Bảng danh sách bậc cước */}
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Thứ tự</th>
                    <th className="py-2.5 px-3">Khoảng cách (km)</th>
                    <th className="py-2.5 px-3">Cước cơ bản</th>
                    <th className="py-2.5 px-3">Đơn giá km vượt</th>
                    {canManage && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingTiers ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-400">
                        Đang tải danh sách bậc cước...
                      </td>
                    </tr>
                  ) : !tiersData || tiersData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-400">
                        Chưa có bậc cước nào. Bấm "Thêm bậc giá" để thiết lập.
                      </td>
                    </tr>
                  ) : (
                    tiersData.map((tier, idx) => (
                      <tr key={tier.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-[10px]">
                              {tier.step_order || idx + 1}
                            </span>
                            {canManage && (
                              <div className="flex flex-col ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveTier(idx, 'up')}
                                  disabled={idx === 0}
                                  className="text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                                  title="Lên trên"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTier(idx, 'down')}
                                  disabled={idx === tiersData.length - 1}
                                  className="text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                                  title="Xuống dưới"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">
                          {tier.from_km} km - {tier.to_km} km
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                          {formatCurrency(tier.base_fee)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">
                          {tier.price_per_km > 0
                            ? `+${formatCurrency(tier.price_per_km)}/km`
                            : 'Không tính'}
                        </td>
                        {canManage && (
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditTierModal(tier)}
                                className="p-1 text-stone-500 hover:text-emerald-700 rounded hover:bg-stone-100 transition cursor-pointer"
                                title="Sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa bậc cước ${tier.from_km}km - ${tier.to_km}km?`)) {
                                    deleteTierMutation.mutate(tier.id);
                                  }
                                }}
                                className="p-1 text-stone-500 hover:text-rose-600 rounded hover:bg-stone-100 transition cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-stone-500 italic">
              * Công thức tính: Nếu quãng đường nằm trong bậc [A - B] km, cước = Cước cơ bản + (km thực tế - A km) x Đơn giá km vượt.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI (5 CỘT): Phụ phí nội thất & Khung tính thử cước */}
        <div className="lg:col-span-5 space-y-8">
          {/* Card 3: Phụ phí & Quy tắc đặc thù */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
              <Package className="w-4 h-4 text-emerald-700" />
              3. Phụ phí & Quy tắc đặc thù đồ nội thất
            </h2>

            {/* Giới hạn bán kính giao tối đa */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Giới hạn khoảng cách giao hàng tối đa
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_distance_limit_enabled ?? true}
                    onChange={(e) => handleInputChange('is_distance_limit_enabled', e.target.checked)}
                    disabled={!canManage}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={formData.max_distance_km || 50}
                  onChange={(e) => handleInputChange('max_distance_km', Number(e.target.value))}
                  disabled={!canManage || !formData.is_distance_limit_enabled}
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-right font-bold focus:outline-none focus:border-emerald-600 disabled:bg-stone-100"
                />
                <span className="text-xs text-stone-600">km (vượt quá khoảng cách này sẽ chặn đặt hàng hoặc báo liên hệ shop)</span>
              </div>
            </div>

            {/* Miễn phí vận chuyển */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Miễn phí vận chuyển theo giá trị đơn hàng
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_free_shipping_enabled ?? true}
                    onChange={(e) => handleInputChange('is_free_shipping_enabled', e.target.checked)}
                    disabled={!canManage}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Đơn từ (VNĐ):</label>
                  <input
                    type="number"
                    step={100000}
                    value={formData.free_shipping_threshold || 5000000}
                    onChange={(e) => handleInputChange('free_shipping_threshold', Number(e.target.value))}
                    disabled={!canManage || !formData.is_free_shipping_enabled}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-bold focus:outline-none focus:border-emerald-600 disabled:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Bán kính tối đa (km):</label>
                  <input
                    type="number"
                    value={formData.free_shipping_max_distance_km || 15}
                    onChange={(e) => handleInputChange('free_shipping_max_distance_km', Number(e.target.value))}
                    disabled={!canManage || !formData.is_free_shipping_enabled}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-bold focus:outline-none focus:border-emerald-600 disabled:bg-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Phụ phí hàng cồng kềnh */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Phụ phí hàng cồng kềnh (Sofa, giường, tủ lớn)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_bulky_surcharge_enabled ?? true}
                    onChange={(e) => handleInputChange('is_bulky_surcharge_enabled', e.target.checked)}
                    disabled={!canManage}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={10000}
                  value={formData.bulky_surcharge_per_item || 100000}
                  onChange={(e) => handleInputChange('bulky_surcharge_per_item', Number(e.target.value))}
                  disabled={!canManage || !formData.is_bulky_surcharge_enabled}
                  className="w-32 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-right font-bold focus:outline-none focus:border-emerald-600 disabled:bg-stone-100"
                />
                <span className="text-xs text-stone-600">VNĐ / sản phẩm cồng kềnh</span>
              </div>
            </div>

            {/* Phụ phí khiêng tầng bộ */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Phụ phí khiêng thang bộ lên tầng
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_floor_surcharge_enabled ?? true}
                    onChange={(e) => handleInputChange('is_floor_surcharge_enabled', e.target.checked)}
                    disabled={!canManage}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={5000}
                  value={formData.floor_surcharge_per_floor || 30000}
                  onChange={(e) => handleInputChange('floor_surcharge_per_floor', Number(e.target.value))}
                  disabled={!canManage || !formData.is_floor_surcharge_enabled}
                  className="w-32 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-right font-bold focus:outline-none focus:border-emerald-600 disabled:bg-stone-100"
                />
                <span className="text-xs text-stone-600">VNĐ / mỗi tầng lầu (từ lầu 1)</span>
              </div>
            </div>

            {/* Phí dịch vụ lắp đặt */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Phí dịch vụ lắp ráp hoàn thiện tại nhà
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_assembly_fee_enabled ?? true}
                    onChange={(e) => handleInputChange('is_assembly_fee_enabled', e.target.checked)}
                    disabled={!canManage}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={10000}
                  value={formData.assembly_fee || 50000}
                  onChange={(e) => handleInputChange('assembly_fee', Number(e.target.value))}
                  disabled={!canManage || !formData.is_assembly_fee_enabled}
                  className="w-32 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-right font-bold focus:outline-none focus:border-emerald-600 disabled:bg-stone-100"
                />
                <span className="text-xs text-stone-600">VNĐ / đơn hàng</span>
              </div>
            </div>
          </div>

          {/* Card 4: Khung tính thử cước phí */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
              <Calculator className="w-4 h-4 text-emerald-700" />
              4. Khung tính thử cước phí (Simulator)
            </h2>

            <form onSubmit={handleRunSimulation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Địa chỉ giao hàng thử nghiệm:
                </label>
                <input
                  type="text"
                  required
                  value={simAddress}
                  onChange={(e) => setSimAddress(e.target.value)}
                  placeholder="Nhập địa chỉ nhà khách hàng..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Vĩ độ (Lat) tùy chọn
                  </label>
                  <input
                    type="number"
                    step={0.0001}
                    value={simLat !== null ? simLat : ''}
                    onChange={(e) => setSimLat(e.target.value ? Number(e.target.value) : null)}
                    placeholder="VD: 10.7769"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Kinh độ (Lng) tùy chọn
                  </label>
                  <input
                    type="number"
                    step={0.0001}
                    value={simLng !== null ? simLng : ''}
                    onChange={(e) => setSimLng(e.target.value ? Number(e.target.value) : null)}
                    placeholder="VD: 106.7009"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Giá trị đơn hàng (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={simSubtotal}
                    onChange={(e) => setSimSubtotal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Số món cồng kềnh
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={simBulkyCount}
                    onChange={(e) => setSimBulkyCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Tầng lầu thang bộ
                  </label>
                  <select
                    value={simFloor}
                    onChange={(e) => setSimFloor(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value={0}>Tầng trệt / Thang máy (0đ)</option>
                    <option value={1}>Lầu 1</option>
                    <option value={2}>Lầu 2</option>
                    <option value={3}>Lầu 3</option>
                    <option value={4}>Lầu 4+</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={simAssembly}
                      onChange={(e) => setSimAssembly(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                    />
                    <span className="text-xs text-stone-700">Lắp ráp tại nhà</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ĐANG TÍNH QUA OSRM...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-3.5 h-3.5" />
                    <span>TÍNH THỬ CƯỚC NGAY</span>
                  </>
                )}
              </button>
            </form>

            {simError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {simError}
              </div>
            )}

            {simResult && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="font-semibold text-stone-800">Khoảng cách thực tế:</span>
                  <span className="font-bold text-stone-900 font-mono text-sm">
                    ~{simResult.distance_km?.toFixed(2)} km
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-600">
                  <span>Nguồn tính:</span>
                  <span className="font-semibold text-emerald-700">
                    {simResult.source === 'osrm' ? 'Lộ trình đường đi OSRM' : 'Haversine đường chim bay x 1.3'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-stone-200">
                  <div className="flex justify-between text-stone-600">
                    <span>Cước cơ bản theo km:</span>
                    <span className="font-mono">{formatCurrency(simResult.base_fee)}</span>
                  </div>
                  {simResult.bulky_surcharge > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Phụ phí hàng cồng kềnh ({simResult.total_bulky_items} món):</span>
                      <span className="font-mono">+{formatCurrency(simResult.bulky_surcharge)}</span>
                    </div>
                  )}
                  {simResult.floor_surcharge > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Phụ phí khiêng tầng:</span>
                      <span className="font-mono">+{formatCurrency(simResult.floor_surcharge)}</span>
                    </div>
                  )}
                  {simResult.assembly_fee > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Phí dịch vụ lắp đặt:</span>
                      <span className="font-mono">+{formatCurrency(simResult.assembly_fee)}</span>
                    </div>
                  )}
                  {simResult.free_shipping_discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Giảm giá miễn phí vận chuyển:</span>
                      <span className="font-mono">-{formatCurrency(simResult.free_shipping_discount)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline">
                  <span className="font-bold text-stone-900">Tổng cước khách trả:</span>
                  <span className="text-base font-bold text-emerald-800 font-mono">
                    {simResult.is_free_shipping ? '0 ₫ (Miễn phí)' : formatCurrency(simResult.final_shipping_fee)}
                  </span>
                </div>

                {!simResult.is_deliverable && (
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-semibold">
                    Cảnh báo: {simResult.message || 'Vượt quá khoảng cách giao hàng tối đa!'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Thêm / Sửa Bậc Giá */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                {editingTier ? 'Chỉnh sửa bậc cước' : 'Thêm bậc cước mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTierModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTierModal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Từ khoảng cách (km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    required
                    value={tierFromKm}
                    onChange={(e) => setTierFromKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Đến khoảng cách (km) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    required
                    value={tierToKm}
                    onChange={(e) => setTierToKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cước cơ bản (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step={5000}
                  min={0}
                  required
                  value={tierBaseFee}
                  onChange={(e) => setTierBaseFee(Number(e.target.value))}
                  placeholder="Ví dụ: 50000"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                />
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  Cước áp dụng cho mốc bắt đầu của bậc này ({formatCurrency(tierBaseFee)})
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Đơn giá km vượt (VNĐ/km)
                </label>
                <input
                  type="number"
                  step={1000}
                  min={0}
                  value={tierPricePerKm}
                  onChange={(e) => setTierPricePerKm(Number(e.target.value))}
                  placeholder="Ví dụ: 10000"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                />
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  Phần km vượt trên {tierFromKm} km sẽ nhân với đơn giá này ({formatCurrency(tierPricePerKm)}/km)
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveTierMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saveTierMutation.isPending ? 'Đang lưu...' : editingTier ? 'Lưu cập nhật' : 'Thêm bậc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShippingSettings;
