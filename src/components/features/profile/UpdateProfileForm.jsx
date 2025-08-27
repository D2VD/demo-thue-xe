// src/components/features/profile/UpdateProfileForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { ArrowUpTrayIcon, PhotoIcon, XCircleIcon,  UserCircleIcon } from '@heroicons/react/24/outline';

const profileSchema = z.object({
  full_name: z.string().min(3, "Họ tên phải có ít nhất 3 ký tự.").max(100, "Họ tên không quá 100 ký tự."),
  phone_number: z.string().regex(/^\d{10,11}$/, "Số điện thoại không hợp lệ (10-11 chữ số).").optional().or(z.literal('')), // Cho phép rỗng hoặc đúng định dạng
  // avatar_url sẽ được xử lý riêng
});

export default function UpdateProfileForm() {
  const { user, session, loading: authLoading, refreshUserProfile } = useAuth(); // Thêm refreshUserProfile
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.profile?.avatar_url || null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
    }
  });

  useEffect(() => {
    if (user && user.profile) {
      setValue('full_name', user.profile.full_name || '');
      setValue('phone_number', user.profile.phone_number || '');
      setAvatarPreview(user.profile.avatar_url || null);
    }
  }, [user, setValue]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setAvatarPreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    // Không set avatar_url thành null ở đây, việc xóa sẽ xử lý khi submit
  };

  const onSubmit = async (formData) => {
    if (!user || !session) {
      setSubmitStatus({ message: 'Bạn cần đăng nhập để thực hiện hành động này.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus({ message: '', type: '' });
    let newAvatarUrl = user.profile?.avatar_url; // Giữ avatar cũ nếu không thay đổi

    try {
      // 1. Upload avatar mới nếu có
      if (avatarFile) {
        // Xóa avatar cũ trên Storage nếu có và khác avatar mới
        if (user.profile?.avatar_url) {
          const oldAvatarPath = user.profile.avatar_url.substring(user.profile.avatar_url.lastIndexOf('/') + 1);
          // Cần kiểm tra xem oldAvatarPath có phải là path mặc định hay không trước khi xóa
          // await supabase.storage.from('avatars').remove([oldAvatarPath]);
          console.log("TODO: Implement delete old avatar from storage:", oldAvatarPath);
        }

        const fileName = `avatar-${user.id}-${Date.now()}.${avatarFile.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars') // Bucket 'avatars'
          .upload(fileName, avatarFile, { upsert: true }); // upsert: true để ghi đè nếu user upload lại ảnh trùng tên (ít khả năng)

        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
        newAvatarUrl = publicUrlData.publicUrl;
      } else if (!avatarPreview && user.profile?.avatar_url) {
        // Người dùng đã xóa preview và có avatar cũ -> Xóa avatar
        // await supabase.storage.from('avatars').remove([user.profile.avatar_url.split('/').pop()]);
        console.log("TODO: Implement delete avatar from storage when preview is removed.");
        newAvatarUrl = null;
      }

      // 2. Cập nhật bảng 'profiles'
      const profileUpdates = {
        full_name: formData.full_name,
        phone_number: formData.phone_number || null, // Gửi null nếu rỗng
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      setSubmitStatus({ message: 'Cập nhật thông tin cá nhân thành công!', type: 'success' });
      if (refreshUserProfile) refreshUserProfile(); // Gọi hàm để làm mới user state trong AuthContext

    } catch (err) {
      console.error("Error updating profile:", err);
      setSubmitStatus({ message: `Lỗi: ${err.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading && !user) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }
  if (!user) {
    return <p className="text-center text-gray-600 dark:text-gray-400">Vui lòng đăng nhập để xem thông tin cá nhân.</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-dark dark:text-white mb-6">Thông Tin Cá Nhân</h2>
      {submitStatus.message && (
        <div className={`p-3 mb-6 rounded-md text-sm ${submitStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {submitStatus.message}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh đại diện</label>
            <div className="mt-1 flex items-center space-x-5">
                <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                {avatarPreview ? (
                    <img className="h-full w-full object-cover" src={avatarPreview} alt="Avatar Preview" />
                ) : (
                    <UserCircleIcon className="h-full w-full text-gray-300 dark:text-gray-500" />
                )}
                </span>
                <label htmlFor="avatar-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <ArrowUpTrayIcon className="w-5 h-5 inline mr-1.5" />
                    <span>Thay đổi</span>
                    <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" onChange={handleAvatarChange} accept="image/png, image/jpeg, image/webp" />
                </label>
                {avatarPreview && (
                    <Button variant="text" size="sm" onClick={removeAvatarPreview} className="!text-red-500 hover:!text-red-600 !p-1" title="Xóa ảnh hiện tại">
                        <XCircleIcon className="h-6 w-6"/>
                    </Button>
                )}
            </div>
        </div>

        <Input label="Họ và Tên (*)" error={errors.full_name?.message} {...register('full_name')} />
        <Input label="Số Điện Thoại" type="tel" error={errors.phone_number?.message} {...register('phone_number')} />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{user.email}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email không thể thay đổi.</p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || !isDirty && !avatarFile} className="!bg-primary-green hover:!bg-primary-green-dark">
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
}