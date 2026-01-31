/**
 * Intelligent Content Generator
 * Generates realistic sample data and content based on business context
 * instead of just copying user prompts
 */

/**
 * Parse business context from user's description
 */
export function parseBusinessContext(description) {
  const lower = description.toLowerCase();
  
  const context = {
    businessType: null,
    businessName: null,
    industry: null,
    currency: 'USD',
    language: 'en',
    style: 'modern',
    targetAudience: null
  };

  // Extract business name (look for quotes or "called" keyword)
  const nameMatch = description.match(/(?:called|named|is)\s+["']?([A-Za-z0-9\s&]+)["']?/i);
  if (nameMatch) {
    context.businessName = nameMatch[1].trim();
  }

  // Detect business type
  const businessTypes = {
    cafe: ['cafe', 'coffee shop', 'coffee studio', 'coffeehouse'],
    restaurant: ['restaurant', 'eatery', 'diner', 'bistro'],
    bakery: ['bakery', 'patisserie', 'pastry shop'],
    bar: ['bar', 'pub', 'lounge', 'tavern'],
    gym: ['gym', 'fitness', 'health club'],
    salon: ['salon', 'barbershop', 'spa', 'beauty'],
    boutique: ['boutique', 'shop', 'store'],
    agency: ['agency', 'studio', 'consultancy'],
    clinic: ['clinic', 'dental', 'medical', 'health center']
  };

  for (const [type, keywords] of Object.entries(businessTypes)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      context.businessType = type;
      break;
    }
  }

  // Detect currency
  const currencies = {
    php: ['philippine peso', 'pesos', 'php', 'philippines'],
    usd: ['dollar', 'usd', 'us dollar'],
    eur: ['euro', 'eur'],
    gbp: ['pound', 'gbp', 'sterling'],
    jpy: ['yen', 'jpy'],
    inr: ['rupee', 'inr', 'india']
  };

  for (const [curr, keywords] of Object.entries(currencies)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      context.currency = curr.toUpperCase();
      break;
    }
  }

  // Detect style
  if (lower.includes('minimal') || lower.includes('clean') || lower.includes('simple')) {
    context.style = 'minimal';
  } else if (lower.includes('modern')) {
    context.style = 'modern';
  } else if (lower.includes('vintage') || lower.includes('classic')) {
    context.style = 'vintage';
  } else if (lower.includes('luxury') || lower.includes('premium')) {
    context.style = 'luxury';
  }

  return context;
}

/**
 * Generate realistic sample data for cafe/coffee shop
 */
