/**
 * Reality mode guardrails for swarm runtime.
 *
 * SWARM_REALITY_MODE=true enforces fail-closed behavior where
 * simulation fallbacks are not allowed.
 */

function parseBoolean(value: string | undefined, fallback = false): boolean {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized === '1'
        || normalized === 'true'
        || normalized === 'yes'
        || normalized === 'on';
}

export function isRealityMode(): boolean {
    return parseBoolean(process.env.SWARM_REALITY_MODE, false);
}

export function isLiveTradingEnabled(): boolean {
    return parseBoolean(process.env.REAL_TRADING_ENABLED, false);
}

export function requireRealityMode(context: string): void {
    if (isRealityMode()) {
        return;
    }
    throw new Error(
        `[RealityMode] ${context} blocked: SWARM_REALITY_MODE=true is required for real-only swarm execution.`
    );
}

export function rejectSimulationFallback(system: string, reason: string): never {
    throw new Error(
        `[RealityMode] ${system} simulation fallback blocked: ${reason}`
    );
}

export function requireConfiguredForReality(
    system: string,
    configured: boolean,
    remediation: string
): void {
    if (!isRealityMode()) {
        return;
    }
    if (configured) {
        return;
    }
    throw new Error(`[RealityMode] ${system} not configured for live operation. ${remediation}`);
}

export function realityStatusSummary(): string {
    return [
        `SWARM_REALITY_MODE=${isRealityMode()}`,
        `REAL_TRADING_ENABLED=${isLiveTradingEnabled()}`
    ].join(' | ');
}
