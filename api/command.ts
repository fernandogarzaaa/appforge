// Vercel API route for /api/command
// Converted from server.ts - Swarm task execution

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple API key check
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.VITE_BASE44_API_KEY || 'appforge_local_dev_key';
  
  if (apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { task, mode } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  // Execute swarm task (fire and forget for serverless)
  try {
    // Dynamic import to avoid issues
    const { runSwarmTask } = await import('../src/swarm/orchestrator.js');
    runSwarmTask(task, mode).catch((err) => console.error('Swarm error:', err));
    
    return res.status(200).json({ status: 'Swarm Activated', task, mode });
  } catch (error) {
    console.error('Swarm task error:', error);
    return res.status(500).json({ error: 'Task execution failed' });
  }
}
