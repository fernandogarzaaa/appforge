import { loadPersistedState, savePersistedState } from '@/services/persistenceStore';

const STORAGE_KEY = 'appforge_visualization_state';
const STATE_KEY = 'visualizationStudio';

const load = () =>
  loadPersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, fallback: { graphs: [], heatmaps: [] } });

const save = (value) => savePersistedState({ storageKey: STORAGE_KEY, stateKey: STATE_KEY, value });

export const VisualizationStudioService = {
  async getState() {
    return load();
  },

  async saveGraph(graph) {
    const state = await load();
    const next = {
      ...state,
      graphs: [graph, ...state.graphs],
    };
    await save(next);
    return next;
  },

  async addHeatmap(heatmap) {
    const state = await load();
    const next = {
      ...state,
      heatmaps: [heatmap, ...state.heatmaps],
    };
    await save(next);
    return next;
  },
};
