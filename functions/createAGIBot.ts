import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            name, 
            purpose, 
            integrations = [],
            offlineMode = true,
            autonomyLevel = 'high'
        } = await req.json();

        if (!name || !purpose) {
            return Response.json({ 
                error: 'Name and purpose are required' 
            }, { status: 400 });
        }

        // Generate AGI bot configuration using AI
        const botConfig = await base44.integrations.Core.InvokeLLM({
            prompt: `Create an advanced AGI assistant configuration for the following purpose:

Name: ${name}
Purpose: ${purpose}
Requested Integrations: ${integrations.join(', ') || 'none specified'}
Offline Mode: ${offlineMode}
Autonomy Level: ${autonomyLevel}

Generate a comprehensive bot configuration with:
1. Detailed instructions for autonomous operation
2. Tool configurations (entities it can access)
3. Integration strategies for the requested services
4. Workflow templates for common tasks
5. Offline caching strategies
6. Proactive automation suggestions

Return JSON with:
{
  "instructions": "detailed AGI instructions",
  "tool_entities": ["Entity1", "Entity2"],
  "integration_plan": [
    {
      "service": "service name",
      "purpose": "why this integration",
      "endpoints": ["endpoint1", "endpoint2"],
      "auth_type": "api_key|oauth|none"
    }
  ],
  "workflows": [
    {
      "name": "workflow name",
      "trigger": "when to execute",
      "steps": ["step1", "step2"]
    }
  ],
  "offline_strategies": ["strategy1", "strategy2"],
  "personality": "bot personality description"
}`,
            response_json_schema: {
                type: "object",
                properties: {
                    instructions: { type: "string" },
                    tool_entities: { type: "array", items: { type: "string" } },
                    integration_plan: { type: "array" },
                    workflows: { type: "array" },
                    offline_strategies: { type: "array" },
                    personality: { type: "string" }
                }
            }
        });

        // Create chatbot entity
        const chatbot = await base44.asServiceRole.entities.Chatbot.create({
            name,
            description: purpose,
            type: 'custom',
            personality: {
                tone: 'professional',
                style: botConfig.personality || 'Advanced AGI assistant with autonomous capabilities',
                language: 'English',
                system_prompt: botConfig.instructions
            },
            channels: {
                whatsapp_enabled: true,
                email_enabled: true,
                website_enabled: true,
                api_enabled: true
            },
            metadata: {
                agi_mode: true,
                autonomy_level: autonomyLevel,
                offline_enabled: offlineMode,
                tool_entities: botConfig.tool_entities,
                integration_plan: botConfig.integration_plan,
                workflows: botConfig.workflows,
                offline_strategies: botConfig.offline_strategies
            }
        });

        // Create integration records for requested services
        const createdIntegrations = [];
        for (const integrationPlan of (botConfig.integration_plan || [])) {
            try {
                const integration = await base44.asServiceRole.entities.Integration.create({
                    name: `${name} - ${integrationPlan.service}`,
                    type: integrationPlan.service.toLowerCase(),
                    config: {
                        purpose: integrationPlan.purpose,
                        endpoints: integrationPlan.endpoints,
                        auth_type: integrationPlan.auth_type
                    },
                    status: 'pending_setup'
                });
                createdIntegrations.push(integration);
            } catch (intError) {
                console.error(`Failed to create integration for ${integrationPlan.service}:`, intError);
            }
        }

        // Create suggested workflows as automations
        const createdWorkflows = [];
        for (const workflow of (botConfig.workflows || []).slice(0, 3)) {
            try {
                const automation = await base44.asServiceRole.entities.Automation.create({
                    name: workflow.name,
                    trigger: workflow.trigger,
                    steps: workflow.steps,
                    status: 'draft',
                    metadata: {
                        chatbot_id: chatbot.id,
                        auto_generated: true
                    }
                });
                createdWorkflows.push(automation);
            } catch (workflowError) {
                console.error(`Failed to create workflow ${workflow.name}:`, workflowError);
            }
        }

        return Response.json({
            success: true,
            chatbot,
            integrations: createdIntegrations,
            workflows: createdWorkflows,
            config: botConfig,
            next_steps: [
                'Configure API keys for integrations',
                'Test the bot in sandbox mode',
                'Enable desired communication channels',
                'Customize workflows as needed',
                'Deploy to production'
            ],
            whatsapp_url: `https://base44.app/agents/${chatbot.id}/whatsapp`
        });

    } catch (error) {
        console.error('AGI bot creation error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});