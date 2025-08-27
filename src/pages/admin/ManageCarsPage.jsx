// src/pages/admin/ManageCarsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination'; // Component Pagination đã tạo
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal'; // Import Modal

const ITEMS_PER_PAGE = 10;

export default function ManageCarsPage() {
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCars, setTotalCars] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchCars = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('cars')
        .select('*', { count: 'exact' }) // Lấy cả count
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`);
      }

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setCars(data || []);
      setTotalCars(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

    } catch (err) {
      console.error("Error fetching cars:", err);
      setError(err.message || "Không thể tải danh sách xe.");
      setCars([]);
      setTotalCars(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]); // fetchCars đã được bọc trong useCallback nên sẽ ổn định

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  };

  // Xử lý debounce cho search (tùy chọn, để tối ưu)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCars();
  //   }, 500); // Chờ 500ms sau khi người dùng ngừng gõ để tìm kiếm
  //   return () => clearTimeout(timer);
  // }, [searchTerm, fetchCars]);


  const openDeleteModal = (car) => {
    setCarToDelete(car);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setCarToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteCar = async () => {
    if (!carToDelete) return;
    setIsDeleting(true);
    try {
      // TODO: Xóa ảnh khỏi Supabase Storage trước khi xóa record DB (nếu cần)
      // Ví dụ: if (carToDelete.image_url) { await supabase.storage.from('car_images').remove([carToDelete.image_url.split('/').pop()]) }
      // Và xóa các ảnh trong mảng 'images'

      const { error: deleteError } = await supabase
        .from('cars')
        .delete()
        .eq('id', carToDelete.id);

      if (deleteError) throw deleteError;

      // Tải lại danh sách xe
      fetchCars();
      closeDeleteModal();
    } catch (err) {
      console.error("Error deleting car:", err);
      alert(`Lỗi khi xóa xe: ${err.message}`); // Hoặc dùng toast notification
    } finally {
      setIsDeleting(false);
    }
  };


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Helmet>
        <title>Quản Lý Xe | Admin Thuê Xe Online</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm xe (tên, hãng, loại)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm"
          />
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/cars/new')}
          className="w-full sm:w-auto !bg-primary-green hover:!bg-primary-green-dark"
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          Thêm Xe Mới
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10"><Spinner size="lg" /></div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Lỗi!</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {cars.length === 0 && searchTerm && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Không tìm thấy xe nào phù hợp với từ khóa "{searchTerm}".</p>
          )}
           {cars.length === 0 && !searchTerm && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Chưa có xe nào trong hệ thống. <Link to="/admin/cars/new" className="text-primary-green hover:underline font-medium">Thêm xe mới ngay</Link>.</p>
          )}

          {cars.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ảnh</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên Xe</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hãng</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loại Xe</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá/Ngày</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng Thái</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {cars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={car.image_url || '/src/assets/images/car-placeholder.jpg'}
                          alt={car.name}
                          className="h-10 w-16 object-cover rounded-md"
                          onError={(e) => { e.target.onerror = null; e.target.src='/src/assets/images/car-placeholder.jpg'; }} // Fallback image
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{car.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{car.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{car.brand}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{car.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-green">
                        {car.price_per_day ? car.price_per_day.toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          car.is_available ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                        }`}>
                          {car.is_available ? 'Sẵn sàng' : 'Đang thuê/Bảo trì'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => navigate(`/admin/cars/edit/${car.id}`)}
                          className="!text-secondary-blue hover:!text-secondary-blue-dark !p-1"
                          title="Sửa"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => openDeleteModal(car)}
                          className="!text-red-600 hover:!text-red-800 !p-1"
                          title="Xóa"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalCars > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title={`Xác nhận xóa xe: ${carToDelete?.name || ''}`}
        footerContent={
          <>
            <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteCar} isLoading={isDeleting} disabled={isDeleting}>
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa xe này không? Hành động này không thể hoàn tác.
        </p>
        {carToDelete?.image_url && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Lưu ý: Ảnh của xe sẽ không tự động bị xóa khỏi Storage (cần xử lý riêng nếu muốn).</p>}
      </Modal>
    </>
  );
}