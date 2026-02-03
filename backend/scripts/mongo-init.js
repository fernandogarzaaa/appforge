// MongoDB initialization script for production
// Creates users, indexes, and initial data

db = db.getSiblingDB('appforge');

// Create application user
db.createUser({
  user: 'appforge_user',
  pwd: 'REPLACE_WITH_SECURE_PASSWORD',
  roles: [
    {
      role: 'readWrite',
      db: 'appforge'
    }
  ]
});

// Create indexes for performance
print('Creating indexes...');

// UserState collection indexes
db.userstates.createIndex({ userId: 1 }, { unique: true });
db.userstates.createIndex({ updatedAt: -1 });
db.userstates.createIndex({ 'state.version': 1 });

// Analytics collection indexes
db.analytics.createIndex({ userId: 1, timestamp: -1 });
db.analytics.createIndex({ eventType: 1, timestamp: -1 });
db.analytics.createIndex({ timestamp: -1 });

// SyncLog collection indexes
db.synclogs.createIndex({ userId: 1, timestamp: -1 });
db.synclogs.createIndex({ stateKey: 1, timestamp: -1 });
db.synclogs.createIndex({ status: 1, timestamp: -1 });

// User collection indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ 'profile.organization': 1 });

print('Indexes created successfully');
