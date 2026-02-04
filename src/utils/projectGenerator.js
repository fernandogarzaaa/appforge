/**
 * Full Project Generator
 * Generates complete projects from detailed descriptions including:
 * - Entity definitions (data models)
 * - Workflow configurations
 * - Initial UI pages
 */

import { generateEnhancedEntities } from './enhancedEntityGeneration';
import { extractDomainContext } from './domainContextExtractor';

/**
 * Project type templates with pre-configured structures
 */
export const PROJECT_TEMPLATES = {
  ecommerce: {
    name: 'E-Commerce Store',
    icon: '🛒',
    color: '#10B981',
    entities: ['Product', 'Category', 'Order', 'Customer', 'Review', 'Cart'],
    workflows: ['order_processing', 'inventory_management', 'customer_notifications'],
    pages: ['Home', 'Products', 'Product Detail', 'Cart', 'Checkout', 'Account', 'Orders'],
    features: ['payment', 'auth', 'search', 'analytics']
  },
  saas: {
    name: 'SaaS Application',
    icon: '💼',
    color: '#6366F1',
    entities: ['User', 'Subscription', 'Plan', 'Feature', 'Invoice', 'Team'],
    workflows: ['subscription_lifecycle', 'billing_automation', 'onboarding'],
    pages: ['Landing', 'Dashboard', 'Settings', 'Billing', 'Team', 'Analytics'],
    features: ['auth', 'payment', 'analytics', 'realtime']
  },
  marketplace: {
    name: 'Marketplace',
    icon: '🏪',
    color: '#F59E0B',
    entities: ['Listing', 'Seller', 'Buyer', 'Transaction', 'Review', 'Category', 'Message'],
    workflows: ['listing_approval', 'transaction_escrow', 'seller_payout', 'dispute_resolution'],
    pages: ['Home', 'Browse', 'Listing Detail', 'Seller Dashboard', 'Messages', 'Account'],
    features: ['auth', 'payment', 'search', 'realtime', 'social']
  },
  booking: {
    name: 'Booking Platform',
    icon: '📅',
    color: '#EC4899',
    entities: ['Service', 'Booking', 'TimeSlot', 'Customer', 'Provider', 'Review'],
    workflows: ['booking_confirmation', 'reminder_notifications', 'cancellation_handling'],
    pages: ['Home', 'Services', 'Book', 'My Bookings', 'Calendar', 'Account'],
    features: ['booking', 'auth', 'realtime', 'analytics']
  },
  crm: {
    name: 'CRM System',
    icon: '👥',
    color: '#8B5CF6',
    entities: ['Contact', 'Lead', 'Deal', 'Company', 'Task', 'Note', 'Activity'],
    workflows: ['lead_nurturing', 'deal_pipeline', 'task_reminders', 'email_sequences'],
    pages: ['Dashboard', 'Contacts', 'Leads', 'Deals', 'Companies', 'Tasks', 'Reports'],
    features: ['crm', 'auth', 'analytics', 'search']
  },
  blog: {
    name: 'Blog/Content Platform',
    icon: '📝',
    color: '#3B82F6',
    entities: ['Article', 'Category', 'Tag', 'Author', 'Comment', 'Subscriber'],
    workflows: ['content_publishing', 'comment_moderation', 'newsletter_automation'],
    pages: ['Home', 'Articles', 'Article Detail', 'Categories', 'Author', 'Subscribe'],
    features: ['auth', 'social', 'search', 'analytics']
  },
  portfolio: {
    name: 'Portfolio/Agency',
    icon: '🎨',
    color: '#14B8A6',
    entities: ['Project', 'Service', 'Testimonial', 'TeamMember', 'ContactInquiry'],
    workflows: ['inquiry_handling', 'project_showcase'],
    pages: ['Home', 'Portfolio', 'Services', 'About', 'Contact', 'Case Study'],
    features: ['portfolio', 'social']
  },
  social: {
    name: 'Social Network',
    icon: '💬',
    color: '#EF4444',
    entities: ['User', 'Post', 'Comment', 'Like', 'Follow', 'Message', 'Notification'],
    workflows: ['content_moderation', 'notification_delivery', 'feed_generation'],
    pages: ['Feed', 'Profile', 'Messages', 'Notifications', 'Search', 'Settings'],
    features: ['auth', 'social', 'realtime', 'search']
  },
  learning: {
    name: 'Learning Management System',
    icon: '🎓',
    color: '#84CC16',
    entities: ['Course', 'Lesson', 'Module', 'Student', 'Instructor', 'Progress', 'Quiz', 'Certificate'],
    workflows: ['enrollment', 'progress_tracking', 'certificate_generation', 'quiz_grading'],
    pages: ['Courses', 'Course Detail', 'Lesson', 'Dashboard', 'Certificates', 'Profile'],
    features: ['auth', 'payment', 'analytics']
  },
  realEstate: {
    name: 'Real Estate Platform',
    icon: '🏠',
    color: '#0EA5E9',
    entities: ['Property', 'Agent', 'Inquiry', 'Viewing', 'Favorite', 'Review'],
    workflows: ['inquiry_handling', 'viewing_scheduling', 'property_alerts'],
    pages: ['Home', 'Properties', 'Property Detail', 'Agents', 'Favorites', 'Contact'],
    features: ['auth', 'search', 'booking', 'analytics']
  }
};

/**
 * Workflow templates for different business processes
 */
