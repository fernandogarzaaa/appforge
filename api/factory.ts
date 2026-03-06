// Vercel API route for /api/factory/start
// Converted from server.ts - Factory mass production trigger

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.VITE_BASE44_API_KEY || 'appforge_local_dev_key';
  
  if (apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { runFactory } = await import('../src/swarm/factory.js');
    runFactory();
    
    return res.status(200).json({ status: 'Factory Started' });
  } catch (error) {
    console.error('Factory error:', error);
    return res.status(500).json({ error: 'Factory start failed' });
  }
}
