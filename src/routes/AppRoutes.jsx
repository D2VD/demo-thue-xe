// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Common Components (ví dụ: Spinner)
import Spinner from '../components/common/Spinner'; // Giả sử bạn có Spinner.jsx

// Client Pages
import HomePage from '../pages/client/HomePage';
import LoginPage from '../pages/client/LoginPage';
import RegisterPage from '../pages/client/RegisterPage';
import CarsPage from '../pages/client/CarsPage'; 
import CarDetailPage from '../pages/client/CarDetailPage';
import NewsPage from '../pages/client/NewsPage';
import ArticleDetailPage from '../pages/client/ArticleDetailPage';
import ContactPage from '../pages/client/ContactPage';
import ProfilePage from '../pages/client/ProfilePage'; 
//Admin Pages
import AdminDashboardPage from '../pages/admin/DashboardPage';
import ManageCarsPage from '../pages/admin/ManageCarsPage';
import EditCarPage from '../pages/admin/EditCarPage';
import ManageArticlesPage from '../pages/admin/ManageArticlesPage';
import EditArticlePage from '../pages/admin/EditArticlePage';
import ManageBookingsPage from '../pages/admin/ManageBookingsPage';
// --- Client Page Placeholders ---

const UserDashboardPage = () => {
    const { user, signOut, isAdmin } = useAuth();
    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-semibold">User Dashboard</h2>
            <p>Email: {user?.email}</p>
            <p>Role: {isAdmin ? 'Admin' : 'User'}</p>
            <button
                onClick={signOut}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
                Đăng xuất
            </button>
        </div>
    );
};

// --- End Client Page Placeholders ---


// --- Admin Page Placeholders ---
const ManageCategoriesPage = () => <div className="p-4"><h1>Quản lý Chuyên Mục</h1><p>Nội dung quản lý chuyên mục...</p></div>;
const ManageTagsPage = () => <div className="p-4"><h1>Quản lý Tags</h1><p>Nội dung quản lý tags...</p></div>;
const ManageUsersPage = () => <div className="p-4"><h1>Quản lý Người Dùng</h1><p>Nội dung quản lý người dùng...</p></div>;
// --- End Admin Page Placeholders ---

// Loading Component (hoặc dùng Spinner trực tiếp)
const RouteLoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

// Component cho route yêu cầu đăng nhập
const ProtectedRoute = () => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

// Component cho route yêu cầu quyền admin
const AdminProtectedRoute = () => {
  const { user, session, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />; // Hoặc trang "Unauthorized" nếu bạn muốn
  }
  return <Outlet />;
};


export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Routes không sử dụng MainLayout (ví dụ: Login, Register) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes sử dụng MainLayout cho người dùng */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/cars/:carSlug" element={<CarDetailPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/category/:categorySlug" element={<NewsPage />} /> {/* Route cho category */}
          <Route path="/news/tag/:tag" element={<NewsPage />} /> {/* Route cho tag */}
          <Route path="/news/:articleSlug" element={<ArticleDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Protected Routes (yêu cầu đăng nhập) bên trong MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Thêm các route cần đăng nhập khác cho user ở đây */}
          </Route>
        </Route>

        {/* Admin Protected Routes với AdminLayout */}
        <Route path="/admin" element={<AdminProtectedRoute />}> {/* Bước 1: Bảo vệ toàn bộ nhánh /admin */}
          <Route element={<AdminLayout />}> {/* Bước 2: Áp dụng AdminLayout cho các route con hợp lệ */}
            <Route index element={<AdminDashboardPage />} /> {/* /admin */}
            <Route path="cars" element={<ManageCarsPage />} /> {/* /admin/cars */}
            <Route path="cars/new" element={<EditCarPage />} /> {/* /admin/cars/new */}
            <Route path="cars/edit/:carId" element={<EditCarPage />} /> {/* /admin/cars/edit/:carId */}
            <Route path="articles" element={<ManageArticlesPage />} />
            <Route path="cars" element={<ManageCarsPage />} /> {/* /admin/articles */}
            <Route path="articles/new" element={<EditArticlePage />} />  {/* /admin/articles/new */}
            <Route path="articles/edit/:articleId" element={<EditArticlePage />} /> {/* /admin/articles/edit/:articleId */}
            <Route path="bookings" element={<ManageBookingsPage />} /> {/* /admin/bookings */}
            <Route path="categories" element={<ManageCategoriesPage />} /> {/* /admin/categories */}
            <Route path="tags" element={<ManageTagsPage />} /> {/* /admin/tags */}
            <Route path="users" element={<ManageUsersPage />} /> {/* /admin/users */}
            {/* Thêm các route admin khác ở đây */}
          </Route>
        </Route>

        {/* Route cho trang không tìm thấy (404) */}
        <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-light p-4">
                <img src="/src/assets/images/404-illustration.svg" alt="404 Not Found" className="w-64 h-64 md:w-80 md:h-80 mb-8" />
               
                <p className="text-2xl text-neutral-dark mt-4">Oops! Trang không tồn tại.</p>
                <p className="text-neutral-dark mt-2">Liên kết bạn theo dõi có thể bị hỏng hoặc trang đã được chuyển đi.</p>
                <Link to="/" className="mt-8 bg-primary-green text-white font-semibold px-6 py-3 rounded-md hover:bg-primary-green-dark transition-colors">
                    Quay về Trang Chủ
                </Link>
            </div>
        } />
      </Routes>
    </Router>
  );
}