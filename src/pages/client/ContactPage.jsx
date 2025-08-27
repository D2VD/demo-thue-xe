// src/pages/client/ContactPage.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabaseClient';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, PaperAirplaneIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    honeypot: '', // *** HONEYPOT FIELD ***
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (formSubmitError) {
        setFormSubmitError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên của bạn.";
    if (!formData.email.trim()) newErrors.email = "Vui lòng nhập địa chỉ email.";
    else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) newErrors.email = "Địa chỉ email không hợp lệ.";
    if (!formData.subject.trim()) newErrors.subject = "Vui lòng nhập tiêu đề tin nhắn.";
    if (!formData.message.trim()) newErrors.message = "Vui lòng nhập nội dung tin nhắn.";
    else if (formData.message.trim().length < 10) newErrors.message = "Nội dung tin nhắn phải có ít nhất 10 ký tự.";

    if (formData.phone.trim() && !/^(0[3|5|7|8|9])+([0-9]{8})\b$/.test(formData.phone.trim())) {
        newErrors.phone = "Số điện thoại không hợp lệ. (VD: 09xxxxxxxx)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitError('');
    if (!validateForm()) return;

    // *** HONEYPOT CHECK (CLIENT-SIDE - ĐƠN GIẢN) ***
    // Logic kiểm tra honeypot thực sự hiệu quả nên ở server-side (Edge Function)
    if (formData.honeypot) {
      console.log("Honeypot field filled, likely spam. Form not submitted.");
      // Bạn có thể không làm gì cả hoặc hiển thị một thông báo chung chung
      // để không cho bot biết nó đã bị phát hiện.
      // Ví dụ: setFormSubmitError("Có lỗi xảy ra, vui lòng thử lại.");
      // Hoặc chỉ đơn giản là return
      return;
    }

    setIsSubmitting(true);

    // Loại bỏ trường honeypot trước khi gửi đi
    const { honeypot, ...actualContactData } = formData;

    const contactDataToSave = {
      full_name: actualContactData.fullName.trim(),
      email: actualContactData.email.trim(),
      phone: actualContactData.phone.trim() || null,
      subject: actualContactData.subject.trim(),
      message: actualContactData.message.trim(),
    };

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([contactDataToSave]);

      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(error.message || "Không thể gửi tin nhắn do lỗi từ server.");
      }

      setShowSuccessModal(true);
      setFormData({ fullName: '', email: '', phone: '', subject: '', message: '', honeypot: '' });
      setErrors({});
    } catch (err) {
      console.error("Contact form submission error:", err);
      setFormSubmitError(`Lỗi khi gửi tin nhắn: ${err.message}. Vui lòng thử lại.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.0967602817267!2d105.78000761540003!3d21.02880209317267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab86cece2969%3A0x80f35ee16136484!2zS2FuZ25hbSBUb3dlciwgSOGInternal%20uLCBU4burIExpw6ptLCBIw6AgTuG7mWksIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1620000000000!5m2!1svi!2s";

  return (
    <>
      <Helmet>
        <title>Liên Hệ - Thuê Xe Online | Hỗ Trợ Khách Hàng 24/7</title>
        <meta name="description" content="Liên hệ với chúng tôi để được tư vấn và hỗ trợ về dịch vụ thuê xe. Địa chỉ, số điện thoại, email và form liên hệ trực tuyến." />
        <link rel="canonical" href="https://YOUR_DOMAIN.com/contact" />
      </Helmet>

      <header className="bg-primary-green text-white py-10 md:py-12 shadow-md">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Liên Hệ Với Chúng Tôi</h1>
          <p className="mt-3 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe mọi ý kiến đóng góp và giải đáp thắc mắc của bạn.
          </p>
        </div>
      </header>

      <section className="py-12 md:py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start">
            {/* Cột Thông Tin Liên Hệ và Bản Đồ */}
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-neutral-dark dark:text-white mb-6">Thông Tin Liên Hệ</h2>
                {/* ... (Nội dung thông tin liên hệ giữ nguyên) ... */}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-dark dark:text-white mb-4">Giờ Làm Việc</h3>
                {/* ... (Nội dung giờ làm việc giữ nguyên) ... */}
              </div>
              <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-2xl border dark:border-gray-700">
                {/* ... (iframe Google Maps giữ nguyên) ... */}
              </div>
            </div>

            {/* Cột Form Liên Hệ */}
            <div className="bg-neutral-light dark:bg-gray-800 p-6 md:p-10 rounded-xl shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-dark dark:text-white mb-8 text-center">Gửi Tin Nhắn Cho Chúng Tôi</h2>
              {formSubmitError && (
                <div className="p-4 mb-6 rounded-lg text-sm flex items-start bg-red-50 dark:bg-red-800/30 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-600 shadow">
                  <XCircleIcon className="w-5 h-5 mr-3 flex-shrink-0"/>
                  <span>{formSubmitError}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* *** HONEYPOT FIELD (ẨN) *** */}
                <div className="absolute -left-[5000px]" aria-hidden="true">
                  <label htmlFor="honeypot">Do not fill this if you are human</label>
                  <input
                    type="text"
                    id="honeypot"
                    name="honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.honeypot}
                    onChange={handleChange}
                  />
                </div>

                <Input label="Họ và Tên (*)" name="fullName" id="contactFullName" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={handleChange} error={errors.fullName} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Email (*)" name="email" type="email" id="contactEmail" placeholder="email@example.com" value={formData.email} onChange={handleChange} error={errors.email} required />
                  <Input label="Số Điện Thoại (Tùy chọn)" name="phone" type="tel" id="contactPhone" placeholder="09xxxxxxxx" value={formData.phone} onChange={handleChange} error={errors.phone} />
                </div>
                <Input label="Tiêu Đề (*)" name="subject" id="contactSubject" placeholder="V/v Hỗ trợ dịch vụ, góp ý..." value={formData.subject} onChange={handleChange} error={errors.subject} required />
                <div>
                  <label htmlFor="contactMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung tin nhắn (*)</label>
                  <textarea
                    id="contactMessage"
                    name="message"
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Nội dung chi tiết bạn muốn trao đổi hoặc góp ý với chúng tôi..."
                    required
                    className={`appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm ${errors.message ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  ></textarea>
                  {errors.message && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.message}</p>}
                </div>
                <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="w-full !bg-primary-green hover:!bg-primary-green-dark py-3 text-base" size="lg" leftIcon={<PaperAirplaneIcon className="w-5 h-5 mr-2"/>}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Tin Nhắn Ngay'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Gửi Tin Nhắn Thành Công */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Gửi Tin Nhắn Thành Công!"
        size="md"
        footerContent={
          <Button onClick={() => setShowSuccessModal(false)} className="!bg-primary-green hover:!bg-primary-green-dark">
            Đóng
          </Button>
        }
      >
        <div className="text-center py-4">
          <CheckCircleIcon className="w-16 h-16 text-primary-green mx-auto mb-5" />
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Cảm ơn bạn đã liên hệ!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong thời gian sớm nhất.
          </p>
        </div>
      </Modal>
    </>
  );
}