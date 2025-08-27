// src/pages/admin/ManageBookingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
// import { Link } from 'react-router-dom'; // Có thể không cần Link ở đây nếu chỉ update status
import { supabase } from '../../lib/supabaseClient';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxXMarkIcon, // Thay cho ClockIcon nếu ý là hủy
  UserCircleIcon,
  TruckIcon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import Select from '../../components/common/Select';

const ITEMS_PER_PAGE = 10;
const BOOKING_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy bởi KH/Admin' }, // Đổi tên cho rõ
  { value: 'rejected', label: 'Bị từ chối' }, // Đổi tên cho rõ
];

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/30 dark:text-yellow-300';
    case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/30 dark:text-blue-300';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-500/30 dark:text-green-300';
    case 'cancelled': return 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
};
const getStatusText = (status) => BOOKING_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;


export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Dùng cho cả update status và notes
  const [adminNotes, setAdminNotes] = useState('');

  const [showConfirmActionModal, setShowConfirmActionModal] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState({
    action: null, bookingId: null, newStatus: '', message: '',
  });

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Gọi RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'search_bookings_with_details',
        {
          p_search_term: searchTerm || '', // Gửi chuỗi rỗng nếu searchTerm là null/undefined
          p_status_filter: statusFilter || '', // Gửi chuỗi rỗng nếu statusFilter là null/undefined
          p_page_number: currentPage,
          p_page_size: ITEMS_PER_PAGE,
        }
      );

      if (rpcError) throw rpcError;

      const bookingsData = rpcData || [];
      
      // Dữ liệu trả về từ RPC là một mảng các object, mỗi object có các trường đã định nghĩa trong RETURNS TABLE
      // Chúng ta cần map lại để khớp với cấu trúc join lồng nhau mà component đang mong đợi cho cars và profiles
      const formattedBookings = bookingsData.map(b => ({
        ...b, // Giữ lại tất cả các cột gốc từ bookings (id, booking_code, ...)
        cars: { // Tạo object cars
            name: b.car_name,
            image_url: b.car_image_url,
            // Thêm các trường khác của cars nếu RPC trả về và bạn cần
        },
        profiles: b.profile_full_name || b.profile_email ? { // Tạo object profiles nếu có thông tin
            full_name: b.profile_full_name,
            //email: b.profile_email,
            // Thêm các trường khác của profiles nếu RPC trả về và bạn cần
        } : null,
      }));

      setBookings(formattedBookings);

      // Lấy total_count từ bản ghi đầu tiên (tất cả các bản ghi sẽ có cùng total_count)
      const currentTotalCount = bookingsData.length > 0 ? Number(bookingsData[0].total_count) : 0;
      setTotalBookings(currentTotalCount);
      setTotalPages(Math.ceil(currentTotalCount / ITEMS_PER_PAGE));

    } catch (err) {
      console.error("Error fetching bookings via RPC:", err); // Dòng 99 của bạn có thể là ở đây
      setError(err.message || "Không thể tải danh sách đơn đặt xe.");
      setBookings([]);
      setTotalBookings(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]); // Dependencies của useCallback

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.admin_notes || '');
    setShowDetailModal(true);
  };
  const closeDetailModal = () => {
    setSelectedBooking(null);
    setShowDetailModal(false);
    setAdminNotes('');
  };

  const promptUpdateStatus = (bookingId, newStatus, actionMessage) => {
    let currentBookingCode = selectedBooking?.booking_code;
    if (!currentBookingCode && bookingId) {
        const bookingToUpdate = bookings.find(b => b.id === bookingId);
        currentBookingCode = bookingToUpdate?.booking_code;
    }

    setConfirmActionDetails({
      action: newStatus,
      bookingId: bookingId || selectedBooking?.id,
      newStatus: newStatus,
      message: actionMessage || `Bạn có chắc muốn ${getStatusText(newStatus).toLowerCase()} đơn hàng #${currentBookingCode || bookingId}?`,
    });
    setShowConfirmActionModal(true);
  };

  const executeStatusUpdate = async () => {
    const { bookingId, newStatus } = confirmActionDetails;
    if (!bookingId || !newStatus) return;

    setIsUpdatingStatus(true);
    setShowConfirmActionModal(false);

    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      fetchBookings();
      if (showDetailModal && selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus, updated_at: new Date().toISOString() }));
      }
      alert("Cập nhật trạng thái thành công!");
    } catch (err) {
      console.error("Error updating booking status:", err);
      alert(`Lỗi khi cập nhật trạng thái: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
      setConfirmActionDetails({ action: null, bookingId: null, newStatus: '', message: '' });
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedBooking || !selectedBooking.id) return;
    setIsUpdatingStatus(true);
    try {
        const { error: notesError } = await supabase
            .from('bookings')
            .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
            .eq('id', selectedBooking.id);
        if (notesError) throw notesError;
        alert("Lưu ghi chú của admin thành công!");
        setSelectedBooking(prev => ({...prev, admin_notes: adminNotes, updated_at: new Date().toISOString()}));
        // Cập nhật lại item trong mảng bookings để hiển thị ngay nếu cần
        setBookings(prevBookings => prevBookings.map(b => b.id === selectedBooking.id ? {...b, admin_notes: adminNotes, updated_at: new Date().toISOString()} : b));
    } catch (err) {
        console.error("Error saving admin notes:", err);
        alert(`Lỗi khi lưu ghi chú: ${err.message}`);
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0,0); // Cuộn lên đầu trang
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return new Date(dateString).toLocaleString('vi-VN', options);
    } catch (e) { return 'N/A'; }
  };

  return (
    <>
      <Helmet>
        <title>Quản Lý Đơn Đặt Xe | Admin Thuê Xe Online</title>
      </Helmet>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:min-w-[250px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Tìm mã đơn, tên, SĐT, tên xe..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="admin-input pl-10"
                />
            </div>
            <div className="relative w-full sm:min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
                 <Select
                    id="status-filter"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    options={BOOKING_STATUS_OPTIONS}
                    className="pl-10 admin-select"
                 />
            </div>
        </div>
      </div>

      {isLoading && <div className="flex justify-center items-center py-10"><Spinner size="lg" /></div>}
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p className="font-bold">Lỗi!</p><p>{error}</p></div>}

      {!isLoading && !error && (
        <>
          {bookings.length === 0 && (searchTerm || statusFilter) && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Không tìm thấy đơn đặt xe nào phù hợp.</p>
          )}
          {bookings.length === 0 && !searchTerm && !statusFilter && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Chưa có đơn đặt xe nào.</p>
          )}

          {bookings.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="th-admin">Mã Đơn</th>
                    <th className="th-admin">Khách Hàng</th>
                    <th className="th-admin">Xe Đặt</th>
                    <th className="th-admin">Ngày Thuê</th>
                    <th className="th-admin">Ngày Trả</th>
                    <th className="th-admin">Tổng Tiền</th>
                    <th className="th-admin">Trạng Thái</th>
                    <th className="th-admin text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="td-admin font-mono text-primary-green dark:text-primary-green hover:underline cursor-pointer" onClick={() => openDetailModal(booking)}>{booking.booking_code}</td>
                      <td className="td-admin">
                        <div className="font-medium text-gray-900 dark:text-white">{booking.customer_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{booking.customer_phone}</div>
                      </td>
                      <td className="td-admin">{booking.cars?.name || 'N/A'}</td>
                      <td className="td-admin">{formatDate(booking.rent_date_from, true)}</td>
                      <td className="td-admin">{formatDate(booking.rent_date_to, true)}</td>
                      <td className="td-admin font-semibold text-accent-yellow">
                        {booking.total_price ? booking.total_price.toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}
                      </td>
                      <td className="td-admin">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </td>
                      <td className="td-admin text-center space-x-1">
                        <Button variant="text" size="sm" onClick={() => openDetailModal(booking)} className="!text-blue-600 hover:!text-blue-800 !p-1" title="Xem Chi Tiết"><EyeIcon className="h-5 w-5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalBookings > 0 && totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </>
      )}

      {/* Modal Chi Tiết Đơn Đặt Xe */}
      {selectedBooking && (
        <Modal
          isOpen={showDetailModal}
          onClose={closeDetailModal}
          title={`Chi Tiết Đơn: #${selectedBooking.booking_code}`}
          size="5xl"
          footerContent={
            <div className="flex flex-wrap justify-end gap-3">
                {selectedBooking.status === 'pending' && (
                    <Button variant="primary" onClick={() => promptUpdateStatus(selectedBooking.id, 'confirmed', `Xác nhận đơn hàng #${selectedBooking.booking_code}?`)} isLoading={isUpdatingStatus && confirmActionDetails.newStatus === 'confirmed'} leftIcon={<CheckCircleIcon className="w-5 h-5"/>}>Xác Nhận Đơn</Button>
                )}
                {selectedBooking.status === 'confirmed' && (
                    <Button variant="success" onClick={() => promptUpdateStatus(selectedBooking.id, 'completed', `Đánh dấu hoàn thành đơn hàng #${selectedBooking.booking_code}?`)} isLoading={isUpdatingStatus && confirmActionDetails.newStatus === 'completed'} leftIcon={<CheckCircleIcon className="w-5 h-5"/>}>Hoàn Thành</Button>
                )}
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                    <>
                    <Button variant="warning" onClick={() => promptUpdateStatus(selectedBooking.id, 'rejected', `Từ chối đơn hàng #${selectedBooking.booking_code}?`)} isLoading={isUpdatingStatus && confirmActionDetails.newStatus === 'rejected'} leftIcon={<XCircleIcon className="w-5 h-5"/>}>Từ Chối</Button>
                    <Button variant="danger" onClick={() => promptUpdateStatus(selectedBooking.id, 'cancelled', `Hủy đơn hàng #${selectedBooking.booking_code}?`)} isLoading={isUpdatingStatus && confirmActionDetails.newStatus === 'cancelled'} leftIcon={<ArchiveBoxXMarkIcon className="w-5 h-5"/>}>Hủy Đơn</Button>
                    </>
                )}
                <Button variant="outline" onClick={closeDetailModal} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Đóng</Button>
            </div>
          }
        >
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            {/* Phần Thông Tin Chung */}
            <div className="p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
              <h4 className="text-lg font-semibold text-primary-green mb-3">Thông Tin Đơn Hàng</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <p><strong>Mã đơn:</strong> <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">{selectedBooking.booking_code}</span></p>
                <p><strong>Trạng thái:</strong> <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${getStatusClass(selectedBooking.status)}`}>{getStatusText(selectedBooking.status)}</span></p>
                <p><strong>Ngày tạo đơn:</strong> {formatDate(selectedBooking.created_at, true)}</p>
                <p><strong>Cập nhật:</strong> {formatDate(selectedBooking.updated_at, true)}</p>
              </div>
            </div>

            {/* Phần Thông Tin Khách Hàng */}
            <div className="p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
              <h4 className="text-lg font-semibold text-primary-green mb-3 flex items-center"><UserCircleIcon className="w-6 h-6 mr-2"/>Thông Tin Khách Hàng</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <p><strong>Tên:</strong> {selectedBooking.customer_name}</p>
                <p><strong>SĐT:</strong> <a href={`tel:${selectedBooking.customer_phone}`} className="text-secondary-blue hover:underline">{selectedBooking.customer_phone}</a></p>
                <p className="md:col-span-2"><strong>Email:</strong> <a href={`mailto:${selectedBooking.customer_email}`} className="text-secondary-blue hover:underline">{selectedBooking.customer_email || 'N/A'}</a></p>
                {selectedBooking.user_id && selectedBooking.profiles && (
                  <p className="md:col-span-2 text-xs text-gray-500 dark:text-gray-400">
                    (Tài khoản: {selectedBooking.profiles.full_name || selectedBooking.profiles.email}, ID: <span className="font-mono text-xs">{selectedBooking.user_id.substring(0,8)}...</span>)
                  </p>
                )}
              </div>
            </div>

            {/* Phần Thông Tin Xe Đặt */}
            {selectedBooking.cars && (
              <div className="p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                <h4 className="text-lg font-semibold text-primary-green mb-3 flex items-center"><TruckIcon className="w-6 h-6 mr-2"/>Thông Tin Xe Đặt</h4>
                <div className="flex items-start gap-4">
                    {selectedBooking.cars.image_url && (
                        <img src={selectedBooking.cars.image_url} alt={selectedBooking.cars.name} className="w-32 h-20 object-cover rounded-md border dark:border-gray-600"/>
                    )}
                    <div className="grid grid-cols-1 gap-y-1 flex-grow">
                        <p><strong>Tên xe:</strong> {selectedBooking.cars.name}</p>
                        <p><strong>Giá thuê/ngày:</strong> {selectedBooking.cars.price_per_day?.toLocaleString('vi-VN')} VNĐ</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID Xe: <span className="font-mono">{selectedBooking.car_id.substring(0,8)}...</span></p>
                    </div>
                </div>
              </div>
            )}

            {/* Phần Chi Tiết Thuê */}
            <div className="p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
              <h4 className="text-lg font-semibold text-primary-green mb-3 flex items-center"><CalendarDaysIcon className="w-6 h-6 mr-2"/>Chi Tiết Thuê Xe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <p><strong>Nhận xe:</strong> {formatDate(selectedBooking.rent_date_from, true)}</p>
                <p><strong>Trả xe:</strong> {formatDate(selectedBooking.rent_date_to, true)}</p>
                <p className="md:col-span-2"><strong>Số ngày thuê:</strong> {
                    (() => {
                        const d1 = new Date(selectedBooking.rent_date_from);
                        const d2 = new Date(selectedBooking.rent_date_to);
                        const diff = Math.max(1, Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
                        return `${diff} ngày`;
                    })()
                }</p>
                <p className="md:col-span-2"><strong>Tổng tiền:</strong> <span className="font-bold text-xl text-accent-yellow">{selectedBooking.total_price?.toLocaleString('vi-VN')} VNĐ</span></p>
                 <p><strong>Trạng thái thanh toán:</strong> <span className="font-medium capitalize">{selectedBooking.payment_status || 'N/A'}</span></p>
                 <p><strong>Phương thức TT:</strong> <span className="font-medium capitalize">{selectedBooking.payment_method || 'N/A'}</span></p>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                <h4 className="text-lg font-semibold text-primary-green mb-2 flex items-center"><ChatBubbleLeftEllipsisIcon className="w-6 h-6 mr-2"/>Ghi Chú Của Khách Hàng</h4>
                <p className="p-2 bg-white dark:bg-gray-800 rounded-md whitespace-pre-wrap border dark:border-gray-500">{selectedBooking.notes}</p>
              </div>
            )}

            <div className="p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                <h4 className="text-lg font-semibold text-primary-green mb-2">Ghi Chú Của Admin (Nội bộ)</h4>
                <textarea
                    rows="3"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Thêm ghi chú cho đơn hàng này..."
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white focus:ring-primary-green focus:border-primary-green"
                />
                <Button
                    onClick={handleSaveAdminNotes}
                    isLoading={isUpdatingStatus && confirmActionDetails.action !== 'save_notes'} // Chỉ loading nếu không phải đang update status
                    disabled={isUpdatingStatus || adminNotes === (selectedBooking.admin_notes || '')}
                    size="sm"
                    className="mt-2 !bg-secondary-blue hover:!bg-secondary-blue-dark"
                >
                    Lưu Ghi Chú
                </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Xác Nhận Hành Động */}
      <Modal
        isOpen={showConfirmActionModal}
        onClose={() => {
            setShowConfirmActionModal(false);
            setConfirmActionDetails({ action: null, bookingId: null, newStatus: '', message: '' });
        }}
        title="Xác Nhận Hành Động"
        size="md"
        footerContent={
          <>
            <Button variant="outline" onClick={() => {
                setShowConfirmActionModal(false);
                setConfirmActionDetails({ action: null, bookingId: null, newStatus: '', message: '' });
            }} disabled={isUpdatingStatus} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
              Không
            </Button>
            <Button
              onClick={executeStatusUpdate}
              isLoading={isUpdatingStatus}
              disabled={isUpdatingStatus}
              className={
                confirmActionDetails.newStatus === 'confirmed' || confirmActionDetails.newStatus === 'completed' ? '!bg-primary-green hover:!bg-primary-green-dark' :
                confirmActionDetails.newStatus === 'rejected' ? '!bg-yellow-500 hover:!bg-yellow-600 text-white' : // Thêm text-white cho nút vàng
                confirmActionDetails.newStatus === 'cancelled' ? '!bg-red-600 hover:!bg-red-700' :
                '!bg-secondary-blue hover:!bg-secondary-blue-dark'
              }
            >
              {isUpdatingStatus ? 'Đang xử lý...' : 'Có, Đồng Ý'}
            </Button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300 text-base">
          {confirmActionDetails.message}
        </p>
        {(confirmActionDetails.newStatus === 'cancelled' || confirmActionDetails.newStatus === 'rejected') && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-3">
                Lưu ý: Hành động này có thể không thể hoàn tác dễ dàng.
            </p>
        )}
      </Modal>
    </>
  );
}

// CSS cho input/select/th/td admin (trong src/index.css)
/*
.admin-input, .admin-select {
  @apply block w-full pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm;
}
.admin-select { @apply pl-3; } // Bỏ pl-10 nếu không dùng icon bên trái cho select này
.th-admin {
  @apply px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider; // Giảm padding x
}
.td-admin {
  @apply px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300; // Giảm padding x
}
*/