import { QuantumSwarmCore } from '../core/quantum_core.js';

export interface MutationAction {
    type: 'click' | 'fill' | 'check' | 'assert';
    selector: string;
    value?: string;
    description: string;
}

export class QAMutatorAgent {
    private quantumCore: QuantumSwarmCore;

    constructor() {
        this.quantumCore = new QuantumSwarmCore();
    }

    /**
     * Generate a sequence of actions based on a DOM map and a target goal.
     */
    async planMutationSequence(domMap: any, targetFeature: string): Promise<MutationAction[]> {
        console.log(`🧪 [QAMutatorAgent] Planning mutation sequence for: ${targetFeature}`);

        const simplifiedMap = JSON.stringify({
            title: domMap.title,
            headings: domMap.headings,
            interactables: domMap.interactables.slice(0, 10)
        });

        const prompt = `Based on this DOM map, suggest a 5-step interaction sequence to verify "${targetFeature}".
        Return ONLY a JSON array of actions with this schema:
        [
          { "type": "click" | "fill" | "assert", "selector": "text=...", "value": "optional", "description": "..." }
        ]
        
        DOM Context: ${simplifiedMap}`;

        const result = await this.quantumCore.consultOracle(
            prompt,
            [
                `[{ "type": "click", "selector": "text=${targetFeature}", "description": "Click the target feature" }, { "type": "assert", "selector": "text=Success", "description": "Verify success state" }]`,
                `[{ "type": "fill", "selector": "input[type='text']", "value": "test", "description": "Search for feature" }, { "type": "click", "selector": "button[type='submit']", "description": "Submit search" }]`
            ],
            ['logic', 'sequence_safety']
        );

        let sequenceStr = typeof result === 'string' ? result : result.recommendation || JSON.stringify(result);

        // Clean up markdown code blocks if necessary
        if (sequenceStr.includes('```')) {
            const match = sequenceStr.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (match?.[1]) sequenceStr = match[1];
        }

        try {
            const sequence = JSON.parse(sequenceStr);
            console.log(`🧪 [QAMutatorAgent] Generated sequence with ${sequence.length} steps.`);
            return sequence;
        } catch (e) {
            console.error('🧪 [QAMutatorAgent] Failed to parse sequence JSON. Returning default.', e);
            return [
                { type: 'assert', selector: `text=${targetFeature}`, description: `Fallback: Assert visibility of ${targetFeature}` }
            ];
        }
    }
}
