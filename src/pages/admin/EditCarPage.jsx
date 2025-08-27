// src/pages/admin/EditCarPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeftIcon, ArrowUpTrayIcon, PhotoIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Định nghĩa schema validation với Zod
const carSchema = z.object({
  name: z.string().min(3, "Tên xe phải có ít nhất 3 ký tự."),
  slug: z.string().min(3, "Slug phải có ít nhất 3 ký tự.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang (không bắt đầu/kết thúc bằng gạch ngang, không có gạch ngang liền kề)."),
  brand: z.string().min(1, "Vui lòng chọn hãng xe."),
  type: z.string().min(1, "Vui lòng chọn loại xe."),
  price_per_day: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(String(val).replace(/,/g, '')), // Loại bỏ dấu phẩy nếu có
    z.number({ required_error: "Giá không được để trống.", invalid_type_error: "Giá phải là một con số." }).positive("Giá phải lớn hơn 0.")
  ),
  seats: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(val),
    z.number({ invalid_type_error: "Số chỗ phải là số." }).int("Số chỗ phải là số nguyên.").positive("Số chỗ phải lớn hơn 0.").optional().nullable()
  ),
  description: z.string().optional().nullable(),
  fuel_type: z.string().optional().nullable(),
  transmission: z.string().optional().nullable(),
  image_url: z.string().url("URL ảnh không hợp lệ.").optional().nullable(), // Validate URL nếu là URL
  is_featured: z.boolean().optional().default(false),
  is_available: z.boolean().optional().default(true),
  // features: z.string().optional().nullable(), // Tạm thời là string, sau này có thể là JSON
  // specifications: z.string().optional().nullable(), // Tạm thời là string
});

// Dữ liệu mẫu cho Select
const carBrandOptions = [
    { value: '', label: '--- Chọn hãng xe ---' },
    { value: 'Toyota', label: 'Toyota' }, { value: 'Honda', label: 'Honda' },
    { value: 'Ford', label: 'Ford' }, { value: 'Hyundai', label: 'Hyundai' },
    { value: 'Kia', label: 'Kia' }, { value: 'Mazda', label: 'Mazda' },
    { value: 'VinFast', label: 'VinFast' }, { value: 'Mercedes-Benz', label: 'Mercedes-Benz' },
    { value: 'BMW', label: 'BMW' }, { value: 'Audi', label: 'Audi' }, { value: 'Mitsubishi', label: 'Mitsubishi'},
    // Thêm các hãng khác
];
const carTypeOptions = [
    { value: '', label: '--- Chọn loại xe ---' },
    { value: 'Sedan', label: 'Sedan' }, { value: 'SUV', label: 'SUV (Gầm cao)' },
    { value: 'MPV', label: 'MPV (Đa dụng)' }, { value: 'Hatchback', label: 'Hatchback' },
    { value: 'Bán tải', label: 'Bán tải (Pickup)' }, { value: 'Coupe', label: 'Coupe (2 cửa)' },
    { value: 'Limousine', label: 'Limousine' }, { value: 'Xe tải', label: 'Xe tải' },
];
const fuelTypeOptions = [
    { value: '', label: '--- Chọn nhiên liệu ---' },
    { value: 'Xăng', label: 'Xăng' }, { value: 'Dầu (Diesel)', label: 'Dầu (Diesel)' },
    { value: 'Điện', label: 'Điện' }, { value: 'Hybrid', label: 'Hybrid' },
];
const transmissionOptions = [
    { value: '', label: '--- Chọn hộp số ---' },
    { value: 'Số tự động (AT)', label: 'Số tự động (AT)' },
    { value: 'Số sàn (MT)', label: 'Số sàn (MT)' },
    { value: 'Tự động vô cấp (CVT)', label: 'Tự động vô cấp (CVT)' },
];


