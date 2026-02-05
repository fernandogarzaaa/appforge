import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates comprehensive API documentation
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const format = new URL(req.url).searchParams.get('format') || 'markdown';

    const documentation = {
      title: 'AppForge API Documentation',
      version: '1.0.0',
      baseUrl: 'https://api.appforge.dev/v1',
      authentication: {
        type: 'Bearer',
        format: 'Bearer key_xxx:secret_yyy'
      },
      endpoints: [
        {
          method: 'GET',
          path: '/projects',
          description: 'List all projects',
          scopes: ['read:projects'],
          response: {
            success: true,
            data: []
          }
        },
        {
          method: 'POST',
          path: '/projects',
          description: 'Create a new project',
          scopes: ['write:projects'],
          body: {
            name: 'string (required)',
            description: 'string',
            icon: 'string',
            color: 'string'
          }
        },
        {
          method: 'GET',
          path: '/projects/{projectId}',
          description: 'Get project details',
          scopes: ['read:projects']
        },
        {
          method: 'GET',
          path: '/entities',
          description: 'List all entities',
          scopes: ['read:entities']
        },
        {
          method: 'POST',
          path: '/webhooks',
          description: 'Register a webhook',
          scopes: ['write:webhooks'],
          body: {
            url: 'string (required)',
            events: 'array of event types'
          }
        },
        {
          method: 'GET',
          path: '/webhooks',
          description: 'List registered webhooks',
          scopes: ['read:webhooks']
        }
      ],
      events: [
        {
          name: 'project.created',
          description: 'Fired when a project is created',
          payload: {
            event_type: 'project.created',
            resource_type: 'project',
            resource_id: 'string',
            data: 'project object'
          }
        },
        {
          name: 'project.updated',
          description: 'Fired when a project is updated'
        },
        {
          name: 'entity.created',
          description: 'Fired when an entity is created'
        },
        {
          name: 'subscription.created',
          description: 'Fired when a subscription is created'
        }
      ]
    };

    if (format === 'openapi') {
      return Response.json(generateOpenAPISpec(documentation));
    }

    return Response.json({
      success: true,
      documentation,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Documentation generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateOpenAPISpec(doc) {
  return {
    openapi: '3.0.0',
    info: {
      title: doc.title,
      version: doc.version
    },
    servers: [{ url: doc.baseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer'
        }
      }
    },
    paths: doc.endpoints.reduce((paths, endpoint) => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        security: [{ bearerAuth: endpoint.scopes }],
        responses: {
          200: { description: 'Success' },
          401: { description: 'Unauthorized' }
        }
      };
      return paths;
    }, {})
  };
}