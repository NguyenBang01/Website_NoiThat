import React, { useState } from 'react';
import { Sparkles, Calendar, Compass, User, Palette, CheckCircle2 } from 'lucide-react';

interface FengShuiDetail {
  element: string; // Kim, Mộc, Thủy, Hỏa, Thổ
  napAm: string;
  cungPhi: string;
  group: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh';
  goodDirections: string[];
  luckyColors: { name: string; hex: string; type: 'Tương sinh' | 'Bản mệnh' }[];
  avoidColors: { name: string; hex: string }[];
  interiorAdvice: string;
}

// 60 Hoa Giáp Can Chi & Nạp Âm
const CAN_LIST = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI_LIST = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// Bảng Nạp Âm chuẩn xác
const NAP_AM_MAP: Record<string, { element: string; title: string }> = {
  'Giáp Tý': { element: 'Kim', title: 'Hải Trung Kim (Vàng trong biển)' },
  'Ất Sửu': { element: 'Kim', title: 'Hải Trung Kim (Vàng trong biển)' },
  'Bính Dần': { element: 'Hỏa', title: 'Lư Trung Hỏa (Lửa trong lò)' },
  'Đinh Mão': { element: 'Hỏa', title: 'Lư Trung Hỏa (Lửa trong lò)' },
  'Mậu Thìn': { element: 'Mộc', title: 'Đại Lâm Mộc (Gỗ rừng già)' },
  'Kỷ Tỵ': { element: 'Mộc', title: 'Đại Lâm Mộc (Gỗ rừng già)' },
  'Canh Ngọ': { element: 'Thổ', title: 'Lộ Bàng Thổ (Đất ven đường)' },
  'Tân Mùi': { element: 'Thổ', title: 'Lộ Bàng Thổ (Đất ven đường)' },
  'Nhâm Thân': { element: 'Kim', title: 'Kiếm Phong Kim (Vàng mũi kiếm)' },
  'Quý Dậu': { element: 'Kim', title: 'Kiếm Phong Kim (Vàng mũi kiếm)' },
  'Giáp Tuất': { element: 'Hỏa', title: 'Sơn Đầu Hỏa (Lửa đầu núi)' },
  'Ất Hợi': { element: 'Hỏa', title: 'Sơn Đầu Hỏa (Lửa đầu núi)' },
  'Bính Tý': { element: 'Thủy', title: 'Giản Hạ Thủy (Nước dưới khe)' },
  'Đinh Sửu': { element: 'Thủy', title: 'Giản Hạ Thủy (Nước dưới khe)' },
  'Mậu Dần': { element: 'Thổ', title: 'Thành Đầu Thổ (Đất trên thành)' },
  'Kỷ Mão': { element: 'Thổ', title: 'Thành Đầu Thổ (Đất trên thành)' },
  'Canh Thìn': { element: 'Kim', title: 'Bạch Lạp Kim (Vàng sáp ong)' },
  'Tân Tỵ': { element: 'Kim', title: 'Bạch Lạp Kim (Vàng sáp ong)' },
  'Nhâm Ngọ': { element: 'Mộc', title: 'Dương Liễu Mộc (Gỗ cây dương)' },
  'Quý Mùi': { element: 'Mộc', title: 'Dương Liễu Mộc (Gỗ cây dương)' },
  'Giáp Thân': { element: 'Thủy', title: 'Tuyền Trung Thủy (Nước trong suối)' },
  'Ất Dậu': { element: 'Thủy', title: 'Tuyền Trung Thủy (Nước trong suối)' },
  'Bính Tuất': { element: 'Thổ', title: 'Ốc Thượng Thổ (Đất nóc nhà)' },
  'Đinh Hợi': { element: 'Thổ', title: 'Ốc Thượng Thổ (Đất nóc nhà)' },
  'Mậu Tý': { element: 'Hỏa', title: 'Tích Lịch Hỏa (Lửa sấm sét)' },
  'Kỷ Sửu': { element: 'Hỏa', title: 'Tích Lịch Hỏa (Lửa sấm sét)' },
  'Canh Dần': { element: 'Mộc', title: 'Tùng Bách Mộc (Gỗ tùng bách)' },
  'Tân Mão': { element: 'Mộc', title: 'Tùng Bách Mộc (Gỗ tùng bách)' },
  'Nhâm Thìn': { element: 'Thủy', title: 'Trường Lưu Thủy (Nước chảy dài)' },
  'Quý Tỵ': { element: 'Thủy', title: 'Trường Lưu Thủy (Nước chảy dài)' },
  'Giáp Ngọ': { element: 'Kim', title: 'Sa Trung Kim (Vàng trong cát)' },
  'Ất Mùi': { element: 'Kim', title: 'Sa Trung Kim (Vàng trong cát)' },
  'Bính Thân': { element: 'Hỏa', title: 'Sơn Hạ Hỏa (Lửa dưới núi)' },
  'Đinh Dậu': { element: 'Hỏa', title: 'Sơn Hạ Hỏa (Lửa dưới núi)' },
  'Mậu Tuất': { element: 'Mộc', title: 'Bình Địa Mộc (Gỗ đồng bằng)' },
  'Kỷ Hợi': { element: 'Mộc', title: 'Bình Địa Mộc (Gỗ đồng bằng)' },
  'Canh Tý': { element: 'Thổ', title: 'Bích Thượng Thổ (Đất trên vách)' },
  'Tân Sửu': { element: 'Thổ', title: 'Bích Thượng Thổ (Đất trên vách)' },
  'Nhâm Dần': { element: 'Kim', title: 'Kim Bạch Kim (Vàng lá trắng)' },
  'Quý Mão': { element: 'Kim', title: 'Kim Bạch Kim (Vàng lá trắng)' },
  'Giáp Thìn': { element: 'Hỏa', title: 'Phúc Đăng Hỏa (Lửa ngọn đèn)' },
  'Ất Tỵ': { element: 'Hỏa', title: 'Phúc Đăng Hỏa (Lửa ngọn đèn)' },
  'Bính Ngọ': { element: 'Thủy', title: 'Thiên Hà Thủy (Nước trên trời)' },
  'Đinh Mùi': { element: 'Thủy', title: 'Thiên Hà Thủy (Nước trên trời)' },
  'Mậu Thân': { element: 'Thổ', title: 'Đại Trạch Thổ (Đất nền nhà)' },
  'Kỷ Dậu': { element: 'Thổ', title: 'Đại Trạch Thổ (Đất nền nhà)' },
  'Canh Tuất': { element: 'Kim', title: 'Thoa Xuyến Kim (Vàng trang sức)' },
  'Tân Hợi': { element: 'Kim', title: 'Thoa Xuyến Kim (Vàng trang sức)' },
  'Nhâm Tý': { element: 'Mộc', title: 'Tang Đố Mộc (Gỗ cây dâu)' },
  'Quý Sửu': { element: 'Mộc', title: 'Tang Đố Mộc (Gỗ cây dâu)' },
  'Giáp Dần': { element: 'Thủy', title: 'Đại Khê Thủy (Nước khe lớn)' },
  'Ất Mão': { element: 'Thủy', title: 'Đại Khê Thủy (Nước khe lớn)' },
  'Bính Thìn': { element: 'Thổ', title: 'Sa Trung Thổ (Đất pha cát)' },
  'Đinh Tỵ': { element: 'Thổ', title: 'Sa Trung Thổ (Đất pha cát)' },
  'Mậu Ngọ': { element: 'Hỏa', title: 'Thiên Thượng Hỏa (Lửa trên trời)' },
  'Kỷ Mùi': { element: 'Hỏa', title: 'Thiên Thượng Hỏa (Lửa trên trời)' },
  'Canh Thân': { element: 'Mộc', title: 'Thạch Lựu Mộc (Gỗ cây lựu đá)' },
  'Tân Dậu': { element: 'Mộc', title: 'Thạch Lựu Mộc (Gỗ cây lựu đá)' },
  'Nhâm Tuất': { element: 'Thủy', title: 'Đại Hải Thủy (Nước biển lớn)' },
  'Quý Hợi': { element: 'Thủy', title: 'Đại Hải Thủy (Nước biển lớn)' },
};

