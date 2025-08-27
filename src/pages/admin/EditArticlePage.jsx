// src/pages/admin/EditArticlePage.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabaseClient';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ArrowLeftIcon, ArrowUpTrayIcon, PhotoIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Định nghĩa schema validation với Zod
const articleSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự."),
  slug: z.string().min(3, "Slug phải có ít nhất 3 ký tự.").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang."),
  excerpt: z.string().max(300, "Trích đoạn không quá 300 ký tự.").optional().nullable(),
  content: z.string()
    .min(1, "Nội dung bài viết không được để trống.")
    .refine(value => {
      if (!value) return false;
      const plainText = value.replace(/<[^>]*>/g, '').trim();
      return plainText.length >= 20;
    }, { message: "Nội dung bài viết phải có ít nhất 20 ký tự văn bản thực tế (không tính định dạng HTML)." }),
  featured_image_url: z.string().url("URL ảnh không hợp lệ.").optional().nullable(), // Vẫn giữ .url() để validate nếu có giá trị
  status: z.enum(['draft', 'published'], { required_error: "Vui lòng chọn trạng thái." }).default('draft'),
  category_name: z.string().optional().nullable(),
  author_name: z.string().optional().nullable(),
  tags_string: z.string().optional().nullable(),
});

const quillModules = { /* ... (giữ nguyên) ... */ };
const quillFormats = [ /* ... (giữ nguyên) ... */ ];

