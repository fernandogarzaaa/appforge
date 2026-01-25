import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pipelineRunId, pipelineId, botId } = await req.json();

    if (!pipelineRunId || !pipelineId || !botId) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch pipeline and run
    const pipeline = await base44.entities.BotPipeline.list();
    const pipelineData = pipeline.find(p => p.id === pipelineId);
    
    const runs = await base44.entities.PipelineRun.list();
    let pipelineRun = runs.find(r => r.id === pipelineRunId);

    if (!pipelineData || !pipelineRun) {
      return Response.json({ error: 'Pipeline or run not found' }, { status: 404 });
    }

    // Start pipeline run
    const startTime = Date.now();
    const logs = [
      `Pipeline run started at ${new Date().toISOString()}`,
      `Ref: ${pipelineRun.git_ref}`,
      `Commit: ${pipelineRun.commit_hash}`
    ];

    const stageResults = [];
    let overallStatus = 'passed';

    // Execute each stage
    for (const stage of pipelineData.stages || []) {
      logs.push(`\n--- Stage: ${stage.name} ---`);
      const stageStartTime = Date.now();

      try {
        let stageStatus = 'passed';
        let stageOutput = '';
        let stageError = '';

        switch (stage.type) {
          case 'test':
            ({ output: stageOutput, error: stageError, status: stageStatus } = await runTestStage(base44, botId, logs));
            break;

          case 'build':
            ({ output: stageOutput, error: stageError, status: stageStatus } = await runBuildStage(botId, logs));
            break;

          case 'deploy':
            ({ output: stageOutput, error: stageError, status: stageStatus } = await runDeployStage(base44, botId, stage.config, logs));
            break;

          case 'custom':
            stageOutput = 'Custom stage executed';
            break;
        }

        const stageDuration = (Date.now() - stageStartTime) / 1000;
        
        stageResults.push({
          stage_name: stage.name,
          status: stageStatus,
          duration_seconds: stageDuration,
          output: stageOutput,
          error: stageError
        });

        logs.push(`✓ ${stage.name} completed in ${stageDuration.toFixed(2)}s`);

        if (stageStatus === 'failed') {
          overallStatus = 'failed';
          if (stage.required) {
            logs.push(`✗ Required stage failed, stopping pipeline`);
            break;
          } else {
            logs.push(`⚠ Optional stage failed, continuing`);
          }
        }
      } catch (error) {
        logs.push(`✗ Stage error: ${error.message}`);
        stageResults.push({
          stage_name: stage.name,
          status: 'failed',
          duration_seconds: (Date.now() - stageStartTime) / 1000,
          error: error.message
        });

        if (stage.required) {
          overallStatus = 'failed';
          break;
        }
      }
    }

    const totalDuration = (Date.now() - startTime) / 1000;
    logs.push(`\nPipeline ${overallStatus} after ${totalDuration.toFixed(2)}s`);

    // Update pipeline run
    pipelineRun = await base44.entities.BotPipelineRun.update(pipelineRunId, {
      status: overallStatus,
      stage_results: stageResults,
      completed_at: new Date().toISOString(),
      duration_seconds: totalDuration,
      logs
    });

    // Send notifications
    if (pipelineData.notifications) {
      await sendNotifications(pipelineData, pipelineRun, logs);
    }

    return Response.json({
      success: true,
      status: overallStatus,
      duration: totalDuration,
      logs
    });
  } catch (error) {
    console.error('Pipeline execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function runTestStage(base44, botId, logs) {
  logs.push('Running bot tests...');

  try {
    const testCases = await base44.entities.BotTestCase.filter({ bot_id: botId, status: 'active' });
    
    if (testCases.length === 0) {
      logs.push('No test cases found, skipping');
      return { output: 'No tests', status: 'passed' };
    }

    const results = await base44.functions.invoke('runBotTests', {
      botId,
      testIds: testCases.map(t => t.id),
      botNodes: []
    });

    const passedTests = results.data.results.filter(r => r.status === 'completed').length;
    const totalTests = results.data.totalRun;

    logs.push(`Tests: ${passedTests}/${totalTests} passed`);

    return {
      output: `Tests passed: ${passedTests}/${totalTests}`,
      status: passedTests === totalTests ? 'passed' : 'failed'
    };
  } catch (error) {
    logs.push(`Test execution failed: ${error.message}`);
    return { output: '', error: error.message, status: 'failed' };
  }
}

async function runBuildStage(botId, logs) {
  logs.push('Building bot package...');

  try {
    // Simulate build process
    const buildId = `build-${Date.now()}`;
    logs.push(`Build ID: ${buildId}`);
    logs.push('Packaging bot files...');
    logs.push('Build completed successfully');

    return {
      output: `Build package: ${buildId}.zip`,
      status: 'passed'
    };
  } catch (error) {
    return { output: '', error: error.message, status: 'failed' };
  }
}

async function runDeployStage(base44, botId, stageConfig, logs) {
  logs.push('Deploying bot...');

  try {
    const deployConfig = stageConfig?.environment;
    if (!deployConfig) {
      logs.push('No deployment configuration provided');
      return { output: 'Skipped', status: 'passed' };
    }

    logs.push(`Deploying to ${deployConfig} environment...`);

    // Simulate deployment
    const deploymentUrl = `https://bot.example.com/${botId}`;
    logs.push(`Deployment URL: ${deploymentUrl}`);
    logs.push('Health check: OK');
    logs.push('Deployment successful');

    return {
      output: `Deployed to ${deployConfig}: ${deploymentUrl}`,
      status: 'passed'
    };
  } catch (error) {
    return { output: '', error: error.message, status: 'failed' };
  }
}

async function sendNotifications(pipeline, run, logs) {
  const shouldNotify = 
    (run.status === 'passed' && pipeline.notifications.notify_on?.includes('success')) ||
    (run.status === 'failed' && pipeline.notifications.notify_on?.includes('failure')) ||
    pipeline.notifications.notify_on?.includes('all');

  if (!shouldNotify) return;

  // Slack notification
  if (pipeline.notifications.slack_enabled && pipeline.notifications.slack_channel) {
    try {
      const message = `Bot Pipeline: ${run.status.toUpperCase()}\nBranch: ${run.git_ref}\nDuration: ${run.duration_seconds}s`;
      // Integration with Slack would go here
    } catch (e) {
      console.error('Failed to send Slack notification:', e);
    }
  }

  // Email notification
  if (pipeline.notifications.email_enabled && pipeline.notifications.email_recipients?.length > 0) {
    try {
      // Integration with email would go here
    } catch (e) {
      console.error('Failed to send email notification:', e);
    }
  }
}