export function generateCafeMenuItems(businessName, currency = 'PHP') {
  const currencySymbols = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹'
  };

  const symbol = currencySymbols[currency] || currency;
  
  // Price multipliers for different currencies
  const priceMultipliers = {
    PHP: 1,
    USD: 0.018,
    EUR: 0.016,
    GBP: 0.014,
    JPY: 2.5,
    INR: 1.5
  };
  
  const multiplier = priceMultipliers[currency] || 1;
  
  const basePrice = (price) => Math.round(price * multiplier);

  return [
    // Coffee Drinks
    {
      name: 'Classic Espresso',
      category: 'beverage',
      subcategory: 'Hot Coffee',
      price: basePrice(80),
      description: 'Rich and bold single shot of espresso, perfect for a quick energy boost',
      dietary_tags: ['vegan'],
      available: true,
      featured: false
    },
    {
      name: 'Cappuccino',
      category: 'beverage',
      subcategory: 'Hot Coffee',
      price: basePrice(120),
      description: 'Smooth espresso with steamed milk and a thick layer of foam',
      allergens: ['dairy'],
      available: true,
      featured: true
    },
    {
      name: 'Caramel Macchiato',
      category: 'beverage',
      subcategory: 'Hot Coffee',
      price: basePrice(150),
      description: 'Espresso with vanilla-flavored syrup, steamed milk, and caramel drizzle',
      allergens: ['dairy'],
      available: true,
      featured: true
    },
    {
      name: 'Iced Americano',
      category: 'beverage',
      subcategory: 'Cold Coffee',
      price: basePrice(100),
      description: 'Chilled espresso diluted with cold water and ice',
      dietary_tags: ['vegan'],
      available: true
    },
    {
      name: 'Cold Brew',
      category: 'beverage',
      subcategory: 'Cold Coffee',
      price: basePrice(130),
      description: 'Smooth, less acidic coffee steeped in cold water for 12 hours',
      dietary_tags: ['vegan'],
      available: true,
      featured: true
    },
    {
      name: 'Vanilla Latte',
      category: 'beverage',
      subcategory: 'Hot Coffee',
      price: basePrice(140),
      description: 'Espresso with steamed milk and vanilla syrup',
      allergens: ['dairy'],
      available: true
    },
    
    // Tea & Non-Coffee
    {
      name: 'Matcha Latte',
      category: 'beverage',
      subcategory: 'Tea',
      price: basePrice(160),
      description: 'Premium Japanese matcha green tea with steamed milk',
      allergens: ['dairy'],
      dietary_tags: ['vegetarian'],
      available: true,
      featured: true
    },
    {
      name: 'Chai Tea Latte',
      category: 'beverage',
      subcategory: 'Tea',
      price: basePrice(135),
      description: 'Spiced black tea with steamed milk and honey',
      allergens: ['dairy'],
      available: true
    },
    {
      name: 'Hot Chocolate',
      category: 'beverage',
      subcategory: 'Other Drinks',
      price: basePrice(120),
      description: 'Rich and creamy chocolate drink topped with whipped cream',
      allergens: ['dairy'],
      available: true
    },
    
    // Pastries
    {
      name: 'Butter Croissant',
      category: 'dessert',
      subcategory: 'Pastry',
      price: basePrice(85),
      description: 'Flaky, buttery French croissant baked fresh daily',
      allergens: ['gluten', 'dairy', 'eggs'],
      available: true,
      featured: true
    },
    {
      name: 'Chocolate Muffin',
      category: 'dessert',
      subcategory: 'Pastry',
      price: basePrice(95),
      description: 'Moist chocolate muffin with chocolate chips',
      allergens: ['gluten', 'dairy', 'eggs'],
      available: true
    },
    {
      name: 'Blueberry Scone',
      category: 'dessert',
      subcategory: 'Pastry',
      price: basePrice(90),
      description: 'Light and fluffy scone packed with fresh blueberries',
      allergens: ['gluten', 'dairy', 'eggs'],
      available: true
    },
    {
      name: 'Cinnamon Roll',
      category: 'dessert',
      subcategory: 'Pastry',
      price: basePrice(110),
      description: 'Soft, warm cinnamon roll with cream cheese frosting',
      allergens: ['gluten', 'dairy', 'eggs'],
      available: true,
      featured: true
    },
    
    // Sandwiches
    {
      name: 'Classic BLT',
      category: 'main',
      subcategory: 'Sandwich',
      price: basePrice(180),
      description: 'Bacon, lettuce, tomato on toasted sourdough with mayo',
      allergens: ['gluten'],
      available: true
    },
    {
      name: 'Grilled Chicken Sandwich',
      category: 'main',
      subcategory: 'Sandwich',
      price: basePrice(195),
      description: 'Grilled chicken breast with lettuce, tomato, and special sauce',
      allergens: ['gluten'],
      available: true,
      featured: true
    },
    {
      name: 'Vegetarian Panini',
      category: 'main',
      subcategory: 'Sandwich',
      price: basePrice(175),
      description: 'Grilled vegetables, mozzarella, and pesto on ciabatta',
      allergens: ['gluten', 'dairy'],
      dietary_tags: ['vegetarian'],
      available: true
    },
    
    // Specials
    {
      name: 'Avocado Toast',
      category: 'special',
      subcategory: 'Breakfast',
      price: basePrice(165),
      description: 'Smashed avocado on sourdough with cherry tomatoes and poached egg',
      allergens: ['gluten', 'eggs'],
      dietary_tags: ['vegetarian'],
      available: true,
      featured: true
    },
    {
      name: 'Acai Bowl',
      category: 'special',
      subcategory: 'Healthy',
      price: basePrice(185),
      description: 'Acai berry smoothie bowl topped with granola, fresh fruits, and honey',
      allergens: ['nuts'],
      dietary_tags: ['vegan', 'gluten-free'],
      available: true,
      featured: true
    }
  ];
}

