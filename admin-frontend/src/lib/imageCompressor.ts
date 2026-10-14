/**
 * Tự động tối ưu và nén ảnh trên trình duyệt trước khi upload.
 * Giúp người dùng có thể chọn bất kỳ ảnh nào (kể cả ảnh chụp điện thoại/máy ảnh 10MB - 30MB)
 * mà không bao giờ bị giới hạn dung lượng 5MB của server.
 */
export async function compressImageIfNeeded(
  file: File,
  maxSizeMB: number = 4.2,
  maxWidthOrHeight: number = 2560
): Promise<File> {
  // Không nén ảnh GIF để giữ animation nếu file đã hợp lệ
  if (file.type === 'image/gif') {
    return file;
  }

  // Nếu ảnh đã nhỏ hơn 2.5MB và không quá lớn, không cần nén lại
  if (file.size <= 2.5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Giới hạn độ phân giải tối đa (2K / 2560px là quá đẹp và sắc nét cho web thương mại điện tử)
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback nếu browser không tạo được context 2d
        resolve(file);
        return;
      }

      // Tô nền trắng để tránh PNG trong suốt bị đen khi chuyển sang JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Thử nén với chất lượng 0.85
      let quality = 0.85;
      const mimeType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      const ext = mimeType === 'image/webp' ? '.webp' : '.jpg';

      const tryExport = (q: number): Promise<Blob | null> => {
        return new Promise((res) => canvas.toBlob(res, mimeType, q));
      };

      let blob = await tryExport(quality);

      // Nếu vẫn lớn hơn giới hạn cho phép, giảm chất lượng thêm một chút
      if (blob && blob.size > maxSizeMB * 1024 * 1024) {
        quality = 0.72;
        blob = await tryExport(quality);
      }

      if (blob && blob.size > maxSizeMB * 1024 * 1024) {
        quality = 0.6;
        blob = await tryExport(quality);
      }

      if (!blob) {
        resolve(file);
        return;
      }

      // Đổi đuôi tên file tương ứng nếu từ PNG lớn chuyển sang JPEG
      let newName = file.name;
      if (!newName.toLowerCase().endsWith(ext)) {
        newName = newName.replace(/\.[^.]+$/, ext);
      }

      const compressedFile = new File([blob], newName, {
        type: mimeType,
        lastModified: Date.now(),
      });

      resolve(compressedFile);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Nếu lỗi load ảnh, giữ nguyên file gốc để backend xử lý tiếp
      resolve(file);
    };

    img.src = objectUrl;
  });
}
