import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button'; // Có thể dùng Button cho "Đọc thêm"
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

// interface ArticleCardProps {
//   id: string | number;
//   title: string;
//   imageUrl: string;
//   date: string; // Ví dụ: "05/06/2025"
//   excerpt: string;
//   slug: string; // Để tạo URL: /news/tieu-de-bai-viet
//   category?: string; // Tùy chọn
// }

export default function ArticleCard({
  id,
  title,
  imageUrl,
  date,
  excerpt,
  slug,
  category,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:transform hover:-translate-y-1">
      <Link to={`/news/${slug}`} className="block">
        <div className="aspect-w-16 aspect-h-9 overflow-hidden"> {/* Giữ tỷ lệ ảnh */}
          <img
            src={imageUrl || '/src/assets/images/placeholder-image.jpg'} // Ảnh mặc định nếu không có
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      <div className="p-5 md:p-6 flex flex-col flex-grow">
        {category && (
          <Link to={`/news/category/${category.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs font-semibold text-secondary-blue dark:text-secondary-blue-dark hover:underline mb-2 uppercase tracking-wider">
            {category}
          </Link>
        )}
        <Link to={`/news/${slug}`} className="hover:text-primary-green dark:hover:text-primary-green">
          <h3 className="text-lg md:text-xl font-semibold text-neutral-dark dark:text-white mb-2 leading-snug group-hover:text-primary-green dark:group-hover:text-primary-green line-clamp-2" title={title}>
            {/* line-clamp-2 giới hạn tiêu đề 2 dòng, thêm title attribute để xem full khi hover */}
            {title}
          </h3>
        </Link>

        {date && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
            <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
            <span>{date}</span>
          </div>
        )}

        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 flex-grow line-clamp-3">
          {/* line-clamp-3 giới hạn trích đoạn 3 dòng */}
          {excerpt}
        </p>

        <div className="mt-auto"> {/* Đẩy nút đọc thêm xuống dưới */}
          <Link to={`/news/${slug}`}>
            <Button
              variant="text" // Hoặc 'outline' tùy thiết kế
              className="!text-primary-green hover:!text-primary-green-dark !px-0 !py-1 font-semibold group-hover:!underline"
            >
              Đọc thêm →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}