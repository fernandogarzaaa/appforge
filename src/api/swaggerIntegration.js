/**
 * Swagger/OpenAPI Integration
 * Setup and configuration for API documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger options configuration
 */
export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AppForge API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for AppForge quantum-AI platform',
      contact: {
        name: 'API Support',
        email: 'support@appforge.dev',
      },
      license: {
        name: 'Apache 2.0',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: process.env.API_URL || 'https://api.appforge.dev',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', description: 'Error code' },
            message: { type: 'string', description: 'Error message' },
            details: { type: 'object', description: 'Additional error details' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },

        // Quantum Consensus schemas
        QuantumConsensusResult: {
          type: 'object',
          properties: {
            consensus: { type: 'string', description: 'Consensus result' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            entropy: { type: 'number', description: 'System entropy measure' },
            coherence: { type: 'number', description: 'Coherence score' },
            models: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  model: { type: 'string' },
                  response: { type: 'string' },
                  weight: { type: 'number' },
                },
              },
            },
          },
        },

        // Subscription schemas
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
            status: { type: 'string', enum: ['active', 'cancelled', 'expired'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            autoRenew: { type: 'boolean' },
          },
        },

        // User schemas
        User: {
          type: 'object',
          required: ['email', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            profile: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Quantum Analysis schemas
        QuantumAnalysis: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', description: 'Code to analyze' },
            complexity: { type: 'number', description: 'Complexity score' },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optimization suggestions',
            },
            executionTime: { type: 'number', description: 'Analysis time in ms' },
          },
        },

        // Pagination schemas
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },

    security: [
      { bearerAuth: [] },
      { apiKey: [] },
    ],
  },

  // API endpoints
  apis: ['./src/api/**/*.js', './functions/**/*.ts'],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware
 * Usage: app.use('/api/docs', setupSwagger());
 */
export function setupSwagger() {
  return swaggerUi.serve;
}

/**
 * Setup Swagger UI routes
 * Usage: app.get('/api/docs', swaggerUIOptions(swaggerSpec));
 */
export function swaggerUIOptions(spec) {
  return swaggerUi.setup(spec, {
    customCss: `
      .topbar { display: none; }
      .swagger-ui .topbar { display: block; }
      .swagger-ui .models { margin-bottom: 2rem; }
    `,
    customCssUrl: null,
    swaggerOptions: {
      deepLinking: true,
      presets: [
        swaggerUi.presets.apis,
        swaggerUi.SwaggerUIBundle.presets.layouts,
      ],
      layout: 'StandaloneLayout',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
  });
}

/**
 * API Documentation structure
 * Add JSDoc comments to your Express routes like this:

/**
 * @swagger
 * /api/quantum/analyze:
 *   post:
 *     summary: Analyze code with quantum engine
 *     tags:
 *       - Quantum Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Source code to analyze
 *               language:
 *                 type: string
 *                 enum: ['javascript', 'typescript', 'python']
 *     responses:
 *       200:
 *         description: Analysis complete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuantumAnalysis'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * Configure API documentation routes
 * Usage: configureSwaggerRoutes(app);
 */
export function configureSwaggerRoutes(app) {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUIOptions(swaggerSpec));
  
  // JSON specification endpoint
  app.get('/api/docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
  
  // YAML specification endpoint
  app.get('/api/docs.yaml', (req, res) => {
    res.type('text/yaml').send(require('js-yaml').dump(swaggerSpec));
  });
  
  console.log('[Swagger] Documentation available at /api/docs');
}

/**
 * Helper to add operation tags and descriptions to endpoints
 * Usage: const docs = createEndpointDocs('Users', 'Manage user accounts');
 */
export function createEndpointDocs(tag, description) {
  return {
    tags: [tag],
    summary: description,
  };
}

/**
 * Create request body schema
 * Usage: const bodySchema = createRequestSchema({ email: 'string', name: 'string' });
 */
export function createRequestSchema(properties) {
  return {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: Object.keys(properties),
            properties: Object.entries(properties).reduce((acc, [key, type]) => {
              acc[key] = { type };
              return acc;
            }, {}),
          },
        },
      },
    },
  };
}

/**
 * Create successful response schema
 * Usage: const response = createSuccessResponse(200, 'QuantumAnalysis');
 */
export function createSuccessResponse(statusCode, schemaRef) {
  return {
    responses: {
      [statusCode]: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${schemaRef}`,
            },
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      500: {
        description: 'Server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  };
}

export default {
  swaggerOptions,
  swaggerSpec,
  setupSwagger,
  swaggerUIOptions,
  configureSwaggerRoutes,
  createEndpointDocs,
  createRequestSchema,
  createSuccessResponse,
};
