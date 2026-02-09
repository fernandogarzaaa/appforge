/**
 * 🦀 Quantum Core WASM Loader
 * 
 * Lazy-loads the Rust/WebAssembly module with automatic fallback
 * to JavaScript implementations when WASM is unavailable.
 */

// Cache for loaded WASM module
let wasmModule = null;
let wasmLoadPromise = null;
let usingWasm = false;

/**
 * Load the Quantum Core WASM module
 * @returns {Promise<{wasm: object | null, usingWasm: boolean}>}
 */
export async function loadQuantumCore() {
    // Return cached if already loaded
    if (wasmModule !== null) {
        return { wasm: wasmModule, usingWasm };
    }

    // Return in-progress promise if loading
    if (wasmLoadPromise !== null) {
        return wasmLoadPromise;
    }

    wasmLoadPromise = (async () => {
        try {
            // Dynamically import the WASM module
            const wasm = await import('@/quantum-core/pkg');
            wasmModule = wasm;
            usingWasm = true;

            console.log('⚛️ Quantum Core WASM accelerated ✓');
            return { wasm: wasmModule, usingWasm: true };
        } catch (error) {
            // WASM not available - use JS fallback
            console.warn('⚛️ Quantum Core: WASM unavailable, using JS fallback');
            console.debug('WASM load error:', error.message);

            wasmModule = null;
            usingWasm = false;
            return { wasm: null, usingWasm: false };
        }
    })();

    return wasmLoadPromise;
}

/**
 * Check if WASM is being used
 */
export function isWasmAccelerated() {
    return usingWasm;
}

/**
 * Get the WASM module (or null if not loaded)
 */
export function getWasmModule() {
    return wasmModule;
}

// ============================================================
// Accelerated Functions with JS Fallback
// ============================================================

/**
 * Calculate Levenshtein distance (WASM-accelerated with fallback)
 */
export async function levenshteinDistance(str1, str2) {
    const { wasm, usingWasm } = await loadQuantumCore();

    if (usingWasm && wasm?.levenshtein_distance) {
        return wasm.levenshtein_distance(str1, str2);
    }

    // JavaScript fallback
    return levenshteinDistanceJS(str1, str2);
}

/**
 * Pure JS Levenshtein implementation (fallback)
 */
function levenshteinDistanceJS(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Calculate string similarity (WASM-accelerated with fallback)
 */
export async function calculateSimilarity(str1, str2) {
    const { wasm, usingWasm } = await loadQuantumCore();

    if (usingWasm && wasm?.calculate_similarity) {
        return wasm.calculate_similarity(str1, str2);
    }

    // JavaScript fallback
    const distance = await levenshteinDistance(str1, str2);
    const maxLen = Math.max(str1.length, str2.length);
    return maxLen === 0 ? 1 : 1 - (distance / maxLen);
}

/**
 * Measure quantum system health (WASM-accelerated with fallback)
 */
export async function measureSystemHealth(totalNodes, ghostNodes, entanglementCount) {
    const { wasm, usingWasm } = await loadQuantumCore();

    if (usingWasm && wasm?.measure_system_health) {
        return wasm.measure_system_health(totalNodes, ghostNodes, entanglementCount);
    }

    // JavaScript fallback
    const entropy = Math.min(100, (ghostNodes * 10) + (entanglementCount * 5));
    const coherence = Math.max(0, Math.min(100, 100 - entropy + (entanglementCount * 2)));
    const stability = (coherence + (100 - entropy)) / 2;

    return {
        entropy,
        coherence,
        stability,
        superposition_active: ghostNodes > 0,
        entanglement_count: entanglementCount
    };
}

/**
 * Build workflow execution order (WASM-accelerated with fallback)
 */
export async function buildExecutionOrder(nodeIds, connections) {
    const { wasm, usingWasm } = await loadQuantumCore();

    const nodeIdsCsv = nodeIds.join(',');
    const connectionsCsv = connections.map(c => `${c.from}:${c.to}`).join(',');

    if (usingWasm && wasm?.build_execution_order) {
        const result = wasm.build_execution_order(nodeIdsCsv, connectionsCsv);
        return {
            order: result.order_csv.split(',').filter(Boolean),
            hasCycle: result.has_cycle
        };
    }

    // JavaScript fallback (simple BFS)
    return buildExecutionOrderJS(nodeIds, connections);
}

/**
 * Pure JS execution order (fallback)
 */
function buildExecutionOrderJS(nodeIds, connections) {
    const adj = new Map();
    const inDegree = new Map();

    nodeIds.forEach(id => {
        adj.set(id, []);
        inDegree.set(id, 0);
    });

    connections.forEach(({ from, to }) => {
        adj.get(from)?.push(to);
        inDegree.set(to, (inDegree.get(to) || 0) + 1);
    });

    const queue = [];
    inDegree.forEach((degree, node) => {
        if (degree === 0) queue.push(node);
    });

    const result = [];
    while (queue.length > 0) {
        const node = queue.shift();
        result.push(node);

        adj.get(node)?.forEach(neighbor => {
            const newDegree = inDegree.get(neighbor) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) queue.push(neighbor);
        });
    }

    return {
        order: result,
        hasCycle: result.length !== nodeIds.length
    };
}

