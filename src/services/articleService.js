// src/services/articleService.js
import { supabase } from '../lib/supabaseClient';

/**
 * Fetch latest published articles from Supabase, typically for homepage display.
 * @param {number} limit - Number of articles to fetch.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of article objects.
 */
export const getLatestPublishedArticles = async (limit = 3) => {
  const { data, error } = await supabase
    .from('articles')
    .select(`
        id, title, slug, excerpt, featured_image_url, created_at, published_at, category_name,
        author_name, 
        profiles ( full_name ) 
    `) // Lấy các cột cần thiết. Giả sử có author_name hoặc join profiles
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching latest published articles:', error.message);
    throw error;
  }
  return data || [];
};

/**
 * Fetch paginated, filtered, and published articles from Supabase.
 * @param {object} options
 * @param {number} options.page - Current page number (1-indexed).
 * @param {number} options.itemsPerPage - Number of items per page.
 * @param {string} [options.searchTerm] - Term to search for in article title or excerpt.
 * @param {string} [options.categoryName] - Filter by category name (case-insensitive like search).
 * @param {string} [options.tag] - Filter by a single tag (exact match in tags array).
 * @param {string} [options.sortBy = 'published_at'] - Column to sort by.
 * @param {boolean} [options.ascending = false] - Sort order.
 * @returns {Promise<{data: Array<Object>, count: number}>} - A promise that resolves to an object with article data and total count.
 */
export const getAllPublishedArticles = async ({
  page = 1,
  itemsPerPage = 6,
  searchTerm = '',
  categoryName = '',
  tag = '',
  sortBy = 'published_at',
  ascending = false,
}) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage - 1;

  let query = supabase
    .from('articles')
    .select(`
      id, title, slug, excerpt, featured_image_url, created_at, published_at, category_name,
      author_name,
      profiles ( full_name ) 
    `, { count: 'exact' })
    .eq('status', 'published');

  // Áp dụng tìm kiếm
  if (searchTerm.trim()) {
    // Tìm kiếm trong title hoặc excerpt
    // Sử dụng textSearch nếu bạn đã cấu hình FTS, hoặc or() với ilike cho nhiều trường
    query = query.or(`title.ilike.%${searchTerm.trim()}%,excerpt.ilike.%${searchTerm.trim()}%`);
  }

  // Áp dụng bộ lọc category (tìm gần đúng, không phân biệt hoa thường trên cột category_name)
  if (categoryName && categoryName.toLowerCase() !== 'all') {
    query = query.ilike('category_name', `%${categoryName}%`);
  }

  // Áp dụng bộ lọc tag (kiểm tra xem mảng 'tags' có chứa tag này không)
  if (tag && tag.toLowerCase() !== 'all') {
    query = query.cs('tags', [tag]); // 'cs' là contains (chứa phần tử trong mảng jsonb)
                                     // Đảm bảo 'tag' truyền vào là một string đơn
  }

  // Sắp xếp
  query = query.order(sortBy, { ascending, nullsFirst: false });

  // Phân trang
  query = query.range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching all published articles:', error.message);
    throw error;
  }

  return { data: data || [], count: count || 0 };
};

/**
 * Fetch a single published article by its slug from Supabase.
 * @param {string} slug - The slug of the article.
 * @returns {Promise<Object|null>} - A promise that resolves to the article object or null if not found.
 */
export const getPublishedArticleBySlug = async (slug) => {
  if (!slug) {
    console.error('Error: Slug is required to fetch article details.');
    return null;
  }

  const { data, error } = await supabase
    .from('articles')
    .select(`
      *, 
      author_name,
      profiles ( full_name ), 
      categories ( name, slug ) 
    `) // Giả sử bạn có bảng categories và FK category_id trong articles trỏ đến categories.id
       // Nếu không, bạn sẽ lấy category_name từ chính bảng articles
       // và không cần join 'categories ( name, slug )'
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle(); // Trả về null nếu không tìm thấy, không ném lỗi PGRST116

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching published article by slug:', error.message);
    throw error;
  }
  return data;
};


/**
 * Get unique category names from published articles for filter options.
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export const getArticleCategoryOptions = async () => {
    const { data, error } = await supabase
        .from('articles')
        .select('category_name')
        .eq('status', 'published')
        .not('category_name', 'is', null); // Chỉ lấy những category_name không null

    if (error) {
        console.error('Error fetching article category options:', error.message);
        throw error;
    }
    // Lấy các category_name duy nhất và không rỗng/null
    const uniqueCategories = [...new Set(data.map(article => article.category_name).filter(Boolean))].sort();
    return uniqueCategories.map(name => ({
        value: name, // Dùng tên làm value (để filter bằng ilike) hoặc slug nếu có
        label: name
    }));
};

/**
 * Get unique tags from published articles for filter options.
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export const getArticleTagOptions = async () => {
    const { data, error } = await supabase
        .from('articles')
        .select('tags') // Giả sử 'tags' là cột kiểu jsonb chứa mảng các text tag
        .eq('status', 'published')
        .not('tags', 'is', null); // Chỉ lấy những bài có tags

    if (error) {
        console.error('Error fetching article tag options:', error.message);
        throw error;
    }

    const allTags = data.reduce((acc, article) => {
        if (Array.isArray(article.tags)) {
            article.tags.forEach(tag => {
                if (typeof tag === 'string' && tag.trim() !== '') {
                    acc.add(tag.trim());
                }
            });
        }
        return acc;
    }, new Set());

    return Array.from(allTags).sort().map(tag => ({
        value: tag, // Dùng tag làm value
        label: tag
    }));
};