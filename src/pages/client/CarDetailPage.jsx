// src/pages/client/CarDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import DetailedBookingForm from '../../components/features/cars/DetailedBookingForm';
import { getCarBySlug } from '../../services/carService'; // Đã import
import { ArrowLeftIcon, CheckBadgeIcon, UsersIcon, CogIcon, MapPinIcon, BuildingStorefrontIcon, BeakerIcon } from '@heroicons/react/24/outline'; // Thêm icon nếu cần

// --- CarImageGallery và CarInfo Components (Tách ra file riêng nếu muốn) ---
const CarImageGallery = ({ images, carName }) => {
    const [mainImage, setMainImage] = useState(images && images.length > 0 ? images[0] : '/src/assets/images/car-placeholder.jpg');

    useEffect(() => {
        if (images && images.length > 0) {
            setMainImage(images[0]);
        } else {
            setMainImage('/src/assets/images/car-placeholder.jpg');
        }
    }, [images]);

    if (!images || images.length === 0) {
        return (
        <div className="aspect-w-16 aspect-h-10 overflow-hidden rounded-lg shadow-lg bg-gray-200 dark:bg-gray-700">
            <img src={mainImage} alt={carName || "Hình ảnh xe"} className="w-full h-full object-cover" />
        </div>
        );
    }
    return (
        <div className="space-y-4">
        <div className="aspect-w-16 aspect-h-10 overflow-hidden rounded-lg shadow-lg bg-gray-200 dark:bg-gray-700">
            <img src={mainImage} alt={`Hình chính ${carName}`} className="w-full h-full object-cover transition-opacity duration-300" />
        </div>
        {images.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((imgSrc, index) => (
                <button
                key={index}
                onClick={() => setMainImage(imgSrc)}
                className={`aspect-w-1 aspect-h-1 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green
                            ${mainImage === imgSrc ? 'ring-2 ring-primary-green ring-offset-2' : 'hover:opacity-80'}`}
                >
                <img src={imgSrc} alt={`Thumbnail ${index + 1} ${carName}`} className="w-full h-full object-cover" />
                </button>
            ))}
            </div>
        )}
        </div>
    );
};

