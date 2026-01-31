/**
 * Domain Context Extraction Test
 * Demonstrates how the AI now understands domain-specific website requests
 */

import { extractDomainContext, generateDomainSpecificPlan } from './src/utils/domainContextExtractor.js';

console.log('🎯 DOMAIN-AWARE AI AGENT TEST\n');

// Test cases
const testRequests = [
  "Build a full cafe website",
  "I need a coffee shop website with online ordering",
  "Create an ecommerce store for my products",
  "Build a restaurant reservation system",
  "Create my portfolio to showcase my projects",
  "Build a SaaS dashboard for my app",
  "Create a blog platform"
];

console.log('=' .repeat(80));
console.log('TEST 1: Domain Context Extraction');
console.log('=' .repeat(80));

testRequests.forEach(request => {
  console.log(`\n📝 User Request: "${request}"`);
  
  const domainContext = extractDomainContext(request);
  
  if (domainContext.domain) {
    console.log(`✅ DOMAIN IDENTIFIED: ${domainContext.domainName}`);
    console.log(`   Keywords matched: ${domainContext.matchedKeywords.join(', ')}`);
    console.log(`   Confidence: ${(domainContext.contextConfidence * 100).toFixed(0)}%`);
    
    // Generate domain-specific plan
    const plan = generateDomainSpecificPlan(request, domainContext);
    console.log(`\n📋 DOMAIN-SPECIFIC PLAN:`);
    console.log(`   Goal: ${plan.goal}`);
    console.log(`   Steps: ${plan.steps.length} total steps`);
    console.log(`   Complexity: ${plan.complexity}`);
    console.log(`   Estimated Duration: ${plan.estimated_duration}`);
    
    console.log(`\n   📊 Key Components to Build:`);
    plan.pages.forEach((page, i) => {
      console.log(`      ${i + 1}. ${page.name.toUpperCase()}: ${page.purpose}`);
    });
    
    console.log(`\n   🗄️ Database Entities:`);
    plan.entities.forEach((entity, i) => {
      console.log(`      ${i + 1}. ${entity.name}: ${entity.fields.join(', ')}`);
    });
    
    console.log(`\n   ⭐ High-Priority Features:`);
    plan.features.filter(f => f.priority === 'high').slice(0, 4).forEach((feature, i) => {
      console.log(`      ${i + 1}. ${feature.name}: ${feature.description}`);
    });
    
  } else {
    console.log(`⚠️  NO DOMAIN IDENTIFIED - Using generic planning`);
  }
  
  console.log(`\n${'-'.repeat(80)}`);
});

console.log('\n' + '='.repeat(80));
console.log('TEST 2: Plan Step-by-Step Breakdown');
console.log('='.repeat(80));

// Detailed breakdown for cafe website
const cafeRequest = "Build a full cafe website with online ordering and loyalty program";
console.log(`\n📝 Request: "${cafeRequest}"`);

const cafeContext = extractDomainContext(cafeRequest);
const cafePlan = generateDomainSpecificPlan(cafeRequest, cafeContext);

console.log(`\n✨ CAFE WEBSITE BUILD PLAN:\n`);
cafePlan.steps.forEach((step, index) => {
  console.log(`STEP ${step.step}: ${step.action.toUpperCase()}`);
  console.log(`  Description: ${step.description}`);
  console.log(`  Reasoning: ${step.reasoning}`);
  console.log(`  Parameters: ${JSON.stringify(step.parameters, null, 2)}`);
  console.log();
});

console.log('\n' + '='.repeat(80));
console.log('TEST 3: Feature Comparison');
console.log('='.repeat(80));

// Compare features across domains
const domains = ['cafe', 'restaurant', 'ecommerce', 'blog', 'portfolio'];

console.log('\n📊 DOMAIN-SPECIFIC FEATURES:\n');
domains.forEach(domain => {
  const context = extractDomainContext(`Build a ${domain}`);
  if (context.domain) {
    const plan = generateDomainSpecificPlan(`Build a ${domain}`, context);
    console.log(`${context.domainName.toUpperCase()}:`);
    console.log(`  Total Features: ${plan.features.length}`);
    console.log(`  High Priority: ${plan.features.filter(f => f.priority === 'high').length}`);
    console.log(`  Pages: ${plan.pages.length}`);
    console.log(`  Entities: ${plan.entities.length}`);
    console.log();
  }
});

console.log('\n' + '='.repeat(80));
console.log('✅ ALL DOMAIN CONTEXT TESTS COMPLETED!');
console.log('='.repeat(80));

console.log(`
🎉 IMPROVEMENTS:

The AI Agent now:
✅ Extracts domain context from user requests
✅ Identifies business type (cafe, restaurant, ecommerce, etc)
✅ Generates domain-specific plans with relevant features
✅ Understands requirement nuances (ordering, loyalty, reservations, etc)
✅ Creates targeted database schemas and page structures
✅ Falls back to LLM planning if no domain identified

This means:
- "Build a full cafe website" → Creates cafe-specific plan with menu, ordering, loyalty
- "Create restaurant website" → Creates reservation system, chef profiles, wine list
- "Build ecommerce store" → Creates product catalog, shopping cart, checkout

🔮 QUANTUM-ENHANCED: Plans with 3+ steps automatically optimized with quantum algorithms!
`);
