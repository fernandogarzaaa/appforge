import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature_name, resource_type } = await req.json();

    // Get user's active subscription
    const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
      user_id: user.email,
      status: 'active'
    });

    if (subscriptions.length === 0) {
      return Response.json({ 
        has_access: false, 
        reason: 'No active subscription',
        upgrade_url: '/subscriptions'
      }, { status: 200 });
    }

    const subscription = subscriptions[0];

    // Get the plan details
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      id: subscription.plan_id
    });

    if (plans.length === 0) {
      return Response.json({ has_access: false, reason: 'Plan not found' }, { status: 200 });
    }

    const plan = plans[0];
    const usage = subscription.current_usage || {};

    // Check feature access based on resource type
    let has_access = true;
    let reason = 'Access granted';

    if (resource_type === 'agents' && plan.max_agents) {
      if ((usage.agents_created || 0) >= plan.max_agents) {
        has_access = false;
        reason = `Agent limit reached (${plan.max_agents})`;
      }
    } else if (resource_type === 'recommendations' && plan.max_recommendations_per_month) {
      if ((usage.recommendations_used || 0) >= plan.max_recommendations_per_month) {
        has_access = false;
        reason = `Recommendation limit reached (${plan.max_recommendations_per_month}/month)`;
      }
    } else if (resource_type === 'workflows' && plan.max_workflows_per_month) {
      if ((usage.workflows_used || 0) >= plan.max_workflows_per_month) {
        has_access = false;
        reason = `Workflow limit reached (${plan.max_workflows_per_month}/month)`;
      }
    } else if (resource_type === 'api_calls' && plan.max_api_calls_per_month) {
      if ((usage.api_calls_used || 0) >= plan.max_api_calls_per_month) {
        has_access = false;
        reason = `API call limit reached (${plan.max_api_calls_per_month}/month)`;
      }
    }

    // Check if feature is in plan
    if (feature_name && plan.features && !plan.features.includes(feature_name)) {
      has_access = false;
      reason = `Feature not included in ${plan.name} plan`;
    }

    return Response.json({
      has_access,
      reason,
      plan: {
        name: plan.name,
        tier: plan.tier
      },
      usage,
      limits: {
        max_agents: plan.max_agents,
        max_recommendations_per_month: plan.max_recommendations_per_month,
        max_workflows_per_month: plan.max_workflows_per_month,
        max_api_calls_per_month: plan.max_api_calls_per_month
      }
    });
  } catch (error) {
    console.error('Access check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});