import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * RESTful API Gateway for AppForge
 * Handles all API requests and enforces permissions
 */

Deno.serve(async (req) => {
  try {
    // Extract API key from header
    const authHeader = req.headers.get('Authorization') || '';
    const [scheme, credentials] = authHeader.split(' ');

    if (scheme !== 'Bearer') {
      return Response.json({ error: 'Invalid authorization scheme' }, { status: 401 });
    }

    const [keyId, keySecret] = credentials.split(':');

    if (!keyId || !keySecret) {
      return Response.json({ error: 'Invalid API credentials' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify API key
    const apiKeys = await base44.asServiceRole.entities.APIKey.filter({
      user_id: user.email,
      key_id: keyId,
      is_active: true
    });

    if (apiKeys.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const apiKey = apiKeys[0];

    // Verify secret
    const hashedSecret = await hashSecret(keySecret);
    if (hashedSecret !== apiKey.key_secret_hashed) {
      return Response.json({ error: 'Invalid API secret' }, { status: 401 });
    }

    // Check expiration
    if (new Date(apiKey.expires_at) < new Date()) {
      return Response.json({ error: 'API key expired' }, { status: 401 });
    }

    // Parse request
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    // Route requests
    if (pathname === '/api/v1/projects' && method === 'GET') {
      return handleGetProjects(base44, apiKey);
    } else if (pathname === '/api/v1/projects' && method === 'POST') {
      return handleCreateProject(base44, apiKey, req);
    } else if (pathname.match(/^\/api\/v1\/projects\/[^\/]+$/) && method === 'GET') {
      const projectId = pathname.split('/').pop();
      return handleGetProject(base44, apiKey, projectId);
    } else if (pathname === '/api/v1/entities' && method === 'GET') {
      return handleGetEntities(base44, apiKey);
    } else if (pathname === '/api/v1/webhooks' && method === 'POST') {
      return handleRegisterWebhook(base44, apiKey, req);
    } else if (pathname === '/api/v1/webhooks' && method === 'GET') {
      return handleListWebhooks(base44, apiKey);
    } else {
      return Response.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('API Gateway error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleGetProjects(base44, apiKey) {
  if (!apiKey.scopes.includes('read:projects')) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const projects = await base44.entities.Project.list('-updated_date');
  return Response.json({ success: true, data: projects });
}

async function handleCreateProject(base44, apiKey, req) {
  if (!apiKey.scopes.includes('write:projects')) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { name, description, icon, color } = await req.json();

  if (!name) {
    return Response.json({ error: 'Project name required' }, { status: 400 });
  }

  const project = await base44.entities.Project.create({
    name,
    description,
    icon: icon || '📁',
    color: color || '#6366f1',
    status: 'draft'
  });

  return Response.json({ success: true, data: project }, { status: 201 });
}

async function handleGetProject(base44, apiKey, projectId) {
  if (!apiKey.scopes.includes('read:projects')) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const projects = await base44.entities.Project.filter({ id: projectId });
  if (projects.length === 0) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  return Response.json({ success: true, data: projects[0] });
}

async function handleGetEntities(base44, apiKey) {
  if (!apiKey.scopes.includes('read:entities')) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const entities = await base44.asServiceRole.entities.Entity.list();
  return Response.json({ success: true, data: entities });
}

async function handleRegisterWebhook(base44, apiKey, req) {
  if (!apiKey.scopes.includes('write:webhooks')) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { url, events } = await req.json();

  if (!url || !events || events.length === 0) {
    return Response.json({ error: 'URL and events required' }, { status: 400 });
  }

  const webhook = await base44.asServiceRole.entities.Webhook.create({
    user_id: apiKey.user_id,
    url: url,
    events: events,
    is_active: true,
    secret: generateWebhookSecret(),
    created_at: new Date().toISOString()
  });

  return Response.json({ success: true, data: webhook }, { status: 201 });
}

async function handleListWebhooks(base44, apiKey) {
  if (!apiKey.scopes.includes('read:webhooks')) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const webhooks = await base44.asServiceRole.entities.Webhook.filter({
    user_id: apiKey.user_id
  });

  return Response.json({ success: true, data: webhooks });
}

async function hashSecret(secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateWebhookSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}