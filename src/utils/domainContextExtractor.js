/**
 * Domain Context Extractor
 * Extracts business type, domain, and specific requirements from user requests
 * Enables domain-aware planning and feature generation
 */

// Domain Definitions - Features specific to each business type
const DOMAIN_SPECIFICATIONS = {
  cafe: {
    name: 'Cafe/Coffee Shop',
    keywords: ['cafe', 'coffee', 'coffeeshop', 'coffee shop', 'coffee house', 'barista', 'espresso', 'cafe website'],
    features: [
      { name: 'menu_display', description: 'Display coffee and food items with prices', priority: 'high' },
      { name: 'online_ordering', description: 'Allow customers to order online', priority: 'high' },
      { name: 'drink_customization', description: 'Let customers customize drinks (size, extra shots, milk type)', priority: 'high' },
      { name: 'location_map', description: 'Show cafe location with Google Maps', priority: 'high' },
      { name: 'hours_display', description: 'Display opening/closing hours', priority: 'high' },
      { name: 'reviews_ratings', description: 'Display customer reviews and ratings', priority: 'medium' },
      { name: 'loyalty_program', description: 'Implement coffee loyalty/rewards system', priority: 'medium' },
      { name: 'reservation_system', description: 'Allow table reservations', priority: 'medium' },
      { name: 'wifi_info', description: 'Display WiFi info for remote workers', priority: 'low' },
      { name: 'music_playlist', description: 'Showcase cafe music playlists', priority: 'low' },
      { name: 'event_calendar', description: 'Display special events and activities', priority: 'low' },
      { name: 'barista_profiles', description: 'Highlight team members/baristas', priority: 'low' }
    ],
    pages: [
      { name: 'home', purpose: 'Hero section with cafe ambiance, featured drinks' },
      { name: 'menu', purpose: 'Full menu with coffee, food, and prices' },
      { name: 'order', purpose: 'Online ordering interface with customization' },
      { name: 'locations', purpose: 'Store locator with maps and hours' },
      { name: 'about', purpose: 'Cafe story, barista bios, coffee philosophy' },
      { name: 'contact', purpose: 'Contact form, hours, location, phone' }
    ],
    entities: [
      { name: 'MenuItem', fields: ['name', 'description', 'category', 'price', 'image', 'isAvailable', 'customizations'] },
      { name: 'Drink', fields: ['name', 'basePrice', 'sizes', 'shots', 'milkOptions', 'temperature'] },
      { name: 'Order', fields: ['items', 'customizations', 'orderDate', 'status', 'totalPrice'] },
      { name: 'Location', fields: ['name', 'address', 'latitude', 'longitude', 'hours', 'phone', 'email'] },
      { name: 'Barista', fields: ['name', 'bio', 'specialty', 'certifications', 'image'] },
      { name: 'LoyaltyCard', fields: ['customerId', 'points', 'stampCount', 'lastStamp', 'rewardsTier'] }
    ],
    sampleData: {
      drinks: [
        { name: 'Espresso', basePrice: 2.5, sizes: ['single', 'double', 'triple'] },
        { name: 'Americano', basePrice: 3.0, sizes: ['small', 'medium', 'large'] },
        { name: 'Cappuccino', basePrice: 4.0, sizes: ['small', 'medium', 'large'], milkOptions: ['whole', 'skim', 'oat', 'almond'] },
        { name: 'Latte', basePrice: 4.5, sizes: ['small', 'medium', 'large'], milkOptions: ['whole', 'skim', 'oat', 'almond'] },
        { name: 'Cold Brew', basePrice: 3.5, sizes: ['small', 'medium', 'large'] }
      ]
    },
    colors: {
      primary: '#8B4513', // Coffee brown
      secondary: '#D2691E', // Chocolate
      accent: '#FFD700', // Gold
      background: '#F5DEB3' // Wheat/cream
    }
  },

  restaurant: {
    name: 'Restaurant',
    keywords: ['restaurant', 'eatery', 'dining', 'bistro', 'grill', 'kitchen'],
    features: [
      { name: 'menu_display', description: 'Full restaurant menu with categories', priority: 'high' },
      { name: 'reservation_system', description: 'Table reservation booking', priority: 'high' },
      { name: 'online_ordering', description: 'Delivery and takeout ordering', priority: 'high' },
      { name: 'hours_display', description: 'Operating hours and holidays', priority: 'high' },
      { name: 'location_map', description: 'Location with directions', priority: 'high' },
      { name: 'chef_profiles', description: 'Chef bios and specialties', priority: 'medium' },
      { name: 'reviews_ratings', description: 'Customer reviews', priority: 'medium' },
      { name: 'special_events', description: 'Private events and catering', priority: 'medium' },
      { name: 'wine_list', description: 'Wine or beverage pairings', priority: 'low' }
    ],
    pages: [
      { name: 'home', purpose: 'Restaurant showcase with hero image' },
      { name: 'menu', purpose: 'Full menu with detailed descriptions and photos' },
      { name: 'reserve', purpose: 'Reservation booking interface' },
      { name: 'about', purpose: 'Restaurant story and chef bios' },
      { name: 'contact', purpose: 'Contact and location information' }
    ],
    entities: [
      { name: 'MenuItem', fields: ['name', 'description', 'price', 'category', 'allergens', 'image'] },
      { name: 'Reservation', fields: ['date', 'time', 'partySize', 'customerName', 'phone', 'specialRequests'] },
      { name: 'Order', fields: ['items', 'orderType', 'status', 'totalPrice', 'deliveryAddress'] }
    ]
  },

  ecommerce: {
    name: 'E-Commerce Store',
    keywords: ['ecommerce', 'e-commerce', 'shop', 'store', 'online store', 'shopping'],
    features: [
      { name: 'product_catalog', description: 'Browse products with search and filters', priority: 'high' },
      { name: 'shopping_cart', description: 'Add items to cart', priority: 'high' },
      { name: 'checkout', description: 'Secure payment processing', priority: 'high' },
      { name: 'user_accounts', description: 'Customer accounts and profiles', priority: 'high' },
      { name: 'order_tracking', description: 'Track order status', priority: 'high' },
      { name: 'reviews_ratings', description: 'Product reviews', priority: 'medium' },
      { name: 'wishlist', description: 'Save favorite items', priority: 'medium' },
      { name: 'inventory_management', description: 'Track stock levels', priority: 'high' },
      { name: 'product_recommendations', description: 'AI-powered recommendations', priority: 'medium' }
    ],
    pages: [
      { name: 'home', purpose: 'Featured products and promotions' },
      { name: 'products', purpose: 'Product catalog with filters' },
      { name: 'product_detail', purpose: 'Individual product page' },
      { name: 'cart', purpose: 'Shopping cart management' },
      { name: 'checkout', purpose: 'Payment and shipping' }
    ],
    entities: [
      { name: 'Product', fields: ['name', 'description', 'price', 'category', 'sku', 'inventory', 'images'] },
      { name: 'Order', fields: ['customerId', 'items', 'totalPrice', 'status', 'shippingAddress', 'trackingNumber'] },
      { name: 'Customer', fields: ['name', 'email', 'phone', 'addresses', 'orderHistory'] }
    ]
  },

  blog: {
    name: 'Blog/Publishing Site',
    keywords: ['blog', 'blogging', 'news', 'magazine', 'publication', 'content'],
    features: [
      { name: 'post_management', description: 'Create and manage blog posts', priority: 'high' },
      { name: 'categories', description: 'Organize posts by category', priority: 'high' },
      { name: 'search', description: 'Search posts by keywords', priority: 'high' },
      { name: 'comments', description: 'Allow reader comments', priority: 'medium' },
      { name: 'sharing', description: 'Social media sharing', priority: 'medium' },
      { name: 'rss_feed', description: 'RSS feed for subscribers', priority: 'low' },
      { name: 'author_profiles', description: 'Author bios and archives', priority: 'medium' }
    ],
    pages: [
      { name: 'home', purpose: 'Latest articles and featured posts' },
      { name: 'blog', purpose: 'Blog archive with filters' },
      { name: 'post', purpose: 'Individual article view' },
      { name: 'category', purpose: 'Posts by category' },
      { name: 'about', purpose: 'About the blog/author' }
    ],
    entities: [
      { name: 'Post', fields: ['title', 'slug', 'content', 'excerpt', 'author', 'category', 'tags', 'publishedDate', 'image'] },
      { name: 'Comment', fields: ['postId', 'author', 'content', 'createdDate', 'approved'] }
    ]
  },

  portfolio: {
    name: 'Portfolio/Personal Website',
    keywords: ['portfolio', 'personal', 'freelancer', 'agency', 'resume', 'cv'],
    features: [
      { name: 'project_showcase', description: 'Display portfolio projects', priority: 'high' },
      { name: 'about_section', description: 'Bio and background', priority: 'high' },
      { name: 'contact_form', description: 'Client inquiries', priority: 'high' },
      { name: 'skill_showcase', description: 'List skills and expertise', priority: 'medium' },
      { name: 'testimonials', description: 'Client testimonials', priority: 'medium' },
      { name: 'case_studies', description: 'Detailed project case studies', priority: 'medium' },
      { name: 'blog', description: 'Blog posts and articles', priority: 'low' }
    ],
    pages: [
      { name: 'home', purpose: 'Landing page with hero and intro' },
      { name: 'projects', purpose: 'Portfolio projects gallery' },
      { name: 'about', purpose: 'Bio and background' },
      { name: 'contact', purpose: 'Contact form' }
    ],
    entities: [
      { name: 'Project', fields: ['title', 'description', 'image', 'technologies', 'link', 'date', 'featured'] },
      { name: 'Skill', fields: ['name', 'proficiency', 'category', 'yearsOfExperience'] }
    ]
  },

  saas: {
    name: 'SaaS Product',
    keywords: ['saas', 'software as a service', 'app', 'web app', 'platform', 'dashboard'],
    features: [
      { name: 'user_authentication', description: 'Login and signup', priority: 'high' },
      { name: 'dashboard', description: 'Main user dashboard', priority: 'high' },
      { name: 'user_settings', description: 'Profile and preferences', priority: 'high' },
      { name: 'billing', description: 'Subscription management', priority: 'high' },
      { name: 'analytics', description: 'Usage analytics and reports', priority: 'medium' },
      { name: 'api_access', description: 'API for integrations', priority: 'medium' },
      { name: 'team_management', description: 'Invite and manage team members', priority: 'medium' }
    ],
    pages: [
      { name: 'landing', purpose: 'Marketing landing page' },
      { name: 'pricing', purpose: 'Pricing plans' },
      { name: 'dashboard', purpose: 'Main app interface' },
      { name: 'settings', purpose: 'User settings and profile' }
    ],
    entities: [
      { name: 'User', fields: ['email', 'password', 'profile', 'subscriptionPlan', 'createdDate'] },
      { name: 'Subscription', fields: ['userId', 'plan', 'status', 'billingCycle', 'nextBillingDate'] }
    ]
  }
};