/**
 * Generate realistic sample data for restaurants
 */
export function generateRestaurantMenuItems(businessName, cuisine = 'international', currency = 'PHP') {
  const currencySymbols = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹'
  };

  const symbol = currencySymbols[currency] || currency;
  const priceMultipliers = {
    PHP: 1,
    USD: 0.018,
    EUR: 0.016,
    GBP: 0.014,
    JPY: 2.5,
    INR: 1.5
  };
  
  const multiplier = priceMultipliers[currency] || 1;
  const basePrice = (price) => Math.round(price * multiplier);

  return [
    // Appetizers
    {
      name: 'Caesar Salad',
      category: 'appetizer',
      price: basePrice(250),
      description: 'Crisp romaine lettuce with parmesan, croutons, and classic Caesar dressing',
      dietary_tags: ['vegetarian'],
      available: true
    },
    {
      name: 'Garlic Bread',
      category: 'appetizer',
      price: basePrice(150),
      description: 'Toasted bread with garlic butter and herbs',
      allergens: ['gluten', 'dairy'],
      available: true
    },
    {
      name: 'Spring Rolls',
      category: 'appetizer',
      price: basePrice(180),
      description: 'Crispy vegetable spring rolls with sweet chili sauce',
      dietary_tags: ['vegan'],
      available: true,
      featured: true
    },
    
    // Main Courses
    {
      name: 'Grilled Salmon',
      category: 'main',
      subcategory: 'Seafood',
      price: basePrice(450),
      description: 'Fresh Atlantic salmon with lemon butter sauce, served with vegetables',
      allergens: ['fish'],
      available: true,
      featured: true
    },
    {
      name: 'Beef Tenderloin',
      category: 'main',
      subcategory: 'Meat',
      price: basePrice(580),
      description: 'Premium beef tenderloin with red wine reduction and mashed potatoes',
      available: true,
      featured: true
    },
    {
      name: 'Chicken Alfredo Pasta',
      category: 'main',
      subcategory: 'Pasta',
      price: basePrice(350),
      description: 'Fettuccine pasta in creamy Alfredo sauce with grilled chicken',
      allergens: ['gluten', 'dairy'],
      available: true
    },
    {
      name: 'Vegetarian Pizza',
      category: 'main',
      subcategory: 'Pizza',
      price: basePrice(320),
      description: 'Wood-fired pizza with fresh vegetables and mozzarella',
      allergens: ['gluten', 'dairy'],
      dietary_tags: ['vegetarian'],
      available: true
    },
    
    // Desserts
    {
      name: 'Chocolate Lava Cake',
      category: 'dessert',
      price: basePrice(200),
      description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
      allergens: ['gluten', 'dairy', 'eggs'],
      available: true,
      featured: true
    },
    {
      name: 'Tiramisu',
      category: 'dessert',
      price: basePrice(180),
      description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
      allergens: ['gluten', 'dairy', 'eggs'],
      available: true
    },
    
    // Beverages
    {
      name: 'Fresh Mango Shake',
      category: 'beverage',
      price: basePrice(120),
      description: 'Refreshing shake made with fresh Philippine mangoes',
      dietary_tags: ['vegan'],
      available: true
    }
  ];
}

/**
 * Generate sample portfolio projects
 */
