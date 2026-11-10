/**
 * Thư viện kiểm tra dữ liệu đầu vào (Validation) chuẩn tiếng Việt
 * Áp dụng cho Số điện thoại (SĐT), Họ và tên, và Địa chỉ giao nhận.
 */

// Bảng kiểm tra đầu số hợp lệ của các nhà mạng Việt Nam:
// Viettel: 032-039, 086, 096, 097, 098
// Mobifone: 070, 076, 077, 078, 079, 089, 090, 093
// Vinaphone: 081, 082, 083, 084, 085, 088, 091, 094
// Vietnamobile: 052, 056, 058, 092
// Gmobile/Itelecom/Wintel/FPT: 055, 059, 087, 077...
const VN_PHONE_REGEX = /^(0)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

// Regex cho họ tên tiếng Việt (bao gồm toàn bộ dấu thanh Unicode tiếng Việt)
const VN_NAME_REGEX =
  /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

/**
 * Kiểm tra tính hợp lệ của Số điện thoại Việt Nam
 */
export function validateVietnamesePhone(phone: string): {
  isValid: boolean;
  error?: string;
  cleanPhone?: string;
} {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Vui lòng nhập số điện thoại.' };
  }

  // Loại bỏ khoảng trắng, dấu gạch ngang, dấu chấm, dấu ngoặc
  let clean = phone.trim().replace(/[\s\-\.\(\)]/g, '');

  // Chuẩn hóa đầu số quốc tế +84 hoặc 84 về đầu 0
  if (clean.startsWith('+840')) {
    clean = clean.slice(3);
  } else if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('840') && clean.length === 12) {
    clean = clean.slice(2);
  } else if (clean.startsWith('84') && clean.length === 11) {
    clean = '0' + clean.slice(2);
  }

  // Kiểm tra chỉ chứa số
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Số điện thoại chỉ được chứa các chữ số.' };
  }

  // Kiểm tra độ dài
  if (clean.length !== 10) {
    return {
      isValid: false,
      error: `Số điện thoại phải gồm đúng 10 chữ số (bạn đã nhập ${clean.length} số).`,
    };
  }

  // Chặn các dãy số giả lập lặp lại vô nghĩa
  const dummyNumbers = [
    '0000000000',
    '0111111111',
    '0222222222',
    '0333333333',
    '0444444444',
    '0555555555',
    '0666666666',
    '0777777777',
    '0888888888',
    '0999999999',
    '0123456789',
    '0987654321',
  ];
  if (dummyNumbers.includes(clean)) {
    return { isValid: false, error: 'Số điện thoại không hợp lệ hoặc là số ảo.' };
  }

  // Kiểm tra đầu số nhà mạng
  if (!VN_PHONE_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Đầu số điện thoại không thuộc các nhà mạng viễn thông Việt Nam (hỗ trợ đầu 03, 05, 07, 08, 09).',
    };
  }

  return { isValid: true, cleanPhone: clean };
}

/**
 * Kiểm tra tính hợp lệ của Họ và tên
 */
export function validateFullName(name: string): {
  isValid: boolean;
  error?: string;
  cleanName?: string;
} {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Vui lòng nhập họ và tên.' };
  }

  // Chuẩn hóa nhiều khoảng trắng liên tiếp thành 1 khoảng trắng
  const clean = name.trim().replace(/\s+/g, ' ');

  if (clean.length < 2) {
    return { isValid: false, error: 'Họ và tên quá ngắn (tối thiểu 2 ký tự).' };
  }

  if (clean.length > 50) {
    return { isValid: false, error: 'Họ và tên không được vượt quá 50 ký tự.' };
  }

  // Chặn ký tự số hoặc ký tự đặc biệt
  if (/\d/.test(clean)) {
    return { isValid: false, error: 'Họ và tên không được chứa chữ số.' };
  }

  if (!VN_NAME_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa ký tự đặc biệt.',
    };
  }

  // Yêu cầu có ít nhất 2 từ (Họ và Tên)
  const words = clean.split(' ').filter(Boolean);
  if (words.length < 2) {
    return {
      isValid: false,
      error: 'Vui lòng nhập đầy đủ cả Họ và Tên (ít nhất 2 từ, ví dụ: Nguyễn Văn A).',
    };
  }

  return { isValid: true, cleanName: clean };
}

/**
 * Kiểm tra tính hợp lệ của Địa chỉ cụ thể (Số nhà, tên đường, ngõ ngách)
 */
export function validateAddressStreet(street: string): {
  isValid: boolean;
  error?: string;
  cleanStreet?: string;
} {
  if (!street || typeof street !== 'string') {
    return { isValid: false, error: 'Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường).' };
  }

  const clean = street.trim().replace(/\s+/g, ' ');

  if (clean.length < 5) {
    return {
      isValid: false,
      error: 'Địa chỉ quá ngắn (vui lòng nhập rõ số nhà, tên đường, tối thiểu 5 ký tự).',
    };
  }

  if (clean.length > 200) {
    return { isValid: false, error: 'Địa chỉ không được vượt quá 200 ký tự.' };
  }

  // Chặn địa chỉ chỉ toàn dấu câu hoặc ký tự vô nghĩa (ví dụ: ".....", ",,,,", "----")
  if (/^[\.\,\-\/\_\s]+$/.test(clean)) {
    return { isValid: false, error: 'Địa chỉ không hợp lệ, vui lòng nhập rõ số nhà và tên đường.' };
  }

  return { isValid: true, cleanStreet: clean };
}

/**
 * Kiểm tra tính hợp lệ của Email
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
  cleanEmail?: string;
} {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Vui lòng nhập địa chỉ email.' };
  }

  const clean = email.trim();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!EMAIL_REGEX.test(clean)) {
    return { isValid: false, error: 'Định dạng email không hợp lệ (ví dụ: ten@gmail.com).' };
  }

  return { isValid: true, cleanEmail: clean };
}

