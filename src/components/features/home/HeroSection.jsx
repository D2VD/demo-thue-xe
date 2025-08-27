// src/components/features/home/HeroSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Button from '../../common/Button';
import HeroImage from '../../../assets/images/hero-background-car.jpg'; // Đảm bảo đường dẫn ảnh đúng

export default function HeroSection() {
  const navigate = useNavigate(); // Khởi tạo navigate

  return (
    <section
      className="relative w-full bg-no-repeat bg-cover bg-center text-white"
      style={{
        backgroundImage: `url(${HeroImage})`,
        minHeight: 'calc(100vh - 70px)', // 70px là chiều cao ước tính của Header (TopBar + MainNavigation)
        // Nếu header của bạn cao hơn hoặc thấp hơn, hãy điều chỉnh giá trị này
      }}
    >
      {/* Overlay làm tối ảnh nền */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Container cho nội dung text và button, căn giữa */}
      <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center text-center relative z-10 py-16 sm:py-24 md:py-32">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-tight tracking-tight"
          style={{ textShadow: '0 3px 6px rgba(0,0,0,0.75)' }} // Tăng độ đậm shadow
        >
          ĐẶT XE TRỰC TUYẾN
          <br />
          <span className="text-accent-yellow block mt-1 md:mt-2">BẤT CỨ LÚC NÀO - Ở MỌI NƠI</span>
        </h1>
        <p
          className="text-lg md:text-xl mb-8 md:mb-10 max-w-3xl mx-auto font-light"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.65)' }}
        >
          Trải nghiệm dịch vụ cho thuê xe chuyên nghiệp, đa dạng các dòng xe đời mới với mức giá cạnh tranh nhất thị trường.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 text-base md:text-lg font-semibold !bg-primary-green hover:!bg-primary-green-dark transform hover:scale-105 transition-transform duration-300 shadow-lg"
            onClick={() => navigate('/cars')} // Sử dụng navigate
          >
            Xem Các Loại Xe
          </Button>
          <Button
            variant="outline-light"
            size="lg"
            className="w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 text-base md:text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-primary-green transform hover:scale-105 transition-transform duration-300 shadow-lg"
            onClick={() => {
              const bookingForm = document.getElementById('booking-form-section'); // Đảm bảo BookingFormSection có id này
              if (bookingForm) {
                // Điều chỉnh offset nếu header của bạn là sticky và che mất phần đầu của section
                const headerOffset = 80; // Chiều cao ước tính của header
                const elementPosition = bookingForm.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }}
          >
            Đặt Xe Ngay
          </Button>
        </div>
      </div>
    </section>
  );
}