export default function EditCarPage() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(carId);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null); // File ảnh mới chọn để upload
  const [currentImageUrlFromDb, setCurrentImageUrlFromDb] = useState(null); // URL ảnh hiện tại từ DB (khi edit)
  const [imagePreview, setImagePreview] = useState(null); // URL xem trước ảnh (từ file mới hoặc URL cũ)
  const [initialCarNameForTitle, setInitialCarNameForTitle] = useState('');

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(carSchema),
    defaultValues: {
        name: '', slug: '', brand: '', type: '', price_per_day: undefined,
        seats: undefined, description: '', fuel_type: '', transmission: '',
        image_url: null, is_featured: false, is_available: true,
    }
  });

  const watchedName = watch('name');

  // Tự động tạo slug
  useEffect(() => {
    if (watchedName && !isEditMode && !watch('slug')) { // Chỉ khi thêm mới và slug chưa được nhập
      const generatedSlug = watchedName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9-]/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedName, isEditMode, setValue, watch]);

  // Fetch car data khi ở chế độ sửa
  useEffect(() => {
    if (isEditMode && carId) {
      const fetchCarData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const { data, error } = await supabase.from('cars').select('*').eq('id', carId).single();
          if (error) {
            if (error.code === 'PGRST116') throw new Error(`Không tìm thấy xe với ID: ${carId}`);
            throw error;
          }
          if (data) {
            reset(data); // Điền tất cả dữ liệu vào form
            setInitialCarNameForTitle(data.name);
            if (data.image_url) {
              setImagePreview(data.image_url);
              setCurrentImageUrlFromDb(data.image_url);
            }
            setImageFile(null); // Reset file đang chọn
          } else {
            setFormError("Không tìm thấy thông tin xe.");
          }
        } catch (err) {
          console.error("Error fetching car data:", err);
          setFormError(err.message || "Lỗi tải dữ liệu xe.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCarData();
    } else {
      setIsLoading(false);
      reset(); // Reset về defaultValues nếu là form thêm mới
      setInitialCarNameForTitle('');
      setImagePreview(null);
      setCurrentImageUrlFromDb(null);
      setImageFile(null);
    }
  }, [carId, isEditMode, reset, setValue]); // Thêm reset vào dependencies

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Giới hạn 5MB
        setFormError("Kích thước ảnh không được vượt quá 5MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.readAsDataURL(file);
      setValue('image_url', null, {shouldDirty: true}); // Đánh dấu form dirty, image_url sẽ được cập nhật từ upload
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue('image_url', null, {shouldDirty: true}); // Đặt image_url thành null để xóa trong DB
    // Logic xóa file cũ trên storage sẽ được xử lý trong onSubmit nếu cần
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setFormError(null);
    let finalImageUrl = currentImageUrlFromDb; // Mặc định giữ ảnh cũ nếu có

    try {
      if (imageFile) { // Nếu có file ảnh mới được chọn để upload
        // Xóa ảnh cũ trên storage NẾU đang edit VÀ có ảnh cũ VÀ ảnh cũ khác với ảnh đang hiển thị (nếu có)
        if (isEditMode && currentImageUrlFromDb) {
            const oldFileName = currentImageUrlFromDb.substring(currentImageUrlFromDb.lastIndexOf('/') + 1).split('?')[0];
            if (oldFileName) {
                console.log("Attempting to delete old image from storage:", oldFileName);
                // const { error: deleteStorageError } = await supabase.storage.from('car_images').remove([oldFileName]);
                // if (deleteStorageError) console.warn("Could not delete old image:", deleteStorageError.message);
            }
        }

        const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('car-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('car-images').getPublicUrl(uploadData.path);
        finalImageUrl = publicUrlData.publicUrl;
      } else if (!imagePreview && isEditMode && currentImageUrlFromDb) { // Nếu ảnh bị xóa (imagePreview là null) và đang edit và có ảnh cũ
        finalImageUrl = null; // Đặt là null để xóa trong DB
        // Xóa file cũ trên storage
        const oldFileName = currentImageUrlFromDb.substring(currentImageUrlFromDb.lastIndexOf('/') + 1).split('?')[0];
        if (oldFileName) {
            console.log("Attempting to delete image (due to removal) from storage:", oldFileName);
            // const { error: deleteStorageError } = await supabase.storage.from('car_images').remove([oldFileName]);
            // if (deleteStorageError) console.warn("Could not delete removed image:", deleteStorageError.message);
        }
      }

      const carDataToSave = {
        name: formData.name,
        slug: formData.slug,
        brand: formData.brand,
        type: formData.type,
        price_per_day: Number(formData.price_per_day),
        seats: formData.seats ? Number(formData.seats) : null,
        description: formData.description || null,
        fuel_type: formData.fuel_type || null,
        transmission: formData.transmission || null,
        image_url: finalImageUrl,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        // updated_at sẽ được trigger tự cập nhật
      };

      let responseError = null;
      if (isEditMode) {
        const { error } = await supabase.from('cars').update(carDataToSave).eq('id', carId);
        responseError = error;
      } else {
        const { error } = await supabase.from('cars').insert(carDataToSave);
        responseError = error;
      }

      if (responseError) {
        if (responseError.code === '23505' && responseError.message.includes('cars_slug_key')) {
          throw new Error("Slug này đã tồn tại. Vui lòng chọn một slug khác.");
        }
        throw responseError;
      }

      alert(isEditMode ? "Cập nhật xe thành công!" : "Thêm xe mới thành công!");
      navigate('/admin/cars');

    } catch (err) {
      console.error("Error saving car:", err);
      setFormError(err.message || `Lỗi khi ${isEditMode ? 'cập nhật' : 'thêm'} xe.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Spinner size="xl" /></div>;
  }

  // Nếu ở chế độ sửa và có lỗi fetch ban đầu (ví dụ xe không tồn tại)
  if (isEditMode && formError && !initialCarNameForTitle) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-red-500 mb-4">Không thể tải dữ liệu</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{formError}</p>
        <Link to="/admin/cars">
          <Button variant="primary" className="!bg-primary-green hover:!bg-primary-green-dark">
            <ArrowLeftIcon className="w-5 h-5 mr-2 inline" /> Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditMode ? `Sửa Xe: ${initialCarNameForTitle || watchedName || '...'}` : 'Thêm Xe Mới'} | Admin</title>
      </Helmet>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          {isEditMode ? `Sửa Thông Tin Xe: ${initialCarNameForTitle || ''}` : 'Thêm Xe Mới'}
        </h1>
        <Link to="/admin/cars" className="inline-flex items-center text-sm font-medium text-primary-green hover:text-primary-green-dark">
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          Quay lại Danh sách
        </Link>
      </div>

      {formError && !isLoading && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Đã xảy ra lỗi!</p>
          <p>{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl">
        {/* Tên xe & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Tên xe (*)" error={errors.name?.message} {...register('name')} placeholder="VD: Toyota Camry 2.5Q 2024" />
          <Input label="Slug (URL thân thiện) (*)" error={errors.slug?.message} {...register('slug')} placeholder="vd-toyota-camry-2024" />
        </div>

        {/* Hãng, Loại, Giá */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller name="brand" control={control} render={({ field }) => (<Select label="Hãng xe (*)" options={carBrandOptions} error={errors.brand?.message} {...field} />)} />
          <Controller name="type" control={control} render={({ field }) => (<Select label="Loại xe (*)" options={carTypeOptions} error={errors.type?.message} {...field} />)} />
          <Input label="Giá / ngày (VNĐ) (*)" type="text" error={errors.price_per_day?.message} {...register('price_per_day')} placeholder="VD: 800000" 
                 onFocus={(e) => e.target.type = 'number'} // Chuyển sang number khi focus để dễ nhập
                 onBlur={(e) => e.target.type = 'text'} // Chuyển lại text để hiển thị dấu phẩy (nếu có format)
          />
        </div>

        {/* Số chỗ, Nhiên liệu, Hộp số */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="Số chỗ ngồi" type="number" error={errors.seats?.message} {...register('seats')} placeholder="VD: 5" />
          <Controller name="fuel_type" control={control} render={({ field }) => (<Select label="Loại nhiên liệu" options={fuelTypeOptions} error={errors.fuel_type?.message} {...field} />)} />
          <Controller name="transmission" control={control} render={({ field }) => (<Select label="Hộp số" options={transmissionOptions} error={errors.transmission?.message} {...field} />)} />
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả chi tiết</label>
          <textarea id="description" rows="5" className="input-field w-full" placeholder="Mô tả các đặc điểm nổi bật, tình trạng xe, chính sách thuê..." {...register('description')}></textarea>
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Ảnh đại diện */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ảnh đại diện xe</label>
          <div className="flex items-center space-x-4">
            <div className="shrink-0">
              {imagePreview ? (
                <img className="h-32 w-48 object-cover rounded-lg shadow-md" src={imagePreview} alt="Xem trước ảnh xe" />
              ) : (
                <div className="h-32 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <PhotoIcon className="h-16 w-16" />
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
                <label htmlFor="image-upload" className="button-outline-primary cursor-pointer inline-flex items-center"> {/* Sử dụng class button chung */}
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                    <span>{imageFile ? imageFile.name : (currentImageUrlFromDb ? 'Thay đổi ảnh' : 'Chọn ảnh')}</span>
                    <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
                </label>
                {(imagePreview || currentImageUrlFromDb) && ( // Chỉ hiển thị nút xóa nếu có ảnh
                    <Button variant="text" size="sm" onClick={removeImage} className="!text-red-500 hover:!text-red-700 !p-1 self-start" title="Xóa ảnh hiện tại">
                        <XCircleIcon className="h-5 w-5 mr-1"/> Xóa ảnh
                    </Button>
                )}
            </div>
          </div>
          {errors.image_url && <p className="mt-2 text-xs text-red-500">{errors.image_url.message}</p>}
          {currentImageUrlFromDb && !imagePreview && !imageFile && <p className="mt-1 text-xs text-gray-500">Ảnh hiện tại: {currentImageUrlFromDb.substring(0,50)}...</p>}
        </div>

        {/* Các trường khác: Features, Specifications (Tạm thời bỏ qua để đơn giản) */}

        {/* Nổi bật & Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
          <div className="flex items-center">
            <input id="is_featured" type="checkbox" className="h-4 w-4 text-primary-green border-gray-300 rounded focus:ring-primary-green" {...register('is_featured')} />
            <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900 dark:text-white">Đánh dấu là xe nổi bật</label>
          </div>
          <div className="flex items-center">
            <input id="is_available" type="checkbox" className="h-4 w-4 text-primary-green border-gray-300 rounded focus:ring-primary-green" {...register('is_available')} />
            <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900 dark:text-white">Xe sẵn sàng cho thuê</label>
          </div>
        </div>

        {/* Nút Submit */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/cars')} disabled={isSubmitting} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
            Hủy Bỏ
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || (!isDirty && isEditMode && !imageFile)} className="!bg-primary-green hover:!bg-primary-green-dark">
            {isSubmitting ? (isEditMode ? 'Đang lưu...' : 'Đang thêm...') : (isEditMode ? 'Lưu Thay Đổi' : 'Thêm Xe Mới')}
          </Button>
        </div>
      </form>
    </>
  );
}

// Thêm class input-field vào src/index.css hoặc file global nếu chưa có
/*
.input-field {
  @apply appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm;
}
.button-outline-primary {
    @apply py-2 px-3 border border-primary-green rounded-md shadow-sm text-sm leading-4 font-medium text-primary-green hover:bg-primary-green/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green;
}
*/