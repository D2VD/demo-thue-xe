// src/components/features/cars/DetailedBookingForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import Input from '../../common/Input'; // Đảm bảo Input component đã được tạo và import đúng
import Button from '../../common/Button'; // Đảm bảo Button component đã được tạo và import đúng
import Modal from '../../common/Modal';   // Đảm bảo Modal component đã được tạo và import đúng
import { InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Thêm useLocation

export default function DetailedBookingForm({ carId, carName, pricePerDay }) {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Để lấy path hiện tại cho redirect sau login
  const today = new Date().toISOString().split("T")[0];
  const [minReturnDate, setMinReturnDate] = useState(today);

  const initialFormData = {
    pickupDate: '',
    pickupTime: '10:00',
    returnDate: '',
    returnTime: '10:00',
    fullName: '',
    phoneNumber: '',
    email: '',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [totalPrice, setTotalPrice] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (user && session) {
      setFormData(prev => ({
        ...prev,
        fullName: user.profile?.full_name || prev.fullName || user.email?.split('@')[0] || '', // Lấy tên từ profile hoặc email
        phoneNumber: user.profile?.phone_number || prev.phoneNumber || '',
        email: user.email || prev.email || '',
      }));
      setShowLoginModal(false);
    } else {
      // Reset thông tin cá nhân nếu user logout hoặc chưa login
      setFormData(prev => ({
        ...prev,
        fullName: '',
        phoneNumber: '',
        email: '',
      }));
    }
  }, [user, session]);

  useEffect(() => {
    if (formData.pickupDate && formData.returnDate && pricePerDay > 0) {
      const date1 = new Date(formData.pickupDate);
      const date2 = new Date(formData.returnDate);
      if (date2 >= date1) {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setNumberOfDays(diffDays);
        setTotalPrice(diffDays * pricePerDay);
        if (errors.returnDate && date2 >= date1) {
            setErrors(prev => ({...prev, returnDate: null}));
        }
      } else {
        setNumberOfDays(0);
        setTotalPrice(0);
      }
    } else {
      setNumberOfDays(0);
      setTotalPrice(0);
    }
  }, [formData.pickupDate, formData.returnDate, pricePerDay, errors.returnDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (name === 'pickupDate') {
        const newMinReturnDate = value || today;
        setMinReturnDate(newMinReturnDate);
        if (formData.returnDate && value > formData.returnDate) {
            setFormData(prev => ({ ...prev, returnDate: '' }));
        }
    }
  };

  const validateForm = () => {
    const currentErrors = {};
    if (!formData.pickupDate) currentErrors.pickupDate = "Vui lòng chọn ngày nhận.";
    if (!formData.returnDate) currentErrors.returnDate = "Vui lòng chọn ngày trả.";
    else if (new Date(formData.returnDate) < new Date(formData.pickupDate)) {
      currentErrors.returnDate = "Ngày trả phải sau hoặc bằng ngày nhận.";
    }
    if (!formData.pickupTime) currentErrors.pickupTime = "Vui lòng chọn giờ nhận.";
    if (!formData.returnTime) currentErrors.returnTime = "Vui lòng chọn giờ trả.";
    
    // Thông tin người dùng đã được xử lý bởi `user` state và `useEffect`
    // Không cần validate ở đây nữa nếu bắt buộc đăng nhập
    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ message: '', type: '' });

    if (!user || !session) {
      setShowLoginModal(true);
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    const bookingCode = `BK-${Date.now().toString().slice(-6)}`;
    const bookingData = {
      car_id: carId,
      user_id: user.id,
      customer_name: formData.fullName || user.profile?.full_name || user.email?.split('@')[0], // Đảm bảo có tên
      customer_phone: formData.phoneNumber || user.profile?.phone_number || 'N/A', // Đảm bảo có SĐT hoặc giá trị mặc định
      customer_email: formData.email || user.email, // Đảm bảo có email
      rent_date_from: `${formData.pickupDate}T${formData.pickupTime}:00.000Z`,
      rent_date_to: `${formData.returnDate}T${formData.returnTime}:00.000Z`,
      total_price: totalPrice,
      notes: formData.notes,
      status: 'pending',
      booking_code: bookingCode,
    };

    try {
      const { data, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;

      console.log('Booking successful:', data);
      setShowSuccessModal(true);
      setFormData(initialFormData); // Reset về giá trị ban đầu
      setErrors({});
      setNumberOfDays(0);
      setTotalPrice(0);
      setMinReturnDate(today); // Reset minReturnDate
    } catch (err) {
      console.error("Booking submission error:", err);
      setSubmitStatus({ message: `Lỗi khi gửi yêu cầu: ${err.message}. Vui lòng thử lại.`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-neutral-light dark:bg-gray-800 p-6 rounded-xl shadow-xl sticky top-24">
        <h3 className="text-2xl font-bold text-primary-green mb-1">Đặt Xe {carName}</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-5 text-sm">
          Giá thuê: <span className="font-bold text-accent-yellow text-lg">{pricePerDay ? pricePerDay.toLocaleString('vi-VN') : 'N/A'} VNĐ/ngày</span>
        </p>

        {submitStatus.message && !showSuccessModal && ( // Chỉ hiển thị lỗi submit nếu không có modal success
          <div className={`p-3 mb-4 rounded-md text-sm ${submitStatus.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ngày nhận (*)" type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} error={errors.pickupDate} min={today} required />
            <Input label="Giờ nhận (*)" type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} error={errors.pickupTime} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ngày trả (*)" type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} error={errors.returnDate} min={minReturnDate} required />
            <Input label="Giờ trả (*)" type="time" name="returnTime" value={formData.returnTime} onChange={handleChange} error={errors.returnTime} required />
          </div>

          {user && session && (
            <div className="p-3 bg-primary-green/10 dark:bg-primary-green/20 rounded-md text-sm space-y-1">
                <p className="font-medium text-neutral-dark dark:text-white">Thông tin người đặt (tự động):</p>
                <p><strong>Tên:</strong> {formData.fullName || user.profile?.full_name || user.email?.split('@')[0] || 'Chưa cập nhật'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>SĐT:</strong> {formData.phoneNumber || user.profile?.phone_number || 'Chưa cập nhật'}</p>
                 {(!user.profile?.full_name || !user.profile?.phone_number) && (
                    <Link to="/profile" className="text-xs text-secondary-blue hover:underline">Cập nhật thông tin cá nhân</Link>
                 )}
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú thêm (tùy chọn)</label>
            <textarea
              id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange}
              placeholder="Ví dụ: Yêu cầu giao xe tại sảnh khách sạn, cần ghế trẻ em..."
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm"
            ></textarea>
          </div>

          {numberOfDays > 0 && (
            <div className="p-4 bg-primary-green/10 dark:bg-primary-green/20 rounded-md text-sm">
              <div className="flex justify-between items-center font-medium text-neutral-dark dark:text-white">
                <span>Số ngày thuê:</span>
                <span>{numberOfDays} ngày</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg text-primary-green dark:text-primary-green mt-1">
                <span>Tổng tiền tạm tính:</span>
                <span>{totalPrice.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || numberOfDays <= 0} className="w-full !bg-accent-yellow hover:!bg-yellow-400 !text-neutral-dark disabled:opacity-60" size="lg">
            {isSubmitting ? 'Đang Gửi Yêu Cầu...' : 'Gửi Yêu Cầu Đặt Xe'}
          </Button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            <InformationCircleIcon className="w-4 h-4 inline mr-1 align-text-bottom" />
            Nhân viên của chúng tôi sẽ liên hệ lại với bạn để xác nhận trong thời gian sớm nhất.
          </p>
        </form>
      </div>

      {/* Modal Yêu Cầu Đăng Nhập */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Yêu Cầu Đăng Nhập"
        footerContent={
          <>
            <Button variant="outline" onClick={() => setShowLoginModal(false)} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Hủy</Button>
            <Button onClick={() => {
                setShowLoginModal(false);
                // Lưu lại trang hiện tại để redirect về sau khi login
                navigate('/login', { state: { from: location } });
            }} className="!bg-primary-green hover:!bg-primary-green-dark">
              Đăng Nhập Ngay
            </Button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt xe.
        </p>
      </Modal>

      {/* Modal Đặt Xe Thành Công */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Yêu Cầu Đã Được Gửi!"
        size="md" // Có thể dùng size nhỏ hơn
        footerContent={
          <Button onClick={() => {
            setShowSuccessModal(false);
            // navigate('/dashboard/my-bookings'); // Chuyển đến trang lịch sử đặt xe nếu có
          }} className="!bg-primary-green hover:!bg-primary-green-dark w-full sm:w-auto">
            Đóng
          </Button>
        }
      >
        <div className="text-center py-4">
            <CheckCircleIcon className="w-16 h-16 text-primary-green mx-auto mb-5" />
            <h4 className="text-xl font-semibold text-neutral-dark dark:text-white mb-2">Đặt Xe Thành Công</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                Yêu cầu đặt xe <span className="font-semibold">{carName}</span> của bạn đã được ghi nhận.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
                Chúng tôi sẽ liên hệ với bạn qua SĐT hoặc Email đã cung cấp để xác nhận đơn hàng trong thời gian sớm nhất.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!
            </p>
        </div>
      </Modal>
    </>
  );
}