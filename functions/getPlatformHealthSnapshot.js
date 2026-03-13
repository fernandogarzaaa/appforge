import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
async function runCheck(command) {
    try {
        const proc = new Deno.Command(command[0], {
            args: command.slice(1),
            stdout: 'piped',
            stderr: 'piped'
        });
        const out = await proc.output();
        const output = `${new TextDecoder().decode(out.stdout)}${new TextDecoder().decode(out.stderr)}`.trim();
        return {
            command: command.join(' '),
            status: out.code === 0 ? 'pass' : 'fail',
            output: output.slice(0, 4000)
        };
    }
    catch (error) {
        return {
            command: command.join(' '),
            status: 'warning',
            output: `Unable to run command in current environment: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }
        const checks = await Promise.all([
            runCheck(['npm', 'run', 'lint']),
            runCheck(['npm', 'run', 'typecheck']),
            runCheck(['npm', 'test'])
        ]);
        const failingDomains = checks
            .filter(check => check.status === 'fail')
            .map(check => check.command.includes('typecheck') ? 'typecheck' : check.command.includes('lint') ? 'lint' : 'test');
        return Response.json({
            status: failingDomains.length === 0 ? 'healthy' : 'degraded',
            generatedAt: new Date().toISOString(),
            checks,
            failingDomains
        });
    }
    catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
});
