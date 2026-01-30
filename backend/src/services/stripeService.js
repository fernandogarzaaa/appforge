/**
 * Stripe Integration Service
 * Handles subscription management and payment processing
 * Updated: January 2026
 */

import Stripe from 'stripe';
import SubscriptionTierCalculator from './subscriptionTierCalculator.js';
import { CreditManager } from '../models/UserCredits.js';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const calculator = new SubscriptionTierCalculator(0.80); // 80% profit margin

/**
 * Stripe Service
 */
class StripeService {
  /**
   * Create Stripe customer
   */
  static async createCustomer(userId, email, name) {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString()
      }
    });

    return customer;
  }

  /**
   * Create subscription for user
   */
  static async createSubscription(customerId, priceId, tierName) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    return subscription;
  }

  /**
   * Get Stripe prices for tiers
   * IMPORTANT: These need to be created in Stripe Dashboard first
   * Or use this function to create them dynamically
   */
  static async createStripePrices() {
    const tiers = calculator.generateTiers();
    const prices = {};

    // Get or create product
    let product = await stripe.products.search({
      query: `name:"AppForge Credits"`
    }).then(res => res.data[0]);

    if (!product) {
      product = await stripe.products.create({
        name: 'AppForge Credits',
        description: 'API Credits for AppForge Platform',
        type: 'service'
      });
    }

    // Create prices for each tier
    for (const [tierKey, tierData] of Object.entries(tiers)) {
      if (tierData.price === 0) continue; // Skip free tier

      try {
        // Check if price exists
        const existingPrice = await stripe.prices.search({
          query: `product:"${product.id}" AND active:"true" AND metadata["tier"]:"${tierKey}"`
        }).then(res => res.data[0]);

        if (existingPrice) {
          prices[tierKey] = existingPrice.id;
          continue;
        }

        // Create new price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(tierData.price * 100), // Convert to cents
          currency: 'usd',
          recurring: {
            interval: 'month',
            interval_count: 1
          },
          metadata: {
            tier: tierKey,
            credits: this.calculateCreditsForPrice(tierData.price)
          }
        });

        prices[tierKey] = price.id;
      } catch (error) {
        console.error(`Error creating price for ${tierKey}:`, error);
      }
    }

    return prices;
  }

  /**
   * Calculate credits allocated for monthly payment
   */
  static calculateCreditsForPrice(monthlyPrice) {
    // Based on 80% profit margin, remaining 20% is available for API costs
    // Convert monthly price to monthly API budget
    const monthlyApiAllowance = monthlyPrice * 0.20;
    
    // Each "credit" = $0.001, so multiply by 1000
    return Math.round(monthlyApiAllowance * 1000);
  }

  /**
   * Handle subscription created webhook
   */
  static async handleSubscriptionCreated(subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const tierName = this.extractTierFromSubscription(subscription);
    const tier = calculator.generateTiers()[tierName];

    if (tier) {
      const credits = this.calculateCreditsForPrice(tier.price);
      await CreditManager.addCredits(
        userId,
        credits,
        tierName,
        subscription.id
      );
    }
  }

  /**
   * Handle subscription updated webhook
   */
  static async handleSubscriptionUpdated(subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const tierName = this.extractTierFromSubscription(subscription);
    const tier = calculator.generateTiers()[tierName];

    if (tier) {
      const credits = this.calculateCreditsForPrice(tier.price);
      await CreditManager.addCredits(
        userId,
        credits,
        tierName,
        subscription.id
      );
    }
  }

  /**
   * Handle subscription deleted webhook
   */
  static async handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const { UserCredits } = await import('../models/UserCredits.js');
    const credits = await UserCredits.findOne({ userId });

    if (credits) {
      credits.subscriptionTier = 'free';
      credits.paymentStatus = 'cancelled';
      await credits.save();
    }
  }

  /**
   * Extract tier name from Stripe subscription
   */
  static extractTierFromSubscription(subscription) {
    const item = subscription.items?.data?.[0];
    if (!item?.price?.metadata?.tier) {
      return 'free';
    }
    return item.price.metadata.tier;
  }

  /**
   * Handle payment failed webhook
   */
  static async handlePaymentFailed(invoice) {
    const userId = invoice.subscription_details?.metadata?.userId;
    if (!userId) return;

    const { UserCredits } = await import('../models/UserCredits.js');
    const credits = await UserCredits.findOne({ userId });

    if (credits) {
      credits.paymentStatus = 'past_due';
      await credits.save();
    }
  }

  /**
   * Handle payment succeeded webhook
   */
  static async handlePaymentSucceeded(invoice) {
    const userId = invoice.subscription_details?.metadata?.userId;
    if (!userId) return;

    const { UserCredits } = await import('../models/UserCredits.js');
    const credits = await UserCredits.findOne({ userId });

    if (credits) {
      credits.paymentStatus = 'active';
      await credits.save();
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscriptionDetails(subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    return subscription;
  }

  /**
   * Get invoice for subscription
   */
  static async getInvoices(customerId, limit = 12) {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
      expand: ['data.subscription']
    });
    return invoices.data;
  }

  /**
   * Create payment method from token
   */
  static async attachPaymentMethod(customerId, paymentMethodId) {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
    return paymentMethod;
  }
}

/**
 * Webhook Handler for Stripe events
 */
const handleStripeWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await StripeService.handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await StripeService.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await StripeService.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await StripeService.handlePaymentFailed(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await StripeService.handlePaymentSucceeded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
};

export { StripeService, handleStripeWebhook };
export default StripeService;
