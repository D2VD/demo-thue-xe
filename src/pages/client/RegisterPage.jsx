// src/pages/client/RegisterPage.jsx
// ... (imports giữ nguyên như code hoàn chỉnh đã cung cấp trước đó)
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { // Kiểm tra độ dài mật khẩu
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { error: signUpError } = await signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      if (signUpError) throw signUpError;
      setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trong vòng vài phút.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
    } catch (err) {
      if (err.message && err.message.includes("User already registered")) {
        setError("Địa chỉ email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.");
      } else {
        setError(err.message || 'Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
      }
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // SỬA LỖI LỆCH FORM: Thêm w-screen
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-neutral-light py-12 px-4 sm:px-6 lg:px-8">
      {/* BOX CHỨA FORM - Thêm mx-auto */}
      <div className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl rounded-xl mx-auto">
        <div>
          <Link to="/" className="flex justify-center">
            <h2 className="text-3xl font-extrabold text-primary-green">
              THUÊ XE ONLINE
            </h2>
          </Link>
          <h3 className="mt-4 text-center text-xl font-bold text-gray-800">
            Tạo Tài Khoản Mới
          </h3>
        </div>
        {/* ... (phần error, message và form giữ nguyên như code hoàn chỉnh đã cung cấp trước đó) ... */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 my-3 rounded-md text-sm" role="alert">
            <p className="font-semibold">Lỗi Đăng Ký</p>
            <p>{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 my-3 rounded-md text-sm" role="alert">
            <p className="font-semibold">Thông Báo</p>
            <p>{message}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="Họ và Tên"
            type="text"
            name="fullName"
            id="full-name"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
          />
          <Input
            label="Địa chỉ Email"
            type="email"
            name="email"
            id="email-address-register"
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
            id="password-register"
            placeholder="Ít nhất 6 ký tự" // Rõ ràng hơn
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          />
          <Input
            label="Xác nhận Mật khẩu"
            type="password"
            name="confirmPassword"
            id="confirm-password"
            placeholder="Nhập lại mật khẩu" // Rõ ràng hơn
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
          />
          <Button type="submit" isLoading={loading} disabled={loading} className="w-full py-3 text-base">
            {loading ? 'Đang xử lý...' : 'Đăng Ký'}
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-primary-green hover:text-primary-green-dark">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}