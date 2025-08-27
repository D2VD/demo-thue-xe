// src/pages/client/ArticleDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import ArticleCard from '../../components/common/ArticleCard';
import { getPublishedArticleBySlug, getAllPublishedArticles } from '../../services/articleService';
import { ArrowLeftIcon, CalendarDaysIcon, UserCircleIcon, TagIcon, ShareIcon } from '@heroicons/react/24/outline';

// --- Component Bài Viết Liên Quan ---
const RelatedArticles = ({ currentArticleSlug, categoryNameForFilter }) => {
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRelated = useCallback(async () => {
    if (!categoryNameForFilter) {
      setIsLoading(false);
      setRelatedArticles([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await getAllPublishedArticles({
        itemsPerPage: 4,
        categoryName: categoryNameForFilter,
      });
      setRelatedArticles(data.filter(a => a.slug !== currentArticleSlug).slice(0, 3));
    } catch (error) {
      console.error("Error fetching related articles:", error);
      setRelatedArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentArticleSlug, categoryNameForFilter]);

  useEffect(() => {
    fetchRelated();
  }, [fetchRelated]);

  if (isLoading) {
    return (
      <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-gray-200 dark:border-gray-700 text-center">
        <Spinner />
      </div>
    );
  }

  if (relatedArticles.length === 0) {
    return null;
  }

  const formatDateForCard = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  return (
    <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl md:text-3xl font-semibold text-neutral-dark dark:text-white mb-6 md:mb-8">
        Bài Viết Liên Quan
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {relatedArticles.map(article => (
          <ArticleCard
            key={article.id}
            id={article.id}
            title={article.title}
            imageUrl={article.featured_image_url}
            date={formatDateForCard(article.published_at || article.created_at)}
            excerpt={article.excerpt}
            slug={article.slug}
            category={article.category_name} // Truyền category_name nếu ArticleCard có hiển thị
          />
        ))}
      </div>
    </div>
  );
};
// --- Kết thúc Component Bài Viết Liên Quan ---


export default function ArticleDetailPage() {
  const { articleSlug } = useParams();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticleDetails = async () => {
      if (!articleSlug) {
        setError("Không tìm thấy slug bài viết.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      window.scrollTo(0, 0);
      try {
        const articleData = await getPublishedArticleBySlug(articleSlug);
        if (articleData) {
          setArticle(articleData);
        } else {
          setError(`Không tìm thấy bài viết với slug "${articleSlug}" hoặc bài viết này chưa được xuất bản.`);
        }
      } catch (err) {
        console.error("Error fetching article details:", err);
        setError(err.message || 'Đã có lỗi xảy ra khi tải chi tiết bài viết.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticleDetails();
  }, [articleSlug]);

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
        <img src="/src/assets/images/error-illustration.svg" alt="Lỗi" className="mx-auto mb-6 h-32 w-32 sm:h-40 sm:w-40" />
        <h2 className="text-xl sm:text-2xl font-semibold text-red-600 mb-4">Không Thể Tải Bài Viết</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
        <Button variant="primary" onClick={() => navigate('/news')} className="!bg-primary-green hover:!bg-primary-green-dark">
          <ArrowLeftIcon className="w-5 h-5 mr-2 inline" />
          Quay Lại Trang Tin Tức
        </Button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <img src="/src/assets/images/not-found-article.svg" alt="Không tìm thấy bài viết" className="mx-auto mb-6 h-32 w-32 sm:h-40 sm:w-40" />
        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-dark dark:text-white mb-4">Không Tìm Thấy Bài Viết</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">Rất tiếc, chúng tôi không tìm thấy bài viết bạn yêu cầu.</p>
        <Link to="/news">
            <Button variant="primary" className="!bg-primary-green hover:!bg-primary-green-dark">
                <ArrowLeftIcon className="w-5 h-5 mr-2 inline" />
                Xem Các Bài Viết Khác
            </Button>
        </Link>
      </div>
    );
  }

  const createMarkup = (htmlString) => ({ __html: htmlString || '<p class="text-center italic">Nội dung đang được cập nhật...</p>' });
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';
  const categoryNameForRelated = article.categories?.name || article.category_name;

  return (
    <>
      <Helmet>
        <title>{article.title} | Thuê Xe Online</title>
        <meta name="description" content={article.excerpt?.substring(0, 160) || article.title} />
        <link rel="canonical" href={`https://YOUR_DOMAIN.com/news/${article.slug}`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt?.substring(0, 150) || article.title} />
        <meta property="og:image" content={article.featured_image_url || '/src/assets/images/og-default-news.jpg'} />
        <meta property="og:url" content={`https://YOUR_DOMAIN.com/news/${article.slug}`} />
        <meta property="og:type" content="article" />
        {(article.profiles?.full_name || article.author_name) && <meta property="article:author" content={article.profiles?.full_name || article.author_name} />}
        {(article.published_at || article.created_at) && <meta property="article:published_time" content={new Date(article.published_at || article.created_at).toISOString()} />}
        {(article.categories?.name || article.category_name) && <meta property="article:section" content={article.categories?.name || article.category_name} />}
        {Array.isArray(article.tags) && article.tags.map(tag => <meta property="article:tag" content={tag} key={tag} />)}
      </Helmet>

      <header className="bg-neutral-light dark:bg-gray-800 py-6 md:py-8 shadow-sm">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb" className="text-sm mb-4">
            <ol className="list-none p-0 inline-flex flex-wrap items-center">
              <li className="flex items-center">
                <Link to="/" className="text-primary-green hover:underline">Trang Chủ</Link>
                <svg className="fill-current w-3 h-3 mx-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
              </li>
              <li className="flex items-center">
                <Link to="/news" className="text-primary-green hover:underline">Tin Tức</Link>
                <svg className="fill-current w-3 h-3 mx-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
              </li>
              {(article.categories?.slug && article.categories?.name) ? (
                <li className="flex items-center">
                  <Link to={`/news/category/${article.categories.slug}`} className="text-primary-green hover:underline">{article.categories.name}</Link>
                  <svg className="fill-current w-3 h-3 mx-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
                </li>
              ) : article.category_name ? (
                <li className="flex items-center">
                  <Link to={`/news?category=${encodeURIComponent(article.category_name)}`} className="text-primary-green hover:underline">{article.category_name}</Link>
                  <svg className="fill-current w-3 h-3 mx-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
                </li>
              ) : null}
              <li className="text-gray-600 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs md:max-w-sm lg:max-w-md" aria-current="page" title={article.title}>
                {article.title}
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-dark dark:text-white leading-tight">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-x-4 gap-y-2">
            {(article.profiles?.full_name || article.author_name) && (
              <span className="flex items-center"><UserCircleIcon className="w-5 h-5 mr-1.5" /> {article.profiles?.full_name || article.author_name}</span>
            )}
            {(article.published_at || article.created_at) && (
              <span className="flex items-center"><CalendarDaysIcon className="w-5 h-5 mr-1.5" /> {formatDate(article.published_at || article.created_at)}</span>
            )}
            {(article.categories?.name || article.category_name) && (
                <span className="flex items-center bg-secondary-blue/10 text-secondary-blue dark:bg-secondary-blue/20 dark:text-secondary-blue-dark px-2.5 py-1 rounded-full text-xs font-medium">
                    <TagIcon className="w-4 h-4 mr-1.5" /> {article.categories?.name || article.category_name}
                </span>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-900 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:gap-x-8 xl:gap-x-12">
            <div className="w-full lg:w-8/12 xl:w-9/12"> {/* Cột nội dung chính */}
              <article className="bg-white dark:bg-gray-800 md:p-6 lg:p-8 rounded-lg md:shadow-lg">
                {article.featured_image_url && (
                  <figure className="mb-6 md:mb-8 rounded-lg overflow-hidden not-prose">
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-auto object-cover aspect-[16/9]"
                    />
                  </figure>
                )}
                <div
                  className="prose prose-lg lg:prose-xl dark:prose-invert max-w-none 
                             prose-headings:font-semibold prose-headings:text-primary-green dark:prose-headings:text-primary-green 
                             prose-a:text-secondary-blue hover:prose-a:text-secondary-blue-dark 
                             dark:prose-a:text-secondary-blue-dark dark:hover:prose-a:text-secondary-blue
                             prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full prose-img:mx-auto prose-img:h-auto 
                             prose-figure:my-6 md:prose-figure:my-8"
                  dangerouslySetInnerHTML={createMarkup(article.content)}
                />

                {Array.isArray(article.tags) && article.tags.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 not-prose">
                        <span className="font-semibold mr-2 text-neutral-dark dark:text-white">Tags:</span>
                        {article.tags.map(tag => (
                        <Link
                            key={tag}
                            to={`/news?tag=${encodeURIComponent(tag)}`}
                            className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium mr-2 mb-2 px-3 py-1.5 rounded-full hover:bg-primary-green hover:text-white dark:hover:bg-primary-green transition-colors"
                        >
                            #{tag}
                        </Link>
                        ))}
                    </div>
                )}
                {/* Nút Chia Sẻ (Placeholder) */}
                {/* <div className="mt-6 flex items-center space-x-3 not-prose"> ... </div> */}
              </article>

              <RelatedArticles
                currentArticleSlug={article.slug}
                categoryNameForFilter={categoryNameForRelated}
              />
              {/* Khu vực bình luận (TODO) */}
            </div>

            <aside className="w-full lg:w-4/12 xl:w-3/12 mt-10 lg:mt-0">
              <div className="sticky top-24 space-y-8">
                <div className="p-6 bg-neutral-light dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-primary-green mb-4">Tìm kiếm nhanh</h3>
                   {/* Placeholder cho search widget */}
                  <input type="search" placeholder="Tìm bài viết khác..." className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                </div>
                <div className="p-6 bg-neutral-light dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-primary-green mb-4">Chuyên mục nổi bật</h3>
                  {/* Placeholder cho category list widget */}
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/news?category=Kinh+Nghiệm+Du+Lịch" className="text-gray-700 dark:text-gray-300 hover:text-primary-green">Kinh Nghiệm Du Lịch</Link></li>
                    <li><Link to="/news?category=Chăm+Sóc+Xe" className="text-gray-700 dark:text-gray-300 hover:text-primary-green">Chăm Sóc Xe</Link></li>
                    <li><Link to="/news?category=Khuyến+Mãi" className="text-gray-700 dark:text-gray-300 hover:text-primary-green">Khuyến Mãi</Link></li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}