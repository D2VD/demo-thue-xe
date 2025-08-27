// src/components/features/profile/ChangePasswordForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext'; // Để lấy user nếu cần
import Input from '../../common/Input';
import Button from '../../common/Button';
import { KeyIcon } from '@heroicons/react/24/outline';

const passwordSchema = z.object({
  // currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."), // Bỏ qua nếu Supabase không yêu cầu
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự."),
  confirmPassword: z.string().min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
  path: ["confirmPassword"], // Lỗi sẽ hiển thị ở trường confirmPassword
});

export default function ChangePasswordForm() {
  const { user } = useAuth(); // Lấy user để đảm bảo họ đã đăng nhập
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      // currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (formData) => {
    if (!user) {
      setSubmitStatus({ message: 'Bạn cần đăng nhập để thực hiện hành động này.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus({ message: '', type: '' });

    try {
      // Supabase cho phép cập nhật mật khẩu chỉ với mật khẩu mới nếu user đã đăng nhập.
      // Nếu bạn muốn yêu cầu mật khẩu cũ, bạn cần một flow khác (ví dụ: reauthenticate).
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) {
        // Xử lý các lỗi cụ thể từ Supabase nếu cần
        if (error.message.includes("New password should be different from the old password.")) {
            throw new Error("Mật khẩu mới phải khác với mật khẩu cũ.");
        }
        if (error.message.includes("Password should be at least 6 characters.")) {
            throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        throw error;
      }

      setSubmitStatus({ message: 'Đổi mật khẩu thành công!', type: 'success' });
      reset(); // Reset form sau khi thành công

    } catch (err) {
      console.error("Error changing password:", err);
      setSubmitStatus({ message: `Lỗi: ${err.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <p className="text-center text-gray-600 dark:text-gray-400">Vui lòng đăng nhập để đổi mật khẩu.</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-dark dark:text-white mb-6 flex items-center">
        <KeyIcon className="w-7 h-7 mr-2 text-primary-green"/> Đổi Mật Khẩu
      </h2>
      {submitStatus.message && (
        <div className={`p-3 mb-6 rounded-md text-sm ${submitStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {submitStatus.message}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* <Input
          label="Mật Khẩu Hiện Tại (*)"
          type="password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        /> */}
        <Input
          label="Mật Khẩu Mới (*)"
          type="password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
          autoComplete="new-password"
        />
        <Input
          label="Xác Nhận Mật Khẩu Mới (*)"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          autoComplete="new-password"
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="!bg-primary-green hover:!bg-primary-green-dark">
            {isSubmitting ? 'Đang lưu...' : 'Đổi Mật Khẩu'}
          </Button>
        </div>
      </form>
    </div>
  );
}