import React, { useState } from 'react';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Button from '../../common/Button';
import { MapPinIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'; // Chỉ dùng icon cần thiết

export default function BookingFormSection() {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    carType: '',
    pickupDate: '',
    returnDate: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.pickupLocation) newErrors.pickupLocation = "Vui lòng nhập điểm nhận.";
    if (!formData.pickupDate) newErrors.pickupDate = "Vui lòng chọn ngày nhận.";
    if (!formData.returnDate) newErrors.returnDate = "Vui lòng chọn ngày trả.";
    // Thêm validation: ngày trả phải sau hoặc bằng ngày nhận
    if (formData.pickupDate && formData.returnDate && formData.returnDate < formData.pickupDate) {
        newErrors.returnDate = "Ngày trả phải sau hoặc bằng ngày nhận.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    console.log('Form tìm kiếm xe:', formData);
    // TODO: navigate(`/cars?pickup=${formData.pickupLocation}&type=${formData.carType}...`);
  };

  const carTypeOptions = [
    { value: '', label: 'Tất cả loại xe' },
    { value: '4-cho', label: 'Xe 4 chỗ' },
    { value: '7-cho', label: 'Xe 7 chỗ' },
    { value: '16-cho', label: 'Xe 16 chỗ' },
    { value: 'suv', label: 'SUV/Gầm cao' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'limousine', label: 'Limousine' },
  ];

  const today = new Date().toISOString().split("T")[0];

  return (
    // ID này để HeroSection có thể cuộn xuống
    <section id="booking-form-section" className="py-8 md:py-10 bg-gray-800 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-5 items-end p-6 bg-white dark:bg-slate-700 rounded-lg shadow-xl"
        >
          <Input
            label="Điểm đi (Thành phố, sân bay, điểm cụ thể)"
            name="pickupLocation"
            id="pickupLocationHome" // Đặt ID khác nếu có form khác
            placeholder="VD: Hà Nội hoặc Sân bay Nội Bài"
            value={formData.pickupLocation}
            onChange={handleChange}
            error={errors.pickupLocation}
            icon={<MapPinIcon className="h-5 w-5 text-gray-400" />}
            labelClassName="text-sm font-medium text-gray-700 dark:text-gray-300"
            required
          />
          <Select
            label="Loại xe (Tùy chọn)"
            name="carType"
            id="carTypeHome"
            value={formData.carType}
            onChange={handleChange}
            options={carTypeOptions}
            error={errors.carType}
            labelClassName="text-sm font-medium text-gray-700 dark:text-gray-300"
          />
          <Input
            label="Ngày nhận xe"
            type="date"
            name="pickupDate"
            id="pickupDateHome"
            value={formData.pickupDate}
            onChange={handleChange}
            error={errors.pickupDate}
            min={today}
            labelClassName="text-sm font-medium text-gray-700 dark:text-gray-300"
            required
          />
          <Input
            label="Ngày trả xe"
            type="date"
            name="returnDate"
            id="returnDateHome"
            value={formData.returnDate}
            onChange={handleChange}
            error={errors.returnDate}
            min={formData.pickupDate || today} // Ngày trả không được trước ngày nhận
            labelClassName="text-sm font-medium text-gray-700 dark:text-gray-300"
            required
          />
          <Button
            type="submit"
            size="lg"
            className="w-full !bg-primary-green hover:!bg-primary-green-dark text-white h-[42px] mt-auto sm:mt-7 font-semibold" // Căn chiều cao với input, sm:mt-7 để căn với label
            // Nếu muốn giống mẫu (nút màu đỏ):
            // className="w-full !bg-red-600 hover:!bg-red-700 text-white h-[42px] mt-auto sm:mt-7 font-semibold"
          >
            Tìm Xe Ngay
          </Button>
        </form>
      </div>
    </section>
  );
}