/**
 * Marketplace API Routes
 * 12 endpoints for template management, ratings, payments, and downloads
 */

import express from 'express';
import { validateRequest } from '../middleware/validators.js';
import { authenticate, authorize } from '../middleware/auth.js';
import marketplaceController from '../controllers/marketplace.js';

const router = express.Router();

// Middleware - All marketplace routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/marketplace/templates
 * @desc    Upload new template with file handling
 * @access  Private
 */
router.post('/templates', 
  validateRequest('body', {
    title: 'string|required|max:200',
    description: 'string|required|max:2000',
    category: 'string|required|in:javascript,typescript,react,vue,angular,nodejs,python,java',
    language: 'string|required|in:javascript,typescript,python,java,go,rust',
    tags: 'array|required|min:1|max:10',
    price: 'number|min:0|max:10000',
    isPublic: 'boolean'
  }),
  marketplaceController.uploadTemplate
);

/**
 * @route   GET /api/v1/marketplace/templates
 * @desc    Browse templates with search, filters, pagination
 * @access  Private
 * @query   search, category, language, minPrice, maxPrice, sortBy, page, limit
 */
router.get('/templates', 
  validateRequest('query', {
    search: 'string|max:100',
    category: 'string',
    language: 'string',
    minPrice: 'number|min:0',
    maxPrice: 'number|min:0',
    sortBy: 'string|in:trending,recent,popular,rating',
    page: 'number|min:1',
    limit: 'number|min:1|max:100'
  }),
  marketplaceController.getTemplates
);

/**
 * @route   GET /api/v1/marketplace/templates/:id
 * @desc    Get template details with version history
 * @access  Private
 */
router.get('/templates/:id', 
  marketplaceController.getTemplateDetails
);

/**
 * @route   PUT /api/v1/marketplace/templates/:id
 * @desc    Update template metadata
 * @access  Private (template owner only)
 */
router.put('/templates/:id', 
  authorize('template_owner'),
  validateRequest('body', {
    title: 'string|max:200',
    description: 'string|max:2000',
    category: 'string',
    language: 'string',
    tags: 'array',
    price: 'number|min:0',
    isPublic: 'boolean'
  }),
  marketplaceController.updateTemplate
);

/**
 * @route   DELETE /api/v1/marketplace/templates/:id
 * @desc    Soft delete template
 * @access  Private (template owner only)
 */
router.delete('/templates/:id', 
  authorize('template_owner'),
  marketplaceController.deleteTemplate
);

/**
 * @route   POST /api/v1/marketplace/templates/:id/download
 * @desc    Track template download and increment counter
 * @access  Private
 */
router.post('/templates/:id/download', 
  marketplaceController.downloadTemplate
);

/**
 * @route   POST /api/v1/marketplace/templates/:id/rate
 * @desc    Add or update template rating (1-5 stars)
 * @access  Private
 */
router.post('/templates/:id/rate', 
  validateRequest('body', {
    rating: 'number|required|min:1|max:5',
    review: 'string|max:1000'
  }),
  marketplaceController.rateTemplate
);

/**
 * @route   GET /api/v1/marketplace/templates/:id/versions
 * @desc    Get template version history
 * @access  Private
 */
router.get('/templates/:id/versions', 
  marketplaceController.getTemplateVersions
);

/**
 * @route   POST /api/v1/marketplace/templates/:id/purchase
 * @desc    Process payment and grant access to premium template
 * @access  Private
 */
router.post('/templates/:id/purchase', 
  validateRequest('body', {
    stripeToken: 'string|required',
    quantity: 'number|min:1'
  }),
  marketplaceController.purchaseTemplate
);

/**
 * @route   GET /api/v1/marketplace/earnings
 * @desc    Get creator earnings and sales statistics
 * @access  Private
 * @query   period (day, week, month, year, all)
 */
router.get('/earnings', 
  validateRequest('query', {
    period: 'string|in:day,week,month,year,all'
  }),
  marketplaceController.getEarnings
);

/**
 * @route   GET /api/v1/marketplace/categories
 * @desc    List all template categories with counts
 * @access  Private
 */
router.get('/categories', 
  marketplaceController.getCategories
);

/**
 * @route   POST /api/v1/marketplace/templates/:id/report
 * @desc    Report template for abuse/inappropriate content
 * @access  Private
 */
router.post('/templates/:id/report', 
  validateRequest('body', {
    reason: 'string|required|in:copyright,inappropriate,spam,malware,other',
    description: 'string|required|max:1000'
  }),
  marketplaceController.reportTemplate
);

// Error handling
router.use((err, req, res, next) => {
  console.error('Marketplace route error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

export default router;