function getCanChi(year: number): string {
  const can = CAN_LIST[(year + 6) % 10];
  const chi = CHI_LIST[(year + 8) % 12];
  return `${can} ${chi}`;
}

// Tính Cung Phi Bát Trạch chuẩn xác theo giới tính
function calculateCungPhi(year: number, gender: 'Nam' | 'Nữ'): { cung: string; group: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh'; directions: string[] } {
  // Rút gọn 2 số cuối năm sinh
  let digitsSum = Math.floor(year / 1000) + Math.floor((year % 1000) / 100) + Math.floor((year % 100) / 10) + (year % 10);
  while (digitsSum > 9) {
    digitsSum = Math.floor(digitsSum / 10) + (digitsSum % 10);
  }

  let cungNum: number;
  if (year >= 2000) {
    if (gender === 'Nam') {
      cungNum = 9 - digitsSum;
      if (cungNum <= 0) cungNum += 9;
      if (cungNum === 5) cungNum = 2; // Cung Khôn
    } else {
      cungNum = 6 + digitsSum;
      while (cungNum > 9) cungNum -= 9;
      if (cungNum === 5) cungNum = 8; // Cung Cấn
    }
  } else {
    if (gender === 'Nam') {
      cungNum = 10 - digitsSum;
      while (cungNum > 9) cungNum -= 9;
      if (cungNum === 5) cungNum = 2;
    } else {
      cungNum = 5 + digitsSum;
      while (cungNum > 9) cungNum -= 9;
      if (cungNum === 5) cungNum = 8;
    }
  }

  const CUNG_NAMES: Record<number, { name: string; group: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh'; directions: string[] }> = {
    1: { name: 'Cung Khảm (Thủy)', group: 'Đông Tứ Mệnh', directions: ['Đông Nam (Sinh Khí)', 'Đông (Thiên Y)', 'Nam (Diên Niên)', 'Bắc (Phục Vị)'] },
    2: { name: 'Cung Khôn (Thổ)', group: 'Tây Tứ Mệnh', directions: ['Đông Bắc (Sinh Khí)', 'Tây (Thiên Y)', 'Tây Bắc (Diên Niên)', 'Tây Nam (Phục Vị)'] },
    3: { name: 'Cung Chấn (Mộc)', group: 'Đông Tứ Mệnh', directions: ['Nam (Sinh Khí)', 'Bắc (Thiên Y)', 'Đông Nam (Diên Niên)', 'Đông (Phục Vị)'] },
    4: { name: 'Cung Tốn (Mộc)', group: 'Đông Tứ Mệnh', directions: ['Bắc (Sinh Khí)', 'Nam (Thiên Y)', 'Đông (Diên Niên)', 'Đông Nam (Phục Vị)'] },
    6: { name: 'Cung Càn (Kim)', group: 'Tây Tứ Mệnh', directions: ['Tây (Sinh Khí)', 'Đông Bắc (Thiên Y)', 'Tây Nam (Diên Niên)', 'Tây Bắc (Phục Vị)'] },
    7: { name: 'Cung Đoài (Kim)', group: 'Tây Tứ Mệnh', directions: ['Tây Bắc (Sinh Khí)', 'Tây Nam (Thiên Y)', 'Đông Bắc (Diên Niên)', 'Tây (Phục Vị)'] },
    8: { name: 'Cung Cấn (Thổ)', group: 'Tây Tứ Mệnh', directions: ['Tây Nam (Sinh Khí)', 'Tây Bắc (Thiên Y)', 'Tây (Diên Niên)', 'Đông Bắc (Phục Vị)'] },
    9: { name: 'Cung Ly (Hỏa)', group: 'Đông Tứ Mệnh', directions: ['Đông (Sinh Khí)', 'Đông Nam (Thiên Y)', 'Bắc (Diên Niên)', 'Nam (Phục Vị)'] },
  };

  const selected = CUNG_NAMES[cungNum] || CUNG_NAMES[1];
  return {
    cung: selected.name,
    group: selected.group,
    directions: selected.directions,
  };
}

