export enum ActionType {
    BLOCKCHAIN = 'BLOCKCHAIN',
    DATABASE = 'DATABASE',
    LOGIC = 'LOGIC'
}

export interface UniversalAction {
    type: ActionType;
    intent: string;
    payload: any;
    timestamp: number;
    production_verification_hash: string; // Proof of real-world validation
}

export interface Adapter {
    execute(action: UniversalAction): Promise<any>;
    validate(action: UniversalAction): Promise<boolean>;
}

export class UniversalAdapter {
    private static plugins: Map<string, Adapter> = new Map();

    static registerPlugin(domain: string, adapter: Adapter) {
        this.plugins.set(domain, adapter);
    }

    static async route(action: UniversalAction): Promise<any> {
        // Simple routing logic based on ActionType
        const adapter = this.plugins.get(action.type);
        if (!adapter) {
            throw new Error(`No adapter found for ActionType: ${action.type}`);
        }
        return await adapter.execute(action);
    }
}
