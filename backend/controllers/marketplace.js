/**
 * Marketplace Controller
 * Handles all marketplace endpoint logic and business operations
 */

import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
import Stripe from 'stripe';
import * as searchService from '../services/marketplaceSearch.js';
import * as uploadService from '../services/fileUpload.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Upload new template
 */
export async function uploadTemplate(req, res) {
  try {
    const { title, description, category, language, tags, price, isPublic } = req.body;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Validate file
    const validation = await uploadService.validateUploadedFile(file.path);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'File validation failed'
      });
    }

    // Scan for malware
    const scanResult = await uploadService.scanForMalware(file.path);
    if (!scanResult.safe) {
      await uploadService.deleteUploadedFile(file.path);
      return res.status(400).json({
        success: false,
        error: 'File failed security scan'
      });
    }

    // Generate thumbnail
    const templateId = require('uuid').v4();
    const thumbnail = await uploadService.generateThumbnail(file.path, templateId);

    // Upload to cloud storage if configured
    const cloudStorage = await uploadService.storeInCloudStorage(file.path, templateId, userId);

    // Store template in database
    const query = `
      INSERT INTO templates (
        id, user_id, title, description, category, language,
        tags, price, is_public, file_path, file_hash, file_size,
        thumbnail_url, cloud_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      templateId,
      userId,
      title,
      description,
      category,
      language,
      JSON.stringify(tags),
      price || 0,
      isPublic !== false,
      file.path,
      validation.hash,
      validation.size,
      thumbnail,
      cloudStorage?.url || null
    ];

    const result = await pool.query(query, values);
    const template = result.rows[0];

    logger.info(`✅ Template uploaded: ${templateId} by user ${userId}`);

    res.status(201).json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        category: template.category,
        isPublic: template.is_public,
        url: cloudStorage?.url || `/api/v1/marketplace/templates/${template.id}/download`
      }
    });
  } catch (error) {
    logger.error('Upload template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get templates with search and filters
 */
export async function getTemplates(req, res) {
  try {
    const {
      search = '',
      category = null,
      language = null,
      minPrice = 0,
      maxPrice = Infinity,
      sortBy = 'trending',
      page = 1,
      limit = 20
    } = req.query;

    const result = await searchService.searchTemplates({
      search,
      category,
      language,
      minPrice: parseInt(minPrice),
      maxPrice: parseInt(maxPrice),
      sortBy,
      page: parseInt(page),
      limit: parseInt(limit),
      userId: req.user.id
    });

    res.json({
      success: true,
      templates: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get template details
 */
export async function getTemplateDetails(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        t.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating) as avg_rating
      FROM templates t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN template_reviews r ON t.id = r.template_id
      WHERE t.id = $1 AND t.deleted_at IS NULL
      GROUP BY t.id, u.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const template = result.rows[0];

    res.json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        language: template.language,
        tags: template.tags,
        price: template.price,
        creator: {
          id: template.user_id,
          username: template.username,
          avatar: template.avatar_url
        },
        stats: {
          downloads: template.downloads_count,
          rating: parseFloat(template.avg_rating) || 0,
          reviews: template.review_count
        },
        thumbnail: template.thumbnail_url,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }
    });
  } catch (error) {
    logger.error('Get template details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Update template
 */
export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category, language, tags, price, isPublic } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM templates WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const query = `
      UPDATE templates SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        language = COALESCE($4, language),
        tags = COALESCE($5, tags),
        price = COALESCE($6, price),
        is_public = COALESCE($7, is_public),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      title, description, category, language,
      tags ? JSON.stringify(tags) : null,
      price, isPublic, id
    ]);

    logger.info(`✅ Template updated: ${id}`);

    res.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Delete template (soft delete)
 */
export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM templates WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await pool.query(
      'UPDATE templates SET deleted_at = NOW() WHERE id = $1',
      [id]
    );

    logger.info(`🗑️  Template deleted: ${id}`);

    res.json({
      success: true,
      message: 'Template deleted'
    });
  } catch (error) {
    logger.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Download template
 */
export async function downloadTemplate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get template
    const templateResult = await pool.query(
      'SELECT file_path, price, user_id FROM templates WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = templateResult.rows[0];

    // Check access (free or paid)
    if (template.price > 0 && template.user_id !== userId) {
      // Check if user purchased
      const purchaseCheck = await pool.query(
        'SELECT id FROM template_purchases WHERE template_id = $1 AND user_id = $2',
        [id, userId]
      );

      if (purchaseCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'This template requires purchase'
        });
      }
    }

    // Increment download count
    await pool.query(
      'UPDATE templates SET downloads_count = downloads_count + 1 WHERE id = $1',
      [id]
    );

    // Log download
    await pool.query(
      `INSERT INTO template_downloads (template_id, user_id, created_at)
       VALUES ($1, $2, NOW())`,
      [id, userId]
    );

    // Send file
    const fileStream = await uploadService.getFileStream(template.file_path);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=template.zip');

    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Rate template
 */
