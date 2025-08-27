// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900"> {/* Nền chung cho toàn bộ trang */}
      <Header /> {/* Header sẽ tự quản lý container của nó */}
      {/* Outlet render HomePage. HomePage sẽ quyết định section nào full-width. */}
      <div className="flex-grow"> {/* Đảm bảo main content chiếm không gian còn lại */}
        <Outlet />
      </div>
      <Footer /> {/* Footer sẽ tự quản lý container của nó */}
    </div>
  );
}