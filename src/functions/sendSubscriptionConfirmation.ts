import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logger } from './utils/logger.ts';

const planDetails = {
  'price_1StWdZ8rNvlz2v0BtngMRUyS': {
    name: 'Basic',
    price: 20,
    features: 'Up to 10 workflows, Basic automation, Email support, Monthly reports, 1 GB storage'
  },
  'price_1StWdZ8rNvlz2v0BV7sIV4A9': {
    name: 'Pro',
    price: 30,
    features: 'Unlimited workflows, Advanced automation, Priority support, Weekly reports, 50 GB storage, Custom integrations'
  },
  'price_1StWdZ8rNvlz2v0BSl7yx4v7': {
    name: 'Premium',
    price: 99,
    features: 'Everything in Pro, Dedicated support, Real-time analytics, Unlimited storage, API access, Custom workflows, White-label options'
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, priceId, email } = await req.json();

    if (!email || !priceId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const plan = planDetails[priceId];

    if (!plan) {
      console.error('Unknown price ID:', priceId);
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const emailBody = `
Hello ${user.full_name || 'there'},

Thank you for subscribing to the ${plan.name} plan! Your subscription is now active.

📋 Subscription Details
Plan: ${plan.name}
Price: $${plan.price}/month
Email: ${email}
Session ID: ${sessionId}

✨ Your Plan Includes:
${plan.features}

💳 Billing Information
Your card will be charged $${plan.price} on the same day each month. You can manage or cancel your subscription anytime from your account settings.

If you have any questions, feel free to reach out to our support team.

Best regards,
The Team
    `.trim();

    // Send confirmation email using Base44 integration
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `Welcome to the ${plan.name} Plan!`,
      body: emailBody,
      from_name: 'Subscription Team'
    });

    logger.info(`Confirmation email sent to ${email} for ${plan.name} plan`);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Send confirmation email error:', error);
    // Don't fail the checkout if email fails - just log it
    return Response.json({ success: false, warning: error.message }, { status: 200 });
  }
});