export async function rateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    const query = `
      INSERT INTO template_reviews (template_id, user_id, rating, review, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (template_id, user_id) DO UPDATE SET
        rating = $3,
        review = $4,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId, rating, review]);

    // Update template average rating
    const ratingUpdate = await pool.query(
      `UPDATE templates SET
         rating_average = (SELECT AVG(rating) FROM template_reviews WHERE template_id = $1),
         rating_count = (SELECT COUNT(*) FROM template_reviews WHERE template_id = $1)
       WHERE id = $1
       RETURNING rating_average, rating_count`,
      [id]
    );

    logger.info(`⭐ Template rated: ${id} (${rating} stars by ${userId})`);

    res.json({
      success: true,
      review: result.rows[0],
      templateRating: ratingUpdate.rows[0]
    });
  } catch (error) {
    logger.error('Rate template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get template versions
 */
export async function getTemplateVersions(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id, version, file_hash, file_size,
        created_at, updated_at
      FROM template_versions
      WHERE template_id = $1
      ORDER BY version DESC
    `;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      versions: result.rows
    });
  } catch (error) {
    logger.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase template
 */
export async function purchaseTemplate(req, res) {
  try {
    const { id } = req.params;
    const { stripeToken, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Get template
    const templateResult = await pool.query(
      'SELECT price, title, user_id FROM templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = templateResult.rows[0];
    const amount = template.price * quantity * 100; // Convert to cents

    // Process payment
    const charge = await stripe.charges.create({
      amount,
      currency: 'usd',
      source: stripeToken,
      description: `Template purchase: ${template.title}`
    });

    // Record purchase
    const purchaseQuery = `
      INSERT INTO template_purchases (template_id, user_id, quantity, amount, stripe_charge_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const result = await pool.query(purchaseQuery, [
      id, userId, quantity, template.price, charge.id
    ]);

    logger.info(`💳 Template purchased: ${id} by ${userId} (${amount} cents)`);

    res.json({
      success: true,
      purchase: result.rows[0]
    });
  } catch (error) {
    logger.error('Purchase template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get earnings
 */
export async function getEarnings(req, res) {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user.id;

    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = "AND tp.created_at >= NOW() - INTERVAL '1 day'";
        break;
      case 'week':
        dateFilter = "AND tp.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND tp.created_at >= NOW() - INTERVAL '1 month'";
        break;
      case 'year':
        dateFilter = "AND tp.created_at >= NOW() - INTERVAL '1 year'";
        break;
      default:
        dateFilter = '';
    }

    const query = `
      SELECT 
        COUNT(DISTINCT tp.id) as purchases,
        SUM(tp.amount) as total_revenue,
        SUM(t.downloads_count) as total_downloads,
        COUNT(DISTINCT t.id) as published_templates
      FROM template_purchases tp
      JOIN templates t ON tp.template_id = t.id
      WHERE t.user_id = $1 ${dateFilter}
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      earnings: {
        period,
        ...result.rows[0]
      }
    });
  } catch (error) {
    logger.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get categories
 */
export async function getCategories(req, res) {
  try {
    const categories = await searchService.getCategories();

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Report template abuse
 */
export async function reportTemplate(req, res) {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    const query = `
      INSERT INTO template_reports (template_id, reporter_id, reason, description, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId, reason, description]);

    logger.warn(`⚠️  Template reported: ${id} (${reason})`);

    res.json({
      success: true,
      report: result.rows[0]
    });
  } catch (error) {
    logger.error('Report template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export default {
  uploadTemplate,
  getTemplates,
  getTemplateDetails,
  updateTemplate,
  deleteTemplate,
  downloadTemplate,
  rateTemplate,
  getTemplateVersions,
  purchaseTemplate,
  getEarnings,
  getCategories,
  reportTemplate
};
