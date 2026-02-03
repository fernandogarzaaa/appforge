/**
 * Swagger/OpenAPI Documentation Setup
 * Auto-generates API documentation from Express routes
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AppForge API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for AppForge - AI-powered application development platform',
      contact: {
        name: 'AppForge Support',
        email: 'support@appforge.dev',
        url: 'https://appforge.dev/support',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://staging.appforge.dev/api',
        description: 'Staging server',
      },
      {
        url: 'https://api.appforge.dev',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for server-to-server authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
          required: ['error'],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'enterprise'],
              description: 'User role',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            subscription: {
              type: 'object',
              properties: {
                tier: {
                  type: 'string',
                  enum: ['free', 'pro', 'enterprise'],
                },
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'cancelled'],
                },
                expiresAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            status: {
              type: 'string',
              enum: ['active', 'archived', 'deleted'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        APIKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: 'API key name/label',
            },
            key: {
              type: 'string',
              description: 'API key value (only shown once)',
            },
            scopes: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Allowed scopes for this key',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        Analytics: {
          type: 'object',
          properties: {
            timeRange: {
              type: 'object',
              properties: {
                start: {
                  type: 'string',
                  format: 'date-time',
                },
                end: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
            metrics: {
              type: 'object',
              properties: {
                totalRequests: {
                  type: 'integer',
                },
                successRate: {
                  type: 'number',
                  format: 'float',
                  minimum: 0,
                  maximum: 100,
                },
                averageResponseTime: {
                  type: 'number',
                  format: 'float',
                  description: 'Average response time in milliseconds',
                },
                errorRate: {
                  type: 'number',
                  format: 'float',
                  minimum: 0,
                  maximum: 100,
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Unauthorized',
                code: 'AUTH_REQUIRED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Forbidden',
                code: 'INSUFFICIENT_PERMISSIONS',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Not Found',
                code: 'RESOURCE_NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: {
                  field: 'email',
                  message: 'Invalid email format',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                details: {
                  retryAfter: 60,
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Projects',
        description: 'Project management operations',
      },
      {
        name: 'API Keys',
        description: 'API key generation and management',
      },
      {
        name: 'Analytics',
        description: 'Usage analytics and metrics',
      },
      {
        name: 'Subscriptions',
        description: 'Subscription and billing management',
      },
      {
        name: 'Webhooks',
        description: 'Webhook configuration and management',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (admin only)',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger documentation middleware
 */
export function setupSwagger(app) {
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AppForge API Documentation',
    customfavIcon: '/favicon.ico',
  }));

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at /api-docs');
  console.log('📄 OpenAPI spec available at /api-docs.json');
}

/**
 * Example route documentation using JSDoc
 * 
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

export default swaggerSpec;
