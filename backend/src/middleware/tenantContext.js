/**
 * Multi-tenancy Context Middleware
 * Extracts tenant ID from header or subdomain
 */

function tenantContext(req, res, next) {
  const headerTenant = req.headers['x-tenant-id'];
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];

  const tenantId = headerTenant || (subdomain && subdomain !== 'localhost' ? subdomain : 'default');

  req.tenant = {
    id: tenantId,
    source: headerTenant ? 'header' : 'subdomain'
  };

  res.setHeader('x-tenant-id', tenantId);
  next();
}

function requireTenant(req, res, next) {
  if (!req.tenant?.id || req.tenant.id === 'default') {
    return res.status(400).json({
      error: 'Tenant required',
      message: 'Missing tenant context. Provide x-tenant-id header or subdomain.'
    });
  }
  next();
}

module.exports = tenantContext;
