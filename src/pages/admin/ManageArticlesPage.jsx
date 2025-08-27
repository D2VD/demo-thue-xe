// src/pages/admin/ManageArticlesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';

const ITEMS_PER_PAGE = 10;

export default function ManageArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalArticles, setTotalArticles] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          profiles ( full_name ) 
        `, { count: 'exact' }) // Giả sử author_id liên kết với profiles.id và bạn muốn lấy full_name
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setArticles(data || []);
      setTotalArticles(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(err.message || "Không thể tải danh sách bài viết.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openDeleteModal = (article) => {
    setArticleToDelete(article);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setArticleToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    try {
      // TODO: Xóa ảnh đại diện khỏi Supabase Storage nếu có
      if (articleToDelete.featured_image_url) {
        const imageName = articleToDelete.featured_image_url.split('/').pop();
        // Kiểm tra xem imageName có query params không và loại bỏ
        const cleanImageName = imageName.split('?')[0];
        if(cleanImageName){
             const { error: storageError } = await supabase.storage.from('article_images').remove([cleanImageName]);
             if (storageError) console.warn("Could not delete old image from storage:", storageError.message); // Log warning, không dừng hẳn quá trình
        }
      }

      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleToDelete.id);

      if (deleteError) throw deleteError;
      fetchArticles();
      closeDeleteModal();
    } catch (err) {
      console.error("Error deleting article:", err);
      alert(`Lỗi khi xóa bài viết: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Hàm định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };


  return (
    <>
      <Helmet>
        <title>Quản Lý Bài Viết | Admin Thuê Xe Online</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm"
          />
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/articles/new')}
          className="w-full sm:w-auto !bg-primary-green hover:!bg-primary-green-dark"
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          Thêm Bài Mới
        </Button>
      </div>

      {isLoading && <div className="flex justify-center items-center py-10"><Spinner size="lg" /></div>}
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p className="font-bold">Lỗi!</p><p>{error}</p></div>}

      {!isLoading && !error && (
        <>
          {articles.length === 0 && searchTerm && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Không tìm thấy bài viết nào phù hợp với từ khóa "{searchTerm}".</p>
          )}
          {articles.length === 0 && !searchTerm && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Chưa có bài viết nào. <Link to="/admin/articles/new" className="text-primary-green hover:underline font-medium">Thêm bài mới ngay</Link>.</p>
          )}

          {articles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ảnh</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tiêu Đề</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tác giả</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Chuyên mục</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày Tạo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng Thái</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={article.featured_image_url || '/src/assets/images/placeholder-news.jpg'}
                          alt={article.title}
                          className="h-10 w-16 object-cover rounded"
                          onError={(e) => { e.target.onerror = null; e.target.src='/src/assets/images/placeholder-news.jpg'; }}
                        />
                      </td>
                      <td className="px-6 py-4"> {/* Bỏ whitespace-nowrap cho tiêu đề dài */}
                        <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate" title={article.title}>{article.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{article.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {article.profiles?.full_name || article.author_name || 'N/A'} {/* Giả sử có profiles join hoặc trường author_name */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {article.category_name || article.category_id || 'N/A'} {/* Giả sử có category_name join hoặc trường category_id */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(article.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                        }`}>
                          {article.status === 'published' ? 'Xuất bản' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button variant="text" size="sm" onClick={() => navigate(`/admin/articles/edit/${article.id}`)} className="!text-secondary-blue hover:!text-secondary-blue-dark !p-1" title="Sửa"><PencilSquareIcon className="h-5 w-5" /></Button>
                        <Button variant="text" size="sm" onClick={() => openDeleteModal(article)} className="!text-red-600 hover:!text-red-800 !p-1" title="Xóa"><TrashIcon className="h-5 w-5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalArticles > 0 && totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title={`Xác nhận xóa bài viết: ${articleToDelete?.title || ''}`}
        footerContent={
          <>
            <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Hủy</Button>
            <Button variant="danger" onClick={handleDeleteArticle} isLoading={isDeleting} disabled={isDeleting}>
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.</p>
      </Modal>
    </>
  );
}