export const WORKFLOW_TEMPLATES = {
  order_processing: {
    name: 'Order Processing',
    description: 'Handles order lifecycle from placement to delivery',
    trigger: 'order.created',
    steps: [
      { action: 'validate_inventory', description: 'Check product availability' },
      { action: 'process_payment', description: 'Charge customer payment method' },
      { action: 'update_inventory', description: 'Reduce stock levels' },
      { action: 'notify_customer', description: 'Send order confirmation email' },
      { action: 'notify_fulfillment', description: 'Alert warehouse for shipping' }
    ]
  },
  subscription_lifecycle: {
    name: 'Subscription Lifecycle',
    description: 'Manages subscription renewals and cancellations',
    trigger: 'subscription.period_end',
    steps: [
      { action: 'check_payment_method', description: 'Verify payment method is valid' },
      { action: 'process_renewal', description: 'Charge for next period' },
      { action: 'update_subscription', description: 'Extend subscription period' },
      { action: 'send_receipt', description: 'Email receipt to customer' }
    ]
  },
  booking_confirmation: {
    name: 'Booking Confirmation',
    description: 'Handles new booking requests',
    trigger: 'booking.created',
    steps: [
      { action: 'check_availability', description: 'Verify time slot is free' },
      { action: 'confirm_booking', description: 'Mark booking as confirmed' },
      { action: 'send_confirmation', description: 'Email confirmation to customer' },
      { action: 'add_to_calendar', description: 'Create calendar event' },
      { action: 'schedule_reminder', description: 'Queue reminder notification' }
    ]
  },
  lead_nurturing: {
    name: 'Lead Nurturing',
    description: 'Automated follow-up sequence for new leads',
    trigger: 'lead.created',
    steps: [
      { action: 'assign_to_rep', description: 'Auto-assign to sales rep' },
      { action: 'send_welcome_email', description: 'Send initial contact email' },
      { action: 'create_follow_up_task', description: 'Schedule follow-up call' },
      { action: 'add_to_sequence', description: 'Enroll in email sequence' }
    ]
  },
  content_publishing: {
    name: 'Content Publishing',
    description: 'Workflow for publishing and promoting content',
    trigger: 'article.published',
    steps: [
      { action: 'update_sitemap', description: 'Regenerate XML sitemap' },
      { action: 'notify_subscribers', description: 'Send to newsletter subscribers' },
      { action: 'post_to_social', description: 'Share on social media' },
      { action: 'submit_to_search', description: 'Ping search engines' }
    ]
  },
  inquiry_handling: {
    name: 'Inquiry Handling',
    description: 'Process incoming contact inquiries',
    trigger: 'inquiry.created',
    steps: [
      { action: 'send_auto_reply', description: 'Send acknowledgment email' },
      { action: 'create_ticket', description: 'Create support ticket' },
      { action: 'assign_to_team', description: 'Route to appropriate team' },
      { action: 'set_sla_timer', description: 'Start response time tracking' }
    ]
  },
  user_onboarding: {
    name: 'User Onboarding',
    description: 'Welcome and guide new users',
    trigger: 'user.registered',
    steps: [
      { action: 'send_welcome_email', description: 'Send welcome email' },
      { action: 'create_sample_data', description: 'Generate sample project' },
      { action: 'schedule_tips', description: 'Queue onboarding tips' },
      { action: 'track_activation', description: 'Monitor for activation' }
    ]
  }
};

/**
 * Page templates for different page types
 */
export const PAGE_TEMPLATES = {
  landing: {
    name: 'Landing Page',
    sections: ['hero', 'features', 'testimonials', 'pricing', 'cta', 'footer'],
    layout: 'full-width'
  },
  dashboard: {
    name: 'Dashboard',
    sections: ['stats', 'charts', 'recent_activity', 'quick_actions'],
    layout: 'sidebar'
  },
  listing: {
    name: 'Listing Page',
    sections: ['filters', 'search', 'grid', 'pagination'],
    layout: 'sidebar'
  },
  detail: {
    name: 'Detail Page',
    sections: ['hero', 'content', 'sidebar', 'related'],
    layout: 'content-sidebar'
  },
  form: {
    name: 'Form Page',
    sections: ['header', 'form', 'actions'],
    layout: 'centered'
  },
  profile: {
    name: 'Profile Page',
    sections: ['header', 'tabs', 'content', 'activity'],
    layout: 'full-width'
  }
};

/**
 * Analyze a project description and extract key information
 */
export function analyzeProjectDescription(description) {
  const lower = description.toLowerCase();
  
  // Extract domain context
  const domainContext = extractDomainContext(description);
  
  // Detect project type
  let detectedType = null;
  let typeConfidence = 0;
  
  const typeKeywords = {
    ecommerce: ['shop', 'store', 'product', 'cart', 'checkout', 'ecommerce', 'e-commerce', 'sell', 'buy', 'inventory'],
    saas: ['saas', 'subscription', 'plan', 'tier', 'software as a service', 'cloud', 'monthly', 'yearly'],
    marketplace: ['marketplace', 'vendor', 'seller', 'buyer', 'listing', 'commission', 'multi-vendor'],
    booking: ['booking', 'appointment', 'schedule', 'reservation', 'calendar', 'availability', 'slot'],
    crm: ['crm', 'customer relationship', 'lead', 'pipeline', 'deal', 'contact management', 'sales'],
    blog: ['blog', 'article', 'post', 'content', 'publish', 'author', 'newsletter'],
    portfolio: ['portfolio', 'agency', 'showcase', 'work', 'case study', 'freelance', 'creative'],
    social: ['social', 'network', 'feed', 'follow', 'post', 'share', 'community'],
    learning: ['course', 'lesson', 'learning', 'lms', 'education', 'training', 'quiz', 'certificate'],
    realEstate: ['property', 'real estate', 'listing', 'agent', 'house', 'apartment', 'rent', 'buy']
  };
  
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    const matches = keywords.filter(kw => lower.includes(kw)).length;
    const confidence = matches / keywords.length;
    if (confidence > typeConfidence) {
      typeConfidence = confidence;
      detectedType = type;
    }
  }
  
  // Extract entities from description using NLP-like patterns
  const extractedEntities = extractEntitiesFromDescription(description);
  
  // Extract features
  const features = detectFeatures(description);
  
  // Skip quantum optimization - just use features directly
  const optimizedFeatures = features;
  
  return {
    description,
    detectedType,
    typeConfidence,
    domainContext,
    extractedEntities,
    features: optimizedFeatures,
    suggestedTemplate: detectedType ? PROJECT_TEMPLATES[detectedType] : null
  };
}