export function generatePortfolioProjects(businessName, industry = 'web') {
  return [
    {
      title: 'E-Commerce Platform Redesign',
      slug: 'ecommerce-redesign',
      description: 'Complete redesign of a multi-vendor marketplace with focus on user experience and conversion optimization',
      client_name: 'RetailPro Inc.',
      category: 'web',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      featured_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      featured: true,
      year: 2024,
      duration: '3 months'
    },
    {
      title: 'Mobile Banking App',
      slug: 'mobile-banking',
      description: 'Secure and intuitive mobile banking application with real-time transactions and biometric authentication',
      client_name: 'FinanceFirst Bank',
      category: 'mobile',
      technologies: ['React Native', 'Firebase', 'Plaid API'],
      featured_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
      featured: true,
      year: 2024,
      duration: '4 months'
    },
    {
      title: 'Brand Identity Design',
      slug: 'brand-identity',
      description: 'Complete brand identity including logo, color palette, typography, and brand guidelines',
      client_name: 'TechStart Ventures',
      category: 'branding',
      technologies: ['Figma', 'Adobe Illustrator'],
      featured_image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      featured: false,
      year: 2023,
      duration: '2 months'
    },
    {
      title: 'Corporate Website',
      slug: 'corporate-website',
      description: 'Professional corporate website with CMS integration and multilingual support',
      client_name: 'Global Solutions Ltd.',
      category: 'web',
      technologies: ['Next.js', 'Contentful', 'Tailwind CSS'],
      featured_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      featured: false,
      year: 2023,
      duration: '2 months'
    }
  ];
}

/**
 * Generate sample blog articles
 */
export function generateBlogArticles(businessName, niche = 'technology') {
  return [
    {
      title: 'The Future of Web Development in 2024',
      slug: 'future-web-development-2024',
      excerpt: 'Exploring emerging trends and technologies shaping the future of web development',
      content: `# The Future of Web Development in 2024\n\nWeb development continues to evolve at a rapid pace. From AI-powered tools to new frameworks, developers have more options than ever before.\n\n## Key Trends\n\n1. **AI Integration**: AI is becoming integral to development workflows\n2. **Edge Computing**: Faster, more distributed applications\n3. **Web3 Technologies**: Blockchain and decentralized apps\n\n## Conclusion\n\nStaying current with these trends will be crucial for developers in 2024.`,
      author_name: 'Tech Team',
      category: 'Technology',
      featured_image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      featured: true,
      status: 'published',
      tags: ['web development', 'trends', 'technology'],
      reading_time: 5,
      published_at: new Date().toISOString()
    },
    {
      title: '10 Tips for Better Code Organization',
      slug: '10-tips-code-organization',
      excerpt: 'Practical tips to keep your codebase clean, maintainable, and scalable',
      content: `# 10 Tips for Better Code Organization\n\nGood code organization is essential for maintainability...\n\n1. Use consistent naming conventions\n2. Follow the single responsibility principle\n3. Write meaningful comments\n...`,
      author_name: 'Dev Team',
      category: 'Best Practices',
      featured_image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      featured: true,
      status: 'published',
      tags: ['coding', 'best practices', 'clean code'],
      reading_time: 8,
      published_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      title: 'Getting Started with TypeScript',
      slug: 'getting-started-typescript',
      excerpt: 'A beginner-friendly guide to TypeScript and static typing',
      content: `# Getting Started with TypeScript\n\nTypeScript adds static typing to JavaScript...\n\n## Why TypeScript?\n\n- Type safety\n- Better IDE support\n- Improved code quality`,
      author_name: 'Tech Team',
      category: 'Tutorials',
      featured_image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
      featured: false,
      status: 'published',
      tags: ['typescript', 'javascript', 'tutorial'],
      reading_time: 10,
      published_at: new Date(Date.now() - 172800000).toISOString()
    }
  ];
}

/**
 * Generate sample e-commerce products
 */
