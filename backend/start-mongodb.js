/**
 * Start MongoDB Memory Server for Development/Testing
 * 
 * This script starts an in-memory MongoDB instance that the backend can connect to.
 * Perfect for testing persistence without installing MongoDB.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startMemoryMongo() {
  console.log('🚀 Starting MongoDB Memory Server...\n');

  try {
    // Create MongoDB instance
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'appforge'
      }
    });

    const uri = mongoServer.getUri();
    console.log('✅ MongoDB Memory Server started successfully!');
    console.log(`📍 Connection URI: ${uri}`);
    console.log(`🔌 Port: 27017`);
    console.log(`📊 Database: appforge`);
    console.log(`\n⚠️  Note: This is an in-memory database. Data will be lost when stopped.\n`);

    // Update .env file with the connection string
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add MONGODB_URI
      if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(
          /MONGODB_URI=.*/,
          `MONGODB_URI=${uri}appforge`
        );
      } else {
        envContent += `\nMONGODB_URI=${uri}appforge\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env with MongoDB URI\n');
    }

    console.log('📖 Instructions:');
    console.log('   1. Keep this terminal open (MongoDB is running)');
    console.log('   2. In another terminal, run: cd backend && npm start');
    console.log('   3. Backend will connect to this MongoDB instance');
    console.log('\n   Press Ctrl+C to stop MongoDB\n');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping MongoDB Memory Server...');
      await mongoServer.stop();
      console.log('✅ MongoDB stopped. Goodbye!');
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Failed to start MongoDB Memory Server:', error);
    process.exit(1);
  }
}

startMemoryMongo();