export default function FengShuiAIAssistant() {
  const [day, setDay] = useState<number>(15);
  const [month, setMonth] = useState<number>(6);
  const [year, setYear] = useState<number>(2003);
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [homeDirection, setHomeDirection] = useState<string>('Đông Nam');

  const canChi = getCanChi(year);
  const napAmData = NAP_AM_MAP[canChi] || { element: 'Mộc', title: 'Dương Liễu Mộc (Gỗ cây dương)' };
  const cungPhiData = calculateCungPhi(year, gender);

  // Bảng màu sắc tương sinh - bản mệnh & kiêng kỵ
  const COLOR_PALETTES: Record<string, { lucky: { name: string; hex: string; type: 'Tương sinh' | 'Bản mệnh' }[]; avoid: { name: string; hex: string }[]; advice: string }> = {
    Mộc: {
      lucky: [
        { name: 'Xanh nước biển', hex: '#0284c7', type: 'Tương sinh' },
        { name: 'Đen than', hex: '#1e293b', type: 'Tương sinh' },
        { name: 'Xanh lá cây', hex: '#16a34a', type: 'Bản mệnh' },
        { name: 'Xanh rêu', hex: '#65a30d', type: 'Bản mệnh' },
        { name: 'Nâu vân gỗ', hex: '#854d0e', type: 'Bản mệnh' },
      ],
      avoid: [
        { name: 'Trắng sứ', hex: '#f8fafc' },
        { name: 'Xám bạc', hex: '#94a3b8' },
        { name: 'Ánh kim', hex: '#eab308' },
      ],
      advice: 'Không gian mở, ánh sáng tự nhiên chan hòa, kết hợp nhiều cây xanh và nội thất gỗ óc chó hoặc gỗ sồi tự nhiên giúp gia chủ đón tài lộc dồi dào.',
    },
    Kim: {
      lucky: [
        { name: 'Vàng hoàng thổ', hex: '#ca8a04', type: 'Tương sinh' },
        { name: 'Nâu đất ấm', hex: '#78350f', type: 'Tương sinh' },
        { name: 'Trắng tinh khôi', hex: '#f8fafc', type: 'Bản mệnh' },
        { name: 'Xám bạc', hex: '#94a3b8', type: 'Bản mệnh' },
        { name: 'Ánh kim PVD', hex: '#eab308', type: 'Bản mệnh' },
      ],
      avoid: [
        { name: 'Đỏ nhung', hex: '#dc2626' },
        { name: 'Cam tươi', hex: '#ea580c' },
        { name: 'Hồng sen', hex: '#ec4899' },
      ],
      advice: 'Nên ưu tiên các đường nét gọn gàng, bề mặt đá cẩm thạch sáng màu, chân bàn ghế kim loại mạ titan hoặc PVD vàng bóng sang trọng.',
    },
    Thủy: {
      lucky: [
        { name: 'Trắng sứ', hex: '#ffffff', type: 'Tương sinh' },
        { name: 'Xám bạc', hex: '#cbd5e1', type: 'Tương sinh' },
        { name: 'Xanh biển sâu', hex: '#0369a1', type: 'Bản mệnh' },
        { name: 'Đen huyền bí', hex: '#0f172a', type: 'Bản mệnh' },
        { name: 'Xanh ngọc', hex: '#0d9488', type: 'Bản mệnh' },
      ],
      avoid: [
        { name: 'Vàng mù tạt', hex: '#ca8a04' },
        { name: 'Nâu đất', hex: '#713f12' },
      ],
      advice: 'Nội thất đường cong bo tròn mềm mại, gương trang trí khổ lớn, tranh trừu tượng sóng nước và điểm xuyết kim loại sáng bóng.',
    },
    Hỏa: {
      lucky: [
        { name: 'Xanh lá tươi', hex: '#22c55e', type: 'Tương sinh' },
        { name: 'Xanh ngọc bích', hex: '#10b981', type: 'Tương sinh' },
        { name: 'Đỏ ấm áp', hex: '#ea580c', type: 'Bản mệnh' },
        { name: 'Cam đất nung', hex: '#c2410c', type: 'Bản mệnh' },
        { name: 'Tím hoa cà', hex: '#a855f7', type: 'Bản mệnh' },
      ],
      avoid: [
        { name: 'Xanh nước biển', hex: '#0284c7' },
        { name: 'Đen tuyền', hex: '#0f172a' },
      ],
      advice: 'Sử dụng sofa tông màu cam đất hoặc đỏ trầm làm điểm nhấn trung tâm, kết hợp ánh sáng đèn vàng 3000K ấm cúng và vật liệu gỗ tương sinh.',
    },
    Thổ: {
      lucky: [
        { name: 'Đỏ đô', hex: '#991b1b', type: 'Tương sinh' },
        { name: 'Cam ấm', hex: '#ea580c', type: 'Tương sinh' },
        { name: 'Nâu đất trầm', hex: '#713f12', type: 'Bản mệnh' },
        { name: 'Vàng cát cháy', hex: '#ca8a04', type: 'Bản mệnh' },
        { name: 'Be cà phê', hex: '#d97706', type: 'Bản mệnh' },
      ],
      avoid: [
        { name: 'Xanh lá cây', hex: '#16a34a' },
        { name: 'Xanh chuối', hex: '#84cc16' },
      ],
      advice: 'Không gian ấm áp, vững chãi với bàn trà mặt đá nhân tạo, bình hoa gốm sứ mộc mạc và sofa bọc vải nỉ cao cấp gam màu đất an yên.',
    },
  };

  const palette = COLOR_PALETTES[napAmData.element] || COLOR_PALETTES['Mộc'];
  const directionsList = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'];

  return (
    <section id="tro-ly-phong-thuy" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <div className="rounded-3xl bg-linear-to-br from-[#e8f7ee] via-[#dcfce7] to-[#bbf7d0]/40 border border-emerald-200/80 p-6 sm:p-10 shadow-elevated relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Form Controls */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/80 shadow-soft space-y-6">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" /> AI Tra Cứu Phong Thủy Góc Nhà Đẹp
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-warm-900 tracking-tight">
                TRỢ LÝ AI PHONG THỦY
              </h3>
              <p className="text-xs text-warm-500">
                Chọn chính xác ngày tháng năm sinh & giới tính để AI tính toán ngũ hành nạp âm, cung phi bát trạch và bảng màu may mắn.
              </p>
            </div>

            <div className="space-y-5">
              {/* Chọn Ngày - Tháng - Năm Sinh */}
              <div>
                <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" /> Ngày tháng năm sinh (Dương lịch)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Ngày */}
                  <div>
                    <label className="text-[11px] text-warm-500 mb-1 block">Ngày</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-xl bg-warm-50 border border-warm-200 text-warm-900 text-sm font-semibold focus:bg-white focus:border-brand-600 outline-hidden transition cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Ngày {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tháng */}
                  <div>
                    <label className="text-[11px] text-warm-500 mb-1 block">Tháng</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-xl bg-warm-50 border border-warm-200 text-warm-900 text-sm font-semibold focus:bg-white focus:border-brand-600 outline-hidden transition cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          Tháng {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Năm */}
                  <div>
                    <label className="text-[11px] text-warm-500 mb-1 block">Năm sinh</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-xl bg-warm-50 border border-warm-200 text-warm-900 text-sm font-semibold focus:bg-white focus:border-brand-600 outline-hidden transition cursor-pointer"
                    >
                      {Array.from({ length: 77 }, (_, i) => 2026 - i).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Giới tính */}
              <div>
                <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-600" /> Giới tính của bạn
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('Nam')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition border cursor-pointer ${
                      gender === 'Nam'
                        ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                        : 'bg-warm-50 border-warm-200 text-warm-700 hover:bg-warm-100'
                    }`}
                  >
                    <span>👨</span> Nam giới
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Nữ')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition border cursor-pointer ${
                      gender === 'Nữ'
                        ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                        : 'bg-warm-50 border-warm-200 text-warm-700 hover:bg-warm-100'
                    }`}
                  >
                    <span>👩</span> Nữ giới
                  </button>
                </div>
              </div>

              {/* Hướng nhà chính */}
              <div>
                <label className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-brand-600" /> Hướng cửa chính hoặc ban công
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {directionsList.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setHomeDirection(d)}
                      className={`py-2 px-1.5 rounded-xl text-xs font-semibold text-center transition border cursor-pointer ${
                        homeDirection === d
                          ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-2xs font-bold'
                          : 'border-warm-200 bg-warm-50 text-warm-700 hover:bg-warm-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-brand-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Đang phân tích cho người sinh ngày <strong>{day}/{month}/{year}</strong> ({canChi}) - Giới tính <strong>{gender}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Live Results */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/80 shadow-soft space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100">
              <h4 className="text-xl font-bold font-serif text-brand-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" /> KẾT QUẢ THAM KHẢO
              </h4>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-800">
                {cungPhiData.group}
              </span>
            </div>

            {/* Mệnh & Can Chi Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="block text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-0.5">
                  Bản Mệnh Ngũ Hành
                </span>
                <span className="text-lg font-black text-brand-900">
                  Mệnh {napAmData.element}
                </span>
                <p className="text-xs text-brand-700 mt-0.5">{napAmData.title}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-warm-50 border border-warm-200">
                <span className="block text-[11px] font-semibold text-warm-600 uppercase tracking-wider mb-0.5">
                  Cung Mệnh ({gender})
                </span>
                <span className="text-lg font-black text-warm-900">
                  {cungPhiData.cung}
                </span>
                <p className="text-xs text-warm-600 mt-0.5">Thuộc {cungPhiData.group}</p>
              </div>
            </div>

            {/* Hướng tốt theo Cung phi */}
            <div>
              <span className="block text-xs font-semibold text-warm-700 uppercase tracking-wider mb-2">
                4 Hướng tốt nhất cho gia chủ ({gender}):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {cungPhiData.directions.map((d) => (
                  <div
                    key={d}
                    className="p-2 rounded-xl bg-warm-50 border border-warm-200 text-center"
                  >
                    <span className="text-xs font-bold text-brand-800 block leading-tight">{d.split(' ')[0]} {d.split(' ')[1] || ''}</span>
                    <span className="text-[10px] text-warm-500 font-medium">{d.substring(d.indexOf('('))}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Màu sắc hợp mệnh */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-warm-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-brand-600" /> Bảng màu hợp mệnh (Tương sinh & Bản mệnh):
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {palette.lucky.map((c, i) => (
                  <div
                    key={i}
                    title={`${c.name} (${c.type})`}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-warm-50 border border-warm-200 text-xs font-medium text-warm-800 hover:border-brand-500 transition"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-warm-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                    <span className="text-[10px] text-brand-700 font-semibold bg-brand-50 px-1.5 py-0.5 rounded-sm">
                      {c.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Màu nên hạn chế */}
            <div>
              <span className="text-[11px] font-semibold text-warm-500 uppercase tracking-wider block mb-1.5">
                Màu sắc tương khắc (Nên hạn chế):
              </span>
              <div className="flex items-center gap-2">
                {palette.avoid.map((c, i) => (
                  <div
                    key={i}
                    title={c.name}
                    className="flex items-center gap-1.5 text-xs text-warm-500 bg-warm-100/60 px-2.5 py-1 rounded-lg border border-warm-200"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-warm-300 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gợi ý bố trí phong thủy nội thất */}
            <div className="pt-3 border-t border-warm-100 space-y-1">
              <span className="block text-xs font-semibold text-brand-800 uppercase tracking-wider">
                Gợi ý bài trí nội thất từ Góc Nhà Đẹp:
              </span>
              <p className="text-xs sm:text-sm text-warm-700 leading-relaxed italic bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                "{palette.advice}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