const CarInfo = ({ car }) => { // Đổi tên từ CarInfoPlaceholder
    if (!car) return null;
    return (
        <div className="space-y-6">
            <div>
            {/* Nếu bạn join bảng brands/types và lấy tên: */}
            <p className="text-sm text-secondary-blue font-semibold uppercase tracking-wider">
                {car.brands?.name || car.brand} - {car.car_types?.name || car.type}
            </p>
            {/* Nếu bạn dùng cột text brand/type trực tiếp:
            <p className="text-sm text-secondary-blue font-semibold uppercase tracking-wider">{car.brand} - {car.type}</p>
            */}
            <h1 className="text-3xl md:text-4xl font-bold text-primary-green mt-1">{car.name}</h1>
            </div>

            <div className="text-3xl font-bold text-accent-yellow">
            {typeof car.price_per_day === 'number' ? car.price_per_day.toLocaleString('vi-VN') : car.price_per_day} VNĐ/ngày
            </div>

            {car.description && (
                 <div className="prose prose-sm sm:prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    <p>{car.description}</p>
                </div>
            )}

            <div>
            <h3 className="text-lg font-semibold text-neutral-dark dark:text-white mb-3">Thông số cơ bản:</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {car.seats && <li className="flex items-center"><UsersIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" /> Số chỗ: {car.seats}</li>}
                {car.transmission && <li className="flex items-center"><CogIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" /> Hộp số: {car.transmission}</li>}
                {car.fuel_type && <li className="flex items-center"><BeakerIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" /> Nhiên liệu: {car.fuel_type}</li>}
                {car.location && <li className="flex items-center"><MapPinIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" /> Khu vực: {car.location}</li>}
            </ul>
            </div>

            {/* Kiểm tra car.features có phải là mảng và có phần tử không */}
            {Array.isArray(car.features) && car.features.length > 0 && (
            <div>
                <h3 className="text-lg font-semibold text-neutral-dark dark:text-white mb-3">Tiện nghi nổi bật:</h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                {car.features.map((feature, index) => ( // Giả sử feature là string
                    <li key={index} className="flex items-center">
                    <CheckBadgeIcon className="w-5 h-5 mr-2 text-primary-green" /> {feature}
                    </li>
                ))}
                </ul>
            </div>
            )}
        </div>
    );
};
// --- Kết thúc Components ---


export default function CarDetailPage() {
  const { carSlug } = useParams();
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!carSlug) {
        setError("Không tìm thấy slug xe.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      window.scrollTo(0, 0);
      try {
        const carData = await getCarBySlug(carSlug);
        if (carData) {
          setCar(carData);
        } else {
          setError(`Không tìm thấy thông tin cho xe "${carSlug}".`);
        }
      } catch (err) {
        console.error("Error in CarDetailPage useEffect:", err);
        setError(err.message || 'Đã có lỗi xảy ra khi tải thông tin chi tiết xe.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarDetails();
  }, [carSlug]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <img src="/src/assets/images/error-illustration.svg" alt="Lỗi" className="mx-auto mb-6 h-40 w-40" /> {/* Cần có ảnh này */}
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Không Thể Tải Thông Tin Xe</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
        <Button variant="primary" onClick={() => navigate('/cars')} className="!bg-primary-green hover:!bg-primary-green-dark">
          <ArrowLeftIcon className="w-5 h-5 mr-2 inline" />
          Quay Lại Danh Sách Xe
        </Button>
      </div>
    );
  }

  if (!car) { // Nếu car là null sau khi loading xong và không có error (trường hợp của maybeSingle)
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <img src="/src/assets/images/not-found-car.svg" alt="Không tìm thấy xe" className="mx-auto mb-6 h-40 w-40" /> {/* Cần có ảnh này */}
            <h2 className="text-2xl font-semibold text-neutral-dark dark:text-white mb-4">Không Tìm Thấy Xe</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Rất tiếc, chúng tôi không tìm thấy thông tin xe bạn yêu cầu.</p>
            <Link to="/cars">
                <Button variant="primary" className="!bg-primary-green hover:!bg-primary-green-dark">
                    <ArrowLeftIcon className="w-5 h-5 mr-2 inline" />
                    Xem Các Xe Khác
                </Button>
            </Link>
      </div>
    );
  }

  // Mảng ảnh cho gallery, ưu tiên trường 'images' (jsonb), nếu không có thì dùng 'image_url'
  // Đảm bảo car.images là một mảng các URL string
  let galleryImages = [];
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    galleryImages = car.images.filter(img => typeof img === 'string'); // Lọc ra các URL hợp lệ
  } else if (car.image_url && typeof car.image_url === 'string') {
    galleryImages = [car.image_url];
  }


  return (
    <>
      <Helmet>
        <title>{car.name} - Chi Tiết Xe | Thuê Xe Online</title>
        <meta name="description" content={`Thông tin chi tiết, giá thuê và hình ảnh xe ${car.name}. ${car.description?.substring(0, 120)}...`} />
        <link rel="canonical" href={`https://YOUR_DOMAIN.com/cars/${car.slug}`} />
        <meta property="og:title" content={`${car.name} - Chi Tiết Xe`} />
        <meta property="og:description" content={car.description?.substring(0, 150)} />
        <meta property="og:image" content={car.image_url || '/src/assets/images/og-default-car.jpg'} /> {/* Ảnh OG mặc định nếu car.image_url null */}
      </Helmet>

      <header className="bg-neutral-light dark:bg-gray-800 py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb" className="text-sm mb-2">
            <ol className="list-none p-0 inline-flex flex-wrap items-center">
              <li className="flex items-center">
                <Link to="/" className="text-primary-green hover:underline">Trang Chủ</Link>
                <svg className="fill-current w-3 h-3 mx-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
              </li>
              <li className="flex items-center">
                <Link to="/cars" className="text-primary-green hover:underline">Danh Sách Xe</Link>
                <svg className="fill-current w-3 h-3 mx-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
              </li>
              <li className="text-gray-600 dark:text-gray-400 truncate max-w-[200px] sm:max-w-none" aria-current="page" title={car.name}>
                {car.name}
              </li>
            </ol>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-12"> {/* Thay đổi grid */}
          {/* Cột trái: Ảnh và Thông tin chi tiết */}
          <div className="lg:col-span-4 space-y-8"> {/* Chiếm 4/7 */}
            <CarImageGallery images={galleryImages} carName={car.name} />
            <CarInfo car={car} />
          </div>

          {/* Cột phải: Form đặt xe */}
          <div className="lg:col-span-3"> {/* Chiếm 3/7 */}
            <DetailedBookingForm carId={car.id} carName={car.name} pricePerDay={car.price_per_day} />
          </div>
        </div>

        {/* Section Xe Tương Tự (TODO) */}
      </div>
    </>
  );
}