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
  },

  gym: {
    name: 'Gym/Fitness Center',
    keywords: ['gym', 'fitness', 'fitness center', 'health club', 'workout', 'training', 'crossfit', 'yoga studio'],
    features: [
      { name: 'class_schedule', description: 'Display fitness class timetable', priority: 'high' },
      { name: 'membership_plans', description: 'Show membership tiers and pricing', priority: 'high' },
      { name: 'trainer_profiles', description: 'Showcase personal trainers and instructors', priority: 'high' },
      { name: 'online_booking', description: 'Book classes and personal training sessions', priority: 'high' },
      { name: 'workout_programs', description: 'Display training programs and plans', priority: 'medium' },
      { name: 'nutrition_plans', description: 'Meal plans and nutrition guidance', priority: 'medium' },
      { name: 'progress_tracking', description: 'Track member fitness progress', priority: 'medium' },
      { name: 'equipment_showcase', description: 'Display gym facilities and equipment', priority: 'medium' },
      { name: 'success_stories', description: 'Member testimonials and transformations', priority: 'low' },
      { name: 'free_trial', description: 'Sign up for free trial sessions', priority: 'high' }
    ],
    pages: [
      { name: 'home', purpose: 'Hero with gym photos and call-to-action' },
      { name: 'classes', purpose: 'Class schedule and descriptions' },
      { name: 'trainers', purpose: 'Personal trainer profiles' },
      { name: 'membership', purpose: 'Membership plans and pricing' },
      { name: 'facilities', purpose: 'Gym equipment and amenities' },
      { name: 'contact', purpose: 'Location, hours, contact form' }
    ],
    entities: [
      { name: 'Class', fields: ['name', 'description', 'instructor', 'duration', 'difficulty', 'schedule', 'capacity', 'image'] },
      { name: 'Trainer', fields: ['name', 'bio', 'specialties', 'certifications', 'experience', 'photo', 'availability'] },
      { name: 'Membership', fields: ['planName', 'price', 'duration', 'benefits', 'classAccess', 'ptSessions'] },
      { name: 'Booking', fields: ['memberId', 'classId', 'date', 'time', 'status', 'checkedIn'] }
    ],
    colors: {
      primary: '#FF6B35', // Energetic orange
      secondary: '#004E89', // Strong blue
      accent: '#F7B801', // Motivating gold
      background: '#1A1A1D' // Dark/modern
    }
  },

  hotel: {
    name: 'Hotel/Travel',
    keywords: ['hotel', 'resort', 'accommodation', 'travel', 'booking', 'vacation', 'hospitality', 'inn', 'motel'],
    features: [
      { name: 'room_listings', description: 'Display available rooms and suites', priority: 'high' },
      { name: 'booking_system', description: 'Online reservation and availability calendar', priority: 'high' },
      { name: 'amenities_showcase', description: 'Hotel facilities and services', priority: 'high' },
      { name: 'photo_gallery', description: 'High-quality room and property photos', priority: 'high' },
      { name: 'pricing_calculator', description: 'Dynamic pricing based on dates and occupancy', priority: 'high' },
      { name: 'special_offers', description: 'Promotions and package deals', priority: 'medium' },
      { name: 'guest_reviews', description: 'Customer ratings and testimonials', priority: 'medium' },
      { name: 'local_attractions', description: 'Nearby points of interest', priority: 'medium' },
      { name: 'concierge_services', description: 'Additional services and requests', priority: 'low' }
    ],
    pages: [
      { name: 'home', purpose: 'Stunning hero with booking widget' },
      { name: 'rooms', purpose: 'Room types, photos, and pricing' },
      { name: 'amenities', purpose: 'Facilities, dining, spa, pool' },
      { name: 'location', purpose: 'Map, directions, local attractions' },
      { name: 'booking', purpose: 'Reservation interface' },
      { name: 'contact', purpose: 'Contact and customer service' }
    ],
    entities: [
      { name: 'Room', fields: ['type', 'description', 'beds', 'capacity', 'amenities', 'pricePerNight', 'images', 'availability'] },
      { name: 'Reservation', fields: ['guestName', 'email', 'phone', 'checkIn', 'checkOut', 'roomId', 'guests', 'totalPrice', 'status'] },
      { name: 'Guest', fields: ['name', 'email', 'phone', 'address', 'loyaltyPoints', 'bookingHistory'] },
      { name: 'Review', fields: ['guestId', 'rating', 'comment', 'date', 'verified', 'response'] }
    ],
    colors: {
      primary: '#2C3E50', // Elegant navy
      secondary: '#C79A6C', // Luxury gold
      accent: '#E8F4F8', // Serene blue
      background: '#FFFFFF' // Clean white
    }
  },

  realestate: {
    name: 'Real Estate',
    keywords: ['real estate', 'property', 'realtor', 'housing', 'apartment', 'home sale', 'rental', 'listing'],
    features: [
      { name: 'property_listings', description: 'Searchable property database', priority: 'high' },
      { name: 'advanced_search', description: 'Filter by price, location, beds, type', priority: 'high' },
      { name: 'virtual_tours', description: '360° property tours and videos', priority: 'high' },
      { name: 'map_integration', description: 'Interactive property map', priority: 'high' },
      { name: 'agent_profiles', description: 'Real estate agent bios and contacts', priority: 'high' },
      { name: 'mortgage_calculator', description: 'Calculate monthly payments', priority: 'medium' },
      { name: 'saved_favorites', description: 'Save and compare properties', priority: 'medium' },
      { name: 'scheduling_tours', description: 'Book property viewings', priority: 'medium' },
      { name: 'market_insights', description: 'Local market trends and data', priority: 'low' }
    ],
    pages: [
      { name: 'home', purpose: 'Search bar and featured listings' },
      { name: 'listings', purpose: 'Property search with filters' },
      { name: 'property', purpose: 'Individual property details' },
      { name: 'agents', purpose: 'Real estate agent directory' },
      { name: 'neighborhoods', purpose: 'Area guides and insights' },
      { name: 'contact', purpose: 'Inquiry and contact form' }
    ],
    entities: [
      { name: 'Property', fields: ['title', 'address', 'price', 'beds', 'baths', 'sqft', 'type', 'status', 'description', 'photos', 'agentId', 'features'] },
      { name: 'Agent', fields: ['name', 'bio', 'phone', 'email', 'photo', 'specialties', 'listings', 'soldCount', 'rating'] },
      { name: 'Inquiry', fields: ['propertyId', 'name', 'email', 'phone', 'message', 'tourDate', 'status'] },
      { name: 'Favorite', fields: ['userId', 'propertyId', 'savedDate', 'notes'] }
    ],
    colors: {
      primary: '#1E3A8A', // Professional blue
      secondary: '#059669', // Trust green
      accent: '#DC2626', // Attention red
      background: '#F9FAFB' // Light gray
    }
  },

  education: {
    name: 'Education/Online Courses',
    keywords: ['course', 'education', 'learning', 'training', 'school', 'academy', 'tutorial', 'elearning', 'lms'],
    features: [
      { name: 'course_catalog', description: 'Browse available courses', priority: 'high' },
      { name: 'enrollment_system', description: 'Sign up and enroll in courses', priority: 'high' },
      { name: 'video_lessons', description: 'Video content delivery', priority: 'high' },
      { name: 'progress_tracking', description: 'Track student progress and completion', priority: 'high' },
      { name: 'quizzes_assignments', description: 'Assessments and homework', priority: 'high' },
      { name: 'certificates', description: 'Issue completion certificates', priority: 'medium' },
      { name: 'discussion_forums', description: 'Student community and Q&A', priority: 'medium' },
      { name: 'instructor_profiles', description: 'Teacher bios and credentials', priority: 'medium' },
      { name: 'live_sessions', description: 'Live webinars and classes', priority: 'medium' },
      { name: 'resource_library', description: 'Downloadable materials', priority: 'low' }
    ],
    pages: [
      { name: 'home', purpose: 'Course highlights and featured instructors' },
      { name: 'courses', purpose: 'Course catalog with search' },
      { name: 'course_detail', purpose: 'Individual course page with curriculum' },
      { name: 'instructors', purpose: 'Instructor profiles' },
      { name: 'dashboard', purpose: 'Student learning dashboard' },
      { name: 'about', purpose: 'About the platform' }
    ],
    entities: [
      { name: 'Course', fields: ['title', 'description', 'instructorId', 'category', 'level', 'duration', 'price', 'curriculum', 'thumbnail', 'enrollCount'] },
      { name: 'Lesson', fields: ['courseId', 'title', 'content', 'videoUrl', 'duration', 'order', 'isFree'] },
      { name: 'Enrollment', fields: ['studentId', 'courseId', 'enrollDate', 'progress', 'completionDate', 'certificateIssued'] },
      { name: 'Instructor', fields: ['name', 'bio', 'expertise', 'photo', 'rating', 'studentCount', 'coursesCreated'] },
      { name: 'Quiz', fields: ['lessonId', 'questions', 'passingScore', 'timeLimit'] }
    ],
    colors: {
      primary: '#7C3AED', // Educational purple
      secondary: '#0891B2', // Learning cyan
      accent: '#F59E0B', // Achievement amber
      background: '#FEFEFE' // Clean white
    }
  },

  medical: {
    name: 'Medical/Healthcare',
    keywords: ['medical', 'clinic', 'doctor', 'healthcare', 'hospital', 'dental', 'pharmacy', 'health'],
    features: [
      { name: 'appointment_booking', description: 'Schedule medical appointments', priority: 'high' },
      { name: 'doctor_directory', description: 'Find doctors by specialty', priority: 'high' },
      { name: 'services_list', description: 'Medical services and procedures', priority: 'high' },
      { name: 'patient_portal', description: 'Access medical records and results', priority: 'high' },
      { name: 'insurance_info', description: 'Accepted insurance providers', priority: 'high' },
      { name: 'telemedicine', description: 'Virtual consultations', priority: 'medium' },
      { name: 'prescription_refills', description: 'Request medication refills', priority: 'medium' },
      { name: 'health_resources', description: 'Educational health content', priority: 'low' },
      { name: 'emergency_info', description: 'Emergency contact and hours', priority: 'high' }
    ],
    pages: [
      { name: 'home', purpose: 'Hero with appointment booking' },
      { name: 'doctors', purpose: 'Medical staff directory' },
      { name: 'services', purpose: 'Medical services offered' },
      { name: 'appointments', purpose: 'Book appointment interface' },
      { name: 'patient_portal', purpose: 'Secure patient login area' },
      { name: 'contact', purpose: 'Location, hours, emergency info' }
    ],
    entities: [
      { name: 'Doctor', fields: ['name', 'specialty', 'qualifications', 'bio', 'photo', 'availability', 'languages', 'rating'] },
      { name: 'Appointment', fields: ['patientId', 'doctorId', 'date', 'time', 'type', 'status', 'reason', 'notes'] },
      { name: 'Patient', fields: ['name', 'email', 'phone', 'dateOfBirth', 'address', 'insuranceProvider', 'medicalHistory'] },
      { name: 'Service', fields: ['name', 'description', 'category', 'duration', 'price', 'doctors'] }
    ],
    colors: {
      primary: '#0EA5E9', // Medical blue
      secondary: '#10B981', // Health green
      accent: '#EF4444', // Emergency red
      background: '#F8FAFC' // Clean clinical
    }
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
