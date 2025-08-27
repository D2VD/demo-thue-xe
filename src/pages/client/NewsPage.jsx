// src/pages/client/NewsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import ArticleCard from '../../components/common/ArticleCard';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { getAllPublishedArticles, getArticleCategoryOptions, getArticleTagOptions } from '../../services/articleService';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Button from '../../components/common/Button'; // Import Button

const ITEMS_PER_PAGE = 6; // Số bài viết trên mỗi trang

// --- Component NewsSidebar ---
const NewsSidebar = ({ categories, tags, onFilterChange, currentFilters, isLoadingOptions }) => {
  const handleCategoryClick = (categoryValue) => {
    // Nếu click vào category đang active, hoặc click "Tất cả", thì bỏ filter category
    const newCategory = currentFilters.category === categoryValue ? '' : categoryValue;
    onFilterChange({ category: newCategory, tag: '' }); // Reset tag khi chọn category mới hoặc bỏ chọn category
  };

  const handleTagClick = (tagValue) => {
    // Nếu click vào tag đang active, thì bỏ filter tag
    const newTag = currentFilters.tag === tagValue ? '' : tagValue;
    onFilterChange({ tag: newTag, category: '' }); // Reset category khi chọn tag mới hoặc bỏ chọn tag
  };

  return (
    <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-8 sticky top-24 self-start"> {/* self-start để sidebar không bị kéo dài */}
      {isLoadingOptions ? (
        <div className="p-6 bg-neutral-light dark:bg-gray-800 rounded-lg shadow text-center"><Spinner /></div>
      ) : (
        <>
          {/* Search Widget (Có thể thêm ở đây nếu muốn tách khỏi main content) */}

          {categories && categories.length > 0 && (
            <div className="p-6 bg-neutral-light dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-primary-green mb-4">Chuyên Mục</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleCategoryClick('')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                      !currentFilters.category
                        ? 'bg-primary-green text-white font-semibold shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Tất cả chuyên mục
                  </button>
                </li>
                {categories.map(category => (
                  <li key={category.value}>
                    <button
                      onClick={() => handleCategoryClick(category.value)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                        currentFilters.category === category.value
                          ? 'bg-primary-green text-white font-semibold shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div className="p-6 bg-neutral-light dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-primary-green mb-4">Tags Phổ Biến</h3>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 15).map(tag => ( // Giới hạn số lượng tags hiển thị
                  <button
                    key={tag.value}
                    onClick={() => handleTagClick(tag.value)}
                    className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-150 transform hover:scale-105
                                ${currentFilters.tag === tag.value
                                    ? 'bg-secondary-blue text-white shadow-md'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-secondary-blue/80 hover:text-white'}`}
                  >
                    #{tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
};
// --- Kết thúc NewsSidebar ---


export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { categorySlug: pathCategorySlug, tag: pathTag } = useParams(); // Lấy từ path params

  const queryParams = new URLSearchParams(location.search);

  // State cho các tham số query và filter
  // Ưu tiên path params, sau đó đến query params, cuối cùng là rỗng
  const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page') || '1', 10));
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  
  // Chuyển đổi categorySlug từ path (nếu có) thành categoryName để filter
  // Giả sử categoryName trong DB và label trong options giống nhau
  const [activeFilters, setActiveFilters] = useState({
    category: pathCategorySlug ? pathCategorySlug.replace(/-/g, ' ') : (queryParams.get('category') || ''),
    tag: pathTag || queryParams.get('tag') || '',
  });

  const [totalPages, setTotalPages] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  // Fetch filter options
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [categoriesData, tagsData] = await Promise.all([
          getArticleCategoryOptions(),
          getArticleTagOptions()
        ]);
        setCategoryOptions(categoriesData);
        setTagOptions(tagsData);
      } catch (err) { console.error("Error fetching article filter options:", err); }
      finally { setIsLoadingOptions(false); }
    };
    loadOptions();
  }, []);

  // Fetch articles data
  const fetchArticlesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Lấy các giá trị filter/search/page từ URL hiện tại
      const currentParams = new URLSearchParams(location.search);
      const page = parseInt(currentParams.get('page') || '1', 10);
      const search = currentParams.get('search') || '';
      // Ưu tiên path param, sau đó query param cho category và tag
      const categoryFilter = pathCategorySlug ? pathCategorySlug.replace(/-/g, ' ') : (currentParams.get('category') || '');
      const tagFilter = pathTag || currentParams.get('tag') || '';

      // Cập nhật state để UI đồng bộ với URL
      setCurrentPage(page);
      setSearchTerm(search);
      setActiveFilters({ category: categoryFilter, tag: tagFilter });

      const { data, count } = await getAllPublishedArticles({
        page,
        itemsPerPage: ITEMS_PER_PAGE,
        searchTerm: search,
        categoryName: categoryFilter,
        tag: tagFilter,
      });
      
      setArticles(data);
      setTotalArticles(count);
      const calculatedTotalPages = Math.ceil(count / ITEMS_PER_PAGE);
      setTotalPages(calculatedTotalPages);

      // Nếu page hiện tại từ URL vượt quá số trang thực tế, điều hướng về trang cuối cùng có dữ liệu (hoặc trang 1)
      if (page > calculatedTotalPages && calculatedTotalPages > 0) {
        handlePageChange(calculatedTotalPages); // Điều hướng đến trang cuối
      } else if (page < 1 && calculatedTotalPages > 0) {
        handlePageChange(1); // Điều hướng đến trang 1
      }

    } catch (err) {
      console.error("Error fetching articles page data:", err);
      setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [location.search, pathCategorySlug, pathTag, navigate]); // Thêm navigate vào dependency

  useEffect(() => {
    fetchArticlesData();
  }, [fetchArticlesData]);


  const updateURLAndNavigate = (newQueryParams = {}, newPathParams = {}) => {
    const params = new URLSearchParams(); // Bắt đầu với params rỗng
    
    // Xử lý search term
    if (newQueryParams.search) params.set('search', newQueryParams.search);

    // Xử lý category và tag
    // Nếu có path param cho category/tag, nó sẽ quyết định path
    let basePath = '/news';
    if (newPathParams.categorySlug) {
        basePath = `/news/category/${newPathParams.categorySlug}`;
    } else if (newQueryParams.category) { // Nếu không có path param, dùng query param
        params.set('category', newQueryParams.category);
    }

    if (newPathParams.tag) {
        basePath = `/news/tag/${newPathParams.tag}`;
    } else if (newQueryParams.tag) {
        params.set('tag', newQueryParams.tag);
    }
    
    params.set('page', newQueryParams.page || '1');
    
    navigate(`${basePath}?${params.toString()}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Khi tìm kiếm, xóa filter category/tag khỏi path, chỉ giữ search và page trong query
    navigate(`/news?search=${encodeURIComponent(searchTerm.trim())}&page=1`);
  };

  const handleFilterChange = (newFilterPart) => {
    // newFilterPart ví dụ: { category: 'Kinh Nghiệm Du Lịch' } hoặc { tag: 'mẹo vặt' }
    // hoặc { category: '' } để xóa filter
    let targetPath = '/news';
    const query = { page: '1', search: searchTerm }; // Giữ lại search term hiện tại

    if (newFilterPart.category !== undefined) {
        if (newFilterPart.category) { // Nếu có category mới
            // Kiểm tra xem category mới có phải là category hiện tại từ path không
            if (pathCategorySlug !== newFilterPart.category.toLowerCase().replace(/\s+/g, '-')) {
                targetPath = `/news/category/${newFilterPart.category.toLowerCase().replace(/\s+/g, '-')}`;
            } else { // Nếu giống, nghĩa là bỏ chọn
                targetPath = '/news';
            }
        } else { // Nếu bỏ chọn category (newFilterPart.category là rỗng)
            targetPath = '/news';
        }
    } else if (newFilterPart.tag !== undefined) {
        if (newFilterPart.tag) {
            if (pathTag !== newFilterPart.tag) {
                targetPath = `/news/tag/${newFilterPart.tag}`;
            } else {
                targetPath = '/news';
            }
        } else {
            targetPath = '/news';
        }
    }
    navigate(`${targetPath}?search=${encodeURIComponent(searchTerm)}&page=1`);
  };


  const handlePageChange = (pageNumber) => {
    const params = new URLSearchParams(location.search);
    params.set('page', pageNumber.toString());
    // Giữ nguyên path hiện tại (có thể là /news, /news/category/:slug, /news/tag/:tag)
    navigate(`${location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDateForCard = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  // Xác định tiêu đề động cho trang
  let pageTitle = "Tin Tức & Chia Sẻ";
  if (activeFilters.category) {
    const foundCategory = categoryOptions.find(c => c.value === activeFilters.category);
    if (foundCategory) pageTitle = `Chuyên mục: ${foundCategory.label}`;
    else if (pathCategorySlug) pageTitle = `Chuyên mục: ${pathCategorySlug.replace(/-/g, ' ')}`;
  } else if (activeFilters.tag) {
    pageTitle = `Tag: #${activeFilters.tag}`;
  }


  return (
    <>
      <Helmet>
        <title>{pageTitle} | Thuê Xe Online</title>
        <meta name="description" content={`Cập nhật tin tức, kinh nghiệm thuê xe ${activeFilters.category ? `trong chuyên mục ${activeFilters.category}` : ''} ${activeFilters.tag ? `với tag #${activeFilters.tag}` : ''} từ Thuê Xe Online.`} />
        <link rel="canonical" href={`https://YOUR_DOMAIN.com${location.pathname}${location.search}`} />
      </Helmet>

      <header className="bg-primary-green text-white py-8 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">{pageTitle}</h1>
          {/* Breadcrumbs có thể thêm ở đây */}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <NewsSidebar
            categories={categoryOptions}
            tags={tagOptions}
            onFilterChange={handleFilterChange}
            currentFilters={activeFilters}
            isLoadingOptions={isLoadingOptions}
          />
          <main className="w-full lg:flex-grow">
            <form onSubmit={handleSearchSubmit} className="mb-8">
              <div className="relative">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm bài viết..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary-green focus:border-primary-green"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div>
                <Button type="submit" className="absolute inset-y-0 right-0 px-4 sm:px-6 !bg-primary-green hover:!bg-primary-green-dark rounded-r-lg text-white text-sm sm:text-base">Tìm</Button>
              </div>
            </form>

            {isLoading ? ( <div className="flex justify-center items-center min-h-[400px]"><Spinner size="xl" /></div> )
            : error ? ( <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-md">{error}</div> )
            : articles.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tìm thấy <strong>{totalArticles}</strong> bài viết.
                    {totalArticles > ITEMS_PER_PAGE && ` Đang hiển thị trang ${currentPage} trên tổng số ${totalPages} trang.`}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      imageUrl={article.featured_image_url}
                      date={formatDateForCard(article.published_at || article.created_at)}
                      excerpt={article.excerpt}
                      slug={article.slug}
                      category={article.category_name}
                    />
                  ))}
                </div>
                {totalPages > 1 && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> )}
              </>
            ) : (
              <div className="text-center py-12">
                <img src="/src/assets/images/no-results-news.svg" alt="Không có bài viết" className="mx-auto mb-6 h-40 w-40" /> {/* Đảm bảo có ảnh này */}
                <h3 className="text-xl font-semibold text-neutral-dark dark:text-white mb-2">Không tìm thấy bài viết</h3>
                <p className="text-gray-600 dark:text-gray-400">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}