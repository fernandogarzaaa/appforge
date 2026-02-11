import { spawn, ChildProcess } from 'child_process';
import { createInterface, Interface } from 'readline';

export interface IMessageTransport {
    start(): Promise<void>;
    stop(): Promise<void>;
    onCommand(handler: (cmd: string) => Promise<void>): void;
    pushUpdate(to: string, text: string): Promise<void>;
}

/**
 * Legacy macOS Transport using imsg CLI
 */
export class ImsgTransport implements IMessageTransport {
    private pending = new Map<string, { resolve: (val: any) => void; reject: (err: Error) => void; timer?: NodeJS.Timeout }>();
    private child: ChildProcess | null = null;
    private reader: Interface | null = null;
    private nextId = 1;
    private commandHandler: ((cmd: string) => Promise<void>) | null = null;
    private closed: Promise<void>;
    private closedResolve: (() => void) | null = null;

    constructor() {
        this.closed = new Promise((resolve) => {
            this.closedResolve = resolve;
        });
    }

    async start() {
        if (this.child) return;
        const cliPath = process.env.IMSG_CLI_PATH || 'imsg';
        console.log(`📨 [iMessage] Starting ImsgTransport (RPC client: ${cliPath})`);

        try {
            this.child = spawn(cliPath, ['rpc'], { stdio: ['pipe', 'pipe', 'pipe'] });

            this.child.on('error', (err) => {
                console.error(`📨 [iMessage] Spawn error: ${err}`);
                this.failAll(err);
            });

            this.reader = createInterface({ input: this.child.stdout! });
            this.reader.on('line', (line) => this.handleLine(line));

            this.child.on('close', (code) => {
                console.log(`📨 [iMessage] RPC process exited with code ${code}`);
                this.closedResolve?.();
            });
        } catch (err) {
            console.error(`📨 [iMessage] Failed to start imsg: ${err}`);
        }
    }

    async stop() {
        if (!this.child) return;
        this.reader?.close();
        this.child.stdin?.end();
        await this.closed;
        this.child = null;
    }

    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandler = handler;
    }

    async pushUpdate(to: string, text: string) {
        return this.request('send', { to, text });
    }

    private async request(method: string, params: any): Promise<any> {
        if (!this.child?.stdin) throw new Error('imsg rpc not running');
        const id = this.nextId++;
        const payload = { jsonrpc: '2.0', id, method, params };

        return new Promise((resolve, reject) => {
            const key = String(id);
            const timer = setTimeout(() => {
                this.pending.delete(key);
                reject(new Error(`imsg rpc timeout (${method})`));
            }, 30000);

            this.pending.set(key, { resolve, reject, timer });
            this.child!.stdin!.write(JSON.stringify(payload) + '\n');
        });
    }

    private handleLine(line: string) {
        try {
            const parsed = JSON.parse(line);
            if (parsed.id) {
                const p = this.pending.get(String(parsed.id));
                if (p) {
                    if (p.timer) clearTimeout(p.timer);
                    this.pending.delete(String(parsed.id));
                    if (parsed.error) p.reject(new Error(parsed.error.message));
                    else p.resolve(parsed.result);
                }
            } else if (parsed.method === 'notification' && parsed.params?.text) {
                this.commandHandler?.(parsed.params.text);
            }
        } catch (e) {
            console.error(`📨 [iMessage] Error parsing line: ${line}`);
        }
    }

    private failAll(err: Error) {
        for (const [key, p] of this.pending.entries()) {
            if (p.timer) clearTimeout(p.timer);
            p.reject(err);
            this.pending.delete(key);
        }
    }
}

/**
 * Cross-platform Transport using BlueBubbles REST API
 */
export class BlueBubblesTransport implements IMessageTransport {
    private commandHandler: ((cmd: string) => Promise<void>) | null = null;
    private pollInterval: NodeJS.Timeout | null = null;
    private lastMessageGuid: string | null = null;

    async start() {
        console.log('🌌 [iMessage] Starting BlueBubblesTransport (Windows Compatibility Mode)');
        this.startPolling();
    }

    async stop() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandler = handler;
    }

    async pushUpdate(to: string, text: string) {
        const url = process.env.BLUEBUBBLES_SERVER_URL;
        const password = process.env.BLUEBUBBLES_PASSWORD;
        if (!url || !password) {
            console.error('❌ [BlueBubbles] Missing BLUEBUBBLES_SERVER_URL or BLUEBUBBLES_PASSWORD');
            return;
        }

        const endpoint = `${url}/api/v1/message/text?password=${password}`;
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatGuid: to.includes(';') ? to : undefined,
                    tempGuid: `swarm-${Date.now()}`,
                    message: text,
                    method: 'private-api'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`BlueBubbles API error: ${response.status} - ${errorText}`);
            }
            console.log(`✅ [BlueBubbles] Message dispatched to ${to}`);
        } catch (err) {
            console.error(`❌ [BlueBubbles] Failed to push update: ${err}`);
        }
    }

    private startPolling() {
        const interval = parseInt(process.env.BLUEBUBBLES_POLL_INTERVAL_MS || '5000');
        this.pollInterval = setInterval(async () => {
            await this.pollForMessages();
        }, interval);
    }

    private async pollForMessages() {
        const url = process.env.BLUEBUBBLES_SERVER_URL;
        const password = process.env.BLUEBUBBLES_PASSWORD;
        if (!url || !password) return;

        try {
            const endpoint = `${url}/api/v1/message/query?password=${password}&limit=10&sort=DESC`;
            const response = await fetch(endpoint);
            if (!response.ok) return;

            const payload: any = await response.json();
            const messages = payload.data || [];

            for (const msg of messages) {
                if (msg.fromMe) continue;
                if (!this.lastMessageGuid) {
                    this.lastMessageGuid = msg.guid;
                    break;
                }
                if (msg.guid === this.lastMessageGuid) break;

                console.log(`📨 [BlueBubbles] New signal from ${msg.handle?.address || 'unknown'}: ${msg.text}`);
                if (this.commandHandler) await this.commandHandler(msg.text);
            }

            if (messages.length > 0) {
                this.lastMessageGuid = messages[0].guid;
            }
        } catch (err) {
            // Silently handle polling errors
        }
    }
}

export class IMessageBridge {
    private transport: IMessageTransport | null = null;
    private commandHandler: ((cmd: string) => Promise<void>) | null = null;

    async start() {
        if (!this.transport) {
            const mode = process.env.IMESSAGE_TRANSPORT_MODE || 'imsg';
            console.log(`🌌 [iMessage] Bridge Initializing in mode: ${mode}`);

            if (mode === 'bluebubbles') {
                this.transport = new BlueBubblesTransport();
            } else {
                this.transport = new ImsgTransport();
            }

            if (this.commandHandler) {
                this.transport.onCommand(this.commandHandler);
            }
        }
        await this.transport.start();
    }

    async stop() {
        if (this.transport) {
            await this.transport.stop();
        }
    }

    onCommand(handler: (cmd: string) => Promise<void>) {
        this.commandHandler = handler;
        if (this.transport) {
            this.transport.onCommand(handler);
        }
    }

    async pushUpdate(to: string, text: string) {
        if (!this.transport) {
            await this.start();
        }
        await this.transport!.pushUpdate(to, text);
    }
}

export const imessageBridge = new IMessageBridge();
