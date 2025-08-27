// src/components/layout/TopBar.jsx
import React from 'react';
// Thay đổi import cho Heroicons v2
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'; // Sử dụng EnvelopeIcon thay cho MailIcon và kích thước 24px outline

export default function TopBar() {
  return (
    <div className="bg-neutral-light py-2 text-sm text-neutral-dark">
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="flex items-center space-x-4">
          <a href="tel:02498808660" className="flex items-center hover:text-primary-green">
            <PhoneIcon className="w-5 h-5 mr-1" /> {/* Điều chỉnh kích thước nếu cần */}
            (024) 9880 8660
          </a>
          <a href="mailto:info@thuexeonline.vn" className="flex items-center hover:text-primary-green">
            <EnvelopeIcon className="w-5 h-5 mr-1" /> {/* Sử dụng EnvelopeIcon và điều chỉnh kích thước */}
            info@thuexeonline.vn
          </a>
        </div>
        <div className="flex items-center space-x-3">
          {/* Thêm link MXH nếu có */}
          <a href="#" className="hover:text-primary-green">FB</a>
          <a href="#" className="hover:text-primary-green">IG</a>
        </div>
      </div>
    </div>
  );
}