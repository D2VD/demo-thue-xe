import React from 'react';

// --- BẮT ĐẦU IMPORT LOGO ---
// Import các file logo bạn đã chuẩn bị.
// Thay thế 'path/to/your/logo.svg' bằng đường dẫn thực tế.
// Nếu file không tồn tại, ứng dụng sẽ báo lỗi khi build hoặc chạy.

// Ví dụ (BẠN CẦN THAY THẾ BẰNG ĐƯỜNG DẪN CỦA BẠN):
import toyotaLogo from '../../../assets/logos/brands/toyota-logo.svg'; // Giả sử bạn có file này
import hondaLogo from '../../../assets/logos/brands/honda.svg';   // Giả sử bạn có file này
import fordLogo from '../../../assets/logos/brands/ford.svg';     // Giả sử bạn có file này
import hyundaiLogo from '../../../assets/logos/brands/hyundai.svg';
import kiaLogo from '../../../assets/logos/brands/kia.svg';
//import mazdaLogo from '../../../assets/logos/brands/mazda.svg';
//import vinfastLogo from '../../../assets/logos/brands/vinfast.svg'; // Nếu có
//import mercedesBenzLogo from '../../../assets/logos/brands/mercedes-benz.svg'; // Nếu có
// --- KẾT THÚC IMPORT LOGO ---


const brandLogosData = [
  // Sử dụng biến đã import cho thuộc tính 'src'
  // 'name' vẫn hữu ích cho 'alt' text và 'title'
  { src: toyotaLogo, alt: 'Toyota Logo', name: 'Toyota' },
  { src: hondaLogo, alt: 'Honda Logo', name: 'Honda' },
  { src: fordLogo, alt: 'Ford Logo', name: 'Ford' },
  { src: hyundaiLogo, alt: 'Hyundai Logo', name: 'Hyundai' },
  { src: kiaLogo, alt: 'Kia Logo', name: 'Kia' },
  //{ src: mazdaLogo, alt: 'Mazda Logo', name: 'Mazda' },
  //{ src: vinfastLogo, alt: 'VinFast Logo', name: 'VinFast' }, // Ví dụ
  //{ src: mercedesBenzLogo, alt: 'Mercedes-Benz Logo', name: 'Mercedes-Benz' }, // Ví dụ
  // Thêm các hãng khác nếu cần
];

// Đặt biến này thành false để hiển thị hình ảnh logo
const useTextInsteadOfImages = false;

export default function BrandPartnersSection() {
  return (
    <section id="brand-partners" className="py-12 md:py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green dark:text-primary-green">
            Đối Tác Hãng Xe Hàng Đầu
          </h2>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Chúng tôi tự hào cung cấp dịch vụ cho thuê xe từ các thương hiệu ô tô uy tín và phổ biến nhất.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-8 md:gap-x-12 lg:gap-x-16">
          {brandLogosData.map((brand) => ( // Đổi tên biến để tránh nhầm lẫn với map parameter
            <div
              key={brand.name} // Sử dụng brand.name hoặc một id duy nhất nếu có
              className="group flex justify-center items-center p-2"
              title={brand.name}
            >
              {useTextInsteadOfImages ? (
                <span className="text-2xl md:text-3xl font-semibold text-gray-400 dark:text-gray-500 group-hover:text-primary-green dark:group-hover:text-primary-green transition-colors duration-300">
                  {brand.name}
                </span>
              ) : (
                <img
                  src={brand.src} // Đường dẫn đến file logo đã import
                  alt={brand.alt}
                  // Điều chỉnh kích thước logo cho phù hợp.
                  // Tailwind classes: h-8, h-10, h-12, h-14, h-16
                  // Ví dụ:
                  className="h-10 md:h-12 lg:h-14 max-w-[120px] md:max-w-[150px] object-contain
                             filter grayscale hover:grayscale-0 opacity-70 hover:opacity-100
                             transition-all duration-300 ease-in-out transform hover:scale-110"
                />
                // Các class filter, opacity, transform, transition là tùy chọn để thêm hiệu ứng
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}