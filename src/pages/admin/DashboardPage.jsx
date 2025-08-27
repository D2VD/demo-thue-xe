// src/pages/admin/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabaseClient'; // Import supabase client
import Spinner from '../../components/common/Spinner';
// Icons cho các card thống kê
import { TruckIcon, NewspaperIcon, CalendarDaysIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';

// Component Card thống kê
const StatCard = ({ title, value, icon, colorClass = 'bg-primary-green', isLoading }) => {
  const IconComponent = icon;
  return (
    <div className={`p-6 rounded-xl shadow-lg text-white ${colorClass} flex items-center space-x-4`}>
      <div className="p-3 bg-white bg-opacity-20 rounded-full">
        <IconComponent className="h-8 w-8" />
      </div>
      <div>
        <p className="text-sm font-medium uppercase tracking-wider opacity-80">{title}</p>
        {isLoading ? (
          <div className="h-8 flex items-center"><Spinner size="sm" color="text-white" /></div>
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
      </div>
    </div>
  );
};


export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalCars: 0,
    totalArticles: 0,
    pendingBookings: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- Lấy số lượng xe ---
        const { count: carCount, error: carError } = await supabase
          .from('cars') // Giả sử bạn có bảng 'cars'
          .select('*', { count: 'exact', head: true });
        if (carError) throw carError;

        // --- Lấy số lượng bài viết ---
        const { count: articleCount, error: articleError } = await supabase
          .from('articles') // Giả sử bạn có bảng 'articles'
          .select('*', { count: 'exact', head: true });
        if (articleError) throw articleError;

        // --- Lấy số lượng đơn đặt xe đang chờ xử lý ---
        const { count: bookingCount, error: bookingError } = await supabase
          .from('bookings') // Giả sử bạn có bảng 'bookings'
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'); // Chỉ đếm đơn 'pending'
        if (bookingError) throw bookingError;

        // --- Lấy số lượng người dùng (từ bảng profiles hoặc auth.users) ---
        // Đếm từ bảng profiles sẽ chính xác hơn nếu bạn có trigger tạo profile
        const { count: userCount, error: userError } = await supabase
          .from('profiles') // Giả sử bạn có bảng 'profiles'
          .select('*', { count: 'exact', head: true });
        if (userError) throw userError;


        setStats({
          totalCars: carCount || 0,
          totalArticles: articleCount || 0,
          pendingBookings: bookingCount || 0,
          totalUsers: userCount || 0,
        });

      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err.message || "Không thể tải dữ liệu thống kê.");
        // Set giá trị mặc định nếu lỗi
        setStats({ totalCars: 'Lỗi', totalArticles: 'Lỗi', pendingBookings: 'Lỗi', totalUsers: 'Lỗi' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Thuê Xe Online</title>
      </Helmet>

      {/* Phần tiêu đề của trang được quản lý bởi AdminHeader trong AdminLayout */}
      {/* <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Tổng Quan</h1> */}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Lỗi!</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Tổng Số Xe"
          value={stats.totalCars}
          icon={TruckIcon}
          colorClass="bg-secondary-blue dark:bg-secondary-blue-dark"
          isLoading={isLoading}
        />
        <StatCard
          title="Tổng Bài Viết"
          value={stats.totalArticles}
          icon={NewspaperIcon}
          colorClass="bg-green-500 dark:bg-green-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Đơn Chờ Xử Lý"
          value={stats.pendingBookings}
          icon={CalendarDaysIcon}
          colorClass="bg-yellow-500 dark:bg-yellow-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Tổng Người Dùng"
          value={stats.totalUsers}
          icon={UsersIcon}
          colorClass="bg-purple-500 dark:bg-purple-600"
          isLoading={isLoading}
        />
      </div>

      {/* Khu vực cho biểu đồ hoặc các thông tin khác */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-neutral-dark dark:text-white mb-4 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2 text-primary-green" />
            Hoạt Động Gần Đây (Placeholder)
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-neutral-dark dark:text-white mb-4">
            Thông Báo & Cảnh Báo (Placeholder)
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="p-3 bg-yellow-50 dark:bg-yellow-500/20 rounded-md text-yellow-700 dark:text-yellow-300">
              Có <strong>{isLoading ? '...' : stats.pendingBookings}</strong> đơn đặt xe mới cần được xem xét.
            </li>
            <li className="p-3 bg-blue-50 dark:bg-blue-500/20 rounded-md text-blue-700 dark:text-blue-300">
              Hệ thống vừa cập nhật phiên bản mới.
            </li>
            {/* Thêm các thông báo khác */}
          </ul>
        </div>
      </div>
    </>
  );
}