export function generateEcommerceProducts(businessName, category = 'general', currency = 'PHP') {
  const basePrice = (price) => Math.round(price * (currency === 'PHP' ? 1 : currency === 'USD' ? 0.018 : 1));
  
  return [
    {
      name: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life',
      price: basePrice(5999),
      category: 'Electronics',
      brand: 'AudioTech',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      stock: 50,
      featured: true,
      tags: ['audio', 'wireless', 'electronics']
    },
    {
      name: 'Organic Cotton T-Shirt',
      slug: 'organic-cotton-tshirt',
      description: 'Comfortable and sustainable t-shirt made from 100% organic cotton',
      price: basePrice(899),
      category: 'Clothing',
      brand: 'EcoWear',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
      stock: 100,
      featured: true,
      tags: ['clothing', 'organic', 'sustainable']
    },
    {
      name: 'Smart Fitness Watch',
      slug: 'smart-fitness-watch',
      description: 'Track your fitness goals with heart rate monitoring, GPS, and sleep tracking',
      price: basePrice(3499),
      category: 'Wearables',
      brand: 'FitTrack',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
      stock: 30,
      featured: true,
      tags: ['fitness', 'wearables', 'health']
    },
    {
      name: 'Minimalist Leather Wallet',
      slug: 'minimalist-leather-wallet',
      description: 'Slim leather wallet with RFID protection and card slots',
      price: basePrice(1299),
      category: 'Accessories',
      brand: 'LeatherCraft',
      images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'],
      stock: 75,
      featured: false,
      tags: ['accessories', 'leather', 'wallet']
    },
    {
      name: 'Portable Bluetooth Speaker',
      slug: 'portable-bluetooth-speaker',
      description: 'Waterproof speaker with 360-degree sound and 12-hour battery',
      price: basePrice(2499),
      category: 'Electronics',
      brand: 'SoundWave',
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'],
      stock: 40,
      featured: false,
      tags: ['audio', 'portable', 'bluetooth']
    }
  ];
}

/**
 * Generate sample services (for agencies, salons, etc.)
 */
export function generateServices(businessName, serviceType = 'agency', currency = 'PHP') {
  const basePrice = (price) => Math.round(price * (currency === 'PHP' ? 1 : currency === 'USD' ? 0.018 : 1));
  
  const servicesByType = {
    agency: [
      {
        name: 'Website Design & Development',
        slug: 'website-design-development',
        description: 'Custom website design and development tailored to your brand',
        price_from: basePrice(50000),
        price_type: 'project',
        delivery_time: '4-6 weeks',
        features: ['Custom Design', 'Responsive Layout', 'SEO Optimization', 'Content Management System'],
        active: true
      },
      {
        name: 'Brand Identity Package',
        slug: 'brand-identity',
        description: 'Complete brand identity including logo, colors, and guidelines',
        price_from: basePrice(25000),
        price_type: 'project',
        delivery_time: '2-3 weeks',
        features: ['Logo Design', 'Color Palette', 'Typography', 'Brand Guidelines'],
        active: true
      },
      {
        name: 'Social Media Management',
        slug: 'social-media-management',
        description: 'Monthly social media content creation and management',
        price_from: basePrice(15000),
        price_type: 'monthly',
        delivery_time: 'Ongoing',
        features: ['Content Creation', 'Post Scheduling', 'Analytics Reports', 'Community Management'],
        active: true
      }
    ],
    salon: [
      {
        name: 'Haircut & Styling',
        slug: 'haircut-styling',
        description: 'Professional haircut and styling consultation',
        price_from: basePrice(500),
        price_type: 'fixed',
        delivery_time: '1 hour',
        features: ['Consultation', 'Shampoo', 'Cut', 'Style'],
        active: true
      },
      {
        name: 'Hair Coloring',
        slug: 'hair-coloring',
        description: 'Full hair coloring service with premium products',
        price_from: basePrice(2000),
        price_type: 'fixed',
        delivery_time: '2-3 hours',
        features: ['Color Consultation', 'Premium Products', 'Treatment', 'Styling'],
        active: true
      },
      {
        name: 'Facial Treatment',
        slug: 'facial-treatment',
        description: 'Relaxing facial treatment with organic products',
        price_from: basePrice(1500),
        price_type: 'fixed',
        delivery_time: '1.5 hours',
        features: ['Cleansing', 'Exfoliation', 'Mask', 'Moisturizing'],
        active: true
      }
    ],
    gym: [
      {
        name: 'Personal Training Session',
        slug: 'personal-training',
        description: 'One-on-one training session with certified trainer',
        price_from: basePrice(800),
        price_type: 'hourly',
        delivery_time: '1 hour',
        features: ['Customized Workout', 'Form Coaching', 'Progress Tracking'],
        active: true
      },
      {
        name: 'Group Fitness Class',
        slug: 'group-fitness',
        description: 'High-energy group fitness classes',
        price_from: basePrice(300),
        price_type: 'fixed',
        delivery_time: '45 minutes',
        features: ['Expert Instruction', 'All Equipment Provided', 'Music & Motivation'],
        active: true
      },
      {
        name: 'Nutrition Consultation',
        slug: 'nutrition-consultation',
        description: 'Personalized nutrition plan and consultation',
        price_from: basePrice(1500),
        price_type: 'fixed',
        delivery_time: '1 hour',
        features: ['Meal Plan', 'Macro Calculation', 'Follow-up Support'],
        active: true
      }
    ]
  };

  return servicesByType[serviceType] || servicesByType.agency;
}

