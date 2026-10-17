import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Plus,
  Minus,
  Trash2,
  Phone,
  MapPin,
  Copy,
  Check,
  AlertCircle,
  User,
  Lock,
  Mail,
  Package,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { $cart, updateQuantity, removeFromCart, clearCart } from '../../stores/cartStore';
import { $auth, setAuth, openAuthModal } from '../../stores/authStore';
import { clientFetch } from '../../lib/api';
import { formatCurrency, imgUrl } from '../../lib/format';

interface AppliedCoupon {
  code: string;
  discountAmount: number;
  message: string;
}

export default function CheckoutView() {
  const cart = useStore($cart);
  const auth = useStore($auth);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);

  // Address fields
  const [province, setProvince] = useState('Thành phố Hồ Chí Minh');
  const [district, setDistrict] = useState('Quận Tân Phú');
  const [ward, setWard] = useState('Phường Phú Trung');
  const [street, setStreet] = useState('');
  const [note, setNote] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');

  // Coupon
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // SePay Payment Polling state
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Tự động kiểm tra trạng thái thanh toán SePay khi khách chọn chuyển khoản
  useEffect(() => {
    if (!orderSuccess || orderSuccess.paymentMethod !== 'bank_transfer' || isPaidSuccess) {
      return;
    }

    const orderNumber = orderSuccess.order_number || orderSuccess.order_code;
    if (!orderNumber) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await clientFetch<{ is_paid: boolean; status: string }>(`/payment/check/${encodeURIComponent(orderNumber)}`);
        if (res.data?.is_paid && isMounted) {
          setIsPaidSuccess(true);
          await clearCart();
          clearInterval(interval);
        }
      } catch {
        // Bỏ qua lỗi kết nối khi đang polling
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderSuccess, isPaidSuccess]);

  const handleManualCheckPayment = async () => {
    const orderNumber = orderSuccess?.order_number || orderSuccess?.order_code;
    if (!orderNumber) return;
    setIsCheckingPayment(true);
    try {
      const res = await clientFetch<{ is_paid: boolean; status: string }>(`/payment/check/${encodeURIComponent(orderNumber)}`);
      if (res.data?.is_paid) {
        setIsPaidSuccess(true);
        await clearCart();
      } else {
        alert('Hệ thống chưa nhận được thông báo từ ngân hàng. Nếu bạn vừa chuyển khoản, vui lòng chờ trong 10-30 giây để SePay xử lý.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ đối soát.');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleCancelPayment = async () => {
    const orderNumber = orderSuccess?.order_number || orderSuccess?.order_code;
    if (!orderNumber) {
      setOrderSuccess(null);
      return;
    }
    if (confirm('Bạn có chắc chắn muốn hủy giao dịch chuyển khoản này và quay lại kiểm tra giỏ hàng?')) {
      try {
        await clientFetch(`/payment/cancel/${encodeURIComponent(orderNumber)}`, { method: 'POST' });
      } catch {
        // Bỏ qua
      }
      setOrderSuccess(null);
      setIsPaidSuccess(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Điền trước thông tin nếu khách đã đăng nhập
  useEffect(() => {
    if (auth.user) {
      if (!recipientName) setRecipientName(auth.user.full_name || '');
      if (!recipientPhone) setRecipientPhone(auth.user.phone || '');
      if (!recipientEmail) setRecipientEmail(auth.user.email || '');
      setIsNewAccount(false);
    }
  }, [auth.user]);

  // Tính toán phí vận chuyển & tổng tiền
  const subtotal = cart.subtotal;
  const shippingFee = 0; // Miễn phí vận chuyển & lắp đặt Góc Nhà Đẹp
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  // Kiểm tra & áp dụng mã giảm giá
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await clientFetch<any>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          order_total: subtotal,
        }),
      });

      if (res.success && res.data && res.data.valid) {
        setAppliedCoupon({
          code: res.data.code || code,
          discountAmount: res.data.discount_amount || 0,
          message: res.data.message || 'Áp dụng mã giảm giá thành công!',
        });
        setCouponCodeInput('');
      } else {
        setCouponError(res.data?.message || res.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Lỗi kiểm tra mã giảm giá');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Tự động cập nhật mức giảm hoặc cảnh báo nếu tổng giỏ hàng thay đổi
  useEffect(() => {
    if (!appliedCoupon) return;
    let isCancelled = false;

    if (subtotal <= 0) {
      setAppliedCoupon(null);
      return;
    }

    const revalidate = async () => {
      try {
        const res = await clientFetch<any>('/coupons/validate', {
          method: 'POST',
          body: JSON.stringify({
            code: appliedCoupon.code,
            order_total: subtotal,
          }),
        });

        if (isCancelled) return;

        if (res.success && res.data && res.data.valid) {
          setAppliedCoupon((prev) =>
            prev
              ? {
                  ...prev,
                  discountAmount: res.data.discount_amount || 0,
                  message: res.data.message || 'Áp dụng mã giảm giá thành công!',
                }
              : null
          );
          setCouponError('');
        } else {
          setCouponError(
            res.data?.message || 'Mã giảm giá không còn đủ điều kiện áp dụng cho đơn hàng hiện tại'
          );
          setAppliedCoupon(null);
        }
      } catch {
        // Ignored in background revalidation
      }
    };

    revalidate();

    return () => {
      isCancelled = true;
    };
  }, [subtotal]);

  // Sao chép nội dung chuyển khoản
  const handleCopyMemo = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  // Xử lý gửi đơn hàng
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (cart.items.length === 0) {
      setSubmitError('Giỏ hàng của bạn đang trống.');
      return;
    }

    if (!recipientName.trim()) {
      setSubmitError('Vui lòng nhập họ và tên người nhận hàng.');
      return;
    }

    if (!recipientPhone.trim()) {
      setSubmitError('Vui lòng nhập số điện thoại người nhận hàng.');
      return;
    }

    if (!street.trim()) {
      setSubmitError('Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường).');
      return;
    }

    const fullShippingAddress = `${street.trim()}, ${ward}, ${district}, ${province}`;

    setIsSubmitting(true);

    try {
      let currentToken = auth.token;

      // Nếu chưa đăng nhập:
      // Tự động tạo tài khoản hoặc đăng nhập với email/password đã nhập
      if (!auth.isAuthenticated) {
        if (!recipientEmail.trim()) {
          setSubmitError('Vui lòng nhập email để nhận xác nhận đơn hàng.');
          setIsSubmitting(false);
          return;
        }

        const pwd = password.trim() || 'GocNhaDep@2026'; // Default an toàn nếu khách không nhập
        try {
          const regRes = await clientFetch<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              full_name: recipientName.trim(),
              email: recipientEmail.trim(),
              phone: recipientPhone.trim(),
              password: pwd,
            }),
          });

          if (regRes.success && regRes.data) {
            currentToken = regRes.data.access_token;
            setAuth(regRes.data.access_token, regRes.data.user);
          } else {
            // Có thể email đã tồn tại -> thử login với password nếu đã nhập
            const loginRes = await clientFetch<any>('/auth/login', {
              method: 'POST',
              body: JSON.stringify({
                email: recipientEmail.trim(),
                password: pwd,
              }),
            });

            if (loginRes.success && loginRes.data) {
              currentToken = loginRes.data.access_token;
              setAuth(loginRes.data.access_token, loginRes.data.user);
            } else {
              setSubmitError(
                'Email này đã được sử dụng. Vui lòng bấm "Đăng nhập" ở góc phải để tiếp tục đặt hàng.'
              );
              setIsSubmitting(false);
              return;
            }
          }
        } catch (authErr: any) {
          setSubmitError(authErr.message || 'Lỗi xác thực tài khoản đặt hàng');
          setIsSubmitting(false);
          return;
        }
      }

      // Chuẩn bị items theo DTO của backend
      const orderItems = cart.items.map((it) => ({
        variant_id: it.variant_id,
        quantity: it.quantity,
      }));

      const payload = {
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        shipping_address: fullShippingAddress,
        coupon_code: appliedCoupon ? appliedCoupon.code : '',
        note: note.trim()
          ? `${note.trim()} [Phương thức: ${paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản SePay'}]`
          : `[Phương thức: ${paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản SePay'}]`,
        payment_method: paymentMethod,
        items: orderItems,
      };

      const res = await clientFetch<any>('/orders', {
        method: 'POST',
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : undefined,
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setOrderSuccess({
          ...res.data,
          paymentMethod,
          snapshotItems: [...cart.items],
        });
        if (paymentMethod === 'cod') {
          await clearCart();
          setIsPaidSuccess(true);
        } else {
          setIsPaidSuccess(false);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitError(res.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Có lỗi xảy ra trong quá trình đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  // MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG
  if (orderSuccess) {
    const isBank = orderSuccess.paymentMethod === 'bank_transfer';
    const orderNumber = orderSuccess.order_number || orderSuccess.order_code || `FS-${Date.now()}`;
    const orderTotal = orderSuccess.total_amount || totalAmount;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
        <div className="bg-white rounded-3xl border border-warm-200 shadow-xl overflow-hidden">
          {/* Header trạng thái */}
          {isBank && !isPaidSuccess ? (
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-8 sm:p-10 text-center relative border-b border-amber-500/30">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto mb-4 border border-amber-400/30 animate-pulse">
                <QrCode className="w-8 h-8 text-amber-400" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-2">
                <span>⏳ Đang chờ thanh toán chuyển khoản</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                VUI LÒNG QUÉT MÃ QR ĐỂ HOÀN TẤT ĐẶT HÀNG
              </h1>
              <p className="text-amber-100/80 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                Đơn hàng chưa hoàn tất. Vui lòng quét mã VietQR bên dưới để chuyển khoản. Sau khi SePay ghi nhận tiền vào tài khoản MB Bank, đơn hàng sẽ chính thức được tạo và chuyển vào <strong className="text-amber-300">Đơn hàng của tôi</strong>.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-800 border border-stone-700 text-xs text-stone-300 font-mono font-medium">
                Mã thanh toán: <span className="text-amber-300 font-bold">{orderNumber}</span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-brand-800 to-brand-900 text-white p-8 sm:p-10 text-center relative">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto mb-4 border border-emerald-400/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                {isBank ? '🎉 THANH TOÁN & ĐẶT HÀNG THÀNH CÔNG!' : 'ĐẶT HÀNG THÀNH CÔNG!'}
              </h1>
              <p className="text-brand-200 text-sm mt-2 max-w-lg mx-auto">
                {isBank
                  ? 'Hệ thống SePay đã xác nhận khoản chuyển khoản qua MB Bank. Đơn hàng của bạn đã chính thức được kích hoạt và chuyển vào mục Đơn hàng của tôi.'
                  : 'Cảm ơn bạn đã tin tưởng lựa chọn Góc Nhà Đẹp. Đơn hàng COD của bạn đã được ghi nhận và đang chuẩn bị giao tới bạn.'}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-700/60 border border-brand-600 text-xs text-brand-100 font-mono font-medium">
                Mã đơn hàng: <span className="text-white font-bold">{orderNumber}</span>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-8">
            {/* Nếu thanh toán chuyển khoản: hiện mã QR VietQR hoặc thông báo đã thanh toán */}
            {isBank && (
              isPaidSuccess ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                      Cổng thanh toán SePay
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mt-2 font-serif">
                      ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG!
                    </h2>
                    <p className="text-sm text-emerald-800 max-w-lg mx-auto mt-1">
                      Hệ thống SePay đã tự động ghi nhận thanh toán cho đơn hàng <strong className="text-emerald-950 font-mono font-bold">{orderNumber}</strong> qua ngân hàng <strong className="text-emerald-950 font-semibold">MB Bank</strong>.
                    </p>
                  </div>
                  <div className="p-4 bg-white/80 rounded-xl border border-emerald-200 max-w-md mx-auto text-xs text-warm-700 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span>Số tiền đã thanh toán:</span>
                      <strong className="text-emerald-700 font-bold text-sm">{formatCurrency(orderTotal)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Trạng thái đơn hàng:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">Đã xác nhận (Confirmed)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 text-amber-900 font-bold text-lg">
                        <QrCode className="w-6 h-6 text-amber-700" />
                        <span>Quét mã VietQR để thanh toán tự động (SePay)</span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1">
                        Vui lòng quét mã QR qua ứng dụng ngân hàng. Hệ thống SePay sẽ tự động đối soát và kích hoạt đơn ngay tức thì.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualCheckPayment}
                      disabled={isCheckingPayment}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-60 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      {isCheckingPayment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>{isCheckingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển tiền'}</span>
                    </button>
                  </div>

                  {/* Thanh trạng thái tự động */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/80 border border-amber-200 text-xs text-amber-900">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium">
                      Đang lắng nghe giao dịch SePay theo thời gian thực (tự động cập nhật khi chuyển tiền xong)...
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-amber-200 shadow-xs">
                      <img
                        src={`https://img.vietqr.io/image/970422-0931883988-compact2.png?amount=${orderTotal}&addInfo=${orderNumber}&accountName=NGUYEN%20TRONG%20BANG`}
                        alt="VietQR MB Bank - NGUYEN TRONG BANG"
                        className="w-56 h-auto rounded-xl"
                      />
                      <span className="text-[11px] text-warm-500 mt-2 font-medium">
                        Mã QR thanh toán tự động VietQR (MB Bank)
                      </span>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm">
                      <div className="p-3 bg-white rounded-xl border border-warm-200 flex justify-between items-center">
                        <span className="text-warm-500">Ngân hàng:</span>
                        <strong className="text-warm-900 font-semibold">MB Bank (Quân Đội)</strong>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-warm-200 flex justify-between items-center">
                        <span className="text-warm-500">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-brand-900 font-mono font-bold text-base">
                            0931883988
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopyMemo('0931883988')}
                            className="p-1 text-warm-400 hover:text-brand-700 transition"
                            title="Sao chép"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-warm-200 flex justify-between items-center">
                        <span className="text-warm-500">Chủ tài khoản:</span>
                        <strong className="text-warm-900 font-semibold uppercase">
                          NGUYEN TRONG BANG
                        </strong>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-warm-200 flex justify-between items-center">
                        <span className="text-warm-500">Số tiền:</span>
                        <strong className="text-emerald-700 font-bold text-base font-serif">
                          {formatCurrency(orderTotal)}
                        </strong>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                        <span className="text-emerald-800 font-medium">Nội dung CK:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-emerald-900 font-mono font-bold text-sm">
                            {orderNumber}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopyMemo(orderNumber)}
                            className="p-1 px-2 text-xs rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 flex items-center gap-1 transition"
                          >
                            {copiedMemo ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedMemo ? 'Đã copy' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Thông tin người nhận & giao hàng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-warm-50 p-6 rounded-2xl border border-warm-200 space-y-3">
                <h3 className="font-semibold text-warm-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-700" />
                  Địa chỉ nhận hàng
                </h3>
                <div className="space-y-1.5 text-xs text-warm-700">
                  <p>
                    <span className="text-warm-400">Người nhận:</span>{' '}
                    <strong className="text-warm-900">{orderSuccess.recipient_name}</strong>
                  </p>
                  <p>
                    <span className="text-warm-400">Điện thoại:</span>{' '}
                    <strong className="text-warm-900">{orderSuccess.recipient_phone}</strong>
                  </p>
                  <p>
                    <span className="text-warm-400">Địa chỉ:</span>{' '}
                    <strong className="text-warm-900">{orderSuccess.shipping_address}</strong>
                  </p>
                  {orderSuccess.note && (
                    <p>
                      <span className="text-warm-400">Ghi chú:</span> {orderSuccess.note}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-warm-50 p-6 rounded-2xl border border-warm-200 space-y-3">
                <h3 className="font-semibold text-warm-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-700" />
                  Phương thức thanh toán
                </h3>
                <div className="space-y-1.5 text-xs text-warm-700">
                  <p>
                    <span className="text-warm-400">Hình thức:</span>{' '}
                    <strong className="text-warm-900">
                      {isBank
                        ? 'Chuyển khoản ngân hàng (VietQR)'
                        : 'Thanh toán khi nhận hàng (COD)'}
                    </strong>
                  </p>
                  <p>
                    <span className="text-warm-400">Trạng thái:</span>{' '}
                    {isBank && !isPaidSuccess ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse">
                        ⏳ Chờ thanh toán chuyển khoản
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-bold">
                        {isBank ? 'Đã xác nhận thanh toán (SePay)' : 'Đang chờ xác nhận (COD)'}
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="text-warm-400">Thời gian dự kiến giao:</span>{' '}
                    <strong className="text-warm-900">2 - 3 ngày làm việc</strong>
                  </p>
                  <p className="text-[11px] text-warm-500 pt-1">
                    Nhân viên showroom Góc Nhà Đẹp sẽ liên hệ trước khi vận chuyển và lắp đặt.
                  </p>
                </div>
              </div>
            </div>

            {/* Hotline & Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-warm-200">
              <div className="flex items-center gap-3 text-xs text-warm-600">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-warm-800">Cần tư vấn hỗ trợ đơn hàng?</p>
                  <a
                    href="tel:0931883988"
                    className="font-bold text-brand-700 hover:text-brand-800 text-sm"
                  >
                    0931.883.988 (Hotline 24/7)
                  </a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {isBank && !isPaidSuccess ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelPayment}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs uppercase tracking-wider transition text-center shadow-xs cursor-pointer"
                    >
                      Hủy & Quay lại giỏ hàng
                    </button>
                    <button
                      type="button"
                      onClick={handleManualCheckPayment}
                      disabled={isCheckingPayment}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-700 text-white font-semibold text-xs uppercase tracking-wider hover:bg-amber-800 transition text-center shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isCheckingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      <span>Kiểm tra thanh toán</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/orders"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-warm-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-black transition text-center shadow-xs flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4 text-brand-300" />
                      <span>Xem đơn hàng của tôi</span>
                    </a>
                    <a
                      href="/"
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-700 text-white font-semibold text-xs uppercase tracking-wider hover:bg-brand-800 transition text-center shadow-xs"
                    >
                      Tiếp tục mua hàng
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NẾU GIỎ HÀNG TRỐNG
  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center font-sans">
        <div className="w-20 h-20 rounded-full bg-warm-100 text-warm-400 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-warm-900 mb-2">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="text-sm text-warm-500 max-w-md mx-auto mb-8">
          Hãy khám phá những bộ sưu tập bàn ghế, sofa, giường tủ sang trọng tại Góc Nhà Đẹp và thêm sản phẩm yêu thích vào giỏ hàng.
        </p>
        <a
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-700 text-white text-xs uppercase font-bold tracking-wider hover:bg-brand-800 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Khám phá sản phẩm ngay
        </a>
      </div>
    );
  }

  // FORM THANH TOÁN CHÍNH (2 CỘT)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-sans">
      {/* Tiêu đề & Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-warm-500 mb-2">
          <a href="/" className="hover:text-brand-700 transition">
            Trang chủ
          </a>
          <span>/</span>
          <span className="text-warm-800 font-medium">Thanh toán đơn hàng</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-warm-900">
          THANH TOÁN ĐƠN HÀNG
        </h1>
        <p className="text-xs sm:text-sm text-warm-500 mt-1">
          Vui lòng kiểm tra lại thông tin nhận hàng và phương thức thanh toán của bạn.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (7 CỘT): Thông tin nhận hàng & Thanh toán */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Trạng thái tài khoản */}
          <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-warm-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-warm-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-700" />
                Thông tin người đặt hàng
              </h2>
              {auth.isAuthenticated ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium">
                  <Check className="w-3.5 h-3.5" /> Đã đăng nhập
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                >
                  Đã có tài khoản? Đăng nhập ngay
                </button>
              )}
            </div>

            {auth.isAuthenticated ? (
              <div className="pt-4 text-xs text-warm-600 space-y-1">
                <p>
                  Đặt hàng với tài khoản:{' '}
                  <strong className="text-warm-900">{auth.user?.full_name}</strong>
                </p>
                <p>
                  Email: <span className="font-mono text-warm-800">{auth.user?.email}</span>
                </p>
              </div>
            ) : (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-warm-700 mb-1.5">
                      Email nhận hóa đơn & mã tra cứu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                      <input
                        type="email"
                        required
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="vidu@gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-warm-700 mb-1.5">
                      Mật khẩu tạo tài khoản <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                      <input
                        type="password"
                        minLength={6}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-warm-500 italic">
                  * Hệ thống sẽ tự động tạo tài khoản cho bạn để theo dõi hành trình giao hàng và nhận bảo hành điện tử chính hãng.
                </p>
              </div>
            )}

            {/* Thông tin người nhận */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">
                  Họ và tên người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">
                  Số điện thoại người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Ví dụ: 0931883988"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>
          </div>

          {/* 2. Địa chỉ giao hàng */}
          <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-warm-900 flex items-center gap-2 pb-3 border-b border-warm-100">
              <MapPin className="w-4 h-4 text-brand-700" />
              Địa chỉ nhận hàng (Showroom / Tận nhà)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-warm-200 text-xs bg-white focus:outline-none focus:border-brand-700"
                >
                  <option value="Thành phố Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">
                  Quận / Huyện
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Quận/Huyện"
                  className="w-full px-3 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">
                  Phường / Xã
                </label>
                <input
                  type="text"
                  required
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Phường/Xã"
                  className="w-full px-3 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Ví dụ: 615 Âu Cơ hoặc 295 Tây Thạnh..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Ghi chú đơn hàng (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao 30 phút..."
                className="w-full px-3.5 py-2 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700"
              />
            </div>
          </div>

          {/* 3. Phương thức thanh toán */}
          <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-warm-900 flex items-center gap-2 pb-3 border-b border-warm-100">
              <CreditCard className="w-4 h-4 text-brand-700" />
              Phương thức thanh toán
            </h2>

            <div className="space-y-3">
              {/* Option 1: COD */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                  paymentMethod === 'cod'
                    ? 'border-brand-700 bg-brand-50/40 ring-1 ring-brand-700'
                    : 'border-warm-200 hover:border-warm-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-brand-700 focus:ring-brand-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-warm-700" />
                    <span className="text-xs font-bold text-warm-900">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </div>
                  <p className="text-[11px] text-warm-500 mt-0.5">
                    Kiểm tra sản phẩm và thanh toán bằng tiền mặt trực tiếp cho nhân viên giao vận Góc Nhà Đẹp.
                  </p>
                </div>
              </label>

              {/* Option 2: VietQR */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-brand-700 bg-brand-50/40 ring-1 ring-brand-700'
                    : 'border-warm-200 hover:border-warm-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="mt-1 text-brand-700 focus:ring-brand-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-brand-700" />
                    <span className="text-xs font-bold text-warm-900">
                      Chuyển khoản ngân hàng (VietQR / Internet Banking)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-warm-500 mt-0.5">
                    Quét mã VietQR qua MB Bank (Chủ TK: NGUYEN TRONG BANG - STK: 0931883988). Cổng SePay tự động xác nhận đơn hàng ngay tức thì.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 CỘT): Tóm tắt đơn hàng & Coupon */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-warm-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-warm-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-700" />
                Đơn hàng của bạn ({cart.totalQuantity} sản phẩm)
              </h2>
            </div>

            {/* Danh sách sản phẩm trong giỏ */}
            <div className="divide-y divide-warm-100 max-h-80 overflow-y-auto pr-1 space-y-3">
              {cart.items.map((item) => (
                <div key={`${item.variant_id}-${item.id}`} className="pt-3 first:pt-0 flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-warm-100 border border-warm-200 overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={imgUrl(item.image_url)}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-warm-300">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-warm-900 line-clamp-1">
                          {item.product_name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item)}
                          className="text-warm-400 hover:text-rose-600 transition p-0.5"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-warm-500">
                        {item.color || item.material || item.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Bộ tăng giảm số lượng mini */}
                      <div className="flex items-center rounded border border-warm-200 bg-warm-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          className="p-1 text-warm-600 hover:bg-warm-100"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium text-warm-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          className="p-1 text-warm-600 hover:bg-warm-100"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-brand-800 font-serif">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ô nhập mã giảm giá */}
            <div className="pt-2">
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-mono font-bold">{appliedCoupon.code}</span>
                      <span className="text-emerald-700 ml-1">
                        (-{formatCurrency(appliedCoupon.discountAmount)})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline"
                  >
                    Bỏ mã
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="Mã giảm giá (ví dụ: SALE10)"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-warm-200 text-xs uppercase font-mono focus:outline-none focus:border-brand-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCodeInput.trim()}
                      className="px-4 py-2 rounded-xl bg-warm-900 text-white text-xs font-medium hover:bg-black disabled:opacity-50 transition shrink-0"
                    >
                      {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bảng chi tiết tiền */}
            <div className="pt-4 border-t border-warm-200 space-y-2.5 text-xs text-warm-600">
              <div className="flex justify-between">
                <span>Tạm tính ({cart.totalQuantity} món):</span>
                <span className="font-semibold text-warm-900 font-serif">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm giá khuyến mãi:</span>
                  <span className="font-semibold font-serif">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Phí vận chuyển & lắp đặt:</span>
                <span className="text-emerald-700 font-semibold uppercase text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                  Miễn phí
                </span>
              </div>

              <div className="pt-3 border-t border-warm-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-warm-900">Tổng thanh toán:</span>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-brand-900 font-serif block">
                    {formatCurrency(totalAmount)}
                  </span>
                  <span className="text-[10px] text-warm-400">(Đã bao gồm VAT)</span>
                </div>
              </div>
            </div>

            {/* Nút đặt hàng */}
            <button
              type="submit"
              disabled={isSubmitting || cart.items.length === 0}
              className="w-full py-4 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ĐANG XỬ LÝ...</span>
                </>
              ) : (
                <span>
                  {paymentMethod === 'bank_transfer'
                    ? 'TIẾP TỤC QUÉT MÃ THANH TOÁN (SEPAY) →'
                    : 'XÁC NHẬN ĐẶT HÀNG (COD)'}
                </span>
              )}
            </button>

            {/* Cam kết thương hiệu */}
            <div className="p-4 rounded-xl bg-warm-50 border border-warm-100 space-y-2 text-[11px] text-warm-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span>Bảo hành chính hãng 12 - 24 tháng tại Góc Nhà Đẹp</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span>Giao hàng và lắp đặt tận nhà miễn phí</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span>Hotline giải đáp: <strong>0931.883.988</strong></span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
