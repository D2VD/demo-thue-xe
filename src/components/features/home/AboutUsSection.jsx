import React from 'react';
import { CheckBadgeIcon, UsersIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'; // Import icons
import AboutImage from '../../../assets/images/about-us-image.jpg'; // Thay bằng ảnh của bạn

const features = [
  {
    name: 'Giá Cả Cạnh Tranh',
    description: 'Chúng tôi cam kết mang đến mức giá thuê xe tốt nhất thị trường cùng nhiều ưu đãi hấp dẫn.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Đa Dạng Dòng Xe',
    description: 'Từ xe phổ thông đến xe sang trọng, xe tự lái hay có tài xế, đáp ứng mọi nhu cầu của bạn.',
    icon: CheckBadgeIcon, // Có thể chọn icon khác phù hợp hơn cho "Đa dạng dòng xe"
  },
  {
    name: 'Dịch Vụ Chuyên Nghiệp',
    description: 'Đội ngũ nhân viên tư vấn nhiệt tình, thủ tục thuê xe nhanh chóng, đơn giản và minh bạch.',
    icon: UsersIcon,
  },
  {
    name: 'An Toàn & Tin Cậy',
    description: 'Tất cả xe đều được bảo dưỡng định kỳ, kiểm tra kỹ lưỡng trước mỗi chuyến đi, đảm bảo an toàn tuyệt đối.',
    icon: ShieldCheckIcon,
  },
];

export default function AboutUsSection() {
  return (
    <section id="about-us" className="py-16 md:py-24 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Cột hình ảnh */}
          <div className="wow animate__animated animate__fadeInLeft" data-wow-delay="0.1s"> {/* Thêm animation nếu muốn */}
            <img
              src={AboutImage}
              alt="Về Chúng Tôi - Dịch Vụ Thuê Xe Online"
              className="rounded-xl shadow-2xl w-full h-auto object-cover max-h-[500px]"
            />
          </div>

          {/* Cột nội dung */}
          <div className="wow animate__animated animate__fadeInRight" data-wow-delay="0.3s">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-blue mb-2">
              Tìm Hiểu Về Chúng Tôi
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-primary-green mb-6">
              Đối Tác Tin Cậy Cho Mọi Hành Trình Của Bạn
            </h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Với nhiều năm kinh nghiệm trong lĩnh vực cho thuê xe, chúng tôi tự hào mang đến giải pháp di chuyển tối ưu,
              kết hợp giữa chất lượng dịch vụ vượt trội và chi phí hợp lý. Sứ mệnh của chúng tôi là làm cho mọi chuyến đi của bạn
              trở nên dễ dàng, thoải mái và đáng nhớ.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-8">
              {features.map((feature) => (
                <div key={feature.name} className="flex items-start">
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-primary-green p-1 bg-primary-green/10 rounded-lg" aria-hidden="true" />
                  </div>
                  <div className="ml-4">
                    <dt className="text-lg font-semibold text-neutral-dark dark:text-white">
                      {feature.name}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </dd>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}