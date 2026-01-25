import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId, testIds, botNodes } = await req.json();

    if (!botId || !testIds || testIds.length === 0) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch test cases
    const testCases = await Promise.all(
      testIds.map(id => base44.entities.BotTestCase.get(id))
    );

    const results = [];

    for (const testCase of testCases) {
      const startTime = Date.now();
      const logs = [];

      try {
        logs.push(`Starting test: ${testCase.name}`);

        // Execute bot workflow with mock data
        const mockContext = { ...testCase.mock_data, __testMode: true };
        let executionContext = mockContext;

        logs.push(`Mock data loaded: ${JSON.stringify(mockContext)}`);

        // Execute bot nodes (simplified execution)
        if (botNodes && botNodes.length > 0) {
          for (const node of botNodes) {
            logs.push(`Executing node: ${node.id || 'unknown'}`);
            // Simulate node execution
            executionContext = { ...executionContext, [node.id]: true };
          }
        }

        logs.push('Bot execution completed');

        // Validate assertions
        const assertionResults = [];
        let passedCount = 0;

        for (const assertion of testCase.assertions || []) {
          const actualValue = getNestedValue(executionContext, assertion.variable);
          const passed = evaluateAssertion(actualValue, assertion.operator, assertion.expected_value);

          assertionResults.push({
            id: assertion.id,
            variable: assertion.variable,
            operator: assertion.operator,
            expected_value: assertion.expected_value,
            actual_value: actualValue,
            passed
          });

          if (passed) {
            passedCount++;
            logs.push(`✓ Assertion passed: ${assertion.variable} ${assertion.operator} ${assertion.expected_value}`);
          } else {
            logs.push(`✗ Assertion failed: ${assertion.variable} ${assertion.operator} ${assertion.expected_value} (got ${actualValue})`);
          }
        }

        const executionTime = Date.now() - startTime;

        // Save result
        await base44.entities.BotTestResult.create({
          test_case_id: testCase.id,
          bot_id: botId,
          status: passedCount === (testCase.assertions?.length || 0) ? 'passed' : 'failed',
          passed_assertions: passedCount,
          failed_assertions: (testCase.assertions?.length || 0) - passedCount,
          total_assertions: testCase.assertions?.length || 0,
          execution_time_ms: executionTime,
          actual_output: executionContext,
          assertion_results: assertionResults,
          logs,
          run_at: new Date().toISOString()
        });

        results.push({
          testId: testCase.id,
          testName: testCase.name,
          status: 'completed',
          passedAssertions: passedCount
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        logs.push(`Error: ${error.message}`);

        await base44.entities.BotTestResult.create({
          test_case_id: testCase.id,
          bot_id: botId,
          status: 'error',
          passed_assertions: 0,
          failed_assertions: testCase.assertions?.length || 0,
          total_assertions: testCase.assertions?.length || 0,
          execution_time_ms: executionTime,
          error_message: error.message,
          logs,
          run_at: new Date().toISOString()
        });

        results.push({
          testId: testCase.id,
          testName: testCase.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      results,
      totalRun: testCases.length,
      passedCount: results.filter(r => r.status === 'completed').length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getNestedValue(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
}

function evaluateAssertion(actual, operator, expected) {
  switch (operator) {
    case 'equals':
      return actual == expected;
    case 'notEquals':
      return actual != expected;
    case 'contains':
      return String(actual).includes(String(expected));
    case 'greaterThan':
      return actual > expected;
    case 'lessThan':
      return actual < expected;
    case 'isEmpty':
      return !actual || (Array.isArray(actual) && actual.length === 0) || (typeof actual === 'object' && Object.keys(actual).length === 0);
    case 'isNotEmpty':
      return actual && (Array.isArray(actual) ? actual.length > 0 : (typeof actual === 'object' ? Object.keys(actual).length > 0 : true));
    default:
      return false;
  }
}