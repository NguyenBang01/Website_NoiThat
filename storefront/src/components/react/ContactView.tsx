import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { $auth } from '../../stores/authStore';
import { clientFetch } from '../../lib/api';

export default function ContactView() {
  const auth = useStore($auth);

  const [fullName, setFullName] = useState(auth.user?.full_name || '');
  const [email, setEmail] = useState(auth.user?.email || '');
  const [phone, setPhone] = useState(auth.user?.phone || '');
  const [subject, setSubject] = useState('Tư vấn thiết kế nội thất phòng khách');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await clientFetch<any>('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (res.success) {
        setSuccessMessage(
          'Gửi liên hệ thành công! Ban quản trị và chuyên viên nội thất Góc Nhà Đẹp đã nhận được tin nhắn và sẽ liên hệ tư vấn lại cho bạn trong vòng 30 phút.'
        );
        setMessage('');
        if (!auth.isAuthenticated) {
          setFullName('');
          setEmail('');
          setPhone('');
        }
      } else {
        setErrorMessage(res.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối khi gửi liên hệ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-sans">
      {/* Tiêu đề & Breadcrumbs */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-brand-700 font-bold bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Liên Hệ & Tư Vấn
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-warm-900 mt-3">
          KẾT NỐI VỚI GÓC NHÀ ĐẸP
        </h1>
        <p className="text-xs sm:text-sm text-warm-600 mt-2 leading-relaxed">
          Chúng tôi luôn sẵn sàng lắng nghe và đồng hành kiến tạo không gian sống mơ ước của bạn. Ghé thăm showroom hoặc gửi tin nhắn để nhận tư vấn từ chuyên gia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (5 CỘT): Thông tin Showroom & Kênh trực tiếp */}
        <div className="lg:col-span-5 space-y-6">
          {/* Showroom 1 */}
          <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-7 shadow-xs space-y-4 hover:border-brand-300 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-100">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  Showroom 1 (Tân Phú)
                </span>
                <h3 className="font-serif font-bold text-base text-warm-900 mt-1">
                  Góc Nhà Đẹp - Âu Cơ
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-warm-700 pt-2 border-t border-warm-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>615 Âu Cơ</strong>, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-700 shrink-0" />
                <span>Mở cửa: 08:30 - 21:00 (Thứ 2 - Chủ Nhật)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-700 shrink-0" />
                <span>
                  Hotline: <strong className="text-brand-900">0931.883.988</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Showroom 2 */}
          <div className="bg-white rounded-3xl border border-warm-200 p-6 sm:p-7 shadow-xs space-y-4 hover:border-brand-300 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-100">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  Showroom 2 (Tây Thạnh)
                </span>
                <h3 className="font-serif font-bold text-base text-warm-900 mt-1">
                  Góc Nhà Đẹp - Tây Thạnh
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-warm-700 pt-2 border-t border-warm-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>295 Tây Thạnh</strong>, Phường Tây Thạnh, Quận Tân Phú, TP. Hồ Chí Minh
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-700 shrink-0" />
                <span>Mở cửa: 08:30 - 21:00 (Thứ 2 - Chủ Nhật)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-700 shrink-0" />
                <span>
                  Hotline: <strong className="text-brand-900">0931.883.988</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Kênh kết nối trực tiếp nhanh */}
          <div className="bg-gradient-to-br from-brand-900 to-brand-950 text-white rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-brand-200 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Hỗ trợ tư vấn khẩn cấp 24/7</span>
            </div>
            <h3 className="font-serif text-xl font-bold">
              Bạn cần giải đáp ngay về sản phẩm?
            </h3>
            <p className="text-xs text-brand-200 leading-relaxed">
              Nhân viên tư vấn nội thất và kiến trúc sư của Góc Nhà Đẹp luôn sẵn sàng giải đáp thắc mắc và gửi mẫu thực tế qua Zalo hoặc Hotline.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="https://zalo.me/0931883988"
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl bg-[#0068ff] hover:bg-[#0055d4] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
              >
                <span>Chat Zalo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="tel:0931883988"
                className="py-3 px-4 rounded-xl bg-white hover:bg-warm-100 text-warm-900 text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-brand-700" />
                <span>0931.883.988</span>
              </a>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7 CỘT): Form gửi tin nhắn liên hệ tới Admin */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-warm-200 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="border-b border-warm-100 pb-4">
            <div className="flex items-center gap-2.5 text-brand-700 mb-1">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Hòm thư tiếp nhận yêu cầu
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-warm-900">
              Gửi tin nhắn đến Ban quản trị
            </h2>
            <p className="text-xs text-warm-500 mt-1">
              Tin nhắn của bạn sẽ được chuyển thẳng đến hòm thư quản lý của admin Góc Nhà Đẹp.
            </p>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">
                  Họ và tên của bạn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0931883988"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vidu@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Chủ đề yêu cầu <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 text-xs bg-white focus:outline-none focus:border-brand-700"
              >
                <option value="Tư vấn thiết kế nội thất phòng khách">Tư vấn thiết kế nội thất phòng khách</option>
                <option value="Đặt Sofa / Bàn ăn theo kích thước riêng">Đặt Sofa / Bàn ăn theo kích thước riêng</option>
                <option value="Tư vấn phong thủy hợp mệnh ngũ hành">Tư vấn phong thủy hợp mệnh ngũ hành</option>
                <option value="Báo giá dự án căn hộ / biệt thự">Báo giá dự án căn hộ / biệt thự</option>
                <option value="Hỏi về bảo hành & bảo trì sản phẩm">Hỏi về bảo hành & bảo trì sản phẩm</option>
                <option value="Hợp tác kinh doanh & đối tác">Hợp tác kinh doanh & đối tác</option>
                <option value="Ý kiến đóng góp & phản ánh dịch vụ">Ý kiến đóng góp & phản ánh dịch vụ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-700 mb-1.5">
                Nội dung tin nhắn / Yêu cầu chi tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Vui lòng mô tả chi tiết yêu cầu, mẫu mã bạn quan tâm, kích thước phòng hoặc diện tích nhà cần tư vấn..."
                className="w-full p-3.5 rounded-xl border border-warm-200 text-xs focus:outline-none focus:border-brand-700"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ĐANG GỬI TIN NHẮN TỚI ADMIN...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>GỬI LIÊN HỆ ĐẾN GÓC NHÀ ĐẸP</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
