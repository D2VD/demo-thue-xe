// src/components/layout/AdminHeader.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export default function AdminHeader({ pageTitle = "Dashboard" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm py-3 px-6 flex justify-between items-center sticky top-0 z-40"> {/* Thêm sticky */}
      <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 hidden sm:block">
          Chào, <span className="font-medium">{user?.email?.split('@')[0] || 'Admin'}</span>
        </span>
        <div className="relative">
            <UserCircleIcon className="h-8 w-8 text-gray-500 cursor-pointer" />
            {/* Có thể thêm dropdown cho user admin ở đây */}
        </div>
        <button
          onClick={handleSignOut}
          title="Đăng Xuất"
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}