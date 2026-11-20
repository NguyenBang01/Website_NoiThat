import React, { useState } from 'react';
import { toast } from 'sonner';
import { clientFetch } from '../../lib/api';

/**
 * ConsultationBanner.tsx
 * Chuẩn thiết kế Figma: Frame 1000003320 (Ảnh 4 -> 8)
 * - Container tổng (Ảnh 4): Frame 1000003320 (1440px x 479px)
 * - Hình ảnh minh họa bên trái (Ảnh 8): 634.png (533px x 479px)
 * - Khung nội dung bên phải (Ảnh 5): Frame 1000003318 (Fixed 909px x Hug 190px, Gap 24px)
 *   + Tiêu đề & phụ đề (Ảnh 6): Frame 1000003319 (Fill 909px x Hug 118px, Gap 16px)
 *     - Tiêu đề: "KIẾN TẠO KHÔNG GIAN SỐNG THEO PHONG CÁCH CỦA BẠN"
 *     - Phụ đề (italic): "Để lại thông tin, đội ngũ Góc Nhà Đẹp sẽ liên hệ tư vấn miễn phí..."
 *   + Form nhập liệu (Ảnh 7): Frame 1000003317 (Fixed 758px x Hug 48px, Gap 24px, Flow Horizontal)
 *     - Input 1: "Họ và tên" (h-48px)
 *     - Input 2: "Số điện thoại" (h-48px)
 *     - Button: "Gửi yêu cầu" (h-48px, Green)
 */
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
          message: `Khách hàng ${fullName} (SĐT: ${phone}) yêu cầu tư vấn giải pháp nội thất theo phong cách sống từ Góc Nhà Đẹp.`,
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
    <section className="w-full font-sans select-none box-border py-2">
      {/* Frame 1000003320: 1440px x 479px chuẩn Figma Ảnh 4 */}
      <div className="w-full max-w-[1440px] mx-auto min-h-[440px] lg:h-[479px] bg-[#ecfaeb] rounded-[16px] overflow-hidden flex flex-col lg:flex-row items-center justify-between box-border relative shadow-xs">
        {/* Hình minh họa chuẩn Figma Ảnh 8: 634.png (533px x 479px) */}
        <div className="relative w-full lg:w-[533px] h-[320px] lg:h-[479px] shrink-0 flex items-center justify-center lg:justify-start">
          <img
            src="/consultation_illustration.png"
            alt="Kiến tạo không gian sống theo phong cách của bạn - Góc Nhà Đẹp"
            className="w-full h-full object-contain object-left pointer-events-none"
            loading="lazy"
          />
        </div>

        {/* Frame 1000003318: Khung nội dung chuẩn Figma Ảnh 5 (Fixed 909px x Hug 190px, Gap 24px) */}
        <div className="w-full lg:w-[909px] flex flex-col justify-center items-center lg:items-start gap-[24px] p-6 lg:p-0 lg:pr-12 box-border z-10">
          {/* Frame 1000003319: Tiêu đề và Phụ đề chuẩn Figma Ảnh 6 (Fill 909px x Hug 118px, Gap 16px) */}
          <div className="w-full max-w-[909px] flex flex-col gap-[16px] text-center lg:text-left">
            <h3
              className="text-[22px] sm:text-[26px] lg:text-[30px] font-extrabold uppercase tracking-tight text-[#15803d] m-0 p-0 leading-tight"
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}
            >
              KIẾN TẠO KHÔNG GIAN SỐNG THEO PHONG CÁCH CỦA BẠN
            </h3>
            <p className="text-[13px] sm:text-[14px] lg:text-[15px] italic text-[#166534] leading-relaxed m-0 p-0">
              Để lại thông tin, đội ngũ Góc Nhà Đẹp sẽ liên hệ tư vấn miễn phí
              <br className="hidden sm:inline" />
              và giúp bạn lựa chọn giải pháp nội thất phù hợp nhất.
            </p>
          </div>

          {/* Frame 1000003317: Form nhập liệu chuẩn Figma Ảnh 7 (Fixed 758px x Hug 48px, Gap 24px) */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[758px] flex flex-col sm:flex-row items-center gap-[16px] sm:gap-[24px] box-border"
          >
            {/* Input 1: Họ và tên */}
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Họ và tên"
              className="w-full sm:flex-1 h-[48px] px-[16px] rounded-[4px] bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 text-[14px] focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none shadow-2xs transition-all box-border"
            />

            {/* Input 2: Số điện thoại */}
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại"
              className="w-full sm:flex-1 h-[48px] px-[16px] rounded-[4px] bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 text-[14px] focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none shadow-2xs transition-all box-border"
            />

            {/* Nút: Gửi yêu cầu */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-[190px] h-[48px] px-[24px] rounded-[4px] bg-gradient-to-r from-[#15803d] to-[#16a34a] hover:from-[#166534] hover:to-[#15803d] disabled:opacity-60 text-white font-bold text-[14px] tracking-wide transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0 flex items-center justify-center box-border"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
