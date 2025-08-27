// src/components/features/home/FeaturedCarsSection.jsx
import React, { useState, useEffect } from 'react';
import CarCard from '../../common/CarCard';
import { Link } from 'react-router-dom';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner'; // Import Spinner
import { getFeaturedCars } from '../../../services/carService'; // *** IMPORT SERVICE ***

export default function FeaturedCarsSection() {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeaturedCars = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cars = await getFeaturedCars(4); // Lấy 4 xe nổi bật
        setFeaturedCars(cars);
      } catch (err) {
        console.error(err);
        setError('Không thể tải danh sách xe nổi bật. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedCars();
  }, []); // Chỉ chạy 1 lần khi component mount

  return (
    <section id="featured-cars" className="py-16 md:py-24 bg-neutral-light dark:bg-neutral-700">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green dark:text-primary-green">
            Xe Cho Thuê Nổi Bật
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Khám phá những dòng xe được khách hàng lựa chọn nhiều nhất, phù hợp cho mọi nhu cầu di chuyển của bạn.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <Spinner size="xl" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && featuredCars.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {featuredCars.map((car) => (
              <CarCard
                key={car.id}
                id={car.id}
                name={car.name}
                imageUrl={car.image_url} // Sử dụng image_url từ DB
                pricePerDay={car.price_per_day} // Sử dụng price_per_day từ DB
                type={car.type}
                seats={car.seats}
                transmission={car.transmission}
                slug={car.slug}
                isFeatured={car.is_featured} // Prop này có thể không cần thiết nữa nếu query đã lọc
              />
            ))}
          </div>
        )}

        {!isLoading && !error && featuredCars.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Hiện chưa có xe nổi bật nào.
          </p>
        )}

        <div className="text-center mt-12 md:mt-16">
          <Link to="/cars">
            <Button
              variant="primary"
              size="lg"
              className="!bg-primary-green hover:!bg-primary-green-dark text-white px-10 py-3 text-lg font-semibold"
            >
              Xem Tất Cả Xe
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}