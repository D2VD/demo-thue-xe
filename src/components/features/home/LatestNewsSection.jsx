// src/components/features/home/LatestNewsSection.jsx
import React, { useState, useEffect } from 'react';
import ArticleCard from '../../common/ArticleCard';
import { Link } from 'react-router-dom';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';
import { getLatestPublishedArticles } from '../../../services/articleService'; // *** IMPORT SERVICE ***

export default function LatestNewsSection() {
  const [latestArticles, setLatestArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLatestArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const articles = await getLatestPublishedArticles(3); // Lấy 3 bài viết mới nhất
        setLatestArticles(articles);
      } catch (err) {
        console.error(err);
        setError('Không thể tải tin tức mới nhất. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestArticles();
  }, []);

  const formatDateForCard = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return dateString; }
  };

  return (
    <section id="latest-news" className="py-16 md:py-24 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-green dark:text-primary-green">
            Tin Tức & Sự Kiện
          </h2>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Cập nhật những thông tin mới nhất từ chúng tôi, các mẹo hữu ích và chương trình khuyến mãi đặc biệt.
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

        {!isLoading && !error && latestArticles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {latestArticles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                imageUrl={article.featured_image_url} // Từ DB
                date={formatDateForCard(article.published_at || article.created_at)} // Ưu tiên published_at
                excerpt={article.excerpt}
                slug={article.slug}
                category={article.category_name} // Từ DB (nếu có)
                // authorName={article.profiles?.full_name} // Nếu join và lấy tên tác giả
              />
            ))}
          </div>
        )}

        {!isLoading && !error && latestArticles.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Hiện chưa có tin tức nào.
          </p>
        )}

        <div className="text-center mt-12 md:mt-16">
          <Link to="/news">
            <Button
              variant="primary"
              size="lg"
              className="!bg-primary-green hover:!bg-primary-green-dark text-white px-10 py-3 text-lg font-semibold"
            >
              Xem Thêm Tin Tức
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}