/**
 * Extract potential entities from a description
 */
function extractEntitiesFromDescription(description) {
  const entities = [];
  const lower = description.toLowerCase();
  
  // Common entity patterns
  const entityPatterns = [
    { pattern: /\b(user|users|account|accounts|member|members)\b/i, entity: 'User' },
    { pattern: /\b(product|products|item|items|goods)\b/i, entity: 'Product' },
    { pattern: /\b(order|orders|purchase|purchases)\b/i, entity: 'Order' },
    { pattern: /\b(category|categories)\b/i, entity: 'Category' },
    { pattern: /\b(review|reviews|rating|ratings)\b/i, entity: 'Review' },
    { pattern: /\b(booking|bookings|appointment|appointments|reservation|reservations)\b/i, entity: 'Booking' },
    { pattern: /\b(service|services)\b/i, entity: 'Service' },
    { pattern: /\b(article|articles|post|posts|blog)\b/i, entity: 'Article' },
    { pattern: /\b(course|courses|lesson|lessons)\b/i, entity: 'Course' },
    { pattern: /\b(project|projects|portfolio)\b/i, entity: 'Project' },
    { pattern: /\b(contact|contacts|lead|leads)\b/i, entity: 'Contact' },
    { pattern: /\b(message|messages|chat)\b/i, entity: 'Message' },
    { pattern: /\b(payment|payments|transaction|transactions)\b/i, entity: 'Payment' },
    { pattern: /\b(subscription|subscriptions|plan|plans)\b/i, entity: 'Subscription' },
    { pattern: /\b(event|events)\b/i, entity: 'Event' },
    { pattern: /\b(ticket|tickets)\b/i, entity: 'Ticket' },
    { pattern: /\b(property|properties|listing|listings)\b/i, entity: 'Property' },
    { pattern: /\b(vendor|vendors|seller|sellers)\b/i, entity: 'Vendor' },
    { pattern: /\b(customer|customers|client|clients)\b/i, entity: 'Customer' },
    { pattern: /\b(task|tasks|todo|todos)\b/i, entity: 'Task' },
    { pattern: /\b(notification|notifications|alert|alerts)\b/i, entity: 'Notification' },
    { pattern: /\b(comment|comments)\b/i, entity: 'Comment' },
    { pattern: /\b(team|teams|organization|organizations)\b/i, entity: 'Team' },
    { pattern: /\b(invoice|invoices|bill|bills)\b/i, entity: 'Invoice' },
    { pattern: /\b(inventory|stock)\b/i, entity: 'Inventory' }
  ];
  
  for (const { pattern, entity } of entityPatterns) {
    if (pattern.test(description)) {
      entities.push(entity);
    }
  }
  
  return [...new Set(entities)]; // Remove duplicates
}

/**
 * Detect features based on description
 */
function detectFeatures(description) {
  const lower = description.toLowerCase();
  
  return {
    auth: lower.includes('auth') || lower.includes('login') || lower.includes('user') || lower.includes('account') || lower.includes('register'),
    payment: lower.includes('payment') || lower.includes('checkout') || lower.includes('subscription') || lower.includes('buy') || lower.includes('sell') || lower.includes('stripe') || lower.includes('paypal'),
    search: lower.includes('search') || lower.includes('filter') || lower.includes('find') || lower.includes('browse'),
    analytics: lower.includes('analytics') || lower.includes('tracking') || lower.includes('dashboard') || lower.includes('stats') || lower.includes('report'),
    realtime: lower.includes('realtime') || lower.includes('live') || lower.includes('chat') || lower.includes('notification') || lower.includes('instant'),
    booking: lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('reservation') || lower.includes('calendar'),
    social: lower.includes('social') || lower.includes('follow') || lower.includes('like') || lower.includes('share') || lower.includes('community') || lower.includes('comment'),
    email: lower.includes('email') || lower.includes('newsletter') || lower.includes('notification') || lower.includes('subscribe'),
    fileUpload: lower.includes('upload') || lower.includes('image') || lower.includes('file') || lower.includes('document') || lower.includes('media'),
    api: lower.includes('api') || lower.includes('integration') || lower.includes('webhook') || lower.includes('third-party'),
    mobile: lower.includes('mobile') || lower.includes('app') || lower.includes('responsive'),
    multilingual: lower.includes('multi-language') || lower.includes('translation') || lower.includes('i18n') || lower.includes('international')
  };
}

