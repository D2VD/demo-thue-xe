import React from 'react';
import TestimonialCard from './TestimonialCard'; // Import TestimonialCard

// Mock data cho testimonials - Sau này sẽ lấy từ API
const testimonialsData = [
  {
    id: 1,
    name: 'Anh Hoàng Minh',
    city: 'Quận 1, TP. Hồ Chí Minh',
    review: 'Dịch vụ thuê xe ở đây thực sự tuyệt vời! Xe mới, sạch sẽ, thủ tục nhanh gọn. Nhân viên tư vấn rất nhiệt tình và chuyên nghiệp. Tôi hoàn toàn hài lòng.',
    avatarInitial: 'HM',
    stars: 5,
  },
  {
    id: 2,
    name: 'Chị Thu Trang',
    city: 'Cầu Giấy, Hà Nội',
    review: 'Giá cả hợp lý, xe chạy êm và tiết kiệm nhiên liệu. Tôi đã có một chuyến đi cuối tuần rất vui vẻ cùng gia đình. Sẽ giới thiệu cho bạn bè!',
    avatarInitial: 'TT',
    stars: 5,
  },
  {
    id: 3,
    name: 'Mr. David Miller',
    city: 'Khách du lịch Úc',
    review: 'Excellent service and a great selection of cars. The staff были very helpful and spoke English well. Made my trip in Vietnam much easier. Highly recommended!',
    // avatarUrl: '/path/to/david-avatar.jpg', // Nếu có ảnh thật
    avatarInitial: 'DM',
    stars: 4,
  },
  // Bạn có thể thêm nhiều nhận xét hơn nếu muốn, hoặc sử dụng slider sau này
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-neutral-light dark:bg-neutral-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green dark:text-primary-green">
            Khách Hàng Tin Yêu Nói Gì?
          </h2>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Những chia sẻ chân thực từ những khách hàng đã trải nghiệm dịch vụ thuê xe của chúng tôi.
          </p>
        </div>

        {testimonialsData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"> {/* Thêm items-stretch để các card có chiều cao bằng nhau nếu nội dung khác nhau */}
            {testimonialsData.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                name={testimonial.name}
                city={testimonial.city}
                review={testimonial.review}
                avatarInitial={testimonial.avatarInitial}
                avatarUrl={testimonial.avatarUrl}
                stars={testimonial.stars}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Chưa có nhận xét nào.
          </p>
        )}
      </div>
    </section>
  );
}