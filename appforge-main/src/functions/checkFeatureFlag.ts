import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Simple hash function for consistent percentage-based rollout
function hashEmail(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flag_name } = await req.json();

    if (!flag_name) {
      return Response.json({ error: 'flag_name is required' }, { status: 400 });
    }

    // Get the feature flag
    const flags = await base44.entities.FeatureFlag.filter({ name: flag_name });
    
    if (flags.length === 0) {
      // Flag doesn't exist, default to disabled
      return Response.json({ enabled: false, reason: 'flag_not_found' }, { status: 200 });
    }

    const flag = flags[0];

    // Check if globally disabled
    if (!flag.enabled) {
      return Response.json({ enabled: false, reason: 'globally_disabled' }, { status: 200 });
    }

    // Check date constraints
    const now = new Date();
    if (flag.start_date && new Date(flag.start_date) > now) {
      return Response.json({ enabled: false, reason: 'not_started' }, { status: 200 });
    }
    if (flag.end_date && new Date(flag.end_date) < now) {
      return Response.json({ enabled: false, reason: 'expired' }, { status: 200 });
    }

    // Check if user is in target emails
    if (flag.target_user_emails && flag.target_user_emails.includes(user.email)) {
      return Response.json({ enabled: true, reason: 'targeted_user' }, { status: 200 });
    }

    // Check if user role is in target roles
    if (flag.target_roles && flag.target_roles.includes(user.role)) {
      return Response.json({ enabled: true, reason: 'targeted_role' }, { status: 200 });
    }

    // Check rollout percentage (consistent for same user)
    if (flag.rollout_percentage > 0) {
      const userHash = hashEmail(user.email);
      const userPercentile = (userHash % 100);
      
      if (userPercentile < flag.rollout_percentage) {
        return Response.json({ enabled: true, reason: 'rollout_percentage' }, { status: 200 });
      }
    }

    // Not enabled for this user
    return Response.json({ enabled: false, reason: 'not_in_rollout' }, { status: 200 });
  } catch (error) {
    console.error('Check feature flag error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});