/**
 * Generate a complete project structure from a description
 * @param {string} description - Project description
 * @param {object} base44Client - Base44 client instance
 * @param {function} [progressCallback] - Optional callback for progress updates
 */
export async function generateFullProject(description, base44Client, progressCallback) {
  // Helper to safely call progress callback
  const updateProgress = (data) => {
    if (typeof progressCallback === 'function') {
      progressCallback(data);
    }
  };
  
  const analysis = analyzeProjectDescription(description);
  
  updateProgress({ phase: 'analysis', message: 'Analyzing project requirements...', progress: 5 });
  
  // Step 1: Determine project structure
  const projectName = extractProjectName(description);
  const template = analysis.suggestedTemplate || PROJECT_TEMPLATES.saas;
  
  updateProgress({ phase: 'planning', message: `Detected project type: ${template.name}`, progress: 10 });
  
  // Step 2: Generate entities
  updateProgress({ phase: 'entities', message: 'Generating data models...', progress: 15 });
  
  const entities = await generateProjectEntities(description, analysis, base44Client);
  
  updateProgress({ phase: 'entities', message: `Created ${entities.length} entities`, progress: 35 });
  
  // Step 3: Generate workflows
  updateProgress({ phase: 'workflows', message: 'Setting up workflows...', progress: 40 });
  
  const workflows = generateProjectWorkflows(description, analysis);
  
  updateProgress({ phase: 'workflows', message: `Created ${workflows.length} workflows`, progress: 55 });
  
  // Step 4: Generate pages
  updateProgress({ phase: 'pages', message: 'Creating UI pages...', progress: 60 });
  
  const pages = await generateProjectPages(description, analysis, entities, base44Client);
  
  updateProgress({ phase: 'pages', message: `Created ${pages.length} pages`, progress: 80 });
  
  // Step 5: Create project in Base44
  updateProgress({ phase: 'creation', message: 'Creating project...', progress: 85 });
  
  const project = await base44Client.entities.Project.create({
    name: projectName,
    description: description,
    icon: template.icon,
    color: template.color,
    status: 'active',
    metadata: {
      ai_generated: true,
      project_type: analysis.detectedType,
      type_confidence: analysis.typeConfidence,
      domain_context: analysis.domainContext?.domain,
      features: analysis.features,
      entities: entities.map(e => e.name),
      workflows: workflows.map(w => w.name),
      pages: pages.map(p => p.name),
      creation_timestamp: new Date().toISOString()
    }
  });
  
  // Step 6: Create entities in database
  updateProgress({ phase: 'saving', message: 'Saving entities to database...', progress: 90 });
  
  const createdEntities = [];
  for (const entityData of entities) {
    try {
      const entity = await base44Client.entities.Entity.create({
        project_id: project.id,
        name: entityData.name,
        schema: entityData.schema || {},
        metadata: {
          indexes: entityData.indexes || [],
          relationships: entityData.relationships || [],
          api_endpoints: entityData.api_endpoints || {}
        }
      });
      createdEntities.push(entity);
    } catch (err) {
      console.error(`Failed to create entity ${entityData.name}:`, err);
    }
  }
  
  // Step 7: Create pages in database
  updateProgress({ phase: 'saving', message: 'Saving pages to database...', progress: 95 });
  
  const createdPages = [];
  for (const pageData of pages) {
    try {
      const page = await base44Client.entities.Page.create({
        project_id: project.id,
        name: pageData.name,
        path: pageData.path,
        content: pageData.content,
        metadata: pageData.metadata
      });
      createdPages.push(page);
    } catch (err) {
      console.error(`Failed to create page ${pageData.name}:`, err);
    }
  }
  
  // Step 8: Save workflows
  for (const workflowData of workflows) {
    try {
      await base44Client.entities.Workflow.create({
        project_id: project.id,
        name: workflowData.name,
        description: workflowData.description,
        trigger: workflowData.trigger,
        steps: workflowData.steps,
        active: true,
        metadata: {
          ai_generated: true,
          template: workflowData.template
        }
      });
    } catch (err) {
      console.error(`Failed to create workflow ${workflowData.name}:`, err);
    }
  }
  
  updateProgress({ phase: 'complete', message: 'Project created successfully!', progress: 100 });
  
  return {
    project,
    entities: createdEntities,
    pages: createdPages,
    workflows,
    analysis
  };
}

/**
 * Extract a project name from description
 */
function extractProjectName(description) {
  // Remove common command words and extract meaningful name
  let cleaned = description
    .replace(/^(create|build|make|develop|generate|design|i want|i need|please|help me)\s+/gi, '')
    .replace(/\s+(landing\s+page|website|web\s+app|app|page|site|for\s+me|application)$/gi, '')
    .replace(/\s+for\s+/gi, ' - ')
    .trim();
  
  // Extract first meaningful phrase (up to 50 chars)
  const words = cleaned.split(' ').slice(0, 6);
  cleaned = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  
  return cleaned.substring(0, 50) || 'My Project';
}

/**
 * Generate entities for the project
 */
