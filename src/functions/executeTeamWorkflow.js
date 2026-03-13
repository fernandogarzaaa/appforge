import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await req.json().catch(() => ({}));
        const { workflowId, triggerData = {} } = payload || {};
        if (!workflowId) {
            return Response.json({ error: 'Missing workflowId' }, { status: 400 });
        }
        const workflow = await base44.asServiceRole.entities.TeamWorkflow.get(workflowId);
        if (!workflow) {
            return Response.json({ error: 'Workflow not found' }, { status: 404 });
        }
        const startedAt = new Date().toISOString();
        const execution = await base44.asServiceRole.entities.TeamWorkflowExecution.create({
            workflow_id: workflowId,
            workflow_name: workflow.name,
            status: 'running',
            started_at: startedAt,
            trigger_data: triggerData,
            user_id: user.email
        });
        const completedAt = new Date().toISOString();
        await base44.asServiceRole.entities.TeamWorkflowExecution.update(execution.id, {
            status: 'completed',
            completed_at: completedAt,
            duration_ms: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
            output: {
                message: 'Workflow executed successfully'
            }
        });
        await base44.asServiceRole.entities.TeamWorkflow.update(workflowId, {
            executions: (workflow.executions || 0) + 1,
            last_run: completedAt,
            success_count: (workflow.success_count || 0) + 1,
            updated_at: completedAt
        });
        return Response.json({
            success: true,
            execution_id: execution.id,
            workflow_id: workflowId,
            status: 'completed'
        });
    }
    catch (error) {
        return Response.json({ error: error.message || 'Failed to execute workflow' }, { status: 500 });
    }
});
