import React from 'react';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'; // Sao đầy
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline'; // Sao rỗng (nếu cần cho nửa sao)

// interface TestimonialCardProps {
//   name: string;
//   city?: string; // Tùy chọn
//   review: string;
//   avatarInitial?: string; // Chữ cái đầu của tên để làm avatar
//   avatarUrl?: string; // Hoặc URL ảnh avatar thật
//   stars: number; // Số sao từ 1 đến 5
//   date?: string; // Ngày nhận xét (tùy chọn)
// }

export default function TestimonialCard({
  name,
  city,
  review,
  avatarInitial,
  avatarUrl,
  stars,
  // date, // Có thể thêm ngày nếu muốn
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:transform hover:-translate-y-1">
      <div className="flex mb-3 items-center">
        {[...Array(5)].map((_, i) => (
          <StarIconSolid
            key={i}
            className={`w-5 h-5 ${i < stars ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        ))}
      </div>
      <blockquote className="flex-grow mb-5">
        <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed text-base">
          "{review}"
        </p>
      </blockquote>
      <div className="flex items-center mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        {avatarUrl ? (
          <img className="flex-shrink-0 w-12 h-12 rounded-full object-cover" src={avatarUrl} alt={name} />
        ) : avatarInitial ? (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary-blue text-white flex items-center justify-center text-lg font-semibold">
            {avatarInitial}
          </div>
        ) : null}
        <div className="ml-4">
          <cite className="font-bold text-neutral-dark dark:text-white not-italic">{name}</cite>
          {city && <p className="text-sm text-gray-500 dark:text-gray-400">{city}</p>}
        </div>
      </div>
    </div>
  );
}