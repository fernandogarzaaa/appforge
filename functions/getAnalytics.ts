import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [users, projects, agents, deployments] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Project.list(),
      base44.asServiceRole.entities.CustomAgent.list(),
      base44.asServiceRole.entities.AgentDeployment.list()
    ]);

    const analytics = {
      total_users: users.length,
      total_projects: projects.length,
      total_agents: agents.length,
      total_deployments: deployments.length,
      active_agents: agents.filter(a => a.is_active).length,
      active_deployments: deployments.filter(d => d.status === 'active').length,
      users_by_role: {
        admin: users.filter(u => u.role === 'admin').length,
        user: users.filter(u => u.role === 'user').length
      },
      projects_by_status: {
        draft: projects.filter(p => p.status === 'draft').length,
        development: projects.filter(p => p.status === 'development').length,
        published: projects.filter(p => p.status === 'published').length
      },
      timestamp: new Date().toISOString()
    };

    return Response.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});