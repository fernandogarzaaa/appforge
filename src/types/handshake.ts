
export interface SovereignHandshake {
    swarm_id: string; // Which agent group generated this?
    intent: string; // Natural language explanation of the action.
    payload: string; // The raw code or API instruction.
    risk_score: number; // Swarm's self-assessed risk (0.0 - 1.0).
    verification_token?: string; // To be populated by the Kernel.
}
