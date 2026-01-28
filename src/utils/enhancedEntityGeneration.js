/**
 * Enhanced Entity Generation with Advanced Coding Features
 * Provides intelligent entity schemas with relationships, validations, and API configs
 */

export function generateEnhancedEntities(description) {
  const lower = description.toLowerCase();
  const entities = [];
  
  // Detect technical features
  const features = {
    auth: lower.includes('auth') || lower.includes('login') || lower.includes('user'),
    payment: lower.includes('payment') || lower.includes('checkout') || lower.includes('subscription'),
    search: lower.includes('search') || lower.includes('filter'),
    analytics: lower.includes('analytics') || lower.includes('tracking'),
    realtime: lower.includes('realtime') || lower.includes('live'),
  };

  // E-commerce entities with advanced schemas
  if (lower.includes('product') || lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce')) {
    entities.push({
      name: 'Category',
      schema: {
        name: { type: 'string', required: true, unique: true, minLength: 2, maxLength: 50 },
        slug: { type: 'string', required: true, unique: true, pattern: '^[a-z0-9-]+$' },
        description: { type: 'text', maxLength: 500 },
        icon: { type: 'string' },
        parent_id: { type: 'reference', entity: 'Category' },
        display_order: { type: 'number', default: 0 },
        active: { type: 'boolean', default: true },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['slug', 'active', 'parent_id'],
      api_endpoints: {
        list: { method: 'GET', path: '/categories', auth: false, cache: 300 },
        get: { method: 'GET', path: '/categories/:slug', auth: false },
        create: { method: 'POST', path: '/categories', auth: true, role: 'admin' },
        update: { method: 'PUT', path: '/categories/:id', auth: true, role: 'admin' },
        delete: { method: 'DELETE', path: '/categories/:id', auth: true, role: 'admin' }
      }
    });

    entities.push({
      name: 'Product',
      schema: {
        name: { type: 'string', required: true, minLength: 3, maxLength: 100 },
        slug: { type: 'string', required: true, unique: true, pattern: '^[a-z0-9-]+$' },
        description: { type: 'text', maxLength: 2000 },
        price: { type: 'number', required: true, min: 0 },
        compare_price: { type: 'number', min: 0 },
        cost: { type: 'number', min: 0 },
        sku: { type: 'string', unique: true, maxLength: 50 },
        barcode: { type: 'string', maxLength: 50 },
        category_id: { type: 'reference', entity: 'Category', required: true },
        brand: { type: 'string', maxLength: 50 },
        images: { type: 'array', items: { type: 'string' }, minItems: 1 },
        thumbnail: { type: 'string' },
        stock: { type: 'number', default: 0, min: 0 },
        stock_alert: { type: 'number', default: 5 },
        weight: { type: 'number', min: 0 },
        dimensions: { type: 'object', properties: { length: 'number', width: 'number', height: 'number' } },
        featured: { type: 'boolean', default: false },
        active: { type: 'boolean', default: true },
        seo_title: { type: 'string', maxLength: 60 },
        seo_description: { type: 'string', maxLength: 160 },
        tags: { type: 'array', items: { type: 'string' } },
        variants: { type: 'array', items: { 
          type: 'object',
          properties: { name: 'string', sku: 'string', price: 'number', stock: 'number' }
        }},
        created_at: { type: 'datetime', default: 'now' },
        updated_at: { type: 'datetime', auto: true }
      },
      indexes: ['slug', 'sku', 'category_id', 'featured', 'active'],
      relationships: [
        { type: 'belongsTo', entity: 'Category', foreignKey: 'category_id' }
      ],
      api_endpoints: {
        list: { method: 'GET', path: '/products', auth: false, cache: 180 },
        search: { method: 'GET', path: '/products/search', auth: false },
        get: { method: 'GET', path: '/products/:slug', auth: false, cache: 300 },
        create: { method: 'POST', path: '/products', auth: true, role: 'admin' },
        update: { method: 'PUT', path: '/products/:id', auth: true, role: 'admin' },
        delete: { method: 'DELETE', path: '/products/:id', auth: true, role: 'admin' },
        bulk: { method: 'POST', path: '/products/bulk', auth: true, role: 'admin' }
      }
    });

    if (features.payment) {
      entities.push({
        name: 'Order',
        schema: {
          order_number: { type: 'string', required: true, unique: true, pattern: '^ORD-[0-9]{8}$' },
          user_id: { type: 'reference', entity: 'User' },
          status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
          items: { type: 'array', items: { 
            type: 'object',
            properties: { 
              product_id: { type: 'reference', entity: 'Product' },
              variant_id: 'string',
              quantity: 'number', 
              price: 'number',
              name: 'string'
            }
          }},
          subtotal: { type: 'number', required: true, min: 0 },
          tax: { type: 'number', default: 0, min: 0 },
          shipping: { type: 'number', default: 0, min: 0 },
          discount: { type: 'number', default: 0, min: 0 },
          total: { type: 'number', required: true, min: 0 },
          currency: { type: 'string', default: 'USD', pattern: '^[A-Z]{3}$' },
          payment_status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
          payment_method: { type: 'string', enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer'] },
          payment_intent_id: { type: 'string' },
          shipping_address: { type: 'object', required: true, properties: {
            name: 'string',
            address_line1: 'string',
            address_line2: 'string',
            city: 'string',
            state: 'string',
            postal_code: 'string',
            country: 'string',
            phone: 'string'
          }},
          billing_address: { type: 'object' },
          tracking_number: { type: 'string' },
          notes: { type: 'text' },
          created_at: { type: 'datetime', default: 'now' },
          updated_at: { type: 'datetime', auto: true }
        },
        indexes: ['order_number', 'user_id', 'status', 'payment_status'],
        api_endpoints: {
          list: { method: 'GET', path: '/orders', auth: true },
          get: { method: 'GET', path: '/orders/:id', auth: true },
          create: { method: 'POST', path: '/orders', auth: true },
          update: { method: 'PUT', path: '/orders/:id', auth: true, role: 'admin' },
          cancel: { method: 'POST', path: '/orders/:id/cancel', auth: true }
        }
      });
    }
  }

  // Blog entities with advanced features
  if (lower.includes('blog') || lower.includes('article') || lower.includes('news') || lower.includes('content')) {
    entities.push({
      name: 'Article',
      schema: {
        title: { type: 'string', required: true, minLength: 5, maxLength: 200 },
        slug: { type: 'string', required: true, unique: true, pattern: '^[a-z0-9-]+$' },
        excerpt: { type: 'text', maxLength: 300 },
        content: { type: 'text', required: true, minLength: 100 },
        author_id: { type: 'reference', entity: 'User', required: true },
        author_name: { type: 'string', required: true },
        author_avatar: { type: 'string' },
        published_at: { type: 'datetime' },
        status: { type: 'string', enum: ['draft', 'published', 'archived'], default: 'draft' },
        category: { type: 'string', required: true },
        subcategory: { type: 'string' },
        featured_image: { type: 'string', required: true },
        gallery: { type: 'array', items: { type: 'string' } },
        featured: { type: 'boolean', default: false },
        views: { type: 'number', default: 0 },
        likes: { type: 'number', default: 0 },
        reading_time: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' }, maxItems: 10 },
        seo_title: { type: 'string', maxLength: 60 },
        seo_description: { type: 'string', maxLength: 160 },
        seo_keywords: { type: 'array', items: { type: 'string' } },
        og_image: { type: 'string' },
        allow_comments: { type: 'boolean', default: true },
        created_at: { type: 'datetime', default: 'now' },
        updated_at: { type: 'datetime', auto: true }
      },
      indexes: ['slug', 'author_id', 'status', 'published_at', 'category', 'featured'],
      relationships: [
        { type: 'belongsTo', entity: 'User', foreignKey: 'author_id' }
      ],
      api_endpoints: {
        list: { method: 'GET', path: '/articles', auth: false, cache: 300 },
        featured: { method: 'GET', path: '/articles/featured', auth: false, cache: 600 },
        search: { method: 'GET', path: '/articles/search', auth: false },
        get: { method: 'GET', path: '/articles/:slug', auth: false, cache: 300 },
        create: { method: 'POST', path: '/articles', auth: true, role: 'author' },
        update: { method: 'PUT', path: '/articles/:id', auth: true, role: 'author' },
        delete: { method: 'DELETE', path: '/articles/:id', auth: true, role: 'admin' },
        publish: { method: 'POST', path: '/articles/:id/publish', auth: true, role: 'author' }
      }
    });

    entities.push({
      name: 'Comment',
      schema: {
        article_id: { type: 'reference', entity: 'Article', required: true },
        user_id: { type: 'reference', entity: 'User' },
        author_name: { type: 'string', required: true },
        author_email: { type: 'string', required: true, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
        content: { type: 'text', required: true, minLength: 10, maxLength: 1000 },
        parent_id: { type: 'reference', entity: 'Comment' },
        approved: { type: 'boolean', default: false },
        flagged: { type: 'boolean', default: false },
        likes: { type: 'number', default: 0 },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['article_id', 'parent_id', 'approved'],
      api_endpoints: {
        list: { method: 'GET', path: '/comments', auth: false },
        create: { method: 'POST', path: '/comments', auth: false },
        approve: { method: 'POST', path: '/comments/:id/approve', auth: true, role: 'moderator' },
        delete: { method: 'DELETE', path: '/comments/:id', auth: true, role: 'moderator' }
      }
    });
  }

  // Restaurant/Cafe entities
  if (lower.includes('cafe') || lower.includes('restaurant') || lower.includes('menu') || lower.includes('food')) {
    entities.push({
      name: 'MenuItem',
      schema: {
        name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        slug: { type: 'string', required: true, unique: true },
        description: { type: 'text', maxLength: 500 },
        price: { type: 'number', required: true, min: 0 },
        category: { type: 'string', required: true, enum: ['appetizer', 'main', 'dessert', 'beverage', 'special'] },
        subcategory: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
        thumbnail: { type: 'string' },
        available: { type: 'boolean', default: true },
        featured: { type: 'boolean', default: false },
        allergens: { type: 'array', items: { type: 'string', enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish', 'peanuts'] }},
        dietary_tags: { type: 'array', items: { type: 'string', enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'halal', 'kosher'] }},
        calories: { type: 'number', min: 0 },
        protein: { type: 'number', min: 0 },
        carbs: { type: 'number', min: 0 },
        fats: { type: 'number', min: 0 },
        prep_time: { type: 'number', min: 0 },
        spice_level: { type: 'number', min: 0, max: 5 },
        ingredients: { type: 'array', items: { type: 'string' } },
        display_order: { type: 'number', default: 0 },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['slug', 'category', 'available', 'featured'],
      api_endpoints: {
        list: { method: 'GET', path: '/menu', auth: false, cache: 300 },
        byCategory: { method: 'GET', path: '/menu/category/:category', auth: false },
        get: { method: 'GET', path: '/menu/:slug', auth: false },
        create: { method: 'POST', path: '/menu', auth: true, role: 'admin' },
        update: { method: 'PUT', path: '/menu/:id', auth: true, role: 'admin' },
        delete: { method: 'DELETE', path: '/menu/:id', auth: true, role: 'admin' }
      }
    });
  }

  // User authentication entity
  if (features.auth || entities.some(e => e.schema && Object.values(e.schema).some(s => s.type === 'reference' && s.entity === 'User'))) {
    entities.push({
      name: 'User',
      schema: {
        email: { type: 'string', required: true, unique: true, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
        username: { type: 'string', unique: true, minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$' },
        full_name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        avatar: { type: 'string' },
        bio: { type: 'text', maxLength: 500 },
        role: { type: 'string', enum: ['user', 'author', 'moderator', 'admin'], default: 'user' },
        verified: { type: 'boolean', default: false },
        email_verified: { type: 'boolean', default: false },
        phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' },
        preferences: { type: 'object', properties: {
          newsletter: 'boolean',
          notifications: 'boolean',
          theme: 'string'
        }},
        created_at: { type: 'datetime', default: 'now' },
        last_login: { type: 'datetime' },
        updated_at: { type: 'datetime', auto: true }
      },
      indexes: ['email', 'username', 'role'],
      api_endpoints: {
        register: { method: 'POST', path: '/auth/register', auth: false },
        login: { method: 'POST', path: '/auth/login', auth: false },
        logout: { method: 'POST', path: '/auth/logout', auth: true },
        profile: { method: 'GET', path: '/auth/profile', auth: true },
        update: { method: 'PUT', path: '/auth/profile', auth: true },
        verifyEmail: { method: 'POST', path: '/auth/verify-email', auth: false },
        resetPassword: { method: 'POST', path: '/auth/reset-password', auth: false }
      }
    });
  }

  return { entities, features };
}
