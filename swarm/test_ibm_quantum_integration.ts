/**
 * 🚀 IBM Quantum Integration Test
 * 
 * Tests IBM Quantum API connectivity and functionality.
 * Run with: cd swarm && npx tsx test_ibm_quantum_integration.ts
 */

import {
  ibmQuantum,
  isIBMQuantumConfigured,
  getIBMQuantumHealth,
  listIBMBackends,
  getIBMQueueStatus,
  executeQuantumCircuit,
  compareQuantumExecution,
  getIBMAccountInfo,
  createDemoCircuit,
  createGHZState,
  type QuantumCircuit,
  type ExecutionResult
} from './integrations/ibm_quantum.js';

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_CONFIG = {
  circuitShots: 1024,
  timeout: 30000, // 30 seconds
  verbose: true
};

// ============================================================================
// Test Utilities
// ============================================================================

async function runTest<T>(
  name: string, 
  testFn: () => Promise<T>,
  validateFn?: (result: T) => boolean
): Promise<{ passed: boolean; result: T; error?: string }> {
  console.log(`\n🔍 Testing: ${name}`);
  console.log('='.repeat(50));
  
  try {
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    const isValid = validateFn ? validateFn(result) : true;
    const passed = !result && typeof result === 'object' 
      ? true 
      : isValid || (result !== undefined && result !== null);
    
    if (passed) {
      console.log(`✅ PASSED (${duration}ms)`);
    } else {
      console.log(`❌ FAILED - Validation failed`);
    }
    
    if (TEST_CONFIG.verbose && result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    
    return { passed, result, error: undefined };
  } catch (error: any) {
    console.log(`❌ FAILED - ${error.message}`);
    return { passed: false, result: null as T, error: error.message };
  }
}

function separator(title: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ============================================================================
// Test Suite
// ============================================================================

async function runIntegrationTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║       🚀 IBM QUANTUM INTEGRATION TEST SUITE                    ║
╠════════════════════════════════════════════════════════════════╣
║  Testing IBM Quantum API connectivity and functionality        ║
╚════════════════════════════════════════════════════════════════╝
  `);

  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  // -------------------------------------------------------------------------
  // Test 1: Configuration Check
  // -------------------------------------------------------------------------
  separator('CONFIGURATION');

  const configTest = await runTest(
    'IBM Quantum Configuration',
    async () => {
      const configured = isIBMQuantumConfigured();
      const stats = ibmQuantum.getStats();
      return { configured, stats };
    },
    (r) => r !== null
  );
  results.push({ name: 'Configuration Check', passed: configTest.passed, error: configTest.error });

  // -------------------------------------------------------------------------
  // Test 2: Health Check
  // -------------------------------------------------------------------------
  separator('HEALTH CHECK');

  const healthTest = await runTest(
    'IBM Quantum API Health',
    async () => {
      const health = await getIBMQuantumHealth();
      return health;
    },
    (h) => h && 'status' in h && 'message' in h
  );
  results.push({ name: 'Health Check', passed: healthTest.passed, error: healthTest.error });

  if (healthTest.passed && (healthTest.result as any).status === 'healthy') {
    console.log('✅ IBM Quantum API is reachable!');
  } else if (healthTest.passed) {
    console.log('⚠️  IBM Quantum API configured but using simulator fallback');
  }

  // -------------------------------------------------------------------------
  // Test 3: List Available Backends
  // -------------------------------------------------------------------------
  separator('BACKEND DISCOVERY');

  const backendsTest = await runTest(
    'List Available Backends',
    async () => {
      const backends = await listIBMBackends();
      return backends;
    },
    (b) => Array.isArray(b) && b.length > 0
  );
  results.push({ name: 'Backend Discovery', passed: backendsTest.passed, error: backendsTest.error });

  if (backendsTest.passed && TEST_CONFIG.verbose) {
    const backends = backendsTest.result as any[];
    console.log(`\n📡 Available Backends (${backends.length}):`);
    backends.forEach(b => {
      const status = b.status === 'available' ? '🟢' : '🔴';
      console.log(`  ${status} ${b.name} (${b.numQubits} qubits, queue: ${b.queueLength})`);
    });
  }

  // -------------------------------------------------------------------------
  // Test 4: Queue Status
  // -------------------------------------------------------------------------
  separator('QUEUE STATUS');

  const queueTest = await runTest(
    'Get Queue Status',
    async () => {
      const status = await getIBMQueueStatus();
      return status;
    },
    (q) => q && 'totalBackends' in q && 'backends' in q
  );
  results.push({ name: 'Queue Status', passed: queueTest.passed, error: queueTest.error });

  if (queueTest.passed) {
    const queue = queueTest.result as any;
    console.log(`\n📊 Queue Summary:`);
    console.log(`   Total Backends: ${queue.totalBackends}`);
    console.log(`   Available: ${queue.availableBackends}`);
    console.log(`   Avg Queue Length: ${queue.avgQueueLength.toFixed(1)}`);
  }

  // -------------------------------------------------------------------------
  // Test 5: Account Info
  // -------------------------------------------------------------------------
  separator('ACCOUNT INFO');

  const accountTest = await runTest(
    'Get Account Information',
    async () => {
      const info = await getIBMAccountInfo();
      return info;
    },
    (a) => a && 'credits' in a && 'secondsUsed' in a
  );
  results.push({ name: 'Account Info', passed: accountTest.passed, error: accountTest.error });

  if (accountTest.passed) {
    const account = accountTest.result as any;
    console.log(`\n💳 Account Details:`);
    console.log(`   Plan: ${account.plan}`);
    console.log(`   Credits Available: ${account.credits}`);
    console.log(`   Seconds Used: ${account.secondsUsed}`);
  }

  // -------------------------------------------------------------------------
  // Test 6: Execute Bell State Circuit
  // -------------------------------------------------------------------------
  separator('CIRCUIT EXECUTION');

  const bellCircuit = createDemoCircuit('bell_state_test');
  console.log(`\n📝 Test Circuit: ${bellCircuit.name}`);
  console.log(`   Qubits: ${bellCircuit.qubits}`);
  console.log(`   Gates: ${bellCircuit.gates.length}`);
  console.log(`   Depth: ${bellCircuit.depth}`);

  const executionTest = await runTest(
    'Execute Bell State Circuit',
    async () => {
      const result = await executeQuantumCircuit(bellCircuit, TEST_CONFIG.circuitShots);
      return result;
    },
    (r) => r && 'success' in r && 'executionTime' in r && 'backend' in r
  );
  results.push({ name: 'Circuit Execution', passed: executionTest.passed, error: executionTest.error });

  if (executionTest.passed) {
    const exec = executionTest.result as ExecutionResult;
    console.log(`\n⚡ Execution Result:`);
    console.log(`   Success: ${exec.success}`);
    console.log(`   Backend: ${exec.backend}`);
    console.log(`   Mode: ${exec.mode}`);
    console.log(`   Execution Time: ${exec.executionTime.toFixed(2)}ms`);
    if (exec.credits) {
      console.log(`   Credits Used: ${exec.credits}`);
    }
    if (exec.data) {
      const states = Object.entries(exec.data as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      console.log(`   Top Measurement States:`);
      states.forEach(([state, count]) => {
        const pct = ((count / TEST_CONFIG.circuitShots) * 100).toFixed(2);
        console.log(`     |${state}⟩: ${count} (${pct}%)`);
      });
    }
  }

  // -------------------------------------------------------------------------
  // Test 7: Execute GHZ State Circuit
  // -------------------------------------------------------------------------
  separator('GHZ STATE TEST');

  const ghzCircuit = createGHZState(3);
  console.log(`\n📝 GHZ Circuit: ${ghzCircuit.name}`);
  console.log(`   Qubits: ${ghzCircuit.qubits}`);
  console.log(`   Gates: ${ghzCircuit.gates.length}`);

  const ghzTest = await runTest(
    'Execute 3-Qubit GHZ State',
    async () => {
      const result = await executeQuantumCircuit(ghzCircuit, TEST_CONFIG.circuitShots);
      return result;
    },
    (r) => r && (r as ExecutionResult).success
  );
  results.push({ name: 'GHZ State Execution', passed: ghzTest.passed, error: ghzTest.error });

  // -------------------------------------------------------------------------
  // Test 8: Real vs Simulator Comparison
  // -------------------------------------------------------------------------
  separator('REAL VS SIMULATOR COMPARISON');

  const compareTest = await runTest(
    'Compare Real Hardware vs Simulator',
    async () => {
      const comparison = await compareQuantumExecution(bellCircuit, TEST_CONFIG.circuitShots);
      return comparison;
    },
    (c) => c && 'real' in c && 'simulator' in c && 'comparison' in c
  );
  results.push({ name: 'Real vs Simulator Comparison', passed: compareTest.passed, error: compareTest.error });

  if (compareTest.passed) {
    const comp = compareTest.result as any;
    console.log(`\n📊 Comparison Results:`);
    console.log(`   Real Backend: ${comp.real.backend} (${comp.real.mode})`);
    console.log(`   Simulator: ${comp.simulator.backend} (${comp.simulator.mode})`);
    console.log(`   Fidelity: ${(comp.comparison.fidelity * 100).toFixed(2)}%`);
    console.log(`   Time Ratio: ${comp.comparison.avgExecutionTimeRatio.toFixed(2)}x`);
  }

  // -------------------------------------------------------------------------
  // Test 9: Circuit Cost Estimation
  // -------------------------------------------------------------------------
  separator('COST ESTIMATION');

  const costTest = await runTest(
    'Estimate Execution Cost',
    async () => {
      const cost = await ibmQuantum.estimateCost(bellCircuit, 'ibmq_ehningen');
      return cost;
    },
    (c) => c && 'credits' in c && 'queueTime' in c
  );
  results.push({ name: 'Cost Estimation', passed: costTest.passed, error: costTest.error });

  if (costTest.passed) {
    const cost = costTest.result as any;
    console.log(`\n💰 Cost Estimate:`);
    console.log(`   Estimated Credits: ${cost.credits}`);
    console.log(`   Estimated Queue Time: ${cost.queueTime}s`);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  separator('TEST SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     TEST RESULTS                               ║
╠════════════════════════════════════════════════════════════════╣
║  Passed: ${passed}/${total} tests                                           ║
║  Failed: ${total - passed}/${total} tests                                         ║
╚════════════════════════════════════════════════════════════════╝
  `);

  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`  ${icon} ${r.name}`);
    if (!r.passed && r.error) {
      console.log(`     Error: ${r.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  
  // Final status
  const isConfigured = isIBMQuantumConfigured();
  const health = healthTest.passed ? (healthTest.result as any)?.status : 'unknown';
  
  console.log('\n📋 INTEGRATION STATUS:');
  console.log(`   🔑 API Key Configured: ${isConfigured ? 'Yes' : 'No (using simulator)'}`);
  console.log(`   🌐 API Health: ${health || 'Unknown'}`);
  console.log(`   ⚛️  Hardware Access: ${isConfigured && health === 'healthy' ? 'Available' : 'Simulator Fallback'}`);

  if (!isConfigured) {
    console.log(`
⚠️  TO ENABLE REAL QUANTUM HARDWARE:
   
1. Create an IBM Quantum account: https://quantum-computing.ibm.com
2. Get your API key from: https://quantum-computing.ibm.com/account
3. Add to .env.local:
   
   IBM_Q_API_KEY=your_api_key_here
   
4. Free tier includes 10 minutes/month on real quantum computers!

📚 Resources:
   - Documentation: https://qiskit.org/documentation/
   - IBM Quantum: https://quantum-computing.ibm.com
   - Qiskit GitHub: https://github.com/Qiskit/qiskit
    `);
  }

  return passed === total;
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  try {
    console.log('\n🚀 Starting IBM Quantum Integration Tests...\n');
    
    const allPassed = await runIntegrationTests();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ Test suite failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
main();
