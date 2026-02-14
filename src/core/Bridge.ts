
import axios from 'axios';

// Phase 38: The Handshake Protocol
export interface SovereignHandshake {
    swarm_id: string; // Which agent group generated this?
    intent: string; // Natural language explanation of the action.
    payload: string; // The raw code or API instruction.
    risk_score: number; // Swarm's self-assessed risk (0.0 - 1.0).
    verification_token?: string; // To be populated by the Kernel.
}

const ORACLE_URL = 'http://localhost:3002/api/oracle/validate';

export class SovereignBridge {
    /**
     * THE VERIFICATION GATEWAY
     * @param proposal The raw action proposed by the Swarm.
     * @returns A signed Handshake object if blessed by the Kernel, or throws an error.
     */
    static async executeHandshake(proposal: SovereignHandshake): Promise<SovereignHandshake> {
        const isSilent = process.env.SILENT_MODE === 'true';

        // --- PHASE 48: AX_GOV UPGRADE (Hardware Signature) ---
        const machineId = process.env.COMPUTERNAME || 'SOVEREIGN_NODE_01';
        const hardwareSignature = crypto.createHash('sha256')
            .update(`${machineId}:${proposal.payload}:${Date.now()}`)
            .digest('hex');

        if (!isSilent) {
            console.log(`🌉 BRIDGE: Initiating HW-Signed Handshake [${machineId}] for intent: "${proposal.intent}"`);
        }

        // 1. Truth Check & Validation via Rust Kernel
        try {
            const response = await axios.post(ORACLE_URL, {
                code: proposal.payload,
                intent: proposal.intent,
                verification_hash: "signed_by_bridge",
                hardware_signature: hardwareSignature // Sending HW proof to Kernel
            });

            if (!response.data.safe) {
                console.error(`🛑 BRIDGE: Kernel Rejected Handshake: ${response.data.message}`);
                throw new Error(`KERNEL_REJECTION: ${response.data.message}`);
            }

            if (!isSilent) {
                console.log(`✅ BRIDGE: Handshake Blessed by Hardware Kernel. Confidence: ${response.data.confidence}`);
            }

            // 2. "Bless" the proposal with a kernel token
            return {
                ...proposal,
                verification_token: `KERNEL_BLESSED_${Date.now()}_SIG_${hardwareSignature.substring(0, 8)}`
            };

        } catch (error: any) {
            console.error(`⚠️ BRIDGE: Kernel Unreachable or Error:`, error.message);
            // Fail Closed: If Kernel is down, no action happens.
            throw new Error("KERNEL_UNREACHABLE_OR_ERROR");
        }
    }
}
import crypto from 'crypto';
