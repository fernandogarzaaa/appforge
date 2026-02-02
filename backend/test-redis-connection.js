#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Tests if Redis is available and working properly
 * Usage: node test-redis-connection.js
 */

import redis from 'ioredis';

async function testRedis() {
  console.log('\n🧪 Testing Redis Connection...\n');

  const tests = [
    { host: 'localhost', port: 6379, name: 'Local Default' },
    { host: '127.0.0.1', port: 6379, name: 'Localhost IP' },
    { url: process.env.REDIS_URL, name: 'Environment REDIS_URL' }
  ];

  for (const config of tests) {
    const testName = config.name;
    const testConfig = config.url ? { url: config.url } : { host: config.host, port: config.port };
    
    try {
      console.log(`Testing: ${testName}...`);
      
      const client = new redis(testConfig);
      
      // Set timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );

      const pongPromise = client.ping();
      const response = await Promise.race([pongPromise, timeoutPromise]);

      if (response === 'PONG') {
        console.log(`  ✅ Connected successfully!`);
        
        // Get info
        const info = await client.info('server');
        const versionMatch = info.match(/redis_version:([^\r\n]+)/);
        if (versionMatch) {
          console.log(`  📊 Redis Version: ${versionMatch[1]}`);
        }

        // Get stats
        const dbSize = await client.dbsize();
        console.log(`  📦 Database Size: ${dbSize} keys\n`);
      }

      client.disconnect();
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}\n`);
    }
  }

  console.log('✅ Test complete!');
  console.log('\n💡 If all tests failed:');
  console.log('   1. Run: docker-compose up -d redis');
  console.log('   2. Or install Memurai: https://www.memurai.com');
  console.log('   3. Or run: .\setup-redis-advanced.ps1 -Method auto\n');
}

testRedis().catch(console.error);
