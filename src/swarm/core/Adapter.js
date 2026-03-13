export var ActionType;
(function (ActionType) {
    ActionType["BLOCKCHAIN"] = "BLOCKCHAIN";
    ActionType["DATABASE"] = "DATABASE";
    ActionType["LOGIC"] = "LOGIC";
})(ActionType || (ActionType = {}));
export class UniversalAdapter {
    static plugins = new Map();
    static registerPlugin(domain, adapter) {
        this.plugins.set(domain, adapter);
    }
    static async route(action) {
        // Simple routing logic based on ActionType
        const adapter = this.plugins.get(action.type);
        if (!adapter) {
            throw new Error(`No adapter found for ActionType: ${action.type}`);
        }
        return await adapter.execute(action);
    }
}
