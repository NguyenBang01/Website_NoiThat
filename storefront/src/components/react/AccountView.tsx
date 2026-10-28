import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  User as UserIcon,
  MapPin,
  Lock,
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  Home,
  Save,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Heart,
  ShoppingBag,
} from 'lucide-react';
import { $auth, updateUser, openAuthModal } from '../../stores/authStore';
import { $wishlistItems, $wishlistCount, toggleWishlist } from '../../stores/wishlistStore';
import { addToCart, openCart } from '../../stores/cartStore';
import { formatCurrency, getProductImage } from '../../lib/format';
import { clientFetch } from '../../lib/api';
import type { Address, AddressRequest, UpdateProfileRequest, ChangePasswordRequest } from '../../types';
import { toast } from 'sonner';

export default function AccountView() {
  const auth = useStore($auth);
  const user = auth.user;

  const wishlistItems = useStore($wishlistItems);
  const wishlistCount = useStore($wishlistCount);

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security' | 'wishlist'>('profile');

  // Đọc tab từ query param trên URL (ví dụ /account?tab=wishlist)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'wishlist' ||
        tabParam === 'addresses' ||
        tabParam === 'security' ||
        tabParam === 'profile'
      ) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // --- Profile State ---
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Addresses State ---
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<AddressRequest>({
    recipient_name: '',
    phone: '',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '',
    is_default: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --- Security / Password State ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Khởi tạo dữ liệu người dùng
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Tải danh sách địa chỉ khi chọn tab addresses hoặc khi đăng nhập
  const fetchAddresses = async () => {
    if (!auth.isAuthenticated) return;
    setIsLoadingAddresses(true);
    try {
      const res = await clientFetch<Address[]>('/account/addresses');
      if (res.success && Array.isArray(res.data)) {
        setAddresses(res.data);
      }
    } catch {
      toast.error('Không thể tải sổ địa chỉ nhận hàng');
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchAddresses();
    }
  }, [auth.isAuthenticated]);

  // 1. Cập nhật thông tin cá nhân
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const payload: UpdateProfileRequest = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      };

      const res = await clientFetch<any>('/account/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        updateUser({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        });
        toast.success('Cập nhật thông tin cá nhân thành công!');
      } else {
        toast.error(res.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 2. Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không trùng khớp');
      return;
    }

    setIsChangingPass(true);
    try {
      const payload: ChangePasswordRequest = {
        old_password: oldPassword,
        new_password: newPassword,
      };

      const res = await clientFetch<any>('/account/change-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success('Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsChangingPass(false);
    }
  };

  // 3. Mở Modal Thêm / Sửa địa chỉ
  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setAddressForm({
      recipient_name: user?.full_name || '',
      phone: user?.phone || '',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      street: '',
      is_default: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const handleOpenEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      street: addr.street,
      is_default: addr.is_default,
    });
    setShowAddressModal(true);
  };

  // Lưu địa chỉ (Create / Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipient_name.trim() || !addressForm.phone.trim() || !addressForm.street.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        // Cập nhật
        const res = await clientFetch<any>(`/account/addresses/${editingAddress.id}`, {
          method: 'PUT',
          body: JSON.stringify(addressForm),
        });
        if (res.success) {
          toast.success('Đã cập nhật địa chỉ giao hàng');
          setShowAddressModal(false);
          await fetchAddresses();
        } else {
          toast.error(res.message || 'Không thể cập nhật địa chỉ');
        }
      } else {
        // Thêm mới
        const res = await clientFetch<any>('/account/addresses', {
          method: 'POST',
          body: JSON.stringify(addressForm),
        });
        if (res.success) {
          toast.success('Đã thêm địa chỉ giao hàng mới');
          setShowAddressModal(false);
          await fetchAddresses();
        } else {
          toast.error(res.message || 'Không thể thêm địa chỉ');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu địa chỉ');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Xóa địa chỉ
  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ giao hàng này?')) return;
    setDeletingId(id);
    try {
      const res = await clientFetch<any>(`/account/addresses/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success('Đã xóa địa chỉ thành công');
        await fetchAddresses();
      } else {
        toast.error(res.message || 'Không thể xóa địa chỉ');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối');
    } finally {
      setDeletingId(null);
    }
  };

  // Đặt làm mặc định
  const handleSetDefault = async (id: number) => {
    try {
      const res = await clientFetch<any>(`/account/addresses/${id}/default`, {
        method: 'PUT',
      });
      if (res.success) {
        toast.success('Đã đặt làm địa chỉ mặc định');
        await fetchAddresses();
      } else {
        toast.error(res.message || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi khi thiết lập địa chỉ mặc định');
    }
  };

  // NẾU CHƯA ĐĂNG NHẬP VÀ KHÔNG PHẢI TAB YÊU THÍCH
  if (!auth.isAuthenticated && activeTab !== 'wishlist') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <UserIcon className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-warm-900 mb-2">
          Tài Khoản Góc Nhà Đẹp
        </h1>
        <p className="text-sm text-warm-600 max-w-md mx-auto mb-8">
          Vui lòng đăng nhập để xem và quản lý thông tin cá nhân, sổ địa chỉ nhận hàng và theo dõi đơn hàng của bạn.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-8 py-3.5 rounded-xl bg-brand-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-800 transition shadow-md cursor-pointer"
        >
          Đăng Nhập Tài Khoản
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Top Profile Summary Header Card */}
      {auth.isAuthenticated ? (
        <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-xs shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-warm-900">
                  {user?.full_name || 'Khách hàng'}
                </h1>
                {user?.role === 'admin' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Quản trị viên
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    Thành viên Góc Nhà Đẹp
                  </span>
                )}
                {user?.google_id && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    Google Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-warm-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-warm-400" /> {user?.email}
                </span>
                {user?.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-warm-400" /> {user.phone}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick link sang Quản lý Đơn hàng */}
          <a
            href="/orders"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-semibold transition"
          >
            <Package className="w-4 h-4 text-brand-700" />
            <span>Xem đơn hàng của tôi</span>
            <ChevronRight className="w-3.5 h-3.5 text-warm-400" />
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-serif text-2xl font-bold shadow-xs shrink-0">
              <Heart className="w-8 h-8 fill-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-warm-900">
                  Sản Phẩm Yêu Thích Của Bạn
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Lưu trên trình duyệt
                </span>
              </div>
              <p className="text-xs text-warm-500 mt-1">
                Các sản phẩm bạn yêu thích đang được lưu tạm thời. Đăng nhập ngay để đồng bộ và truy cập từ mọi thiết bị!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm shrink-0 cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            <span>Đăng Nhập Đồng Bộ</span>
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar Menu + Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl border border-warm-200 p-2.5 shadow-xs space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!auth.isAuthenticated) {
                  openAuthModal('login');
                } else {
                  setActiveTab('profile');
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'text-warm-700 hover:bg-warm-50 hover:text-warm-900'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>Thông tin tài khoản</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!auth.isAuthenticated) {
                  openAuthModal('login');
                } else {
                  setActiveTab('addresses');
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'text-warm-700 hover:bg-warm-50 hover:text-warm-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Sổ địa chỉ nhận hàng</span>
              </div>
              {addresses.length > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'addresses'
                      ? 'bg-white/20 text-white'
                      : 'bg-warm-100 text-warm-700'
                  }`}
                >
                  {addresses.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!auth.isAuthenticated) {
                  openAuthModal('login');
                } else {
                  setActiveTab('security');
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'text-warm-700 hover:bg-warm-50 hover:text-warm-900'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Đổi mật khẩu & Bảo mật</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'text-warm-700 hover:bg-warm-50 hover:text-warm-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 shrink-0" />
                <span>Sản phẩm yêu thích</span>
              </div>
              {wishlistCount > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'wishlist'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            <a
              href="/orders"
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-warm-700 hover:bg-warm-50 hover:text-warm-900 transition text-left"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-warm-400 shrink-0" />
                <span>Đơn hàng đã đặt</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-warm-400" />
            </a>
          </div>

          {/* Privacy & Guarantee note */}
          <div className="bg-warm-50/80 rounded-2xl border border-warm-200/80 p-4 text-xs text-warm-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-warm-800">
              <ShieldCheck className="w-4 h-4 text-brand-700" />
              <span>Bảo mật thông tin</span>
            </div>
            <p className="text-[11px] leading-relaxed text-warm-500">
              Thông tin cá nhân và địa chỉ của quý khách được bảo mật tối đa và chỉ sử dụng cho mục đích giao hàng & bảo hành nội thất.
            </p>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-3">
          {/* TAB 1: THÔNG TIN TÀI KHOẢN */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-xs">
              <div className="border-b border-warm-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-warm-900">Thông Tin Cá Nhân</h2>
                <p className="text-xs text-warm-500 mt-0.5">
                  Quản lý họ tên và số điện thoại liên hệ nhận thông báo đơn hàng.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-1.5">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-50/80 text-warm-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-[11px] text-warm-400 mt-1">
                    Email là mã định danh tài khoản và không thể tự ý thay đổi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 text-warm-900 text-sm transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại liên lạc
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 text-warm-900 text-sm transition outline-none"
                  />
                  <p className="text-[11px] text-warm-400 mt-1">
                    Số điện thoại dùng để nhận tin nhắn xác nhận đơn và điều phối thợ lắp đặt.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Lưu Thay Đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SỔ ĐỊA CHỈ NHẬN HÀNG */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-xs">
              <div className="border-b border-warm-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-warm-900">Sổ Địa Chỉ Nhận Hàng</h2>
                  <p className="text-xs text-warm-500 mt-0.5">
                    Quản lý danh sách địa chỉ giao hàng để thanh toán nhanh chóng chỉ với 1 click.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Địa Chỉ Mới</span>
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="py-12 flex flex-col items-center justify-center text-warm-400 gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-brand-700" />
                  <span className="text-xs">Đang tải danh sách địa chỉ...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-12 text-center text-warm-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto text-warm-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-warm-700">Chưa có địa chỉ giao hàng nào</p>
                  <p className="text-xs text-warm-500 max-w-sm mx-auto">
                    Thêm địa chỉ nhà riêng hoặc văn phòng để hệ thống tự động điền khi bạn đặt mua đồ nội thất.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                        addr.is_default
                          ? 'border-brand-600 bg-brand-50/20 shadow-xs'
                          : 'border-warm-200 hover:border-warm-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-sm text-warm-900">
                            {addr.recipient_name}
                          </span>
                          {addr.is_default ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-700 text-white shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Mặc định
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(addr.id)}
                              className="text-[11px] text-warm-500 hover:text-brand-700 transition cursor-pointer font-medium"
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-warm-600 font-medium flex items-center gap-1.5 mb-2">
                          <Phone className="w-3 h-3 text-warm-400" /> {addr.phone}
                        </p>

                        <p className="text-xs text-warm-700 leading-relaxed">
                          {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100 mt-4">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(addr)}
                          className="inline-flex items-center gap-1 text-xs text-warm-600 hover:text-warm-900 font-medium transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          disabled={deletingId === addr.id}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ĐỔI MẬT KHẨU & BẢO MẬT */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-xs">
              <div className="border-b border-warm-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-warm-900">Bảo Mật & Mật Khẩu</h2>
                <p className="text-xs text-warm-500 mt-0.5">
                  Đổi mật khẩu định kỳ để nâng cao tính bảo mật cho tài khoản của bạn.
                </p>
              </div>

              {user?.google_id ? (
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3.5 text-xs text-blue-900">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
                    G
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-blue-950">Đăng Nhập Bằng Google</h4>
                    <p className="leading-relaxed text-blue-800">
                      Tài khoản của bạn được liên kết và bảo vệ an toàn thông qua Google Sign-In. Bạn không cần đặt hay quản lý mật khẩu riêng tại Góc Nhà Đẹp.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                  {/* Mật khẩu cũ */}
                  <div>
                    <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-1.5">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPass ? 'text' : 'password'}
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu đang dùng"
                        className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 text-warm-900 text-sm transition outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-3 text-warm-400 hover:text-warm-700 transition"
                      >
                        {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-1.5">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 text-warm-900 text-sm transition outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-3 text-warm-400 hover:text-warm-700 transition"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-1.5">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 text-warm-900 text-sm transition outline-none"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {isChangingPass ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang cập nhật...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Đổi Mật Khẩu</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: SẢN PHẨM YÊU THÍCH */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-8 shadow-xs">
              <div className="border-b border-warm-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-warm-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                    <span>Sản Phẩm Yêu Thích ({wishlistCount})</span>
                  </h2>
                  <p className="text-xs text-warm-500 mt-0.5">
                    Các mẫu thiết kế nội thất quý khách đã lưu lại để tham khảo và đặt mua.
                  </p>
                </div>

                <a
                  href="/products"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xs font-semibold transition"
                >
                  <ShoppingBag className="w-4 h-4 text-brand-700" />
                  <span>Khám phá thêm sản phẩm</span>
                </a>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="py-16 text-center text-warm-400 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-2xs">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-warm-800">
                    Danh sách yêu thích đang trống
                  </h3>
                  <p className="text-xs text-warm-500 max-w-sm mx-auto leading-relaxed">
                    Hãy dạo quanh showroom Góc Nhà Đẹp và nhấn nút thả tim ❤️ để lưu lại những món đồ nội thất ưng ý nhất nhé!
                  </p>
                  <a
                    href="/products"
                    className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl bg-brand-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-800 transition shadow-sm"
                  >
                    Xem Các Bộ Sưu Tập
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistItems.map((item) => {
                    const product = item.product;
                    if (!product) return null;

                    const effectivePrice =
                      product.sale_price ||
                      product.base_price ||
                      product.variants?.[0]?.sale_price ||
                      product.variants?.[0]?.price ||
                      0;
                    const originalPrice =
                      product.base_price || product.variants?.[0]?.price || effectivePrice;
                    const imageUrl = getProductImage(
                      product.image || product.images?.[0]?.url,
                      product.category?.name
                    );

                    const handleAddThisToCart = async () => {
                      const variant = product.variants?.[0];
                      const res = await addToCart({
                        variant_id: variant?.id || product.id,
                        product_id: product.id,
                        product_name: product.name,
                        product_slug: product.slug,
                        sku: variant?.sku || product.sku,
                        color: variant?.color || 'Tiêu chuẩn',
                        material: variant?.material || 'Gỗ tự nhiên cao cấp',
                        image_url: imageUrl,
                        original_price: originalPrice,
                        unit_price: effectivePrice,
                        quantity: 1,
                        stock_quantity: variant?.stock_quantity ?? 10,
                        available: true,
                      });
                      if (res.success) {
                        toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
                        openCart();
                      } else {
                        toast.error(res.message);
                      }
                    };

                    return (
                      <div
                        key={item.id || product.id}
                        className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-2xs hover:shadow-soft transition flex flex-col justify-between group"
                      >
                        <div>
                          {/* Image Thumbnail */}
                          <div className="relative aspect-4/3 bg-warm-50 overflow-hidden">
                            <a href={`/products/${product.slug}`} className="block w-full h-full">
                              <img
                                src={imageUrl}
                                alt={product.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                            </a>
                            <button
                              type="button"
                              onClick={() => toggleWishlist(product)}
                              title="Bỏ thích"
                              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-rose-600 shadow-xs flex items-center justify-center hover:bg-white transition cursor-pointer"
                            >
                              <Heart className="w-4 h-4 fill-rose-600" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-1.5">
                            <div className="text-[11px] text-warm-400 font-medium">
                              {product.category?.name || 'Nội thất'}
                            </div>
                            <a
                              href={`/products/${product.slug}`}
                              className="block text-xs font-bold text-warm-900 group-hover:text-brand-700 transition line-clamp-2 min-h-[2rem]"
                            >
                              {product.name}
                            </a>

                            <div className="flex items-baseline gap-2 pt-1">
                              <span className="font-serif font-bold text-sm text-brand-800">
                                {formatCurrency(effectivePrice)}
                              </span>
                              {originalPrice > effectivePrice && (
                                <span className="text-[11px] text-warm-400 line-through">
                                  {formatCurrency(originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-warm-100/80 mt-3 pt-3">
                          <a
                            href={`/products/${product.slug}`}
                            className="px-3 py-2 rounded-xl border border-warm-200 text-warm-700 hover:bg-warm-50 text-center text-xs font-semibold transition"
                          >
                            Xem chi tiết
                          </a>
                          <button
                            type="button"
                            onClick={handleAddThisToCart}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Thêm giỏ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Thêm / Sửa địa chỉ */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-warm-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-warm-100 mb-5">
              <h3 className="text-base font-bold text-warm-900">
                {editingAddress ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Giao Hàng Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="p-1.5 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-warm-700 mb-1">
                  Họ tên người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.recipient_name}
                  onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-600 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-warm-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="Ví dụ: 0912 345 678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-600 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-warm-700 mb-1">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    placeholder="TP. Hồ Chí Minh, Hà Nội..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-600 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-warm-700 mb-1">
                    Quận / Huyện <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    placeholder="Quận 1, Tân Bình, Cầu Giấy..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-600 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-warm-700 mb-1">
                  Phường / Xã <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.ward}
                  onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                  placeholder="Phường Bến Nghé, Xã Phú Xuân..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-600 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-warm-700 mb-1">
                  Địa chỉ cụ thể (Số nhà, tên đường, tòa nhà...) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="Số 123 đường Lê Lợi, Căn hộ A12..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-600 text-sm outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-warm-700">
                  <input
                    type="checkbox"
                    checked={!!addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-700 focus:ring-brand-600"
                  />
                  <span>Đặt làm địa chỉ nhận hàng mặc định</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-warm-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold transition disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu Địa Chỉ</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