export default function EditArticlePage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(articleId);

  const [isLoadingPage, setIsLoadingPage] = useState(isEditMode);
  const [formSubmitError, setFormSubmitError] = useState(null);
  const [imageFile, setImageFile] = useState(null);       // File ảnh mới chọn để upload
  const [imagePreview, setImagePreview] = useState(null);   // URL data để xem trước ảnh mới chọn hoặc URL ảnh cũ
  const [initialArticleNameForTitle, setInitialArticleNameForTitle] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(articleSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '', slug: '', excerpt: '', content: '',
      featured_image_url: null, // Khởi tạo là null
      status: 'draft',
      category_name: '', author_name: '',
      tags_string: '',
    }
  });

  const articleTitleWatched = watch('title');
  // Không cần watch('featured_image_url') nữa nếu không dùng trực tiếp để hiển thị lỗi

  useEffect(() => {
    if (articleTitleWatched && !isEditMode && !watch('slug')) {
      const generatedSlug = articleTitleWatched.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9-]/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [articleTitleWatched, isEditMode, setValue, watch]);

  useEffect(() => {
    if (isEditMode && articleId) {
      const fetchArticleData = async () => {
        setIsLoadingPage(true);
        setFormSubmitError(null);
        try {
          const { data, error } = await supabase.from('articles').select('*').eq('id', articleId).single();
          if (error) {
            if (error.code === 'PGRST116') throw new Error(`Bài viết với ID "${articleId}" không tồn tại.`);
            throw error;
          }
          if (data) {
            const defaultData = {
                title: data.title || '',
                slug: data.slug || '',
                excerpt: data.excerpt || '',
                content: data.content || '',
                featured_image_url: data.featured_image_url || null, // Đảm bảo là null nếu rỗng
                status: data.status || 'draft',
                category_name: data.category_name || '',
                author_name: data.author_name || '',
                tags_string: Array.isArray(data.tags) ? data.tags.join(', ') : '',
            };
            reset(defaultData);
            setInitialArticleNameForTitle(data.title || '');
            if (data.featured_image_url) {
                setImagePreview(data.featured_image_url); // Hiển thị ảnh hiện tại từ DB
            } else {
                setImagePreview(null);
            }
            setImageFile(null);
          } else {
            setFormSubmitError("Không tìm thấy thông tin bài viết.");
          }
        } catch (err) {
          console.error("Error fetching article data:", err);
          setFormSubmitError(err.message || "Lỗi tải dữ liệu bài viết.");
        } finally {
          setIsLoadingPage(false);
        }
      };
      fetchArticleData();
    } else {
      setIsLoadingPage(false);
      setInitialArticleNameForTitle('');
      reset();
      setImagePreview(null);
      setImageFile(null);
    }
  }, [articleId, isEditMode, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Kích thước ảnh không được vượt quá 2MB.");
        e.target.value = null;
        return;
      }
      setImageFile(file); // Lưu file để upload
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); }; // Cập nhật preview
      reader.readAsDataURL(file);
      // Không gọi setValue('featured_image_url', ...) ở đây
      // Chỉ khi submit, nếu imageFile tồn tại, mới upload và lấy URL
    }
  };

  const removeImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
    // Khi xóa preview, chúng ta cũng muốn xóa URL ảnh hiện tại trong form state
    // để khi submit, nếu không chọn ảnh mới, featured_image_url sẽ là null (hoặc giá trị ban đầu từ DB nếu không dirty).
    // Nếu đang edit và có ảnh từ DB, việc này sẽ xóa nó khỏi form, khi submit sẽ lưu null.
    setValue('featured_image_url', null, { shouldDirty: true, shouldValidate: true });
    const fileInput = document.getElementById('image-upload-article');
    if (fileInput) fileInput.value = null;
  };

  const onSubmit = async (formData) => {
    console.log('Form submitted. Validated Data:', formData);
    setFormSubmitError(null);
    let finalImageUrlToSave = formData.featured_image_url; // Giá trị URL hiện tại trong form (từ DB hoặc đã bị set null)

    try {
      if (imageFile) { // Nếu người dùng đã chọn một file ảnh mới
        // TODO: Xóa ảnh cũ trên Storage nếu isEditMode và formData.featured_image_url (URL cũ từ DB) tồn tại
        //       Và formData.featured_image_url khác với URL mới sẽ upload.
        //       Cần cẩn thận để không xóa nhầm nếu upload lỗi.
        // if (isEditMode && formData.featured_image_url) {
        //   try {
        //     const oldFileName = formData.featured_image_url.substring(formData.featured_image_url.lastIndexOf('/') + 1).split('?')[0];
        //     if (oldFileName) await supabase.storage.from('article_images').remove([oldFileName]);
        //   } catch (e) { console.warn("Could not delete old image from storage:", e); }
        // }

        const fileName = `articles/featured-${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('article-images').getPublicUrl(uploadData.path);
        finalImageUrlToSave = publicUrlData.publicUrl; // Cập nhật URL để lưu vào DB
      }
      // Nếu không có imageFile mới, finalImageUrlToSave sẽ là giá trị hiện tại của formData.featured_image_url
      // (đã có thể là null nếu người dùng nhấn removeImagePreview)

      const tagsArray = formData.tags_string
        ? formData.tags_string.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : [];
      const contentToSave = (formData.content === '<p><br></p>') ? '' : formData.content;

      const articleDataToSave = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: contentToSave,
        featured_image_url: finalImageUrlToSave, // Sử dụng URL đã xử lý
        status: formData.status,
        category_name: formData.category_name || null,
        author_name: formData.author_name || null,
        tags: tagsArray,
      };

      if (isEditMode) {
        articleDataToSave.updated_at = new Date().toISOString();
      } else {
        if (articleDataToSave.status === 'published') {
          articleDataToSave.published_at = new Date().toISOString();
        }
      }

      let response;
      if (isEditMode) {
        response = await supabase.from('articles').update(articleDataToSave).eq('id', articleId).select().single();
      } else {
        response = await supabase.from('articles').insert(articleDataToSave).select().single();
      }

      const { data: savedArticle, error: dbError } = response;
      if (dbError) {
        if (dbError.code === '23505' && dbError.message.includes('articles_slug_key')) {
            throw new Error("Slug này đã tồn tại. Vui lòng chọn một slug khác.");
        }
        throw dbError;
      }

      alert(isEditMode ? "Cập nhật bài viết thành công!" : "Thêm bài viết mới thành công!");
      navigate('/admin/articles');

    } catch (err) {
      console.error("Error saving article:", err);
      setFormSubmitError(err.message || `Lỗi khi ${isEditMode ? 'cập nhật' : 'thêm'} bài viết.`);
    }
  };

  if (isLoadingPage) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Spinner size="xl" /></div>;
  }
  if (isEditMode && formSubmitError && !initialArticleNameForTitle) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-semibold text-red-600 mb-4">Không thể tải dữ liệu</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{formSubmitError}</p>
            <Link to="/admin/articles"><Button variant="primary">Quay lại</Button></Link>
        </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditMode ? `Sửa Bài Viết: ${initialArticleNameForTitle || articleTitleWatched || '...'}` : 'Thêm Bài Viết Mới'} | Admin</title>
      </Helmet>
      <div className="mb-6">
        <Link to="/admin/articles" className="inline-flex items-center text-sm font-medium text-primary-green hover:text-primary-green-dark">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại Danh sách bài viết
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mt-2">
          {isEditMode ? `Sửa Bài Viết: ${initialArticleNameForTitle || articleTitleWatched}` : 'Thêm Bài Viết Mới'}
        </h1>
      </div>

      {formSubmitError && !isLoadingPage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Đã có lỗi xảy ra!</p>
          <p>{formSubmitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg">
        {/* Tiêu đề và Slug */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Input label="Tiêu đề bài viết (*)" error={errors.title?.message} {...register('title')} placeholder="VD: Kinh nghiệm thuê xe du lịch hè 2025" />
          </div>
          <Input label="Slug (URL) (*)" error={errors.slug?.message} {...register('slug')} placeholder="vd-kinh-nghiem-thue-xe" />
        </div>

        {/* Trích đoạn */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trích đoạn ngắn (SEO & Preview)</label>
          <textarea id="excerpt" rows="3" className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm" placeholder="Mô tả ngắn gọn nội dung bài viết (tối đa 300 ký tự)" {...register('excerpt')}></textarea>
          {errors.excerpt && <p className="mt-1 text-xs text-red-500">{errors.excerpt.message}</p>}
        </div>

        {/* Nội dung bài viết - ReactQuill */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung bài viết (*)</label>
          <Controller
            name="content"
            control={control}
            render={({ field, fieldState: { error: contentError } }) => (
              <>
                <ReactQuill
                  theme="snow"
                  value={field.value || ''}
                  onChange={(htmlContent) => {
                    const isEmptyContent = htmlContent === '<p><br></p>' || htmlContent.replace(/<[^>]*>/g, '').trim().length === 0;
                    field.onChange(isEmptyContent ? '' : htmlContent);
                  }}
                  onBlur={field.onBlur}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Soạn thảo nội dung chi tiết tại đây..."
                  className={`bg-white dark:bg-gray-700 dark:text-white [&_.ql-editor]:min-h-[250px] rounded-md ${contentError || errors.content ? 'ring-1 ring-red-500 border-red-500 ql-error' : 'border border-gray-300 dark:border-gray-600'}`}
                />
                {(contentError || (errors.content && !errors.content.ref)) && <p className="mt-2 text-xs text-red-500">{(contentError?.message || errors.content?.message)}</p>}
              </>
            )}
          />
        </div>

        {/* Ảnh đại diện */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh đại diện</label>
          <div className="mt-1 flex items-center space-x-6">
            <div className="shrink-0">
                {imagePreview ? (
                    <img className="h-28 w-48 object-cover rounded-md shadow" src={imagePreview} alt="Xem trước ảnh" />
                ) : (
                    <div className="h-28 w-48 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <PhotoIcon className="h-12 w-12" />
                    </div>
                )}
            </div>
            <label htmlFor="image-upload-article" className="relative cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                <ArrowUpTrayIcon className="w-5 h-5 inline mr-2" />
                <span>Tải ảnh</span>
                <input id="image-upload-article" name="image-upload-article" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
            </label>
            {imagePreview && (
                <Button variant="text" size="sm" onClick={removeImagePreview} className="!text-red-600 hover:!text-red-700 !p-1" title="Xóa ảnh">
                    <XCircleIcon className="h-6 w-6"/>
                </Button>
            )}
          </div>
          {/* Lỗi từ Zod cho featured_image_url sẽ được hiển thị nếu giá trị là URL không hợp lệ */}
          {errors.featured_image_url && <p className="mt-1 text-xs text-red-500">{errors.featured_image_url.message}</p>}
          {/* Hiển thị URL hiện tại nếu không có preview (khi edit và chưa đổi ảnh) */}
          {watch('featured_image_url') && !imagePreview && !imageFile && <p className="mt-1 text-xs text-gray-500">Ảnh hiện tại: {watch('featured_image_url')}</p>}
        </div>

        {/* Chuyên mục, Tác giả, Trạng thái */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="Chuyên mục" placeholder="VD: Kinh Nghiệm, Tin Tức" {...register('category_name')} error={errors.category_name?.message} />
          <Input label="Tên tác giả" placeholder="VD: Admin Thuê Xe" {...register('author_name')} error={errors.author_name?.message} />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
                <Select
                    label="Trạng thái (*)"
                    options={[ { value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Xuất bản' }]}
                    error={errors.status?.message}
                    {...field}
                />
            )}
          />
        </div>

        {/* Tags */}
        <div>
          <Input
            label="Tags (Phân cách bằng dấu phẩy)"
            id="tags_string"
            placeholder="VD: du lịch, thuê xe, mẹo vặt"
            error={errors.tags_string?.message}
            {...register('tags_string')}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Nhập các từ khóa liên quan, mỗi từ cách nhau bằng dấu phẩy.</p>
        </div>

        {/* Nút Submit */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/articles')} disabled={isSubmitting} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Hủy</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting} className="!bg-primary-green hover:!bg-primary-green-dark">
            {isSubmitting ? (isEditMode ? 'Đang cập nhật...' : 'Đang đăng...') : (isEditMode ? 'Lưu Bài Viết' : 'Đăng Bài Viết')}
          </Button>
        </div>
      </form>
    </>
  );
}