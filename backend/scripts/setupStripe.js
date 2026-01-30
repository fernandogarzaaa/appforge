/**
 * Stripe Setup Script
 * Run this once to create subscription products and prices in Stripe
 * 
 * Usage: node scripts/setupStripe.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import StripeService from '../src/services/stripeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function setupStripe() {
  console.log('🚀 Setting up Stripe products and prices...\n');
  
  try {
    // Create or fetch all subscription prices
    const prices = await StripeService.createStripePrices();
    
    console.log('✅ Stripe setup complete!\n');
    console.log('📋 Created/Found Prices:\n');
    
    Object.entries(prices).forEach(([tier, priceId]) => {
      console.log(`  ${tier.padEnd(15)} → ${priceId}`);
    });
    
    console.log('\n💡 Next Steps:');
    console.log('  1. Update your .env file with the price IDs above (optional)');
    console.log('  2. Setup webhook endpoint in Stripe Dashboard');
    console.log('  3. Test subscription flow with test cards');
    console.log('  4. Go live! 🎉\n');
    
  } catch (error) {
    console.error('❌ Error setting up Stripe:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  - Check your STRIPE_SECRET_KEY in .env');
    console.error('  - Make sure you\'re using the correct API key (test vs live)');
    console.error('  - Verify you have internet connection');
    process.exit(1);
  }
}

setupStripe();
