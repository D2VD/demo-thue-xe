// src/components/layout/Footer.jsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-neutral-light py-8">
      <div className="container mx-auto px-4">
        {/* FooterMain - Chia cột */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold text-primary-green mb-3">THUÊ XE ONLINE</h3>
            <p className="text-sm text-gray-400">
              Dịch vụ cho thuê xe trực tuyến uy tín, chất lượng hàng đầu.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Về Chúng Tôi</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-green">Giới thiệu</a></li>
              <li><a href="#" className="hover:text-primary-green">Điều khoản</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-green">Hướng dẫn đặt xe</a></li>
              <li><a href="#" className="hover:text-primary-green">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Liên Hệ</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. HCM</li>
              <li>Điện thoại: 1900 6750</li>
              <li>Email: support@thuexeonline.vn</li>
            </ul>
            {/* Widget Facebook/Social */}
          </div>
        </div>
        {/* FooterBottom */}
        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Thuê Xe Online. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
}