// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // Import useLocation
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

// Hàm helper để lấy title từ pathname (bạn có thể mở rộng)
const getAdminPageTitle = (pathname) => {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/cars/edit')) return 'Sửa Thông Tin Xe';
  if (pathname.startsWith('/admin/cars/new')) return 'Thêm Xe Mới';
  if (pathname.startsWith('/admin/cars')) return 'Quản Lý Xe';
  if (pathname.startsWith('/admin/articles/edit')) return 'Sửa Bài Viết';
  if (pathname.startsWith('/admin/articles/new')) return 'Thêm Bài Mới';
  if (pathname.startsWith('/admin/articles')) return 'Quản Lý Bài Viết';
  if (pathname.startsWith('/admin/bookings')) return 'Quản Lý Đặt Xe';
  if (pathname.startsWith('/admin/users')) return 'Quản Lý Người Dùng';
  // ... thêm các case khác
  return 'Admin'; // Default
};

export default function AdminLayout() {
  const location = useLocation();
  const pageTitle = getAdminPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100"> {/* Đổi màu nền chung */}
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader pageTitle={pageTitle} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}