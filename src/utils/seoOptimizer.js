/**
 * SEO Optimizer - Auto-generate SEO metadata and structured data
 * Enhances website discoverability and search engine rankings
 */

/**
 * Generate comprehensive SEO metadata for a page
 */
export function generateSEOMeta(pageData, projectData, domainContext) {
  const businessName = projectData.name;
  const description = pageData.description || projectData.description;
  const pageTitle = pageData.name || pageData.title;
  const domain = domainContext?.domainName || 'Website';
  
  // Generate optimized title (50-60 characters ideal)
  const title = generateOptimizedTitle(pageTitle, businessName, domain);
  
  // Generate meta description (150-160 characters ideal)
  const metaDescription = generateMetaDescription(description, businessName, domain);
  
  // Generate keywords
  const keywords = generateKeywords(pageData, projectData, domainContext);
  
  // Generate Open Graph tags
  const openGraph = generateOpenGraphTags(pageData, projectData);
  
  // Generate Twitter Card tags
  const twitterCard = generateTwitterCardTags(pageData, projectData);
  
  // Generate canonical URL
  const canonical = generateCanonicalURL(pageData, projectData);
  
  // Generate structured data (Schema.org)
  const structuredData = generateStructuredData(pageData, projectData, domainContext);
  
  return {
    title,
    metaDescription,
    keywords,
    openGraph,
    twitterCard,
    canonical,
    structuredData,
    meta: {
      robots: 'index, follow',
      author: businessName,
      viewport: 'width=device-width, initial-scale=1.0',
      charset: 'UTF-8'
    }
  };
}

/**
 * Generate SEO-optimized page title
 */
function generateOptimizedTitle(pageTitle, businessName, domain) {
  const maxLength = 60;
  
  // Pattern: Page Title | Business Name - Domain
  let title = `${pageTitle} | ${businessName}`;
  
  if (title.length < maxLength - 15 && domain !== 'Website') {
    title += ` - ${domain}`;
  }
  
  // Truncate if too long
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }
  
  return title;
}

/**
 * Generate compelling meta description
 */
function generateMetaDescription(description, businessName, domain) {
  const maxLength = 160;
  
  if (description.length <= maxLength) {
    return description;
  }
  
  // Truncate at sentence boundary if possible
  const sentences = description.split('. ');
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence).length > maxLength - 3) {
      break;
    }
    result += sentence + '. ';
  }
  
  return result.trim() || description.substring(0, maxLength - 3) + '...';
}

/**
 * Generate relevant keywords based on content
 */
function generateKeywords(pageData, projectData, domainContext) {
  const keywords = new Set();
  
  // Add business name
  keywords.add(projectData.name.toLowerCase());
  
  // Add domain keywords
  if (domainContext?.matchedKeywords) {
    domainContext.matchedKeywords.forEach(k => keywords.add(k));
  }
  
  // Extract keywords from description
  const words = (pageData.description || projectData.description || '').toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !isCommonWord(word));
  
  words.slice(0, 10).forEach(word => keywords.add(word));
  
  // Add domain-specific keywords
  const domainKeywords = getDomainSpecificKeywords(domainContext?.domain);
  domainKeywords.forEach(k => keywords.add(k));
  
  return Array.from(keywords).slice(0, 15).join(', ');
}

/**
 * Check if word is a common stop word
 */
function isCommonWord(word) {
  const stopWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will', 'your', 'our', 'their'];
  return stopWords.includes(word);
}

/**
 * Get domain-specific SEO keywords
 */
function getDomainSpecificKeywords(domain) {
  const domainKeywords = {
    cafe: ['coffee', 'cafe', 'espresso', 'menu', 'coffee shop', 'barista'],
    restaurant: ['restaurant', 'dining', 'menu', 'food', 'reservations'],
    ecommerce: ['shop', 'buy', 'online store', 'products', 'shopping'],
    blog: ['blog', 'articles', 'posts', 'news', 'read'],
    portfolio: ['portfolio', 'work', 'projects', 'design', 'creative'],
    saas: ['software', 'app', 'platform', 'tool', 'solution'],
    gym: ['fitness', 'gym', 'workout', 'training', 'exercise'],
    hotel: ['hotel', 'accommodation', 'booking', 'rooms', 'stay'],
    realestate: ['real estate', 'property', 'homes', 'listings', 'buy'],
    education: ['courses', 'learning', 'education', 'training', 'online'],
    medical: ['healthcare', 'medical', 'doctor', 'clinic', 'health']
  };
  
  return domainKeywords[domain] || [];
}

