// Code generation utilities for AI-powered development

/**
 * Generate TypeScript interface from entity schema
 */
export function generateTypeScriptInterface(entityName, schema) {
  const lines = [`export interface ${entityName} {`];
  
  Object.entries(schema).forEach(([key, config]) => {
    let tsType = 'string';
    
    if (config.type === 'number') tsType = 'number';
    else if (config.type === 'boolean') tsType = 'boolean';
    else if (config.type === 'array') {
      if (config.items?.type === 'string') tsType = 'string[]';
      else if (config.items?.type === 'number') tsType = 'number[]';
      else tsType = 'any[]';
    }
    else if (config.type === 'date' || config.type === 'datetime') tsType = 'Date';
    else if (config.type === 'reference') tsType = `string // ${config.entity} ID`;
    else if (config.type === 'text') tsType = 'string';
    else if (config.enum) tsType = config.enum.map(v => `'${v}'`).join(' | ');
    
    const optional = config.required ? '' : '?';
    const comment = config.unique ? ' // unique' : config.default !== undefined ? ` // default: ${config.default}` : '';
    lines.push(`  ${key}${optional}: ${tsType};${comment}`);
  });
  
  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate React custom hook for entity
 */
export function generateReactHook(entityName) {
  const lowerName = entityName.toLowerCase();
  const pluralName = `${lowerName}s`;
  
  return `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ${entityName} } from '@/types';

export function use${entityName}s() {
  return useQuery<${entityName}[]>({
    queryKey: ['${pluralName}'],
    queryFn: async () => {
      const response = await fetch('/api/${pluralName}');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });
}

export function use${entityName}(id: string) {
  return useQuery<${entityName}>({
    queryKey: ['${pluralName}', id],
    queryFn: async () => {
      const response = await fetch(\`/api/${pluralName}/\${id}\`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreate${entityName}() {
  const queryClient = useQueryClient();
  
  return useMutation<${entityName}, Error, Partial<${entityName}>>({
    mutationFn: async (data) => {
      const response = await fetch('/api/${pluralName}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${pluralName}'] });
    },
  });
}

export function useUpdate${entityName}() {
  const queryClient = useQueryClient();
  
  return useMutation<${entityName}, Error, { id: string; data: Partial<${entityName}> }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(\`/api/${pluralName}/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['${pluralName}'] });
      queryClient.invalidateQueries({ queryKey: ['${pluralName}', id] });
    },
  });
}

export function useDelete${entityName}() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(\`/api/${pluralName}/\${id}\`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${pluralName}'] });
    },
  });
}`;
}

/**
 * Generate API endpoint handler
 */
export function generateAPIHandler(entityName, schema) {
  const lowerName = entityName.toLowerCase();
  const pluralName = `${lowerName}s`;
  
  const requiredFields = Object.entries(schema)
    .filter(([_, config]) => config.required)
    .map(([key]) => key);
  
  return `// API handler for ${entityName}
import { Router } from 'express';
import { validate } from '@/middleware/validation';
import { authenticate } from '@/middleware/auth';

const router = Router();

// GET /api/${pluralName}
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    
    // Apply filters, pagination
    const ${pluralName} = await db.${lowerName}.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
    
    const total = await db.${lowerName}.count({ where: filters });
    
    res.json({
      data: ${pluralName},
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/${pluralName}/:id
router.get('/:id', async (req, res) => {
  try {
    const ${lowerName} = await db.${lowerName}.findUnique({
      where: { id: req.params.id },
    });
    
    if (!${lowerName}) {
      return res.status(404).json({ error: '${entityName} not found' });
    }
    
    res.json(${lowerName});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/${pluralName}
router.post('/', authenticate, validate({
  required: [${requiredFields.map(f => `'${f}'`).join(', ')}],
}), async (req, res) => {
  try {
    const ${lowerName} = await db.${lowerName}.create({
      data: req.body,
    });
    
    res.status(201).json(${lowerName});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/${pluralName}/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const ${lowerName} = await db.${lowerName}.update({
      where: { id: req.params.id },
      data: req.body,
    });
    
    res.json(${lowerName});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/${pluralName}/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.${lowerName}.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;`;
}

/**
 * Generate validation schema (Zod)
 */
export function generateValidationSchema(entityName, schema) {
  const lines = [`import { z } from 'zod';`, '', `export const ${entityName}Schema = z.object({`];
  
  Object.entries(schema).forEach(([key, config]) => {
    let zodType = 'z.string()';
    
    if (config.type === 'number') {
      zodType = 'z.number()';
      if (config.min !== undefined) zodType += `.min(${config.min})`;
      if (config.max !== undefined) zodType += `.max(${config.max})`;
    } else if (config.type === 'boolean') {
      zodType = 'z.boolean()';
    } else if (config.type === 'array') {
      zodType = 'z.array(z.string())';
      if (config.minItems) zodType += `.min(${config.minItems})`;
    } else if (config.type === 'date' || config.type === 'datetime') {
      zodType = 'z.date()';
    } else if (config.type === 'string' || config.type === 'text') {
      zodType = 'z.string()';
      if (config.minLength) zodType += `.min(${config.minLength})`;
      if (config.maxLength) zodType += `.max(${config.maxLength})`;
      if (config.pattern) zodType += `.regex(/${config.pattern}/)`;
      if (config.enum) zodType = `z.enum([${config.enum.map(v => `'${v}'`).join(', ')}])`;
    }
    
    if (!config.required) zodType += '.optional()';
    if (config.default !== undefined && typeof config.default !== 'object') {
      zodType += `.default(${typeof config.default === 'string' ? `'${config.default}'` : config.default})`;
    }
    
    lines.push(`  ${key}: ${zodType},`);
  });
  
  lines.push('});');
  lines.push('');
  lines.push(`export type ${entityName}Input = z.infer<typeof ${entityName}Schema>;`);
  
  return lines.join('\n');
}

/**
 * Generate React component structure
 */
export function generateComponentStructure(projectName, entities) {
  const structure = {
    'src/': {
      'components/': {
        'ui/': ['button.tsx', 'card.tsx', 'input.tsx', 'form.tsx'],
        'layout/': ['Header.tsx', 'Footer.tsx', 'Sidebar.tsx', 'Layout.tsx'],
      },
      'pages/': {
        'Home.tsx': null,
      },
      'hooks/': {},
      'lib/': {
        'api.ts': null,
        'utils.ts': null,
      },
      'types/': {
        'index.ts': null,
      },
    },
  };
  
  // Add entity-specific files
  entities.forEach(entity => {
    structure['src/']['components/'][`${entity.name}List.tsx`] = null;
    structure['src/']['components/'][`${entity.name}Card.tsx`] = null;
    structure['src/']['pages/'][`${entity.name}Detail.tsx`] = null;
    structure['src/']['hooks/'][`use${entity.name}s.ts`] = null;
  });
  
  return structure;
}

/**
 * Detect technical requirements from description
 */
export function detectTechnicalRequirements(description) {
  const lower = description.toLowerCase();
  
  return {
    authentication: lower.includes('auth') || lower.includes('login') || lower.includes('user') || lower.includes('account'),
    payment: lower.includes('payment') || lower.includes('checkout') || lower.includes('subscription') || lower.includes('stripe') || lower.includes('paypal'),
    search: lower.includes('search') || lower.includes('filter') || lower.includes('find'),
    analytics: lower.includes('analytics') || lower.includes('tracking') || lower.includes('metrics') || lower.includes('statistics'),
    notifications: lower.includes('notification') || lower.includes('alert') || lower.includes('email') || lower.includes('sms'),
    api: lower.includes('api') || lower.includes('endpoint') || lower.includes('rest') || lower.includes('graphql'),
    realtime: lower.includes('realtime') || lower.includes('live') || lower.includes('websocket') || lower.includes('chat'),
    fileUpload: lower.includes('upload') || lower.includes('file') || lower.includes('image') || lower.includes('media'),
    admin: lower.includes('admin') || lower.includes('dashboard') || lower.includes('management'),
    multiLanguage: lower.includes('multi-language') || lower.includes('i18n') || lower.includes('translation'),
    seo: lower.includes('seo') || lower.includes('meta') || lower.includes('og:'),
    accessibility: lower.includes('accessibility') || lower.includes('a11y') || lower.includes('wcag'),
  };
}

/**
 * Generate recommended tech stack
 */
export function generateTechStack(requirements) {
  const stack = {
    frontend: ['React', 'TypeScript', 'Tailwind CSS'],
    stateManagement: ['TanStack Query (React Query)'],
    backend: [],
    database: [],
    services: [],
    testing: ['Vitest', 'Testing Library'],
    devTools: ['Vite', 'ESLint', 'Prettier'],
  };
  
  if (requirements.authentication) {
    stack.services.push('Auth0 / Clerk / Supabase Auth');
    stack.backend.push('JWT tokens');
  }
  
  if (requirements.payment) {
    stack.services.push('Stripe');
    stack.backend.push('Webhooks');
  }
  
  if (requirements.realtime) {
    stack.backend.push('WebSockets');
    stack.services.push('Pusher / Ably');
  }
  
  if (requirements.fileUpload) {
    stack.services.push('Cloudinary / AWS S3');
  }
  
  if (requirements.api) {
    stack.backend.push('Express / Fastify');
    stack.backend.push('REST API');
  }
  
  if (requirements.database) {
    stack.database.push('PostgreSQL / MongoDB');
    stack.backend.push('Prisma ORM');
  }
  
  return stack;
}
