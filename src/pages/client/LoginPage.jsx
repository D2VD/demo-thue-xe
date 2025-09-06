// src/pages/client/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Đảm bảo setError là một hàm state
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth(); // Đảm bảo signIn là một hàm
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset lỗi
    setLoading(true);

    // Kiểm tra lại xem signIn có phải là hàm không trước khi gọi
    if (typeof signIn !== 'function') {
        console.error("signIn from useAuth() is not a function!");
        setError("Lỗi hệ thống: Chức năng đăng nhập không khả dụng.");
        setLoading(false);
        return;
    }

    try {
      const { error: signInError } = await signIn({ email, password });

      if (signInError) {
        // Ném lỗi để catch block xử lý
        throw signInError;
      }
      
      // Nếu không có lỗi, điều hướng
      navigate(from, { replace: true });

    } catch (err) {
      console.error("Unexpected login error:", err); // Log lỗi đầy đủ ra console
      
      // Xử lý các thông báo lỗi thân thiện hơn
      if (err.message.includes("Invalid login credentials")) {
        setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      } else if (err.message.includes("Email not confirmed")) {
        setError("Vui lòng xác thực email của bạn trước khi đăng nhập.");
      } else {
        setError(err.message || 'Đã có lỗi không mong muốn xảy ra.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-xl">
        <div>
          <Link to="/">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-green">
              THUÊ XE ONLINE
            </h2>
          </Link>
          <h3 className="mt-2 text-center text-xl font-bold text-gray-800">
            Đăng Nhập Tài Khoản
          </h3>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p className="font-bold">Lỗi Đăng Nhập</p>
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
            <Link to="/forgot-password" className="font-medium text-primary-green hover:text-primary-green-dark">
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" isLoading={loading} disabled={loading} className="w-full">
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-primary-green hover:text-primary-green-dark">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}