/**
 * Generate sample SaaS plans
 */
export function generateSaaSPlans(businessName, currency = 'USD') {
  const basePrice = (price) => currency === 'PHP' ? Math.round(price * 55) : price;
  
  return [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for individuals and small projects',
      price_monthly: basePrice(9),
      price_yearly: basePrice(90),
      features: [
        '5 Projects',
        '10GB Storage',
        'Basic Support',
        '1,000 API Calls/month',
        'Community Access'
      ],
      limits: {
        users: 1,
        storage: 10,
        api_calls: 1000
      },
      active: true,
      display_order: 1
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'For growing businesses and teams',
      price_monthly: basePrice(29),
      price_yearly: basePrice(290),
      features: [
        '50 Projects',
        '100GB Storage',
        'Priority Support',
        '50,000 API Calls/month',
        'Advanced Analytics',
        'Team Collaboration',
        'Custom Branding'
      ],
      limits: {
        users: 10,
        storage: 100,
        api_calls: 50000
      },
      popular: true,
      active: true,
      display_order: 2
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large organizations with custom needs',
      price_monthly: basePrice(99),
      price_yearly: basePrice(990),
      features: [
        'Unlimited Projects',
        '1TB Storage',
        '24/7 Premium Support',
        'Unlimited API Calls',
        'Advanced Security',
        'SSO Integration',
        'Custom Integrations',
        'Dedicated Account Manager'
      ],
      limits: {
        users: -1,
        storage: 1000,
        api_calls: -1
      },
      active: true,
      display_order: 3
    }
  ];
}

/**
 * Generate sample events
 */
export function generateEvents(businessName, category = 'conference') {
  return [
    {
      title: 'Tech Innovation Summit 2024',
      slug: 'tech-innovation-summit-2024',
      description: 'Join industry leaders for a day of innovation, networking, and insights into the future of technology',
      venue: 'Metro Convention Center',
      address: '123 Main Street, City Center',
      start_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      end_date: new Date(Date.now() + 30 * 86400000 + 8 * 3600000).toISOString(),
      category: 'conference',
      capacity: 500,
      tickets_sold: 0,
      featured: true,
      status: 'published'
    },
    {
      title: 'Startup Networking Meetup',
      slug: 'startup-networking-meetup',
      description: 'Connect with fellow entrepreneurs, investors, and innovators in an informal setting',
      venue: 'TechHub Coworking Space',
      address: '456 Innovation Drive',
      start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
      category: 'meetup',
      capacity: 100,
      tickets_sold: 0,
      featured: false,
      status: 'published'
    }
  ];
}

/**
 * Generate page content using AI based on business context
 */
