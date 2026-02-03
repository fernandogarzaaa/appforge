const STORAGE_KEY = 'appforge_visualization_state';

const load = () => {
  if (typeof window === 'undefined') return { graphs: [], heatmaps: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { graphs: [], heatmaps: [] };
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { graphs: [], heatmaps: [] };
  }
};

const save = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const VisualizationStudioService = {
  getState() {
    return load();
  },

  saveGraph(graph) {
    const state = load();
    const next = {
      ...state,
      graphs: [graph, ...state.graphs],
    };
    save(next);
    return next;
  },

  addHeatmap(heatmap) {
    const state = load();
    const next = {
      ...state,
      heatmaps: [heatmap, ...state.heatmaps],
    };
    save(next);
    return next;
  },
};
