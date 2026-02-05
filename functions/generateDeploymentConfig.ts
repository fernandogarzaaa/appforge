import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deployment_description, project_id } = await req.json();

    if (!deployment_description) {
      return Response.json({ error: 'Deployment description required' }, { status: 400 });
    }

    const deploymentPrompt = `You are a DevOps expert. Generate a complete deployment configuration based on this description:

DEPLOYMENT REQUEST:
${deployment_description}

Generate comprehensive deployment setup including:

1. **Infrastructure**: Cloud provider, server specs, regions
2. **CI/CD Pipeline**: GitHub Actions / GitLab CI configuration
3. **Docker Setup**: Dockerfile and docker-compose if needed
4. **Database Setup**: Migration scripts, connection config
5. **Environment Variables**: Required env vars with descriptions
6. **Deployment Scripts**: Shell scripts for automated deployment
7. **Monitoring**: Health checks, logging, alerting setup

Return JSON with this structure:
{
  "deployment_plan": {
    "provider": "string",
    "estimated_cost": "string",
    "setup_time": "string",
    "summary": "string"
  },
  "infrastructure": {
    "provider": "deno_deploy|vercel|aws|gcp|azure",
    "region": "string",
    "server_specs": "string",
    "database": "postgresql|mongodb|mysql|none",
    "storage": "s3|gcs|azure_blob|none"
  },
  "ci_cd_pipeline": {
    "provider": "github_actions|gitlab_ci|jenkins",
    "config_file": "full YAML/config content",
    "triggers": ["on_push", "on_pull_request"],
    "steps": ["string"]
  },
  "docker_config": {
    "dockerfile": "full Dockerfile content",
    "docker_compose": "full docker-compose.yml content",
    "build_args": ["string"]
  },
  "database_setup": {
    "migration_script": "SQL script content",
    "connection_config": "configuration object",
    "backup_strategy": "string"
  },
  "environment_variables": [
    {
      "key": "string",
      "description": "string",
      "required": true,
      "example": "string"
    }
  ],
  "deployment_scripts": [
    {
      "name": "string",
      "description": "string",
      "script": "shell script content"
    }
  ],
  "monitoring": {
    "health_check_endpoint": "string",
    "logging_setup": "string",
    "alert_rules": ["string"]
  },
  "security": {
    "ssl_setup": "string",
    "firewall_rules": ["string"],
    "secrets_management": "string"
  },
  "instructions": ["string"]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: deploymentPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          deployment_plan: { type: "object" },
          infrastructure: { type: "object" },
          ci_cd_pipeline: { type: "object" },
          docker_config: { type: "object" },
          database_setup: { type: "object" },
          environment_variables: { type: "array" },
          deployment_scripts: { type: "array" },
          monitoring: { type: "object" },
          security: { type: "object" },
          instructions: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Save deployment config
    const deployment = await base44.entities.AgentDeployment.create({
      project_id: project_id || null,
      user_id: user.email,
      deployment_description,
      config: result,
      status: 'configured',
      created_by: user.email
    });

    return Response.json({
      success: true,
      deployment_id: deployment.id,
      config: result
    });

  } catch (error) {
    console.error('Deployment generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});