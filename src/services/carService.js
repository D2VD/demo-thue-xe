// src/services/carService.js
import { supabase } from '../lib/supabaseClient'; // Đảm bảo đường dẫn này đúng

/**
 * Fetch featured cars from Supabase.
 * @param {number} limit - Number of featured cars to fetch.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of car objects.
 */
export const getFeaturedCars = async (limit = 4) => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select(`
        id, name, slug, price_per_day, image_url, brand, type, seats, transmission, is_featured
      `) // Chỉ lấy các cột cần thiết cho CarCard và FeaturedCarsSection
      .eq('is_featured', true)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured cars:', error.message);
      // Không ném lỗi ở đây để component có thể xử lý UI nhẹ nhàng hơn,
      // ví dụ hiển thị thông báo thay vì làm sập một phần trang.
      // Nếu muốn component bắt buộc phải xử lý lỗi, hãy: throw error;
      return []; // Trả về mảng rỗng nếu có lỗi
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error in getFeaturedCars:', err.message);
    return [];
  }
};

/**
 * Fetch paginated, filtered, and searched cars from Supabase.
 * @param {object} options
 * @param {number} options.page - Current page number (1-indexed).
 * @param {number} options.itemsPerPage - Number of items per page.
 * @param {string} [options.searchTerm] - Term to search for in car name, brand, etc.
 * @param {string} [options.brand] - Filter by brand.
 * @param {string} [options.type] - Filter by car type.
 * @param {string} [options.sortBy = 'created_at'] - Column to sort by.
 * @param {boolean} [options.ascending = false] - Sort order.
 * @returns {Promise<{data: Array<Object>, count: number}>} - A promise that resolves to an object with car data and total count.
 */
export const getAllCars = async ({
  page = 1,
  itemsPerPage = 8,
  searchTerm = '',
  brand = '',
  type = '',
  // Thêm các filter khác nếu cần: location, priceMin, priceMax, seats, fuel_type, transmission
  sortBy = 'created_at', // Mặc định sắp xếp theo xe mới nhất
  ascending = false,
}) => {
  try {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage - 1;

    let query = supabase
      .from('cars')
      .select(`
        id, name, slug, price_per_day, image_url, brand, type, seats, transmission, is_featured, is_available
      `, { count: 'exact' }) // Lấy các cột cần thiết và tổng số lượng
      .eq('is_available', true);

    // Áp dụng tìm kiếm
    if (searchTerm.trim()) {
      // Sử dụng textSearch hoặc or() cho nhiều trường.
      // or() linh hoạt hơn cho nhiều cột với ilike.
      // Lưu ý: textSearch cần cấu hình tsvector trong DB để hiệu quả.
      // Ví dụ với or():
      const searchCondition = `name.ilike.%${searchTerm.trim()}%,brand.ilike.%${searchTerm.trim()}%,type.ilike.%${searchTerm.trim()}%`;
      query = query.or(searchCondition);
    }

    // Áp dụng bộ lọc
    if (brand) {
      query = query.eq('brand', brand);
    }
    if (type) {
      query = query.eq('type', type);
    }
    // Thêm các .eq() hoặc .gte(), .lte() cho các filter khác
    // Ví dụ:
    // if (seats) query = query.eq('seats', seats);
    // if (priceMin) query = query.gte('price_per_day', priceMin);
    // if (priceMax) query = query.lte('price_per_day', priceMax);

    // Sắp xếp
    query = query.order(sortBy, { ascending });
    if (sortBy !== 'created_at') { // Thêm sắp xếp phụ theo created_at để đảm bảo thứ tự ổn định
        query = query.order('created_at', { ascending: false });
    }


    // Phân trang
    query = query.range(startIndex, endIndex);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching all cars:', error.message);
      throw error; // Ném lỗi để component xử lý
    }

    return { data: data || [], count: count || 0 };
  } catch (err) {
    console.error('Unexpected error in getAllCars:', err.message);
    // Trả về cấu trúc lỗi để component có thể xử lý
    return { data: [], count: 0, error: err };
  }
};

