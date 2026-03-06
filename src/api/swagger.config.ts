/**
 * AppForge API Documentation (OpenAPI 3.0.0)
 * Comprehensive API reference with authentication, models, and quantum integration
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { globSync } from 'glob';

const apiPatterns = ['./src/api/routes/**/*.js', './src/api/endpoints/**/*.ts'];
const resolvedApiFiles = Array.from(new Set(
  apiPatterns.flatMap((pattern) =>
    globSync(pattern, {
      nodir: true,
      windowsPathsNoEscape: true,
    })
  )
));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AppForge API - Quantum AI Platform',
      version: '1.0.0',
      description: 'Enterprise AI platform with quantum-inspired consensus, security analysis, and cost management',
      contact: {
        name: 'AppForge Support',
        url: 'https://appforge.dev',
        email: 'support@appforge.dev',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://opensource.org/licenses/Apache-2.0',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
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
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
          },
          required: ['code', 'message'],
        },
        QuantumConsensusResult: {
          type: 'object',
          properties: {
            consensus: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            entropy: { type: 'number' },
            coherence: { type: 'number' },
            models: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  model: { type: 'string', enum: ['gpt4', 'claude', 'gemini'] },
                  response: { type: 'string' },
                  weight: { type: 'number' },
                },
              },
            },
          },
        },
        SecurityAnalysis: {
          type: 'object',
          properties: {
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            breachProbability: { type: 'number', minimum: 0, maximum: 1 },
            vulnerabilities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  probability: { type: 'number' },
                },
              },
            },
          },
        },
        StabilityMetrics: {
          type: 'object',
          properties: {
            stability: { type: 'number', minimum: 0, maximum: 1 },
            frozen: { type: 'boolean' },
            recommendedTestFrequency: { type: 'number' },
            degradationTimeline: {
              type: 'object',
              properties: {
                timeToFailure: { type: 'number' },
                confidence: { type: 'number' },
              },
            },
          },
        },
        CriticalityAnalysis: {
          type: 'object',
          properties: {
            criticality: { type: 'number', minimum: 0, maximum: 1 },
            status: { type: 'string', enum: ['HEALTHY', 'WARNING', 'CRITICAL'] },
            timeToFailure: { type: 'number' },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'enterprise'] },
            subscription: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
            credits: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SubscriptionPlan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            credits: { type: 'number' },
            features: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { apiKeyAuth: [] },
    ],
  },
  apis: resolvedApiFiles.length > 0 ? resolvedApiFiles : ['./src/api/swagger.config.ts'],
};

export const swaggerSpec = swaggerJsdoc(options as any);

export function setupSwagger(app) {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  }));

  // JSON spec endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export default swaggerSpec;
