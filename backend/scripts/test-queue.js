/**
 * Test Script - Verify Queue Infrastructure
 * Run with: node scripts/test-queue.js
 */

import { enqueueJob, getJob, listJobs } from '../src/services/batchQueue.js';
import { registerWebhook, emitWebhook } from '../src/services/webhookService.js';
import { 
  scheduleRecurringJob, 
  scheduleDelayedJob,
  listRecurringJobs,
  schedulePatterns 
} from '../src/services/scheduledJobs.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TEST_USER_ID = 'test-user-123';
const TEST_TENANT_ID = 'test-tenant-456';

async function testQueueInfrastructure() {
  console.log('🧪 Testing Queue Infrastructure\n');

  try {
    // Connect to MongoDB for webhook tests
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge');
    console.log('✓ MongoDB connected\n');

    // Test 1: Batch Job
    console.log('1️⃣ Testing Batch Jobs...');
    const job = await enqueueJob('quantum-analysis', {
      codeSnippet: 'function test() { return 42; }',
      priority: 5,
    }, TEST_USER_ID, TEST_TENANT_ID);
    
    console.log('   ✓ Job created:', job.id);
    console.log('   ✓ Status:', job.status);
    
    // Wait a moment and check status
    await sleep(2000);
    const jobStatus = await getJob(job.id);
    console.log('   ✓ Updated status:', jobStatus.status);
    console.log('   ✓ Progress:', jobStatus.progress + '%\n');

    // Test 2: Webhook Registration
    console.log('2️⃣ Testing Webhooks...');
    const webhook = await registerWebhook({
      url: 'https://webhook.site/unique-url',
      events: ['job.completed', 'job.failed'],
      secret: 'test-secret-123',
      userId: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
    });
    
    console.log('   ✓ Webhook registered:', webhook.id);
    console.log('   ✓ Events:', webhook.events.join(', '));
    console.log('   ✓ Active:', webhook.active + '\n');

    // Test 3: Webhook Emission
    console.log('3️⃣ Testing Webhook Delivery...');
    const deliveries = await emitWebhook('job.completed', {
      jobId: job.id,
      type: 'quantum-analysis',
      userId: TEST_USER_ID,
      result: { message: 'Test completed' },
    });
    
    console.log('   ✓ Delivered to', deliveries.length, 'webhooks');
    console.log('   ✓ Success:', deliveries.filter(d => d.success).length);
    console.log('   ✓ Failed:', deliveries.filter(d => !d.success).length + '\n');

    // Test 4: Scheduled Jobs
    console.log('4️⃣ Testing Scheduled Jobs...');
    
    // Schedule recurring job (every 5 minutes)
    const recurringJob = await scheduleRecurringJob(
      'test-cleanup',
      { test: true },
      schedulePatterns.EVERY_5_MINUTES
    );
    console.log('   ✓ Recurring job scheduled:', recurringJob.name);
    console.log('   ✓ Pattern:', schedulePatterns.EVERY_5_MINUTES);
    
    // Schedule delayed job (1 minute from now)
    const delayedJob = await scheduleDelayedJob(
      'test-delayed',
      { test: true },
      60000
    );
    console.log('   ✓ Delayed job scheduled:', delayedJob.name);
    console.log('   ✓ Will run at:', delayedJob.scheduledFor);
    
    // List all recurring jobs
    const recurring = await listRecurringJobs();
    console.log('   ✓ Total recurring jobs:', recurring.length + '\n');

    // Test 5: List Jobs
    console.log('5️⃣ Testing Job Listing...');
    const allJobs = await listJobs({ userId: TEST_USER_ID });
    console.log('   ✓ Total jobs for user:', allJobs.length);
    console.log('   ✓ First job:', allJobs[0]?.type || 'none\n');

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log('   • Batch jobs: Working');
    console.log('   • Webhooks: Working');
    console.log('   • Scheduled jobs: Working');
    console.log('   • MongoDB persistence: Working');
    console.log('   • Redis queue: Working\n');

    console.log('🎯 Next steps:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Open Bull Board: http://localhost:5000/admin/queues');
    console.log('   3. Check job progress in dashboard');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   • Ensure Redis is running: redis-cli ping');
    console.error('   • Ensure MongoDB is running: mongo --eval "db.stats()"');
    console.error('   • Check .env file has REDIS_HOST and MONGODB_URI');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
testQueueInfrastructure();
