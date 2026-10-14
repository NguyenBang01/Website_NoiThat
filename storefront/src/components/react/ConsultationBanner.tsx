import React, { useState } from 'react';
import { toast } from 'sonner';
import { clientFetch } from '../../lib/api';

export default function ConsultationBanner() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clientFetch('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: 'khachhang@gocnhadep.vn',
          subject: 'Đăng ký tư vấn thiết kế nội thất',
          message: `Khách hàng ${fullName} (SĐT: ${phone}) yêu cầu tư vấn giải pháp nội thất theo phong cách sống.`,
        }),
      });

      if (res.success) {
        toast.success('Cảm ơn bạn! Đội ngũ Góc Nhà Đẹp sẽ liên hệ trong ít phút.', {
          description: `Chúng tôi đã ghi nhận số điện thoại: ${phone}`,
        });
        setFullName('');
        setPhone('');
      } else {
        toast.error(res.message || 'Gửi yêu cầu thất bại');
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="relative rounded-3xl bg-[#dcfce7]/70 border border-[#bbf7d0] p-6 sm:p-10 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-soft">
        {/* Decorative elements */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Text column */}
        <div className="relative z-10 max-w-xl space-y-3 text-center lg:text-left">
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-brand-900 tracking-tight leading-tight">
            KIẾN TẠO KHÔNG GIAN SỐNG THEO PHONG CÁCH CỦA BẠN
          </h3>
          <p className="text-xs sm:text-sm text-warm-700 leading-relaxed font-normal">
            Để lại thông tin, đội ngũ <strong>Góc Nhà Đẹp</strong> sẽ liên hệ tư vấn miễn phí và giúp bạn lựa chọn giải pháp nội thất phù hợp nhất.
          </p>
        </div>

        {/* Form column */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0"
        >
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Họ và tên"
            className="w-full sm:w-52 h-12 px-4 rounded-xl bg-white border border-warm-200 text-warm-900 placeholder-warm-400 text-sm focus:border-brand-600 outline-hidden transition shadow-2xs"
          />
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số điện thoại"
            className="w-full sm:w-52 h-12 px-4 rounded-xl bg-white border border-warm-200 text-warm-900 placeholder-warm-400 text-sm focus:border-brand-600 outline-hidden transition shadow-2xs"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-bold text-sm tracking-wide transition shadow-sm hover:shadow shrink-0 cursor-pointer"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>
      </div>
    </section>
  );
}
