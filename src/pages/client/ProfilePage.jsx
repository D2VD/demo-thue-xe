// src/pages/client/ProfilePage.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext'; // Để lấy thông tin user
import UpdateProfileForm from '../../components/features/profile/UpdateProfileForm'; // Sẽ tạo
import ChangePasswordForm from '../../components/features/profile/ChangePasswordForm'; // Sẽ tạo
import BookingHistory from '../../components/features/profile/BookingHistory'; // Sẽ tạo
import { UserCircleIcon, KeyIcon, ListBulletIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { name: 'Thông Tin Cá Nhân', icon: UserCircleIcon, component: UpdateProfileForm, id: 'profile' },
  { name: 'Đổi Mật Khẩu', icon: KeyIcon, component: ChangePasswordForm, id: 'password' },
  { name: 'Lịch Sử Đặt Xe', icon: ListBulletIcon, component: BookingHistory, id: 'history' },
];

export default function ProfilePage() {
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  if (!user && !session) { // Nếu chưa có session hoặc user (ví dụ đang load hoặc đã logout)
    // Có thể hiển thị loading hoặc redirect về login
    // navigate('/login', { replace: true }); // Hoặc trả về null/Spinner nếu AuthContext đang loading
    return null; // Hoặc <Spinner />
  }
  if (!user && session) { // Có session nhưng user chưa load xong (hiếm khi xảy ra nếu AuthContext đúng)
    return <div className="flex justify-center items-center min-h-screen"><Spinner size="xl"/></div>;
  }


  const handleSignOut = async () => {
    // Có thể thêm modal xác nhận ở đây nếu muốn, tương tự MainNavigation
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        await signOut();
        navigate('/'); // Điều hướng về trang chủ sau khi đăng xuất
    }
  };

   const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || (() => <div>Tab không hợp lệ</div>);

  return (
    <>
      <Helmet>
        <title>Trang Cá Nhân - {user?.profile?.full_name || user?.email} | Thuê Xe Online</title>
        <meta name="description" content="Quản lý thông tin cá nhân, đổi mật khẩu và xem lịch sử đặt xe của bạn tại Thuê Xe Online." />
        {/* No canonical for profile pages usually, or set to a generic profile URL if public */}
      </Helmet>

      <header className="bg-primary-green text-white py-8 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Trang Cá Nhân</h1>
          <p className="mt-1 opacity-90">Chào mừng trở lại, {user?.profile?.full_name || user?.email?.split('@')[0]}!</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-1/4 lg:w-1/5">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg sticky top-24"> {/* sticky top */}
              <div className="mb-6 text-center">
                {user?.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-2 border-primary-green"/>
                ) : (
                    <UserCircleIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-3"/>
                )}
                <h2 className="text-xl font-semibold text-neutral-dark dark:text-white">{user?.profile?.full_name || 'Người dùng'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors
                                ${activeTab === tab.id
                                    ? 'bg-primary-green text-white shadow-sm'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                  >
                    <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}`} />
                    {tab.name}
                  </button>
                ))}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 mt-4"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3"/>
                    Đăng Xuất
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area for Tabs */}
          <main className="w-full md:w-3/4 lg:w-4/5">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg">
              {ActiveComponent ? <ActiveComponent /> : <div>Vui lòng chọn một mục.</div>}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}