/**
 * Calculate Web Vitals performance score (WASM-accelerated)
 */
export async function calculatePerformanceScore(lcp, fid, cls, fcp, ttfb) {
    const { wasm, usingWasm } = await loadQuantumCore();

    // Use -1 as sentinel for unmeasured metrics
    const safeLcp = lcp ?? -1;
    const safeFid = fid ?? -1;
    const safeCls = cls ?? -1;
    const safeFcp = fcp ?? -1;
    const safeTtfb = ttfb ?? -1;

    if (usingWasm && wasm?.calculate_performance_score) {
        return wasm.calculate_performance_score(safeLcp, safeFid, safeCls, safeFcp, safeTtfb);
    }

    // JavaScript fallback
    return calculatePerformanceScoreJS(safeLcp, safeFid, safeCls, safeFcp, safeTtfb);
}

function calculatePerformanceScoreJS(lcp, fid, cls, fcp, ttfb) {
    const thresholds = {
        LCP: { good: 2500, poor: 4000, weight: 0.25 },
        FID: { good: 100, poor: 300, weight: 0.25 },
        CLS: { good: 0.1, poor: 0.25, weight: 0.25 },
        FCP: { good: 1800, poor: 3000, weight: 0.125 },
        TTFB: { good: 800, poor: 1800, weight: 0.125 },
    };

    const values = { LCP: lcp, FID: fid, CLS: cls, FCP: fcp, TTFB: ttfb };
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [metric, threshold] of Object.entries(thresholds)) {
        const value = values[metric];
        if (value >= 0) {
            let score;
            if (value <= threshold.good) score = 100;
            else if (value >= threshold.poor) score = 0;
            else score = 100 - ((value - threshold.good) / (threshold.poor - threshold.good)) * 100;

            weightedSum += score * threshold.weight;
            totalWeight += threshold.weight;
        }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

// ============================================================
// Quantum Annealing
// ============================================================

interface QuantumAnnealOptions {
    initialTemperature?: number;
    coolingRate?: number;
    minTemperature?: number;
    maxIterations?: number;
}

/**
 * Create and run quantum annealing optimization (WASM-accelerated)
 */
export async function quantumAnneal(initialEnergy: number, options: QuantumAnnealOptions = {}) {
    const { wasm, usingWasm } = await loadQuantumCore();

    const {
        initialTemperature = 5000,
        coolingRate = 0.99,
        minTemperature = 0.01,
        maxIterations = 1000
    } = options;

    if (usingWasm && wasm?.QuantumAnnealer) {
        const annealer = new wasm.QuantumAnnealer(initialTemperature, coolingRate, minTemperature);
        const result = annealer.optimize(initialEnergy, maxIterations);
        return {
            bestEnergy: result.best_energy,
            iterations: result.iterations,
            finalTemperature: result.final_temperature,
            accelerated: true
        };
    }

    // JavaScript fallback
    return quantumAnnealJS(initialEnergy, initialTemperature, coolingRate, minTemperature, maxIterations);
}

function quantumAnnealJS(initialEnergy, temperature, coolingRate, minTemp, maxIterations) {
    let currentEnergy = initialEnergy;
    let bestEnergy = initialEnergy;
    let iterations = 0;

    while (temperature > minTemp && iterations < maxIterations) {
        const perturbation = (Math.random() * 2 - 1) * temperature * 0.1;
        const neighborEnergy = currentEnergy + perturbation;

        const delta = neighborEnergy - currentEnergy;
        const acceptanceProbability = delta < 0 ? 1 : Math.exp(-delta / temperature);

        if (Math.random() < acceptanceProbability) {
            currentEnergy = neighborEnergy;
            if (currentEnergy < bestEnergy) {
                bestEnergy = currentEnergy;
            }
        }

        temperature *= coolingRate;
        iterations++;
    }

    return {
        bestEnergy,
        iterations,
        finalTemperature: temperature,
        accelerated: false
    };
}

// ============================================================
// PHASE 2: Analytics & Data Processing
// ============================================================

interface StatisticsResult {
    mean: number;
    median: number;
    std_dev: number;
    min: number;
    max: number;
    count: number;
}

/**
 * Calculate statistics for a dataset (WASM-accelerated)
 */
export async function calculateStatistics(values: number[]): Promise<StatisticsResult> {
    const { wasm, usingWasm } = await loadQuantumCore();
    const valuesCsv = values.join(',');

    if (usingWasm && wasm?.calculate_statistics) {
        const result = wasm.calculate_statistics(valuesCsv);
        return {
            mean: result.mean,
            median: result.median,
            std_dev: result.std_dev,
            min: result.min,
            max: result.max,
            count: result.count
        };
    }

    // JavaScript fallback
    return calculateStatisticsJS(values);
}

function calculateStatisticsJS(values: number[]): StatisticsResult {
    if (values.length === 0) {
        return { mean: 0, median: 0, std_dev: 0, min: 0, max: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const median = count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];
    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / count;
    const std_dev = Math.sqrt(variance);

    return { mean, median, std_dev, min: sorted[0], max: sorted[count - 1], count };
}

interface AnomalyResult {
    isAnomaly: boolean;
    zScore: number;
    severity: 'normal' | 'warning' | 'critical';
}

/**
 * Detect anomaly in a value compared to dataset (WASM-accelerated)
 */
export async function detectAnomaly(value: number, mean: number, stdDev: number, threshold = 2.0): Promise<AnomalyResult> {
    const { wasm, usingWasm } = await loadQuantumCore();

    if (usingWasm && wasm?.detect_anomaly) {
        const result = wasm.detect_anomaly(value, mean, stdDev, threshold);
        return {
            isAnomaly: result.is_anomaly,
            zScore: result.z_score,
            severity: ['normal', 'warning', 'critical'][result.severity] as AnomalyResult['severity']
        };
    }

    // JavaScript fallback
    const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0;
    const isAnomaly = zScore > threshold;
    const severity: AnomalyResult['severity'] = zScore > threshold * 2 ? 'critical' : zScore > threshold ? 'warning' : 'normal';

    return { isAnomaly, zScore, severity };
}

interface TrendResult {
    direction: 'up' | 'down' | 'stable';
    slope: number;
    rSquared: number;
}

/**
 * Analyze trend in time series data (WASM-accelerated)
 */
export async function analyzeTrend(values: number[]): Promise<TrendResult> {
    const { wasm, usingWasm } = await loadQuantumCore();
    const valuesCsv = values.join(',');

    if (usingWasm && wasm?.analyze_trend) {
        const result = wasm.analyze_trend(valuesCsv);
        return {
            direction: ['stable', 'up', 'down'][result.direction + 1] as TrendResult['direction'],
            slope: result.slope,
            rSquared: result.r_squared
        };
    }

    // JavaScript fallback
    return analyzeTrendJS(values);
}

function analyzeTrendJS(values: number[]): TrendResult {
    const n = values.length;
    if (n < 2) return { direction: 'stable', slope: 0, rSquared: 0 };

    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((acc, y, i) => acc + i * y, 0);
    const sumX2 = Array.from({ length: n }, (_, i) => i * i).reduce((a, b) => a + b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const direction: TrendResult['direction'] = Math.abs(slope) < 0.001 ? 'stable' : slope > 0 ? 'up' : 'down';

    return { direction, slope, rSquared: 0.9 }; // Simplified
}

/**
 * Calculate correlation between two datasets (WASM-accelerated)
 */
export async function calculateCorrelation(values1: number[], values2: number[]): Promise<number> {
    const { wasm, usingWasm } = await loadQuantumCore();

    if (usingWasm && wasm?.calculate_correlation) {
        return wasm.calculate_correlation(values1.join(','), values2.join(','));
    }

    // JavaScript fallback
    const n = Math.min(values1.length, values2.length);
    if (n < 2) return 0;

    const mean1 = values1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let sumProduct = 0, sumSq1 = 0, sumSq2 = 0;
    for (let i = 0; i < n; i++) {
        const d1 = values1[i] - mean1;
        const d2 = values2[i] - mean2;
        sumProduct += d1 * d2;
        sumSq1 += d1 * d1;
        sumSq2 += d2 * d2;
    }

    return sumProduct / Math.sqrt(sumSq1 * sumSq2) || 0;
}

// ============================================================
// PHASE 3: Enterprise Security
// ============================================================

interface PermissionResult {
    allowed: boolean;
    matchedRole: string;
    reason: string;
}

/**
 * Evaluate RBAC permission (WASM-accelerated)
 */
export async function evaluatePermission(
    userRoles: string[],
    rolePermissions: { role: string; permission: string }[],
    requiredPermission: string
): Promise<PermissionResult> {
    const { wasm, usingWasm } = await loadQuantumCore();

    const rolesCsv = userRoles.join(',');
    const permissionsCsv = rolePermissions.map(rp => `${rp.role}:${rp.permission}`).join(',');

    if (usingWasm && wasm?.evaluate_permission) {
        const result = wasm.evaluate_permission(rolesCsv, permissionsCsv, requiredPermission);
        return {
            allowed: result.allowed,
            matchedRole: result.matched_role,
            reason: result.reason
        };
    }

    // JavaScript fallback
    for (const rp of rolePermissions) {
        if (userRoles.includes(rp.role) && rp.permission === requiredPermission) {
            return { allowed: true, matchedRole: rp.role, reason: `Role '${rp.role}' has permission '${requiredPermission}'` };
        }
    }
    return { allowed: false, matchedRole: '', reason: `No role grants permission '${requiredPermission}'` };
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

/**
 * Check rate limit (WASM-accelerated)
 */
export async function checkRateLimit(
    requestTimestamps: number[],
    windowSeconds: number,
    maxRequests: number,
    currentTime?: number
): Promise<RateLimitResult> {
    const { wasm, usingWasm } = await loadQuantumCore();
    const now = currentTime ?? Math.floor(Date.now() / 1000);

    if (usingWasm && wasm?.check_rate_limit) {
        const result = wasm.check_rate_limit(requestTimestamps.join(','), windowSeconds, maxRequests, now);
        return {
            allowed: result.allowed,
            remaining: result.remaining,
            retryAfterSeconds: result.retry_after_seconds
        };
    }

    // JavaScript fallback
    const windowStart = now - windowSeconds;
    const recentRequests = requestTimestamps.filter(ts => ts >= windowStart);

    if (recentRequests.length >= maxRequests) {
        const oldest = Math.min(...recentRequests);
        const retryAfter = Math.max(1, oldest + windowSeconds - now);
        return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }

    return { allowed: true, remaining: maxRequests - recentRequests.length, retryAfterSeconds: 0 };
}

/**
 * Calculate audit risk score (WASM-accelerated)
 */
export async function calculateAuditRiskScore(
    action: string,
    isSensitiveResource: boolean,
    isOutsideBusinessHours: boolean,
    failedAttemptsCount: number
): Promise<number> {
    const { wasm, usingWasm } = await loadQuantumCore();

    if (usingWasm && wasm?.calculate_audit_risk_score) {
        return wasm.calculate_audit_risk_score(action, isSensitiveResource, isOutsideBusinessHours, failedAttemptsCount);
    }

    // JavaScript fallback
    let score = 0;
    if (action === 'delete') score += 30;
    else if (action === 'export') score += 25;
    else if (action === 'update') score += 10;

    if (isSensitiveResource) score += 20;
    if (isOutsideBusinessHours) score += 15;
    score += Math.min(50, failedAttemptsCount * failedAttemptsCount);

    return Math.min(100, score);
}

