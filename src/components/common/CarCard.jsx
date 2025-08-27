import React from 'react';
import { Link } from 'react-router-dom'; // Để điều hướng đến trang chi tiết xe
import Button from './Button'; // Nút "Xem Chi Tiết"
import { TagIcon, UsersIcon, CogIcon } from '@heroicons/react/24/outline'; // Ví dụ icons cho thông tin thêm

// Định nghĩa kiểu dữ liệu cho props của CarCard (TypeScript, hoặc dùng PropTypes)
// interface CarCardProps {
//   id: string | number;
//   name: string;
//   imageUrl: string;
//   pricePerDay: number | string;
//   type?: string; // Ví dụ: "Sedan", "SUV"
//   seats?: number; // Ví dụ: "4 chỗ", "7 chỗ"
//   transmission?: string; // Ví dụ: "Số tự động", "Số sàn"
//   slug: string; // Để tạo URL
//   isFeatured?: boolean;
// }

export default function CarCard({
  id,
  name,
  imageUrl,
  pricePerDay,
  type,
  seats,
  transmission,
  slug, // Dùng để tạo link chi tiết: /cars/ten-xe-slug
  isFeatured = false,
}) {
  const formattedPrice = typeof pricePerDay === 'number'
    ? pricePerDay.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'VNĐ')
    : pricePerDay; // Giữ nguyên nếu là string "Liên hệ"

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:transform hover:-translate-y-1">
      {isFeatured && (
        <div className="absolute top-0 left-0 bg-accent-yellow text-neutral-dark px-3 py-1 text-xs font-bold rounded-br-lg z-10">
          NỔI BẬT
        </div>
      )}
      <Link to={`/cars/${slug}`} className="block group">
        <div className="aspect-w-16 aspect-h-9 overflow-hidden"> {/* Giữ tỷ lệ ảnh */}
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/cars/${slug}`} className="hover:text-primary-green dark:hover:text-primary-green">
          <h3 className="text-xl font-semibold text-neutral-dark dark:text-white mb-2 truncate group-hover:text-primary-green">
            {name}
          </h3>
        </Link>

        {/* Thông tin thêm về xe */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
          {type && (
            <span className="flex items-center">
              <TagIcon className="w-4 h-4 mr-1" /> {type}
            </span>
          )}
          {seats && (
            <span className="flex items-center">
              <UsersIcon className="w-4 h-4 mr-1" /> {seats} chỗ
            </span>
          )}
          {transmission && (
            <span className="flex items-center">
              <CogIcon className="w-4 h-4 mr-1" /> {transmission}
            </span>
          )}
        </div>

        <div className="mt-auto"> {/* Đẩy giá và nút xuống dưới */}
          <p className="text-primary-green dark:text-primary-green font-bold text-2xl mb-3">
            {formattedPrice}/ngày
          </p>
          <Link to={`/cars/${slug}`} className="w-full block">
            <Button
              variant="secondary" // Sử dụng màu secondary-blue
              className="w-full !bg-secondary-blue hover:!bg-secondary-blue-dark"
            >
              Xem Chi Tiết & Đặt Xe
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}