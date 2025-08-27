// src/components/features/profile/BookingHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import Spinner from '../../common/Spinner';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, InformationCircleIcon, XCircleIcon as CancelIconOutline } from '@heroicons/react/24/outline';
import Pagination from '../../common/Pagination';
import Modal from '../../common/Modal';
import Button from '../../common/Button';

const ITEMS_PER_PAGE = 5;

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500';
    case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-600/30 dark:text-blue-300 border border-blue-300 dark:border-blue-500';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-600/30 dark:text-green-300 border border-green-300 dark:border-green-500';
    case 'cancelled': return 'bg-gray-200 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400 border border-gray-300 dark:border-gray-600 line-through';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-600/30 dark:text-red-300 border border-red-300 dark:border-red-500';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-600/30 dark:text-gray-400 border border-gray-300 dark:border-gray-500';
  }
};

const getStatusText = (status) => {
    const options = [
        { value: 'pending', label: 'Chờ xác nhận' }, { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'completed', label: 'Hoàn thành' }, { value: 'cancelled', label: 'Đã hủy' },
        { value: 'rejected', label: 'Đã từ chối' },
    ];
    return options.find(opt => opt.value === status)?.label || status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; options.hour12 = false;}
      return date.toLocaleString('vi-VN', options);
    } catch (e) { return 'N/A'; }
};


