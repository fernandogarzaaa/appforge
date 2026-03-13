import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
function buildSuggestedSplits(content, maxModuleLines) {
    const lines = content.split('\n');
    const chunks = Math.ceil(lines.length / maxModuleLines);
    const suggestions = [];
    for (let i = 0; i < chunks; i++) {
        const start = i * maxModuleLines + 1;
        const end = Math.min((i + 1) * maxModuleLines, lines.length);
        suggestions.push({
            moduleName: `segment_${i + 1}`,
            lineRange: `${start}-${end}`,
            responsibility: i === 0 ? 'types-and-interfaces' : i === chunks - 1 ? 'runtime-wiring' : 'business-logic'
        });
    }
    return suggestions;
}
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }
        const payload = await req.json();
        const targetPath = payload.targetPath;
        if (!targetPath) {
            return Response.json({ error: 'targetPath is required' }, { status: 400 });
        }
        const maxModuleLines = Math.max(200, payload.maxModuleLines || 400);
        const content = await Deno.readTextFile(targetPath);
        const lineCount = content.split('\n').length;
        const suggestions = buildSuggestedSplits(content, maxModuleLines);
        return Response.json({
            targetPath,
            lineCount,
            maxModuleLines,
            requiresDecomposition: lineCount > maxModuleLines,
            suggestedModules: suggestions,
            generatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
});
