export interface RedisConfig {
  url: string;
  token: string;
}

function readRedisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }

  return { url, token };
}

async function redisRequest(path: string, options: RequestInit = {}): Promise<any> {
  const config = readRedisConfig();
  if (!config) {
    return null;
  }

  const response = await fetch(`${config.url}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Redis request failed (${response.status}) ${path}: ${details}`);
  }

  return response.json();
}

export async function getRedisValue<T = unknown>(key: string): Promise<T | null> {
  const payload = await redisRequest(`/get/${key}`, { method: 'GET' });
  const raw = payload?.result;

  if (raw == null) {
    return null;
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  return raw as T;
}

export async function setRedisValue(key: string, value: unknown): Promise<void> {
  await redisRequest(`/set/${key}`, {
    method: 'POST',
    body: JSON.stringify(value)
  });
}

export async function appendRedisList(key: string, value: unknown): Promise<void> {
  await redisRequest(`/rpush/${key}`, {
    method: 'POST',
    body: JSON.stringify(value)
  });
}

export async function popRedisList<T = unknown>(key: string): Promise<T | null> {
  const payload = await redisRequest(`/lpop/${key}`, { method: 'GET' });
  const raw = payload?.result;

  if (raw == null) {
    return null;
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  return raw as T;
}
