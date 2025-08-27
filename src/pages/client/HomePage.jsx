// src/pages/client/HomePage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom'; // Import Link cho các nút điều hướng

// Import các section đã hoàn thiện của trang chủ
import HeroSection from '../../components/features/home/HeroSection';
import BookingFormSection from '../../components/features/home/BookingFormSection';
import AboutUsSection from '../../components/features/home/AboutUsSection';
import FeaturedCarsSection from '../../components/features/home/FeaturedCarsSection';
import BrandPartnersSection from '../../components/features/home/BrandPartnersSection';
import TestimonialsSection from '../../components/features/home/TestimonialsSection';
import LatestNewsSection from '../../components/features/home/LatestNewsSection';

// Import common components nếu cần dùng trực tiếp ở đây (ví dụ Button)
import Button from '../../components/common/Button';

// --- Placeholders chi tiết hơn cho các section còn lại ---
// (Bạn sẽ tạo file riêng cho từng section này và import vào sau)


const CallToActionBottom = () => (
  <section className="py-16 md:py-20 bg-secondary-blue text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn Sàng Cho Chuyến Đi Tiếp Theo Của Bạn?</h2>
      <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
        Đừng chần chừ! Khám phá ngay các dòng xe hiện đại, tiện nghi và đặt xe trực tuyến để nhận những ưu đãi hấp dẫn nhất từ chúng tôi.
      </p>
      <Link to="/cars">
        <Button
          size="lg"
          className="!bg-accent-yellow hover:!bg-yellow-400 !text-neutral-dark font-bold px-10 py-4 text-xl shadow-xl transform hover:scale-105 transition-transform duration-300"
        >
          Đặt Xe Ngay Hôm Nay!
        </Button>
      </Link>
    </div>
  </section>
);
// --- Kết thúc định nghĩa các placeholder ---

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Thuê Xe Online Giá Rẻ - Đặt Xe Du Lịch, Tự Lái Uy Tín</title>
        <meta
          name="description"
          content="Dịch vụ cho thuê xe ô tô trực tuyến hàng đầu. Đặt xe du lịch 4-7-16 chỗ, xe tự lái, xe hoa cưới với giá tốt nhất. Đa dạng xe đời mới, thủ tục nhanh gọn, hỗ trợ 24/7."
        />
        <meta
          name="keywords"
          content="thuê xe, thuê xe online, đặt xe, xe du lịch, xe tự lái, thuê xe giá rẻ, thuê xe hà nội, thuê xe tphcm"
        />
        {/* Thay YOUR_DOMAIN bằng domain thật của bạn khi deploy */}
        <link rel="canonical" href="https://YOUR_DOMAIN.com/" />
        <meta property="og:title" content="Thuê Xe Online Giá Rẻ - Đặt Xe Du Lịch, Tự Lái Uy Tín" />
        <meta property="og:description" content="Dịch vụ cho thuê xe ô tô trực tuyến hàng đầu. Đặt xe du lịch 4-7-16 chỗ, xe tự lái, xe hoa cưới với giá tốt nhất." />
        {/* <meta property="og:image" content="https://YOUR_DOMAIN.com/og-image.jpg" /> */}
        {/* <meta property="og:url" content="https://YOUR_DOMAIN.com/" /> */}
        <meta property="og:type" content="website" />
      </Helmet>

      <HeroSection />
      <BookingFormSection />

      {/* Các section chính của trang chủ */}
      <main> {/* Thẻ main bao bọc các section nội dung chính */}
        <AboutUsSection />
        <FeaturedCarsSection />
        <BrandPartnersSection />
        <TestimonialsSection />
        <LatestNewsSection />
      </main>

      <CallToActionBottom />
    </>
  );
}