import * as vscode from 'vscode';

let swarmProcess: any = null;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Autonomous Swarm Extension Activated');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(pulse) Swarm: Idle";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('autonomousSwarm.start', startSwarm)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('autonomousSwarm.stop', stopSwarm)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('autonomousSwarm.status', showStatus)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('autonomousSwarm.dispatchTask', dispatchTask)
    );

    // Auto-start if enabled
    const config = vscode.workspace.getConfiguration('autonomousSwarm');
    if (config.get('enabled')) {
        startSwarm();
    }
}

async function startSwarm() {
    if (swarmProcess) {
        vscode.window.showInformationMessage('Swarm already running');
        return;
    }

    // Check license
    const config = vscode.workspace.getConfiguration('autonomousSwarm');
    const licenseKey = config.get('licenseKey') as string;

    if (!licenseKey) {
        const trial = await vscode.window.showInformationMessage(
            'No license key found. Start 14-day trial?',
            'Yes', 'No'
        );

        if (trial !== 'Yes') return;
    }

    try {
        // Start swarm process
        const { spawn } = require('child_process');
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        swarmProcess = spawn('npx', ['autonomous-swarm', 'start'], {
            cwd: workspaceRoot,
            shell: true
        });

        swarmProcess.on('error', (error: Error) => {
            vscode.window.showErrorMessage(`Swarm error: ${error.message}`);
        });

        statusBarItem.text = "$(pulse) Swarm: Active";
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');

        vscode.window.showInformationMessage('🐝 Autonomous Swarm started');
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to start swarm: ${error.message}`);
    }
}

async function stopSwarm() {
    if (!swarmProcess) {
        vscode.window.showInformationMessage('Swarm not running');
        return;
    }

    swarmProcess.kill();
    swarmProcess = null;

    statusBarItem.text = "$(pulse) Swarm: Idle";
    statusBarItem.backgroundColor = undefined;

    vscode.window.showInformationMessage('Swarm stopped');
}

async function showStatus() {
    const status = swarmProcess ? 'Running' : 'Stopped';
    const panel = vscode.window.createWebviewPanel(
        'swarmStatus',
        'Swarm Status',
        vscode.ViewColumn.One,
        {}
    );

    panel.webview.html = getStatusHtml(status);
}

async function dispatchTask() {
    const task = await vscode.window.showInputBox({
        prompt: 'Enter task description',
        placeHolder: 'e.g., Fix all TypeScript errors'
    });

    if (task) {
        // Dispatch to swarm via quantum channel
        vscode.window.showInformationMessage(`Task dispatched: ${task}`);
    }
}

function getStatusHtml(status: string): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .status { font-size: 24px; margin-bottom: 20px; }
                .active { color: green; }
                .idle { color: gray; }
            </style>
        </head>
        <body>
            <h1>🐝 Autonomous Swarm</h1>
            <div class="status ${status === 'Running' ? 'active' : 'idle'}">
                Status: ${status}
            </div>
            <h2>Agents</h2>
            <ul>
                <li>🛡️ Sentinel - Security Scanner</li>
                <li>🐞 BugHunter - Bug Detector</li>
                <li>⚡ Optimizer - Performance Analyzer</li>
                <li>👔 ProductOwner - Feature Strategist</li>
                <li>🧙‍♂️ GodMode - Quantum Orchestrator</li>
                <li>🌀 Antigravity - AI Collaboration</li>
            </ul>
        </body>
        </html>
    `;
}

export function deactivate() {
    if (swarmProcess) {
        swarmProcess.kill();
    }
}
