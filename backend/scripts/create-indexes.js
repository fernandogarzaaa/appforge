/**
 * MongoDB Indexes for Performance Optimization
 * Creates indexes on hot queries for faster lookups
 * 
 * Usage: node create-indexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appforge';

// Index definitions
const indexes = [
  {
    collection: 'users',
    indexes: [
      { keys: { email: 1 }, options: { unique: true, name: 'idx_users_email' } },
      { keys: { username: 1 }, options: { unique: true, sparse: true, name: 'idx_users_username' } },
      { keys: { createdAt: -1 }, options: { name: 'idx_users_created' } },
      { keys: { 'subscription.plan': 1, 'subscription.status': 1 }, options: { name: 'idx_users_subscription' } },
    ]
  },
  {
    collection: 'subscriptions',
    indexes: [
      { keys: { userId: 1 }, options: { name: 'idx_subscriptions_user' } },
      { keys: { userId: 1, status: 1 }, options: { name: 'idx_subscriptions_user_status' } },
      { keys: { status: 1, endDate: 1 }, options: { name: 'idx_subscriptions_status_end' } },
      { keys: { stripeCustomerId: 1 }, options: { sparse: true, name: 'idx_subscriptions_stripe_customer' } },
      { keys: { stripeSubscriptionId: 1 }, options: { sparse: true, name: 'idx_subscriptions_stripe_sub' } },
    ]
  },
  {
    collection: 'analytics',
    indexes: [
      { keys: { userId: 1, createdAt: -1 }, options: { name: 'idx_analytics_user_created' } },
      { keys: { createdAt: -1 }, options: { name: 'idx_analytics_created' } },
      { keys: { eventType: 1, createdAt: -1 }, options: { name: 'idx_analytics_event_created' } },
      { keys: { userId: 1, eventType: 1, createdAt: -1 }, options: { name: 'idx_analytics_user_event_created' } },
    ]
  },
  {
    collection: 'documents',
    indexes: [
      { keys: { ownerId: 1, createdAt: -1 }, options: { name: 'idx_documents_owner_created' } },
      { keys: { 'collaborators.userId': 1 }, options: { name: 'idx_documents_collaborators' } },
      { keys: { isPublic: 1, createdAt: -1 }, options: { sparse: true, name: 'idx_documents_public_created' } },
      { keys: { title: 'text', content: 'text' }, options: { name: 'idx_documents_text_search' } },
    ]
  },
  {
    collection: 'teams',
    indexes: [
      { keys: { ownerId: 1 }, options: { name: 'idx_teams_owner' } },
      { keys: { 'members.userId': 1 }, options: { name: 'idx_teams_members' } },
      { keys: { createdAt: -1 }, options: { name: 'idx_teams_created' } },
    ]
  },
  {
    collection: 'apikeys',
    indexes: [
      { keys: { userId: 1 }, options: { name: 'idx_apikeys_user' } },
      { keys: { key: 1 }, options: { unique: true, name: 'idx_apikeys_key' } },
      { keys: { isActive: 1, userId: 1 }, options: { name: 'idx_apikeys_active_user' } },
      { keys: { expiresAt: 1 }, options: { sparse: true, name: 'idx_apikeys_expires' } },
    ]
  },
  {
    collection: 'jobs',
    indexes: [
      { keys: { userId: 1, status: 1, createdAt: -1 }, options: { name: 'idx_jobs_user_status_created' } },
      { keys: { status: 1, createdAt: -1 }, options: { name: 'idx_jobs_status_created' } },
      { keys: { jobId: 1 }, options: { unique: true, name: 'idx_jobs_jobid' } },
      { keys: { completedAt: 1 }, options: { sparse: true, name: 'idx_jobs_completed' } },
    ]
  },
  {
    collection: 'webhooks',
    indexes: [
      { keys: { userId: 1 }, options: { name: 'idx_webhooks_user' } },
      { keys: { isActive: 1 }, options: { name: 'idx_webhooks_active' } },
      { keys: { events: 1, isActive: 1 }, options: { name: 'idx_webhooks_events_active' } },
    ]
  },
];

async function createIndexes() {
  console.log('🔄 Connecting to MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');
    
    let totalCreated = 0;
    let totalSkipped = 0;
    
    for (const { collection, indexes: collectionIndexes } of indexes) {
      console.log(`📊 Processing collection: ${collection}`);
      const db = mongoose.connection.db;
      const coll = db.collection(collection);
      
      // Get existing indexes
      const existingIndexes = await coll.indexes();
      const existingNames = existingIndexes.map(idx => idx.name);
      
      for (const { keys, options } of collectionIndexes) {
        const indexName = options.name;
        
        if (existingNames.includes(indexName)) {
          console.log(`  ⏭️  Skipped: ${indexName} (already exists)`);
          totalSkipped++;
        } else {
          try {
            await coll.createIndex(keys, options);
            console.log(`  ✅ Created: ${indexName}`);
            totalCreated++;
          } catch (error) {
            console.log(`  ❌ Failed: ${indexName} - ${error.message}`);
          }
        }
      }
      
      console.log('');
    }
    
    console.log('📊 Summary:');
    console.log(`  Created: ${totalCreated} indexes`);
    console.log(`  Skipped: ${totalSkipped} indexes (already exist)`);
    console.log(`  Total: ${totalCreated + totalSkipped} indexes`);
    console.log('');
    console.log('✅ Index creation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createIndexes();
}

export default createIndexes;
