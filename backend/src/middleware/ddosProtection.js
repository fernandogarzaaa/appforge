/**
 * DDoS Protection Middleware
 * Lightweight burst protection + request size controls
 */

const WINDOW_MS = parseInt(process.env.DDOS_WINDOW_MS || '10000', 10); // 10s
const MAX_REQUESTS = parseInt(process.env.DDOS_MAX_REQUESTS || '120', 10); // per window
const BLOCK_DURATION_MS = parseInt(process.env.DDOS_BLOCK_MS || '60000', 10); // 60s

const ipCounters = new Map();
const blockedIps = new Map();

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

function ddosProtection(req, res, next) {
  const ip = getIp(req);
  const now = Date.now();

  const blockedUntil = blockedIps.get(ip);
  if (blockedUntil && blockedUntil > now) {
    res.setHeader('Retry-After', Math.ceil((blockedUntil - now) / 1000));
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Your IP has been temporarily blocked due to excessive traffic.'
    });
  }

  const entry = ipCounters.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  ipCounters.set(ip, entry);

  if (entry.count > MAX_REQUESTS) {
    blockedIps.set(ip, now + BLOCK_DURATION_MS);
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Traffic threshold exceeded. Please retry later.'
    });
  }

  next();
}

module.exports = ddosProtection;
