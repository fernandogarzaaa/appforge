

const githubRequest = async (token: string, method: string, endpoint: string, body?: any) => {
    const url = `https://api.github.com${endpoint}`;
    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Base44-GodMode-Bot'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${text}`);
    }

    return response.json();
};

const getFileContent = async (token: string, owner: string, repo: string, path: string) => {
    try {
        const data = await githubRequest(token, 'GET', `/repos/${owner}/${repo}/contents/${path}`);
        if (Array.isArray(data)) return null; // It's a directory
        // content is base64 encoded
        const content = atob(data.content.replace(/\n/g, ''));
        return { content, sha: data.sha };
    } catch (e) {
        if (e.message.includes('404')) return null;
        throw e;
    }
};

const updateFile = async (token: string, owner: string, repo: string, path: string, content: string, message: string, sha?: string) => {
    const body: any = {
        message,
        content: btoa(content),
    };
    if (sha) body.sha = sha;

    await githubRequest(token, 'PUT', `/repos/${owner}/${repo}/contents/${path}`, body);
};

Deno.serve(async (req) => {
    try {
        let createClientFromRequest;
        try {
            // Option A: Explicit NPM version
            const module = await import('npm:@base44/sdk@0.8.18');
            createClientFromRequest = module.createClientFromRequest;
        } catch (e1) {
            try {
                // Option B: ESM.sh CDN
                const module = await import('https://esm.sh/@base44/sdk@0.8.18');
                createClientFromRequest = module.createClientFromRequest;
            } catch (e2) {
                return Response.json({
                    error: `SDK Import Failed (Both NPM and CDN). NPM: ${e1.message} | CDN: ${e2.message}`
                }, { status: 200 });
            }
        }

        const base44 = createClientFromRequest(req);
        // Cloud context: We need the GitHub Token
        const FALLBACK_PAT = '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';
        const GITHUB_TOKEN = Deno.env.get('BOT_GITHUB_TOKEN') || Deno.env.get('GITHUB_TOKEN') || FALLBACK_PAT;
        const REPO_OWNER = 'fernandogarzaaa'; // Should make dynamic or env var
        const REPO_NAME = 'appforge'; // Should make dynamic

        if (!GITHUB_TOKEN) {
            return Response.json({ error: 'Missing GITHUB_TOKEN' }, { status: 500 });
        }

        // 1. Read TODO.md
        const todoFile = await getFileContent(GITHUB_TOKEN, REPO_OWNER, REPO_NAME, 'TODO.md');

        if (!todoFile) {
            return Response.json({ message: 'No TODO.md found' });
        }

        const godTaskRegex = /TODO: \[GOD_MODE\] (.*)/;
        const match = todoFile.content.match(godTaskRegex);

        if (match) {
            const task = match[1];

            // 2. Invoke LLM
            const prompt = `You are an autonomous AI Lead Developer (God Mode).
        Task: "${task}"
        
        Output a JSON object with:
        1. "filepath": Relative path to create/modify.
        2. "code": Full file content.
        3. "message": Commit message.
        
        JSON ONLY.`;

            const llm = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        filepath: { type: 'string' },
                        code: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            });

            const action = llm; // SDK returns parsed JSON 

            if (action.filepath && action.code) {
                // 3. Write File
                const existingFile = await getFileContent(GITHUB_TOKEN, REPO_OWNER, REPO_NAME, action.filepath);
                await updateFile(
                    GITHUB_TOKEN,
                    REPO_OWNER,
                    REPO_NAME,
                    action.filepath,
                    action.code,
                    action.message || `feat: ${task}`,
                    existingFile?.sha
                );

                // 4. Update TODO.md
                const newTodoContent = todoFile.content.replace(match[0], `DONE: [GOD_MODE] ${task}`);
                await updateFile(
                    GITHUB_TOKEN,
                    REPO_OWNER,
                    REPO_NAME,
                    'TODO.md',
                    newTodoContent,
                    `docs: mark task '${task}' as done`,
                    todoFile.sha
                );

                // Log to Audit
                await base44.entities.AuditLog.create({
                    action: 'god_mode_execution',
                    description: `Executed task: ${task}`,
                    changes: { filepath: action.filepath }
                });

                return Response.json({ success: true, task, action: 'committed' });
            }
        }

        return Response.json({ message: 'No pending God Mode tasks' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