async function generateProjectEntities(description, analysis, base44) {
  // Use enhanced entity generation as base
  const { entities: baseEntities, features } = generateEnhancedEntities(description);
  
  // Add any extracted entities not already included
  const entityNames = new Set(baseEntities.map(e => e.name));
  
  for (const entityName of analysis.extractedEntities) {
    if (!entityNames.has(entityName)) {
      const entitySchema = generateEntitySchema(entityName, features);
      if (entitySchema) {
        baseEntities.push(entitySchema);
        entityNames.add(entityName);
      }
    }
  }
  
  // If using a template, ensure all template entities exist
  if (analysis.suggestedTemplate) {
    for (const templateEntity of analysis.suggestedTemplate.entities) {
      if (!entityNames.has(templateEntity)) {
        const entitySchema = generateEntitySchema(templateEntity, features);
        if (entitySchema) {
          baseEntities.push(entitySchema);
          entityNames.add(templateEntity);
        }
      }
    }
  }
  
  // Add User entity if auth is required and not already present
  if (analysis.features?.auth && !entityNames.has('User')) {
    const userEntity = generateUserEntity();
    if (userEntity) {
      // @ts-ignore - Entity schemas have varying structures
      baseEntities.push(userEntity);
      entityNames.add('User');
    }
  }
  
  return baseEntities;
}

/**
 * Generate a basic entity schema for common entity types
 */