/**
 * Extract domain context from user request
 * @param {string} userRequest - The user's request
 * @returns {Object} - Domain context with identified business type and specs
 */
export function extractDomainContext(userRequest) {
  const lowerRequest = userRequest.toLowerCase();
  
  // Search for domain keywords
  let identifiedDomain = null;
  let matchedKeywords = [];
  
  for (const [domainKey, specs] of Object.entries(DOMAIN_SPECIFICATIONS)) {
    const matches = specs.keywords.filter(keyword =>
      lowerRequest.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      identifiedDomain = domainKey;
      matchedKeywords = matches;
      break; // Use first match with highest priority
    }
  }
  
  // If no domain identified, try to infer from context
  if (!identifiedDomain) {
    // Generic website detection
    if (lowerRequest.includes('website') || lowerRequest.includes('build') || lowerRequest.includes('create')) {
      identifiedDomain = 'ecommerce'; // Default to most common use case
    }
  }
  
  const domainSpecs = identifiedDomain ? DOMAIN_SPECIFICATIONS[identifiedDomain] : null;
  
  // Extract other parameters
  const hasOnlineOrdering = lowerRequest.includes('order') || lowerRequest.includes('ordering') || lowerRequest.includes('delivery');
  const hasMultipleLocations = lowerRequest.includes('location') || lowerRequest.includes('branch') || lowerRequest.includes('store');
  const hasTeam = lowerRequest.includes('team') || lowerRequest.includes('staff') || lowerRequest.includes('member');
  const needsMobileOptimized = lowerRequest.includes('mobile') || lowerRequest.includes('responsive');
  const needsPayments = lowerRequest.includes('payment') || lowerRequest.includes('subscription') || lowerRequest.includes('billing');
  
  return {
    domain: identifiedDomain,
    domainName: domainSpecs?.name || 'General Website',
    matchedKeywords,
    specifications: domainSpecs,
    requirements: {
      onlineOrdering: hasOnlineOrdering,
      multipleLocations: hasMultipleLocations,
      teamManagement: hasTeam,
      mobileOptimized: needsMobileOptimized,
      paymentProcessing: needsPayments
    },
    contextConfidence: domainSpecs ? 0.9 : 0.3
  };
}