export async function generateIntelligentPageContent(businessContext, pageType = 'home', base44Client) {
  const { businessType, businessName, currency, style } = businessContext;
  
  // If no base44 client provided, return fallback content
  if (!base44Client || !base44Client.integrations?.Core?.InvokeLLM) {
    return {
      hero_headline: `Welcome to ${businessName}`,
      hero_subheadline: `Experience the best ${businessType} in town`,
      about_section: `${businessName} is your go-to destination for quality service and exceptional experience. We pride ourselves on delivering excellence in everything we do.`,
      unique_selling_points: [
        'High-quality products and services',
        'Friendly and professional staff',
        'Comfortable atmosphere'
      ],
      call_to_action: 'Visit Us Today',
      meta_description: `Visit ${businessName} - your premier ${businessType} destination`
    };
  }
  
  const prompt = `Generate professional ${pageType} page content for a ${businessType} business.

Business Name: ${businessName}
Style: ${style}
Currency: ${currency}

Requirements:
- DO NOT include the business creation prompt or instructions
- Write as if you are the business owner introducing your ${businessType}
- Include a compelling hero section headline
- Write an "About Us" section (2-3 paragraphs)
- Describe what makes this ${businessType} special
- Include a clear call-to-action
- Write in a ${style} tone
- Be professional and engaging
- DO NOT mention that this is AI-generated

Return JSON with:
{
  "hero_headline": "Main headline for the page",
  "hero_subheadline": "Supporting text",
  "about_section": "About us content (2-3 paragraphs)",
  "unique_selling_points": ["Point 1", "Point 2", "Point 3"],
  "call_to_action": "Clear CTA text",
  "meta_description": "SEO description"
}`;

  try {
    const result = await base44Client.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          hero_headline: { type: 'string' },
          hero_subheadline: { type: 'string' },
          about_section: { type: 'string' },
          unique_selling_points: { type: 'array', items: { type: 'string' } },
          call_to_action: { type: 'string' },
          meta_description: { type: 'string' }
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Failed to generate intelligent content:', error);
    
    // Fallback content
    return {
      hero_headline: `Welcome to ${businessName}`,
      hero_subheadline: `Experience the best ${businessType} in town`,
      about_section: `${businessName} is your go-to destination for quality service and exceptional experience. We pride ourselves on delivering excellence in everything we do.`,
      unique_selling_points: [
        'High-quality products and services',
        'Friendly and professional staff',
        'Comfortable atmosphere'
      ],
      call_to_action: 'Visit Us Today',
      meta_description: `Visit ${businessName} - your premier ${businessType} destination`
    };
  }
}

/**
 * Main function to generate all intelligent content
 */
export async function generateBusinessContent(userDescription, base44Client) {
  // Parse the business context
  const context = parseBusinessContext(userDescription);
  const lower = userDescription.toLowerCase();
  
  // Generate sample data based on business type and detected entities
  let sampleData = [];
  let entityMap = {};
  
  // Food & Beverage
  if (context.businessType === 'cafe') {
    sampleData = generateCafeMenuItems(context.businessName, context.currency);
    entityMap = { MenuItem: sampleData };
  } else if (context.businessType === 'restaurant') {
    sampleData = generateRestaurantMenuItems(context.businessName, 'international', context.currency);
    entityMap = { MenuItem: sampleData };
  }
  
  // Portfolio/Agency
  else if (context.businessType === 'agency' || lower.includes('portfolio') || lower.includes('showcase') || lower.includes('creative')) {
    const projects = generatePortfolioProjects(context.businessName);
    const services = generateServices(context.businessName, 'agency', context.currency);
    sampleData = [...projects, ...services];
    entityMap = { Project: projects, Service: services };
  }
  
  // E-commerce/Shop
  else if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce') || lower.includes('product')) {
    const products = generateEcommerceProducts(context.businessName, 'general', context.currency);
    sampleData = products;
    entityMap = { Product: products };
  }
  
  // Blog/Content
  else if (lower.includes('blog') || lower.includes('article') || lower.includes('news') || lower.includes('content')) {
    const articles = generateBlogArticles(context.businessName);
    sampleData = articles;
    entityMap = { Article: articles };
  }
  
  // SaaS/Subscription
  else if (lower.includes('saas') || lower.includes('subscription') || lower.includes('pricing') || lower.includes('plan')) {
    const plans = generateSaaSPlans(context.businessName, context.currency);
    sampleData = plans;
    entityMap = { Plan: plans };
  }
  
  // Events
  else if (lower.includes('event') || lower.includes('conference') || lower.includes('meetup') || lower.includes('ticket')) {
    const events = generateEvents(context.businessName);
    sampleData = events;
    entityMap = { Event: events };
  }
  
  // Services (Salon, Gym, etc.)
  else if (context.businessType === 'salon' || context.businessType === 'gym') {
    const services = generateServices(context.businessName, context.businessType, context.currency);
    sampleData = services;
    entityMap = { Service: services };
  }
  
  // Generate page content
  const pageContent = await generateIntelligentPageContent(context, 'home', base44Client);
  
  return {
    context,
    sampleData,
    entityMap,  // Organized by entity type
    pageContent
  };
}
