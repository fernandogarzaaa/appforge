/**
 * Marketplace Search Service
 * PostgreSQL full-text search with advanced filtering and sorting
 */

import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Search templates with full-text search, filters, and pagination
 */
export async function searchTemplates(options = {}) {
  const {
    search = '',
    category = null,
    language = null,
    minPrice = 0,
    maxPrice = Infinity,
    sortBy = 'trending',
    page = 1,
    limit = 20,
    userId = null
  } = options;

  try {
    let query = `
      SELECT 
        t.id,
        t.user_id,
        t.title,
        t.description,
        t.category,
        t.language,
        t.tags,
        t.price,
        t.is_public,
        t.downloads_count,
        t.rating_average,
        t.rating_count,
        t.file_path,
        t.thumbnail_url,
        t.created_at,
        t.updated_at,
        u.username,
        u.avatar_url,
        COUNT(*) OVER() as total_count
      FROM templates t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.deleted_at IS NULL
        AND t.is_public = true
    `;

    const params = [];
    let paramIndex = 1;

    // Full-text search
    if (search.trim()) {
      query += `
        AND (
          t.title ILIKE $${paramIndex}
          OR t.description ILIKE $${paramIndex + 1}
          OR t.tags::text ILIKE $${paramIndex + 2}
        )
      `;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    // Category filter
    if (category) {
      query += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex += 1;
    }

    // Language filter
    if (language) {
      query += ` AND t.language = $${paramIndex}`;
      params.push(language);
      paramIndex += 1;
    }

    // Price range filter
    query += ` AND t.price >= $${paramIndex} AND t.price <= $${paramIndex + 1}`;
    params.push(minPrice, maxPrice);
    paramIndex += 2;

    // Sorting
    switch (sortBy) {
      case 'trending':
        // Trending: downloads × rating, recent boost
        query += `
          ORDER BY 
            (t.downloads_count * COALESCE(t.rating_average, 0) * 
             (1 + EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 86400 / 30)) DESC
        `;
        break;
      case 'recent':
        query += ` ORDER BY t.created_at DESC`;
        break;
      case 'popular':
        query += ` ORDER BY t.downloads_count DESC`;
        break;
      case 'rating':
        query += ` ORDER BY t.rating_average DESC NULLS LAST, t.rating_count DESC`;
        break;
      default:
        query += ` ORDER BY t.created_at DESC`;
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    return {
      success: true,
      data: result.rows.map(row => ({
        ...row,
        total_count: undefined // Remove metadata
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    logger.error('Template search failed:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Get trending templates (popular × recent)
 */
export async function getTrendingTemplates(limit = 10) {
  try {
    const query = `
      SELECT 
        id,
        title,
        description,
        category,
        language,
        price,
        rating_average,
        downloads_count,
        thumbnail_url,
        created_at
      FROM templates
      WHERE deleted_at IS NULL
        AND is_public = true
      ORDER BY 
        (downloads_count * COALESCE(rating_average, 0)) DESC,
        created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    logger.error('Trending templates query failed:', error);
    throw error;
  }
}

/**
 * Get templates by category with counts
 */
export async function getTemplatesByCategory(category, limit = 20, offset = 0) {
  try {
    const query = `
      SELECT 
        id,
        title,
        description,
        language,
        price,
        rating_average,
        downloads_count,
        thumbnail_url,
        created_at
      FROM templates
      WHERE category = $1
        AND deleted_at IS NULL
        AND is_public = true
      ORDER BY downloads_count DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM templates
      WHERE category = $1
        AND deleted_at IS NULL
        AND is_public = true
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, [category, limit, offset]),
      pool.query(countQuery, [category])
    ]);

    return {
      templates: dataResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  } catch (error) {
    logger.error('Category templates query failed:', error);
    throw error;
  }
}

/**
 * Get all categories with template counts
 */
export async function getCategories() {
  try {
    const query = `
      SELECT 
        category,
        COUNT(*) as count,
        AVG(rating_average) as avg_rating,
        SUM(downloads_count) as total_downloads
      FROM templates
      WHERE deleted_at IS NULL
        AND is_public = true
      GROUP BY category
      ORDER BY count DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('Categories query failed:', error);
    throw error;
  }
}

/**
 * Search user templates (creator's own templates)
 */
export async function searchUserTemplates(userId, options = {}) {
  const {
    search = '',
    page = 1,
    limit = 20,
    includeDeleted = false
  } = options;

  try {
    let query = `
      SELECT 
        id,
        title,
        description,
        category,
        language,
        tags,
        price,
        is_public,
        downloads_count,
        rating_average,
        created_at,
        updated_at,
        deleted_at
      FROM templates
      WHERE user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    if (search.trim()) {
      query += `
        AND (
          title ILIKE $${paramIndex}
          OR description ILIKE $${paramIndex + 1}
        )
      `;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
      paramIndex += 2;
    }

    query += ` ORDER BY created_at DESC`;

    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('User templates search failed:', error);
    throw error;
  }
}

/**
 * Advanced filter options for templates
 */
export async function getFilterOptions() {
  try {
    const [categories, languages] = await Promise.all([
      pool.query(`
        SELECT DISTINCT category FROM templates
        WHERE deleted_at IS NULL AND is_public = true
        ORDER BY category
      `),
      pool.query(`
        SELECT DISTINCT language FROM templates
        WHERE deleted_at IS NULL AND is_public = true
        ORDER BY language
      `)
    ]);

    return {
      categories: categories.rows.map(r => r.category),
      languages: languages.rows.map(r => r.language),
      priceRange: {
        min: 0,
        max: 10000
      },
      sortOptions: ['trending', 'recent', 'popular', 'rating']
    };
  } catch (error) {
    logger.error('Filter options query failed:', error);
    throw error;
  }
}

/**
 * Related templates (same category, language, tags)
 */
export async function getRelatedTemplates(templateId, limit = 5) {
  try {
    const query = `
      SELECT 
        id,
        title,
        description,
        category,
        language,
        price,
        rating_average,
        downloads_count,
        thumbnail_url
      FROM templates
      WHERE deleted_at IS NULL
        AND is_public = true
        AND id != $1
        AND (
          category = (SELECT category FROM templates WHERE id = $1)
          OR language = (SELECT language FROM templates WHERE id = $1)
        )
      ORDER BY rating_average DESC, downloads_count DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [templateId, limit]);
    return result.rows;
  } catch (error) {
    logger.error('Related templates query failed:', error);
    throw error;
  }
}

export default {
  searchTemplates,
  getTrendingTemplates,
  getTemplatesByCategory,
  getCategories,
  searchUserTemplates,
  getFilterOptions,
  getRelatedTemplates
};
