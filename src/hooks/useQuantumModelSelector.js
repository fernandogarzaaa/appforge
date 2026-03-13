/**
 * useQuantumModelSelector - React hook for quantum-optimized model selection
 *
 * Provides easy access to the Quantum Annealer for selecting AI models
 * based on task complexity, cost, speed, and quality requirements
 */
import { useCallback, useReducer } from 'react';
import { selectOptimalModel, selectModelsForTasks, compareModelsForTask, getRecommendation, SelectionStrategy, } from '@/lib/aiRouter';
const initialState = {
    selectedModel: null,
    loading: false,
    error: null,
    recommendations: [],
    lastComplexity: null,
    lastStrategy: null,
};
function selectionReducer(state, action) {
    switch (action.type) {
        case 'START': return { ...state, loading: true, error: null };
        case 'ERROR': return { ...state, loading: false, error: action.error };
        case 'SET_MODEL': return { ...state, loading: false, selectedModel: action.result, lastComplexity: action.complexity || state.lastComplexity, lastStrategy: action.strategy || state.lastStrategy };
        case 'SET_BATCH': return { ...state, loading: false, selectedModel: action.results[0] || null };
        case 'SET_RECOMMENDATIONS': return { ...state, loading: false, recommendations: action.data };
        default: return state;
    }
}
export const useQuantumModelSelector = () => {
    const [state, dispatch] = useReducer(selectionReducer, initialState);
    const wrapAction = async (fn, onSuccess, fallback) => {
        dispatch({ type: 'START' });
        try {
            const result = await fn();
            onSuccess(result);
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Action failed');
            dispatch({ type: 'ERROR', error });
            return fallback;
        }
    };
    const selectModel = useCallback((complexity, strategy = SelectionStrategy.OPTIMAL) => wrapAction(() => selectOptimalModel(complexity, strategy), (result) => dispatch({ type: 'SET_MODEL', result, complexity, strategy }), { model: 'base44', modelName: 'Base44', index: 4, fallback: true }), []);
    const selectBatch = useCallback((tasks, strategy = SelectionStrategy.OPTIMAL) => wrapAction(() => selectModelsForTasks(tasks, strategy), (results) => dispatch({ type: 'SET_BATCH', results }), []), []);
    const compareModels = useCallback((complexity) => wrapAction(() => compareModelsForTask(complexity), (data) => dispatch({ type: 'SET_RECOMMENDATIONS', data }), []), []);
    const getRecommendationData = useCallback((complexity) => wrapAction(() => getRecommendation(complexity), (rec) => {
        const recommendation = rec?.recommendation ?? {};
        dispatch({ type: 'SET_RECOMMENDATIONS', data: rec?.comparisons || [] });
        dispatch({
            type: 'SET_MODEL',
            result: {
                model: recommendation.model || 'base44',
                modelName: recommendation.modelName || 'Base44',
                index: recommendation.index ?? 4,
                complexity,
                strategy: recommendation.strategy ?? SelectionStrategy.OPTIMAL,
                metrics: recommendation.metrics ?? { cost: 0, latency: 0, quality: 0 },
                temperature: recommendation.temperature ?? null,
                isFrozen: recommendation.isFrozen ?? null,
                quantumOptimized: recommendation.quantumOptimized ?? true,
                timestamp: recommendation.timestamp ?? new Date().toISOString(),
            }
        });
    }, null), []);
    return {
        ...state,
        selectModel,
        selectBatch,
        compareModels,
        getRecommendation: getRecommendationData,
    };
};
export default useQuantumModelSelector;