export default function BookingHistory() {
  const { user, session, loading: authContextIsLoading } = useAuth(); // Đổi tên loading từ context
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true); // State loading riêng cho fetch bookings
  const [fetchError, setFetchError] = useState(null); // Đổi tên error state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState({ text: '', type: ''});


  const fetchUserBookings = useCallback(async () => {
    if (!user || !session) { // Đảm bảo có user và session trước khi fetch
      setIsLoadingBookings(false);
      setBookings([]);
      setTotalBookings(0);
      setTotalPages(0);
      return;
    }

    setIsLoadingBookings(true);
    setFetchError(null);
    try {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data, error, count } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (name, slug, image_url)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setBookings(data || []);
      setTotalBookings(count || 0);
      const calculatedTotalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
      setTotalPages(calculatedTotalPages);
      // Nếu trang hiện tại vượt quá tổng số trang (ví dụ sau khi xóa item cuối của trang cuối)
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setCurrentPage(calculatedTotalPages);
      } else if (calculatedTotalPages === 0 && count === 0) { // Nếu không có item nào
        setCurrentPage(1); // Reset về trang 1
      }


    } catch (err) {
      console.error("Error fetching user bookings:", err);
      setFetchError(err.message || "Không thể tải lịch sử đặt xe.");
    } finally {
      setIsLoadingBookings(false);
    }
  }, [user, session, currentPage]); // Bỏ fetchUserBookings khỏi dependency của chính nó

  useEffect(() => {
    // Chỉ fetch bookings nếu AuthContext đã load xong và có user
    if (!authContextIsLoading) {
        if (user && session) {
            fetchUserBookings();
        } else {
            // Nếu AuthContext load xong mà không có user/session, reset state
            setIsLoadingBookings(false);
            setBookings([]);
            setTotalBookings(0);
            setTotalPages(0);
        }
    }
  }, [authContextIsLoading, user, session, fetchUserBookings]); // Thêm fetchUserBookings vào đây

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // fetchUserBookings sẽ tự chạy lại do currentPage thay đổi và là dependency của useEffect gọi nó
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const promptCancelBooking = (booking) => {
    setBookingToCancel(booking);
    setCancelMessage({text: '', type: ''});
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel || !user) return; // Cần user để check quyền
    setIsCancelling(true);
    setCancelMessage({text: '', type: ''});
    try {
      const { data: currentBooking, error: fetchCurrentError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingToCancel.id)
        .eq('user_id', user.id) // Đảm bảo user chỉ lấy đơn của mình
        .single();

      if (fetchCurrentError || !currentBooking) {
        throw new Error("Không thể lấy thông tin đơn hàng hiện tại hoặc bạn không có quyền.");
      }

      if (!['pending', 'confirmed'].includes(currentBooking.status)) {
        throw new Error(`Không thể hủy đơn hàng ở trạng thái "${getStatusText(currentBooking.status)}".`);
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingToCancel.id)
        .eq('user_id', user.id); // Double check user_id khi update

      if (updateError) throw updateError;

      setCancelMessage({text: `Đã hủy thành công đơn hàng #${bookingToCancel.booking_code}.`, type: 'success'});
      // Cập nhật UI ngay lập tức
      setBookings(prevBookings =>
        prevBookings.map(b =>
          b.id === bookingToCancel.id ? { ...b, status: 'cancelled', updated_at: new Date().toISOString() } : b
        )
      );
      // Không cần fetchUserBookings() ngay nếu chỉ cập nhật 1 item và không thay đổi số lượng item / trang
      // Nếu việc hủy làm thay đổi số trang (ví dụ xóa item cuối của trang), cần fetch lại hoặc tính toán lại totalPages
      // Để đơn giản, có thể fetch lại sau khi modal đóng
      setTimeout(() => {
        setShowCancelModal(false);
        setBookingToCancel(null);
        // fetchUserBookings(); // Cân nhắc fetch lại ở đây nếu cần cập nhật tổng số item
      }, 2000);

    } catch (err) {
      console.error("Error cancelling booking:", err);
      setCancelMessage({text: `Lỗi khi hủy đơn hàng: ${err.message}`, type: 'error'});
    } finally {
      setIsCancelling(false);
    }
  };


  if (authContextIsLoading) {
    return <div className="flex justify-center items-center min-h-[300px]"><Spinner size="lg" /></div>;
  }

  if (!user && !session) {
    return (
        <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg shadow">
            <InformationCircleIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"/>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">Bạn Chưa Đăng Nhập</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Vui lòng đăng nhập để xem lịch sử đặt xe của bạn.</p>
            <Link to="/login">
                <Button variant="primary" size="md" className="!bg-primary-green hover:!bg-primary-green-dark">
                    Đăng Nhập Ngay
                </Button>
            </Link>
        </div>
    );
  }

  if (isLoadingBookings) { // Sử dụng state loading riêng của component
    return <div className="flex justify-center items-center min-h-[300px]"><Spinner size="lg" /></div>;
  }

  if (fetchError) { // Sử dụng state error riêng
    return <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-300 dark:border-red-500">{fetchError}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-dark dark:text-white mb-6 flex items-center">
        <CalendarDaysIcon className="w-7 h-7 mr-3 text-primary-green"/> Lịch Sử Đặt Xe
      </h2>
      {bookings.length === 0 ? (
        <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg shadow">
            <InformationCircleIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"/>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">Bạn chưa có đơn đặt xe nào.</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Hãy bắt đầu khám phá và lựa chọn chiếc xe ưng ý cho chuyến đi của bạn!</p>
            <Link to="/cars">
                <Button variant="primary" size="md" className="!bg-primary-green hover:!bg-primary-green-dark">
                    Khám Phá Xe Ngay
                </Button>
            </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h3 className="text-lg md:text-xl font-semibold text-primary-green dark:text-primary-green">
                    Đơn hàng: <span className="font-mono text-neutral-dark dark:text-gray-100">#{booking.booking_code}</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ngày đặt: {formatDate(booking.created_at)}</p>
                </div>
                <span className={`mt-2 sm:mt-0 px-3 py-1.5 inline-flex text-xs leading-tight font-bold rounded-full ${getStatusClass(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4 text-sm">
                <div className="md:col-span-4 lg:col-span-3">
                  {booking.cars?.image_url ? (
                    <Link to={`/cars/${booking.cars.slug}`} className="block aspect-[4/3] rounded-lg overflow-hidden group">
                      <img src={booking.cars.image_url} alt={booking.cars.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    </Link>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">Ảnh xe</div>
                  )}
                </div>
                <div className="md:col-span-8 lg:col-span-5 space-y-1.5 text-gray-700 dark:text-gray-300">
                  <Link to={`/cars/${booking.cars?.slug || '#'}`} className="font-semibold text-lg text-neutral-dark dark:text-white hover:text-primary-green block mb-1">
                    {booking.cars?.name || 'Thông tin xe không khả dụng'}
                  </Link>
                  <p><strong>Nhận xe:</strong> {formatDate(booking.rent_date_from, true)}</p>
                  <p><strong>Trả xe:</strong> {formatDate(booking.rent_date_to, true)}</p>
                  <p><strong>Tổng tiền:</strong> <span className="font-bold text-xl text-accent-yellow">{booking.total_price?.toLocaleString('vi-VN')} VNĐ</span></p>
                </div>
                <div className="md:col-span-12 lg:col-span-4 flex flex-col justify-between items-start lg:items-end space-y-3">
                    {booking.notes && (
                        <div className="w-full text-xs italic text-gray-500 dark:text-gray-400 pt-1">
                            <p className="font-medium not-italic text-gray-600 dark:text-gray-300 mb-0.5">Ghi chú của bạn:</p>
                            <p className="line-clamp-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">{booking.notes}</p>
                        </div>
                    )}
                    <div className="mt-auto w-full flex justify-end">
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => promptCancelBooking(booking)}
                            leftIcon={<CancelIconOutline className="w-4 h-4" />}
                            className="!bg-red-50 hover:!bg-red-100 !text-red-600 border !border-red-300 dark:!bg-red-800/30 dark:!text-red-300 dark:!border-red-600 dark:hover:!bg-red-700/50"
                            disabled={isCancelling && bookingToCancel?.id === booking.id} // Disable nút nếu đang xử lý đơn này
                        >
                            {isCancelling && bookingToCancel?.id === booking.id ? 'Đang hủy...' : 'Hủy Đơn'}
                        </Button>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Modal Xác Nhận Hủy Đơn */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setBookingToCancel(null); setCancelMessage({text: '', type: ''}); }}
        title="Xác Nhận Hủy Đơn Hàng"
        size="lg"
        footerContent={
          <>
            <Button variant="outline" onClick={() => { setShowCancelModal(false); setBookingToCancel(null); setCancelMessage({text: '', type: ''});}} disabled={isCancelling} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Không</Button>
            <Button onClick={confirmCancelBooking} isLoading={isCancelling} disabled={isCancelling} variant="danger">
              {isCancelling ? 'Đang xử lý...' : 'Có, Hủy Đơn Này'}
            </Button>
          </>
        }
      >
        {cancelMessage.text && (
            <div className={`p-3 mb-4 rounded-md text-sm ${cancelMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {cancelMessage.text}
            </div>
        )}
        {!cancelMessage.text && bookingToCancel && (
            <>
            <p className="text-gray-700 dark:text-gray-300 text-base">
                Bạn có chắc chắn muốn hủy đơn hàng <span className="font-bold">#{bookingToCancel.booking_code}</span> với xe <span className="font-semibold">{bookingToCancel.cars?.name}</span> không?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Lưu ý: Hành động này có thể không thể hoàn tác. Vui lòng kiểm tra kỹ chính sách hủy đơn của chúng tôi.
            </p>
            </>
        )}
      </Modal>
    </div>
  );
}