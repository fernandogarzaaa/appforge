import { renormalization } from '@/lib/quantumRenormalization';

/**
 * Execute system criticality detection using Renormalization Group
 * Detects approaching phase transitions
 */
export async function detectCriticality(metrics: number[]) {
    const analysis = renormalization.analyzeMetrics(metrics);
    console.log('🌊 Criticality Analysis:', analysis);
    return analysis;
}