/**
 * Generate Open Graph metadata for social sharing
 */
function generateOpenGraphTags(pageData, projectData) {
  return {
    'og:type': 'website',
    'og:title': pageData.name || projectData.name,
    'og:description': pageData.description || projectData.description,
    'og:image': pageData.image || projectData.icon || '/og-image.jpg',
    'og:url': pageData.url || '/',
    'og:site_name': projectData.name,
    'og:locale': 'en_US'
  };
}

/**
 * Generate Twitter Card metadata
 */
function generateTwitterCardTags(pageData, projectData) {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': pageData.name || projectData.name,
    'twitter:description': pageData.description || projectData.description,
    'twitter:image': pageData.image || projectData.icon || '/twitter-image.jpg'
  };
}

/**
 * Generate canonical URL
 */
function generateCanonicalURL(pageData, projectData) {
  const baseURL = projectData.domain || 'https://example.com';
  const path = pageData.path || '/';
  return `${baseURL}${path}`;
}

/**
 * Generate structured data (Schema.org JSON-LD)
 */
function generateStructuredData(pageData, projectData, domainContext) {
  const domain = domainContext?.domain;
  
  // Base organization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': getSchemaType(domain),
    'name': projectData.name,
    'description': projectData.description,
    'url': projectData.domain || 'https://example.com'
  };
  
  // Add domain-specific schemas
  switch (domain) {
    case 'cafe':
    case 'restaurant':
      return generateRestaurantSchema(projectData, pageData);
    
    case 'ecommerce':
      return generateStoreSchema(projectData, pageData);
    
    case 'hotel':
      return generateHotelSchema(projectData, pageData);
    
    case 'realestate':
      return generateRealEstateSchema(projectData, pageData);
    
    case 'education':
      return generateEducationSchema(projectData, pageData);
    
    case 'medical':
      return generateMedicalSchema(projectData, pageData);
    
    default:
      return organizationSchema;
  }
}

/**
 * Get Schema.org type based on domain
 */
function getSchemaType(domain) {
  const typeMap = {
    cafe: 'CafeOrCoffeeShop',
    restaurant: 'Restaurant',
    ecommerce: 'Store',
    blog: 'Blog',
    portfolio: 'ProfessionalService',
    saas: 'SoftwareApplication',
    gym: 'HealthAndBeautyBusiness',
    hotel: 'Hotel',
    realestate: 'RealEstateAgent',
    education: 'EducationalOrganization',
    medical: 'MedicalClinic'
  };
  
  return typeMap[domain] || 'Organization';
}

/**
 * Generate Restaurant schema
 */
function generateRestaurantSchema(projectData, pageData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    'name': projectData.name,
    'description': projectData.description,
    'image': projectData.icon,
    'servesCuisine': 'Various',
    'priceRange': '$$',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'To be updated',
      'addressLocality': 'City',
      'addressRegion': 'State',
      'postalCode': '00000'
    },
    'telephone': '+1-xxx-xxx-xxxx',
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'opens': '09:00',
        'closes': '22:00'
      }
    ],
    'acceptsReservations': 'True'
  };
}

/**
 * Generate Store schema
 */
function generateStoreSchema(projectData, pageData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    'name': projectData.name,
    'description': projectData.description,
    'image': projectData.icon,
    'url': projectData.domain,
    'priceRange': '$$',
    'paymentAccepted': 'Credit Card, PayPal',
    'openingHours': 'Mo-Su 00:00-24:00'
  };
}

/**
 * Generate Hotel schema
 */
function generateHotelSchema(projectData, pageData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    'name': projectData.name,
    'description': projectData.description,
    'image': projectData.icon,
    'starRating': {
      '@type': 'Rating',
      'ratingValue': '4'
    },
    'priceRange': '$$$',
    'amenityFeature': [
      { '@type': 'LocationFeatureSpecification', 'name': 'Free WiFi' },
      { '@type': 'LocationFeatureSpecification', 'name': 'Parking' },
      { '@type': 'LocationFeatureSpecification', 'name': 'Pool' }
    ]
  };
}

