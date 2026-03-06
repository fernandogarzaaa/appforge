// Vercel API route for /api/telemetry
// Converted from server.ts - Telemetry sink
// Note: File operations removed for serverless (can add Vercel KV later)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.VITE_BASE44_API_KEY || 'appforge_local_dev_key';
  
  if (apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { metrics, activity } = req.body;

  try {
    // Log telemetry (in production, store in Vercel KV or database)
    console.log('[TELEMETRY] Metrics received:', metrics);
    console.log('[TELEMETRY] Activity:', activity);
    
    return res.status(200).json({ 
      status: 'Resonance Received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Telemetry error:', error);
    return res.status(500).json({ error: 'Telemetry failed' });
  }
}
