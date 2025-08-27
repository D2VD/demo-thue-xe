// src/pages/client/LoginPage.jsx
// ... (imports giữ nguyên như code hoàn chỉnh đã cung cấp trước đó)
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signIn({ email, password });
      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
            setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
        } else if (signInError.message.includes("Email not confirmed")) {
            setError("Vui lòng xác thực email của bạn trước khi đăng nhập.");
        } else {
            setError(signInError.message || 'Đã có lỗi xảy ra khi đăng nhập.');
        }
        console.error("Login error object:", signInError);
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      console.error("Unexpected login error:", err);
    } finally {
      setLoading(false); // Đã có ở phiên bản trước
    }
  };

  return (
    // SỬA LỖI LỆCH FORM: Thêm w-screen
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-neutral-light py-12 px-4 sm:px-6 lg:px-8">
      {/* BOX CHỨA FORM - Thêm mx-auto để chắc chắn hơn nữa */}
      <div className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl rounded-xl mx-auto">
        <div>
          <Link to="/" className="flex justify-center"> {/* Căn giữa logo/tên trang */}
            {/* Bạn có thể thay bằng logo hình ảnh nếu muốn */}
            <h2 className="text-3xl font-extrabold text-primary-green">
              THUÊ XE ONLINE
            </h2>
          </Link>
          <h3 className="mt-4 text-center text-xl font-bold text-gray-800">
            Đăng Nhập Tài Khoản
          </h3>
        </div>
        {/* ... (phần error và form giữ nguyên như code hoàn chỉnh đã cung cấp trước đó) ... */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 my-3 rounded-md text-sm" role="alert">
            <p className="font-semibold">Lỗi Đăng Nhập</p>
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="Địa chỉ Email"
            type="email"
            name="email"
            id="email-address"
            placeholder="abc@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
          />
          <Input
            label="Mật khẩu"
            type="password"
            name="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          />
          <div className="flex items-center justify-end text-sm">
            <a href="#" className="font-medium text-primary-green hover:text-primary-green-dark">
              Quên mật khẩu?
            </a>
          </div>
          <Button type="submit" isLoading={loading} disabled={loading} className="w-full py-3 text-base">
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-primary-green hover:text-primary-green-dark">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}