/**
 * Generate Real Estate schema
 */
function generateRealEstateSchema(projectData, pageData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    'name': projectData.name,
    'description': projectData.description,
    'image': projectData.icon,
    'url': projectData.domain,
    'areaServed': {
      '@type': 'City',
      'name': 'Multiple Areas'
    }
  };
}

/**
 * Generate Education schema
 */
function generateEducationSchema(projectData, pageData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    'name': projectData.name,
    'description': projectData.description,
    'url': projectData.domain,
    'educationalLevel': 'Various'
  };
}

/**
 * Generate Medical schema
 */
function generateMedicalSchema(projectData, pageData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    'name': projectData.name,
    'description': projectData.description,
    'image': projectData.icon,
    'medicalSpecialty': 'General Practice'
  };
}

/**
 * Generate sitemap entries
 */
export function generateSitemap(pages, projectData) {
  const baseURL = projectData.domain || 'https://example.com';
  const sitemap = {
    urlset: {
      '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
      url: pages.map(page => ({
        loc: `${baseURL}${page.path || '/'}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: getChangeFrequency(page.path),
        priority: getPriority(page.path)
      }))
    }
  };
  
  return sitemap;
}

/**
 * Get change frequency based on page type
 */
function getChangeFrequency(path) {
  if (path === '/') return 'daily';
  if (path.includes('/blog')) return 'daily';
  if (path.includes('/products')) return 'weekly';
  return 'monthly';
}

/**
 * Get priority based on page importance
 */
function getPriority(path) {
  if (path === '/') return '1.0';
  if (path.includes('/about') || path.includes('/contact')) return '0.8';
  if (path.includes('/blog')) return '0.7';
  return '0.6';
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(projectData) {
  const baseURL = projectData.domain || 'https://example.com';
  
  return `# Robots.txt for ${projectData.name}
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /private

Sitemap: ${baseURL}/sitemap.xml
`;
}

/**
 * Analyze SEO score for a page
 */
export function analyzeSEOScore(pageData, projectData) {
  let score = 0;
  const issues = [];
  const recommendations = [];
  
  // Title check (10 points)
  if (pageData.name && pageData.name.length >= 30 && pageData.name.length <= 60) {
    score += 10;
  } else {
    issues.push('Title should be 30-60 characters');
    recommendations.push('Optimize page title length for better SEO');
  }
  
  // Description check (15 points)
  if (pageData.description && pageData.description.length >= 120 && pageData.description.length <= 160) {
    score += 15;
  } else {
    issues.push('Meta description should be 120-160 characters');
    recommendations.push('Write compelling meta description');
  }
  
  // Image alt tags (10 points)
  if (pageData.image) {
    score += 10;
  } else {
    issues.push('Missing featured image');
    recommendations.push('Add high-quality images with alt text');
  }
  
  // Content length (15 points)
  const contentLength = (pageData.content || '').length;
  if (contentLength > 500) {
    score += 15;
  } else {
    issues.push('Content too short (< 500 chars)');
    recommendations.push('Add more detailed content (aim for 1000+ words)');
  }
  
  // Mobile-friendly (10 points)
  score += 10; // Assume mobile-friendly by default
  
  // HTTPS (10 points)
  if (projectData.domain && projectData.domain.startsWith('https')) {
    score += 10;
  } else {
    recommendations.push('Use HTTPS for security and SEO');
  }
  
  // Structured data (15 points)
  score += 15; // We auto-generate this
  
  // Performance (15 points)
  score += 15; // Assume good performance
  
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  
  return {
    score,
    grade,
    issues,
    recommendations,
    breakdown: {
      title: pageData.name ? 10 : 0,
      description: pageData.description ? 15 : 0,
      images: pageData.image ? 10 : 0,
      content: contentLength > 500 ? 15 : 0,
      mobile: 10,
      https: projectData.domain?.startsWith('https') ? 10 : 0,
      structured: 15,
      performance: 15
    }
  };
}