/**
 * Fetch all unique brand names and car types for filter options.
 * @returns {Promise<{brands: Array<string>, types: Array<string>}>}
 */
export const getCarFilterOptions = async () => {
  try {
    // Lấy các hãng xe duy nhất
    const { data: brandsData, error: brandsError } = await supabase
      .rpc('get_distinct_car_brands'); // Giả sử bạn tạo một RPC function 'get_distinct_car_brands'

    // Hoặc nếu không dùng RPC, query trực tiếp và xử lý ở client (ít hiệu quả hơn nếu nhiều dữ liệu)
    // const { data: brandsData, error: brandsError } = await supabase
    //   .from('cars')
    //   .select('brand')
    //   .eq('is_available', true);

    if (brandsError) {
      console.error('Error fetching car brands:', brandsError.message);
      throw brandsError;
    }
    // Xử lý lấy unique brands nếu không dùng RPC
    // const uniqueBrands = [...new Set(brandsData.map(car => car.brand).filter(Boolean))].sort();
    const uniqueBrands = brandsData ? brandsData.map(item => item.brand_name).sort() : [];


    // Lấy các loại xe duy nhất
    const { data: typesData, error: typesError } = await supabase
        .rpc('get_distinct_car_types'); // Giả sử bạn tạo một RPC function 'get_distinct_car_types'

    // Hoặc query trực tiếp
    // const { data: typesData, error: typesError } = await supabase
    //   .from('cars')
    //   .select('type')
    //   .eq('is_available', true);

    if (typesError) {
      console.error('Error fetching car types:', typesError.message);
      throw typesError;
    }
    // const uniqueTypes = [...new Set(typesData.map(car => car.type).filter(Boolean))].sort();
    const uniqueTypes = typesData ? typesData.map(item => item.type_name).sort() : [];

    return { brands: uniqueBrands, types: uniqueTypes };
  } catch (err) {
    console.error('Unexpected error in getCarFilterOptions:', err.message);
    return { brands: [], types: [], error: err };
  }
};

/**
 * Fetch a single car by its slug from Supabase.
 * @param {string} slug - The slug of the car.
 * @returns {Promise<Object|null>} - A promise that resolves to the car object or null if not found.
 */
export const getCarBySlug = async (slug) => {
  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    console.error('Error: Slug is required and must be a non-empty string to fetch car details.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('cars')
      .select(`
        *, 
        brand_id ( name ), 
        type_id ( name )
      `) // Giả sử bạn có FK brand_id và type_id
      // Nếu không, dùng: .select('*')
      .eq('slug', slug)
      .eq('is_available', true) // Chỉ lấy xe đang available
      .maybeSingle(); // Trả về null nếu không tìm thấy, không ném lỗi PGRST116

    if (error) {
      // Chỉ log lỗi nếu không phải là không tìm thấy (maybeSingle đã xử lý)
      // Tuy nhiên, maybeSingle sẽ không trả về error nếu không tìm thấy, mà data sẽ là null.
      // Lỗi ở đây có thể là lỗi mạng, RLS, etc.
      console.error('Error fetching car by slug:', error.message);
      throw error; // Ném lỗi để component xử lý
    }
    return data; // data sẽ là null nếu không tìm thấy
  } catch (err) {
    console.error('Unexpected error in getCarBySlug:', err.message);
    throw err; // Ném lỗi để component xử lý
  }
};

// ----- RPC Functions (Tạo trong Supabase SQL Editor) -----
/*
-- Function để lấy các hãng xe duy nhất
CREATE OR REPLACE FUNCTION get_distinct_car_brands()
RETURNS TABLE(brand_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT brand
  FROM public.cars
  WHERE brand IS NOT NULL AND brand <> '' AND is_available = true
  ORDER BY brand;
END;
$$ LANGUAGE plpgsql;

-- Function để lấy các loại xe duy nhất
CREATE OR REPLACE FUNCTION get_distinct_car_types()
RETURNS TABLE(type_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT type
  FROM public.cars
  WHERE type IS NOT NULL AND type <> '' AND is_available = true
  ORDER BY type;
END;
$$ LANGUAGE plpgsql;
*/