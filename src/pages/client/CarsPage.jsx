// src/pages/client/CarsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import CarCard from '../../components/common/CarCard';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { getAllCars, getCarFilterOptions } from '../../services/carService'; // Import service
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Select from '../../components/common/Select'; // Dùng Select cho filter
import Button from '../../components/common/Button';

const ITEMS_PER_PAGE = 12;

// --- Component Bộ Lọc ---
const CarFilters = ({ initialFilters, onFilterApply, filterOptions, isLoadingOptions }) => {
  const [brand, setBrand] = useState(initialFilters.brand || '');
  const [type, setType] = useState(initialFilters.type || '');
  // Thêm state cho các filter khác nếu có

  const handleApply = () => {
    onFilterApply({ brand, type /*, các filter khác */ });
  };

  const handleReset = () => {
    setBrand('');
    setType('');
    onFilterApply({ brand: '', type: '' });
  };

  return (
    <aside className="w-full lg:w-1/4 xl:w-1/5 p-6 bg-neutral-light dark:bg-gray-800 rounded-lg shadow-md h-fit sticky top-24">
      <h3 className="text-xl font-semibold text-primary-green mb-6 flex items-center">
        <FunnelIcon className="w-6 h-6 mr-2" /> Bộ Lọc Xe
      </h3>
      {isLoadingOptions ? <Spinner size="md"/> : (
        <div className="space-y-6">
          <div>
            <label htmlFor="brand-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hãng xe:</label>
            <Select
              id="brand-filter"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              options={[{ value: '', label: 'Tất cả hãng' }, ...filterOptions.brands.map(b => ({ value: b, label: b }))]}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại xe:</label>
            <Select
              id="type-filter"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[{ value: '', label: 'Tất cả loại' }, ...filterOptions.types.map(t => ({ value: t, label: t }))]}
              className="w-full"
            />
          </div>
          {/* Thêm các input/select cho các filter khác */}
          <div className="pt-4 space-y-3">
            <Button onClick={handleApply} variant="primary" className="w-full !bg-primary-green">Áp Dụng Lọc</Button>
            <Button onClick={handleReset} variant="outline" className="w-full dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Xóa Bộ Lọc</Button>
          </div>
        </div>
      )}
    </aside>
  );
};
// --- Kết thúc Component Bộ Lọc ---


export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // State cho các tham số query
  const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page') || '1', 10));
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  const [activeFilters, setActiveFilters] = useState({
    brand: queryParams.get('brand') || '',
    type: queryParams.get('type') || '',
    // Lấy các filter khác từ queryParams
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalCars, setTotalCars] = useState(0);
  const [filterOptions, setFilterOptions] = useState({ brands: [], types: [] });

  // Fetch filter options (brands, types, etc.)
  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const options = await getCarFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error("Error fetching filter options:", err);
        // Có thể set lỗi cho options nếu cần
      } finally {
        setIsLoadingOptions(false);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch cars data based on current page, search term, and filters
  const fetchCarsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(location.search);
      const page = parseInt(params.get('page') || '1', 10);
      const search = params.get('search') || '';
      const brand = params.get('brand') || '';
      const type = params.get('type') || '';
      // Lấy các filter khác

      setCurrentPage(page);
      setSearchTerm(search);
      setActiveFilters({ brand, type /*, ... */ });

      const { data, count } = await getAllCars({
        page,
        itemsPerPage: ITEMS_PER_PAGE,
        searchTerm: search,
        brand,
        type,
        // Truyền các filter khác
      });
      
      setCars(data);
      setTotalCars(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));

    } catch (err) {
      console.error("Error fetching cars page data:", err);
      setError('Không thể tải danh sách xe. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [location.search]); // Phụ thuộc vào location.search để fetch lại khi URL thay đổi

  useEffect(() => {
    fetchCarsData();
  }, [fetchCarsData]);


  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value); // Cập nhật state ngay để input hiển thị
  };

  // Xử lý submit search (khi nhấn Enter hoặc nút tìm kiếm)
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Nếu là form
    const params = new URLSearchParams(location.search);
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset về trang 1 khi tìm kiếm mới
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleFilterApply = (newFilters) => {
    const params = new URLSearchParams(location.search);
    // Xóa các filter cũ liên quan trước khi set cái mới
    params.delete('brand');
    params.delete('type');
    // Xóa các filter khác

    if (newFilters.brand) params.set('brand', newFilters.brand);
    if (newFilters.type) params.set('type', newFilters.type);
    // Set các filter khác

    params.set('page', '1'); // Reset về trang 1
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handlePageChange = (pageNumber) => {
    const params = new URLSearchParams(location.search);
    params.set('page', pageNumber.toString());
    navigate(`${location.pathname}?${params.toString()}`);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Helmet>
        <title>Danh Sách Xe Cho Thuê - Đa Dạng Lựa Chọn | Thuê Xe Online</title>
        <meta name="description" content="Khám phá danh sách xe cho thuê đa dạng từ 4 chỗ, 7 chỗ, SUV, sedan đến xe bán tải. Tìm kiếm, so sánh và đặt xe dễ dàng với giá tốt nhất." />
        <link rel="canonical" href="https://YOUR_DOMAIN.com/cars" />
      </Helmet>

      <header className="bg-primary-green text-white py-8 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Khám Phá Các Dòng Xe</h1>
          {/* Breadcrumbs */}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <CarFilters
            initialFilters={activeFilters}
            onFilterApply={handleFilterApply}
            filterOptions={filterOptions}
            isLoadingOptions={isLoadingOptions}
          />

          <main className="w-full lg:flex-grow">
            {/* Thanh tìm kiếm */}
            <form onSubmit={handleSearchSubmit} className="mb-8">
              <div className="relative">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  placeholder="Tìm kiếm tên xe, hãng xe..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary-green focus:border-primary-green"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Button type="submit" className="absolute inset-y-0 right-0 px-6 !bg-primary-green hover:!bg-primary-green-dark rounded-r-lg text-white hidden sm:inline-flex">
                    Tìm
                </Button>
              </div>
            </form>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]"><Spinner size="xl" /></div>
            ) : error ? (
              <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
            ) : cars.length > 0 ? (
              <>
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tìm thấy <strong>{totalCars}</strong> xe phù hợp. Đang hiển thị trang {currentPage}/{totalPages}.
                  </p>
                  {/* Dropdown Sắp xếp */}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {cars.map((car) => (
                    <CarCard
                      key={car.id}
                      id={car.id}
                      name={car.name}
                      imageUrl={car.image_url}
                      pricePerDay={car.price_per_day}
                      type={car.type}
                      seats={car.seats}
                      transmission={car.transmission}
                      slug={car.slug}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <img src="/src/assets/images/no-results.svg" alt="Không tìm thấy xe" className="mx-auto mb-6 h-40 w-40" />
                <h3 className="text-xl font-semibold text-neutral-dark dark:text-white mb-2">Không tìm thấy xe nào</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Vui lòng thử lại với từ khóa hoặc bộ lọc khác.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}