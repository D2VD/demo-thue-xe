// src/components/layout/AdminSidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartBarIcon,
  TruckIcon, // Xe
  NewspaperIcon, // Bài viết
  CalendarDaysIcon, // Đặt xe
  UsersIcon, // Người dùng
  Cog6ToothIcon, // Cài đặt
} from '@heroicons/react/24/outline';

const adminNavItems = [
  { name: 'Dashboard', path: '/admin', icon: ChartBarIcon },
  { name: 'Quản lý Xe', path: '/admin/cars', icon: TruckIcon },
  { name: 'Quản lý Bài Viết', path: '/admin/articles', icon: NewspaperIcon },
  { name: 'Quản lý Đặt Xe', path: '/admin/bookings', icon: CalendarDaysIcon },
  { name: 'Quản lý Người Dùng', path: '/admin/users', icon: UsersIcon },
  { name: 'Cài đặt', path: '/admin/settings', icon: Cog6ToothIcon }, // Ví dụ
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-neutral-800 text-gray-300 flex flex-col min-h-screen"> {/* Đổi màu và đảm bảo full height */}
      <div className="px-6 py-4">
        <NavLink to="/admin" className="text-2xl font-semibold text-primary-green hover:text-primary-green-dark">
          Admin Panel
        </NavLink>
      </div>
      <nav className="flex-grow px-4 space-y-1"> {/* Thêm flex-grow và padding */}
        {adminNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/admin'} // Quan trọng cho route index
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-green text-white shadow-md'
                  : 'hover:bg-neutral-700 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      {/* Optional: Footer in sidebar or user info */}
    </aside>
  );
}