function generateEntitySchema(entityName, features = {}) {
  const schemas = {
    User: generateUserEntity(),
    Customer: {
      name: 'Customer',
      schema: {
        email: { type: 'string', required: true, unique: true },
        first_name: { type: 'string', required: true },
        last_name: { type: 'string', required: true },
        phone: { type: 'string' },
        avatar: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'], default: 'active' },
        metadata: { type: 'object' },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['email', 'status']
    },
    Message: {
      name: 'Message',
      schema: {
        sender_id: { type: 'reference', entity: 'User', required: true },
        recipient_id: { type: 'reference', entity: 'User', required: true },
        content: { type: 'text', required: true },
        read: { type: 'boolean', default: false },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['sender_id', 'recipient_id', 'read']
    },
    Notification: {
      name: 'Notification',
      schema: {
        user_id: { type: 'reference', entity: 'User', required: true },
        type: { type: 'string', required: true, enum: ['info', 'success', 'warning', 'error'] },
        title: { type: 'string', required: true },
        message: { type: 'text', required: true },
        read: { type: 'boolean', default: false },
        action_url: { type: 'string' },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['user_id', 'read', 'type']
    },
    Task: {
      name: 'Task',
      schema: {
        title: { type: 'string', required: true },
        description: { type: 'text' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'cancelled'], default: 'todo' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        assignee_id: { type: 'reference', entity: 'User' },
        due_date: { type: 'datetime' },
        completed_at: { type: 'datetime' },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['status', 'priority', 'assignee_id', 'due_date']
    },
    Team: {
      name: 'Team',
      schema: {
        name: { type: 'string', required: true },
        description: { type: 'text' },
        owner_id: { type: 'reference', entity: 'User', required: true },
        members: { type: 'array', items: { type: 'reference', entity: 'User' } },
        settings: { type: 'object' },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['owner_id']
    },
    Invoice: {
      name: 'Invoice',
      schema: {
        number: { type: 'string', required: true, unique: true },
        customer_id: { type: 'reference', entity: 'Customer', required: true },
        items: { type: 'array', items: { type: 'object' } },
        subtotal: { type: 'number', required: true },
        tax: { type: 'number', default: 0 },
        total: { type: 'number', required: true },
        status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
        due_date: { type: 'date' },
        paid_at: { type: 'datetime' },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['number', 'customer_id', 'status']
    },
    Vendor: {
      name: 'Vendor',
      schema: {
        name: { type: 'string', required: true },
        email: { type: 'string', required: true },
        phone: { type: 'string' },
        description: { type: 'text' },
        logo: { type: 'string' },
        verified: { type: 'boolean', default: false },
        rating: { type: 'number', min: 0, max: 5 },
        status: { type: 'string', enum: ['pending', 'active', 'suspended'], default: 'pending' },
        commission_rate: { type: 'number', default: 10 },
        created_at: { type: 'datetime', default: 'now' }
      },
      indexes: ['email', 'status', 'verified']
    },
    Inventory: {
      name: 'Inventory',
      schema: {
        product_id: { type: 'reference', entity: 'Product', required: true },
        sku: { type: 'string', required: true, unique: true },
        quantity: { type: 'number', required: true, default: 0 },
        reserved: { type: 'number', default: 0 },
        available: { type: 'number', default: 0 },
        low_stock_threshold: { type: 'number', default: 10 },
        location: { type: 'string' },
        last_restocked: { type: 'datetime' },
        updated_at: { type: 'datetime', auto: true }
      },
      indexes: ['product_id', 'sku', 'quantity']
    }
  };
  
  return schemas[entityName] || null;
}

/**
 * Generate the User entity with auth features
 */
function generateUserEntity() {
  return {
    name: 'User',
    schema: {
      email: { type: 'string', required: true, unique: true },
      password_hash: { type: 'string' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      avatar: { type: 'string' },
      role: { type: 'string', enum: ['user', 'admin', 'moderator'], default: 'user' },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended'], default: 'active' },
      email_verified: { type: 'boolean', default: false },
      last_login: { type: 'datetime' },
      preferences: { type: 'object' },
      created_at: { type: 'datetime', default: 'now' },
      updated_at: { type: 'datetime', auto: true }
    },
    indexes: ['email', 'role', 'status'],
    api_endpoints: {
      me: { method: 'GET', path: '/users/me', auth: true },
      update: { method: 'PUT', path: '/users/me', auth: true },
      list: { method: 'GET', path: '/users', auth: true, role: 'admin' }
    }
  };
}

/**
 * Generate workflows for the project
 */
function generateProjectWorkflows(description, analysis) {
  const workflows = [];
  const features = analysis.features || {};
  const template = analysis.suggestedTemplate;
  
  // Add workflows based on template
  if (template?.workflows) {
    for (const workflowName of template.workflows) {
      if (WORKFLOW_TEMPLATES[workflowName]) {
        workflows.push({
          ...WORKFLOW_TEMPLATES[workflowName],
          template: workflowName
        });
      }
    }
  }
  
  // Add feature-based workflows
  if (features.auth && !workflows.some(w => w.name === 'User Onboarding')) {
    workflows.push({ ...WORKFLOW_TEMPLATES.user_onboarding, template: 'user_onboarding' });
  }
  
  if (features.email && !workflows.some(w => w.name.includes('email'))) {
    workflows.push({
      name: 'Email Notifications',
      description: 'Send automated email notifications',
      trigger: 'notification.created',
      steps: [
        { action: 'prepare_email', description: 'Build email content' },
        { action: 'send_email', description: 'Send via email provider' },
        { action: 'log_delivery', description: 'Track delivery status' }
      ],
      template: 'email_notifications'
    });
  }
  
  return workflows;
}

/**
 * Generate pages for the project
 */
async function generateProjectPages(description, analysis, entities, base44) {
  const pages = [];
  const template = analysis.suggestedTemplate;
  const features = analysis.features || {};
  
  // Get template pages or use default
  const templatePages = template?.pages || ['Home', 'Dashboard', 'Settings'];
  
  for (const pageName of templatePages) {
    const pageConfig = generatePageConfig(pageName, entities, features, description);
    if (pageConfig) {
      pages.push(pageConfig);
    }
  }
  
  // Ensure we have essential pages
  const pageNames = new Set(pages.map(p => p.name));
  
  if (!pageNames.has('Home')) {
    pages.unshift(generatePageConfig('Home', entities, features, description));
  }
  
  if (features.auth && !pageNames.has('Account')) {
    pages.push(generatePageConfig('Account', entities, features, description));
  }
  
  return pages;
}

/**
 * Generate configuration for a specific page
 */
function generatePageConfig(pageName, entities, features, description) {
  const pageConfigs = {
    Home: {
      name: 'Home',
      path: '/',
      content: {
        type: 'landing',
        sections: ['hero', 'features', 'cta'],
        hero: {
          headline: extractHeadline(description),
          subheadline: extractSubheadline(description),
          cta: 'Get Started'
        }
      },
      metadata: { template: 'landing', priority: 1 }
    },
    Landing: {
      name: 'Landing',
      path: '/',
      content: {
        type: 'landing',
        sections: ['hero', 'features', 'testimonials', 'pricing', 'cta'],
        hero: {
          headline: extractHeadline(description),
          subheadline: extractSubheadline(description),
          cta: 'Start Free Trial'
        }
      },
      metadata: { template: 'landing', priority: 1 }
    },
    Dashboard: {
      name: 'Dashboard',
      path: '/dashboard',
      content: {
        type: 'dashboard',
        sections: ['stats', 'charts', 'recent', 'quick_actions'],
        widgets: getRelevantWidgets(entities, features)
      },
      metadata: { template: 'dashboard', requiresAuth: true }
    },
    Products: {
      name: 'Products',
      path: '/products',
      content: {
        type: 'listing',
        entity: 'Product',
        sections: ['filters', 'search', 'grid', 'pagination'],
        display: 'grid',
        itemsPerPage: 12
      },
      metadata: { template: 'listing' }
    },
    'Product Detail': {
      name: 'Product Detail',
      path: '/products/:slug',
      content: {
        type: 'detail',
        entity: 'Product',
        sections: ['gallery', 'info', 'reviews', 'related']
      },
      metadata: { template: 'detail' }
    },
    Services: {
      name: 'Services',
      path: '/services',
      content: {
        type: 'listing',
        entity: 'Service',
        sections: ['grid'],
        display: 'cards'
      },
      metadata: { template: 'listing' }
    },
    Cart: {
      name: 'Cart',
      path: '/cart',
      content: {
        type: 'cart',
        sections: ['items', 'summary', 'checkout_button']
      },
      metadata: { template: 'form', requiresAuth: false }
    },
    Checkout: {
      name: 'Checkout',
      path: '/checkout',
      content: {
        type: 'checkout',
        sections: ['shipping', 'payment', 'review', 'confirmation']
      },
      metadata: { template: 'form', requiresAuth: true }
    },
    Account: {
      name: 'Account',
      path: '/account',
      content: {
        type: 'profile',
        sections: ['header', 'tabs'],
        tabs: ['Profile', 'Orders', 'Settings']
      },
      metadata: { template: 'profile', requiresAuth: true }
    },
    Settings: {
      name: 'Settings',
      path: '/settings',
      content: {
        type: 'settings',
        sections: ['profile', 'notifications', 'privacy', 'billing']
      },
      metadata: { template: 'form', requiresAuth: true }
    },
    Orders: {
      name: 'Orders',
      path: '/orders',
      content: {
        type: 'listing',
        entity: 'Order',
        sections: ['filters', 'list', 'pagination'],
        display: 'table'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    'My Bookings': {
      name: 'My Bookings',
      path: '/bookings',
      content: {
        type: 'listing',
        entity: 'Booking',
        sections: ['tabs', 'list'],
        tabs: ['Upcoming', 'Past', 'Cancelled']
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Book: {
      name: 'Book',
      path: '/book/:serviceId',
      content: {
        type: 'booking',
        sections: ['service_info', 'calendar', 'time_slots', 'form', 'confirmation']
      },
      metadata: { template: 'form' }
    },
    Calendar: {
      name: 'Calendar',
      path: '/calendar',
      content: {
        type: 'calendar',
        view: 'month',
        entity: 'Booking'
      },
      metadata: { template: 'custom', requiresAuth: true }
    },
    Articles: {
      name: 'Articles',
      path: '/articles',
      content: {
        type: 'listing',
        entity: 'Article',
        sections: ['featured', 'categories', 'grid', 'pagination'],
        display: 'cards'
      },
      metadata: { template: 'listing' }
    },
    'Article Detail': {
      name: 'Article Detail',
      path: '/articles/:slug',
      content: {
        type: 'article',
        sections: ['header', 'content', 'author', 'comments', 'related']
      },
      metadata: { template: 'detail' }
    },
    Courses: {
      name: 'Courses',
      path: '/courses',
      content: {
        type: 'listing',
        entity: 'Course',
        sections: ['categories', 'search', 'grid', 'pagination'],
        display: 'cards'
      },
      metadata: { template: 'listing' }
    },
    'Course Detail': {
      name: 'Course Detail',
      path: '/courses/:slug',
      content: {
        type: 'course',
        sections: ['header', 'curriculum', 'instructor', 'reviews', 'enrollment']
      },
      metadata: { template: 'detail' }
    },
    Lesson: {
      name: 'Lesson',
      path: '/courses/:courseSlug/lessons/:lessonSlug',
      content: {
        type: 'lesson',
        sections: ['video', 'content', 'resources', 'quiz', 'navigation']
      },
      metadata: { template: 'detail', requiresAuth: true }
    },
    Portfolio: {
      name: 'Portfolio',
      path: '/portfolio',
      content: {
        type: 'portfolio',
        entity: 'Project',
        sections: ['filters', 'masonry'],
        display: 'masonry'
      },
      metadata: { template: 'listing' }
    },
    'Case Study': {
      name: 'Case Study',
      path: '/portfolio/:slug',
      content: {
        type: 'case_study',
        sections: ['header', 'challenge', 'solution', 'results', 'gallery', 'testimonial']
      },
      metadata: { template: 'detail' }
    },
    About: {
      name: 'About',
      path: '/about',
      content: {
        type: 'about',
        sections: ['story', 'team', 'values', 'stats']
      },
      metadata: { template: 'content' }
    },
    Contact: {
      name: 'Contact',
      path: '/contact',
      content: {
        type: 'contact',
        sections: ['info', 'form', 'map']
      },
      metadata: { template: 'form' }
    },
    Contacts: {
      name: 'Contacts',
      path: '/contacts',
      content: {
        type: 'listing',
        entity: 'Contact',
        sections: ['search', 'filters', 'table', 'pagination'],
        display: 'table'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Leads: {
      name: 'Leads',
      path: '/leads',
      content: {
        type: 'listing',
        entity: 'Lead',
        sections: ['pipeline', 'filters', 'kanban'],
        display: 'kanban'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Deals: {
      name: 'Deals',
      path: '/deals',
      content: {
        type: 'listing',
        entity: 'Deal',
        sections: ['pipeline', 'stats', 'kanban'],
        display: 'kanban'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Companies: {
      name: 'Companies',
      path: '/companies',
      content: {
        type: 'listing',
        entity: 'Company',
        sections: ['search', 'filters', 'grid'],
        display: 'cards'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Tasks: {
      name: 'Tasks',
      path: '/tasks',
      content: {
        type: 'listing',
        entity: 'Task',
        sections: ['filters', 'list', 'quick_add'],
        display: 'list'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Reports: {
      name: 'Reports',
      path: '/reports',
      content: {
        type: 'reports',
        sections: ['date_range', 'charts', 'tables', 'export']
      },
      metadata: { template: 'dashboard', requiresAuth: true }
    },
    Analytics: {
      name: 'Analytics',
      path: '/analytics',
      content: {
        type: 'analytics',
        sections: ['overview', 'traffic', 'conversions', 'revenue']
      },
      metadata: { template: 'dashboard', requiresAuth: true }
    },
    Feed: {
      name: 'Feed',
      path: '/feed',
      content: {
        type: 'feed',
        entity: 'Post',
        sections: ['composer', 'posts', 'sidebar']
      },
      metadata: { template: 'custom', requiresAuth: true }
    },
    Profile: {
      name: 'Profile',
      path: '/profile/:username',
      content: {
        type: 'profile',
        sections: ['header', 'stats', 'tabs', 'posts']
      },
      metadata: { template: 'profile' }
    },
    Messages: {
      name: 'Messages',
      path: '/messages',
      content: {
        type: 'messages',
        sections: ['conversations', 'chat', 'info']
      },
      metadata: { template: 'custom', requiresAuth: true }
    },
    Notifications: {
      name: 'Notifications',
      path: '/notifications',
      content: {
        type: 'notifications',
        sections: ['filters', 'list']
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Search: {
      name: 'Search',
      path: '/search',
      content: {
        type: 'search',
        sections: ['input', 'filters', 'results', 'pagination']
      },
      metadata: { template: 'listing' }
    },
    Properties: {
      name: 'Properties',
      path: '/properties',
      content: {
        type: 'listing',
        entity: 'Property',
        sections: ['map', 'filters', 'grid', 'pagination'],
        display: 'split'
      },
      metadata: { template: 'listing' }
    },
    'Property Detail': {
      name: 'Property Detail',
      path: '/properties/:slug',
      content: {
        type: 'property',
        sections: ['gallery', 'info', 'features', 'map', 'agent', 'inquiry_form']
      },
      metadata: { template: 'detail' }
    },
    Agents: {
      name: 'Agents',
      path: '/agents',
      content: {
        type: 'listing',
        entity: 'Agent',
        sections: ['search', 'grid'],
        display: 'cards'
      },
      metadata: { template: 'listing' }
    },
    Favorites: {
      name: 'Favorites',
      path: '/favorites',
      content: {
        type: 'listing',
        entity: 'Favorite',
        sections: ['grid'],
        display: 'grid'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Billing: {
      name: 'Billing',
      path: '/billing',
      content: {
        type: 'billing',
        sections: ['current_plan', 'usage', 'invoices', 'payment_methods']
      },
      metadata: { template: 'form', requiresAuth: true }
    },
    Team: {
      name: 'Team',
      path: '/team',
      content: {
        type: 'team',
        sections: ['members', 'invites', 'roles']
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Browse: {
      name: 'Browse',
      path: '/browse',
      content: {
        type: 'listing',
        entity: 'Listing',
        sections: ['categories', 'filters', 'grid', 'pagination'],
        display: 'grid'
      },
      metadata: { template: 'listing' }
    },
    'Listing Detail': {
      name: 'Listing Detail',
      path: '/listings/:slug',
      content: {
        type: 'marketplace_listing',
        sections: ['gallery', 'info', 'seller', 'reviews', 'similar']
      },
      metadata: { template: 'detail' }
    },
    'Seller Dashboard': {
      name: 'Seller Dashboard',
      path: '/seller',
      content: {
        type: 'seller_dashboard',
        sections: ['stats', 'listings', 'orders', 'earnings']
      },
      metadata: { template: 'dashboard', requiresAuth: true }
    },
    Certificates: {
      name: 'Certificates',
      path: '/certificates',
      content: {
        type: 'listing',
        entity: 'Certificate',
        sections: ['grid'],
        display: 'cards'
      },
      metadata: { template: 'listing', requiresAuth: true }
    },
    Subscribe: {
      name: 'Subscribe',
      path: '/subscribe',
      content: {
        type: 'subscribe',
        sections: ['form', 'benefits']
      },
      metadata: { template: 'form' }
    },
    Categories: {
      name: 'Categories',
      path: '/categories',
      content: {
        type: 'listing',
        entity: 'Category',
        sections: ['grid'],
        display: 'cards'
      },
      metadata: { template: 'listing' }
    },
    Author: {
      name: 'Author',
      path: '/authors/:slug',
      content: {
        type: 'author',
        sections: ['profile', 'bio', 'articles']
      },
      metadata: { template: 'profile' }
    }
  };
  
  return pageConfigs[pageName] || {
    name: pageName,
    path: `/${pageName.toLowerCase().replace(/\s+/g, '-')}`,
    content: {
      type: 'custom',
      sections: ['content']
    },
    metadata: { template: 'custom' }
  };
}

/**
 * Extract headline from description
 */
function extractHeadline(description) {
  // Remove common prefixes
  let cleaned = description
    .replace(/^(create|build|make|i want|i need|please)\s+/gi, '')
    .replace(/\s+(for me|website|app|application|platform)$/gi, '')
    .trim();
  
  // Capitalize and truncate
  const words = cleaned.split(' ').slice(0, 8);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Extract subheadline from description
 */
function extractSubheadline(description) {
  return description.length > 100 
    ? description.substring(0, 100) + '...'
    : description;
}

/**
 * Get relevant dashboard widgets based on entities and features
 */
function getRelevantWidgets(entities, features) {
  const widgets = [];
  const entityNames = entities.map(e => e.name);
  
  if (entityNames.includes('Order')) {
    widgets.push({ type: 'stat', entity: 'Order', metric: 'count', label: 'Total Orders' });
    widgets.push({ type: 'stat', entity: 'Order', metric: 'sum', field: 'total', label: 'Revenue' });
  }
  
  if (entityNames.includes('User') || entityNames.includes('Customer')) {
    widgets.push({ type: 'stat', entity: entityNames.includes('Customer') ? 'Customer' : 'User', metric: 'count', label: 'Total Users' });
  }
  
  if (entityNames.includes('Product')) {
    widgets.push({ type: 'stat', entity: 'Product', metric: 'count', label: 'Products' });
  }
  
  if (entityNames.includes('Booking')) {
    widgets.push({ type: 'stat', entity: 'Booking', metric: 'count', label: 'Bookings' });
    widgets.push({ type: 'calendar', entity: 'Booking', label: 'Upcoming Bookings' });
  }
  
  if (entityNames.includes('Article')) {
    widgets.push({ type: 'stat', entity: 'Article', metric: 'count', label: 'Articles' });
  }
  
  if (features.analytics) {
    widgets.push({ type: 'chart', chartType: 'line', label: 'Traffic Over Time' });
    widgets.push({ type: 'chart', chartType: 'pie', label: 'Traffic Sources' });
  }
  
  // Add recent activity widget
  widgets.push({ type: 'activity', label: 'Recent Activity' });
  
  return widgets;
}

export default {
  PROJECT_TEMPLATES,
  WORKFLOW_TEMPLATES,
  PAGE_TEMPLATES,
  analyzeProjectDescription,
  generateFullProject
};
