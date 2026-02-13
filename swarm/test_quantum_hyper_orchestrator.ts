/**
 * 🧪 TEST SUITE: Quantum-Hyper Intelligence Orchestrator
 * 
 * Tests the unified integration layer to verify:
 * - Component initialization
 * - Orchestration flow execution
 * - Oracle validation
 * - Coherence monitoring
 */

import { QuantumHyperIntelligenceOrchestrator, quickOrchestrate, getOrchestratorStatus, getCoherenceMonitoring } from './core/quantum_hyper_intelligence_orchestrator.js';

async function runTests() {
    console.log('='.repeat(70));
    console.log('🧪 QUANTUM-HYPER INTELLIGENCE ORCHESTRATOR TEST SUITE');
    console.log('='.repeat(70));
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Orchestrator Initialization
    console.log('\n📋 Test 1: Orchestrator Initialization');
    try {
        const orchestrator = new QuantumHyperIntelligenceOrchestrator({
            coherenceTarget: 0.95,
            maxIterations: 5,
            enableOracleValidation: true,
            enableRealTimeLearning: true,
            ollamaModel: 'llama3'
        });
        
        const status = orchestrator.getStatus();
        console.log(`   ✅ Config: ${JSON.stringify(status.config)}`);
        console.log(`   ✅ Oracle Ready: ${status.oracleReady}`);
        console.log(`   ✅ Executions: ${status.executions}`);
        passed++;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
    }
    
    // Test 2: Quick Orchestration
    console.log('\n📋 Test 2: Quick Orchestration Execution');
    try {
        const result = await quickOrchestrate(
            'What are the key benefits of quantum computing?',
            'You are a helpful AI assistant with expertise in emerging technologies.'
        );
        
        console.log(`   ✅ Success: ${result.success}`);
        console.log(`   ✅ Coherence: ${(result.quantumAnalysis.coherence * 100).toFixed(2)}%`);
        console.log(`   ✅ Willow Boost: ${result.quantumAnalysis.willowBoost.toFixed(2)}x`);
        console.log(`   ✅ Oracle Validated: ${result.oracleValidation.isValidated}`);
        console.log(`   ✅ Execution Time: ${result.executionTime}ms`);
        passed++;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
    }
    
    // Test 3: Coherence Monitoring
    console.log('\n📋 Test 3: Coherence Monitoring');
    try {
        const monitoring = getCoherenceMonitoring();
        console.log(`   ✅ Current Coherence: ${(monitoring.currentCoherence * 100).toFixed(2)}%`);
        console.log(`   ✅ Average Coherence: ${(monitoring.averageCoherence * 100).toFixed(2)}%`);
        console.log(`   ✅ Trend: ${monitoring.coherenceTrend}`);
        console.log(`   ✅ History Length: ${monitoring.history.length}`);
        passed++;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
    }
    
    // Test 4: Full Orchestration with Custom Config
    console.log('\n📋 Test 4: Full Orchestration with Custom Config');
    try {
        const orchestrator = new QuantumHyperIntelligenceOrchestrator({
            coherenceTarget: 0.8,
            maxIterations: 3,
            enableOracleValidation: true,
            enableRealTimeLearning: false,
            ollamaModel: 'phi3'
        });
        
        const result = await orchestrator.orchestrate({
            user: 'Explain the concept of superposition in quantum mechanics',
            system: 'You are a physics education AI.',
            criteria: ['accuracy', 'clarity', 'completeness'],
            requiresOracle: true,
            coherenceTarget: 0.8
        });
        
        console.log(`   ✅ Success: ${result.success}`);
        console.log(`   ✅ Output Length: ${result.output.length} chars`);
        console.log(`   ✅ Hyper Overall: ${(result.hyperProcessing.overall * 100).toFixed(1)}%`);
        console.log(`   ✅ Oracle Confidence: ${(result.oracleValidation.confidence * 100).toFixed(1)}%`);
        passed++;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
    }
    
    // Test 5: Course Correction Trigger
    console.log('\n📋 Test 5: Course Correction Trigger');
    try {
        const orchestrator = new QuantumHyperIntelligenceOrchestrator();
        const correction = await orchestrator.triggerCourseCorrection('Low coherence detected');
        
        console.log(`   ✅ Correction Reason: ${correction.reason}`);
        console.log(`   ✅ Suggested Action: ${correction.suggestedAction}`);
        console.log(`   ✅ Confidence: ${(correction.confidence * 100).toFixed(1)}%`);
        passed++;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
    }
    
    // Test 6: Dynamic Configuration Update
    console.log('\n📋 Test 6: Dynamic Configuration Update');
    try {
        const orchestrator = new QuantumHyperIntelligenceOrchestrator();
        orchestrator.updateConfig({
            coherenceTarget: 0.99,
            maxIterations: 20,
            enableRealTimeLearning: true
        });
        
        const status = orchestrator.getStatus();
        console.log(`   ✅ Coherence Target: ${(status.config.coherenceTarget * 100).toFixed(0)}%`);
        console.log(`   ✅ Max Iterations: ${status.config.maxIterations}`);
        console.log(`   ✅ Real-time Learning: ${status.config.enableRealTimeLearning}`);
        passed++;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
    }
    
    // Test 7: Multiple Sequential Executions
    console.log('\n📋 Test 7: Multiple Sequential Executions');
    try {
        const orchestrator = new QuantumHyperIntelligenceOrchestrator({
            enableOracleValidation: false // Speed up tests
        });
        
        const queries = [
            'What is machine learning?',
            'How does neural network work?',
            'Explain deep learning concepts'
        ];
        
        for (const query of queries) {
            const result = await orchestrator.orchestrate({ user: query });
            console.log(`   📝 Query: "${query.substring(0, 30)}..." - Coherence: ${(result.quantumAnalysis.coherence * 100).toFixed(1)}%`);
        }
        
        const monitoring = orchestrator.getCoherenceMonitoring();
        console.log(`   ✅ Total Executions: ${monitoring.executionCount}`);
        passed++;
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        failed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));
    
    return { passed, failed };
}

// Run tests
runTests()
    .then(({ passed, failed }) => {
        process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