/**
 * Generate domain-specific plan
 * @param {string} userRequest - User request
 * @param {Object} domainContext - Domain context from extractDomainContext
 * @returns {Object} - Structured plan with domain-specific steps
 */
export function generateDomainSpecificPlan(userRequest, domainContext) {
  if (!domainContext.specifications) {
    return null; // No specific domain identified
  }
  
  const specs = domainContext.specifications;
  const steps = [];
  
  // Step 1: Create entities
  if (specs.entities && specs.entities.length > 0) {
    steps.push({
      step: steps.length + 1,
      action: 'create_entities',
      description: `Create ${specs.entities.length} database entities for ${specs.name}`,
      parameters: {
        entities: specs.entities,
        domain: domainContext.domain
      },
      reasoning: `${specs.name} requires structured data models for core functionality`
    });
  }
  
  // Step 2: Create pages
  if (specs.pages && specs.pages.length > 0) {
    steps.push({
      step: steps.length + 1,
      action: 'create_pages',
      description: `Create ${specs.pages.length} pages: ${specs.pages.map(p => p.name).join(', ')}`,
      parameters: {
        pages: specs.pages,
        domain: domainContext.domain,
        sampleData: specs.sampleData
      },
      reasoning: `These pages are essential for ${specs.name} functionality`
    });
  }
  
  // Step 3: Generate domain-specific components
  const highPriorityFeatures = specs.features.filter(f => f.priority === 'high');
  if (highPriorityFeatures.length > 0) {
    steps.push({
      step: steps.length + 1,
      action: 'generate_components',
      description: `Generate UI components for: ${highPriorityFeatures.map(f => f.name).join(', ')}`,
      parameters: {
        features: highPriorityFeatures,
        domain: domainContext.domain,
        styling: 'tailwind'
      },
      reasoning: `These components are critical for core ${specs.name} functionality`
    });
  }
  
  // Step 4: Create API endpoints
  if (specs.entities && specs.entities.length > 0) {
    steps.push({
      step: steps.length + 1,
      action: 'generate_apis',
      description: `Generate RESTful APIs for entity management`,
      parameters: {
        entities: specs.entities,
        domain: domainContext.domain,
        authentication: true
      },
      reasoning: `Backend APIs needed for data persistence and manipulation`
    });
  }
  
  // Step 5: Additional features based on requirements
  if (domainContext.requirements.paymentProcessing) {
    steps.push({
      step: steps.length + 1,
      action: 'integrate_payments',
      description: `Integrate payment processing (Stripe/PayPal)`,
      parameters: {
        domain: domainContext.domain
      },
      reasoning: `Payment processing required for transactions`
    });
  }
  
  return {
    goal: `Build a comprehensive ${specs.name} website for: ${userRequest.substring(0, 80)}...`,
    domain: domainContext.domain,
    domainName: specs.name,
    steps,
    features: specs.features,
    entities: specs.entities,
    pages: specs.pages,
    colors: specs.colors || {},
    estimated_duration: `${5 + steps.length * 2}-${15 + steps.length * 3} minutes`,
    complexity: steps.length > 5 ? 'complex' : steps.length > 3 ? 'moderate' : 'simple',
    confidence: domainContext.contextConfidence
  };
}

export { DOMAIN_SPECIFICATIONS };
