import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 🧬 Quantum Generated Type Definitions
export interface CausalNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  data: any;
  className?: string; // For ghost rendering
}

export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
}

interface CausalState {
  nodes: CausalNode[];
  edges: CausalEdge[];
  threshold: number;
  history: { nodes: CausalNode[]; edges: CausalEdge[] }[];
  historyIndex: number;

  // 🔮 Predictive State
  predictedNodes: CausalNode[];
  isPredicting: boolean;

  // Actions
  setNodes: (nodes: CausalNode[]) => void;
  setEdges: (edges: CausalEdge[]) => void;
  setThreshold: (threshold: number) => void;
  onNodesChange: (changes: any) => void;
  undo: () => void;
  redo: () => void;
  jumpTo: (index: number) => void;

  // 🔮 Predictive Actions
  predictFuture: () => void;
  clearPrediction: () => void;

  // 🔗 Quantum Entanglement
  entangledEdges: any[];
  processEntanglement: (packet: any) => void;

  // 🌠 Quantum Collapse
  collapsedState: any;
  collapseWavefunction: () => void;
  autoRemediate: () => void;

  // 👁️ Quantum Observability
  quantumMetrics: { entropy: number; coherence: number; stability: number; superpositionState: string } | null;
  updateQuantumMetrics: () => void;
}

export const useCausalStore = create<CausalState>()(
  devtools(
    persist(
      (set, get) => ({
        nodes: [],
        edges: [],
        threshold: 70,
        history: [{ nodes: [], edges: [] }],
        historyIndex: 0,

        // Predictive State
        predictedNodes: [],
        isPredicting: false,

        // Entanglement State
        entangledEdges: [],

        // Collapse State
        collapsedState: null,

        // Observability State
        quantumMetrics: null,

        setNodes: (nodes) => {
          const { history, historyIndex, edges } = get();
          const newHistory = history.slice(0, historyIndex + 1);
          const newState = { nodes, edges };
          newHistory.push(newState);

          set({
            nodes,
            history: newHistory,
            historyIndex: newHistory.length - 1
          }, false, 'setNodes');
        },

        setEdges: (edges) => {
          const { history, historyIndex, nodes } = get();
          const newHistory = history.slice(0, historyIndex + 1);
          const newState = { nodes, edges };
          newHistory.push(newState);

          set({
            edges,
            history: newHistory,
            historyIndex: newHistory.length - 1
          }, false, 'setEdges');
        },

        setThreshold: (threshold) => set({ threshold }, false, 'setThreshold'),

        onNodesChange: (changes) => {
          console.log("Quantum Update:", changes);
        },

        undo: () => {
          const { history, historyIndex } = get();
          if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const previousState = history[prevIndex];
            set({
              nodes: previousState.nodes,
              edges: previousState.edges,
              historyIndex: prevIndex
            }, false, 'undo');
          }
        },

        redo: () => {
          const { history, historyIndex } = get();
          if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextState = history[nextIndex];
            set({
              nodes: nextState.nodes,
              edges: nextState.edges,
              historyIndex: nextIndex
            }, false, 'redo');
          }
        },

        jumpTo: (index) => {
          const { history } = get();
          if (index >= 0 && index < history.length) {
            const targetState = history[index];
            set({
              nodes: targetState.nodes,
              edges: targetState.edges,
              historyIndex: index
            }, false, 'jumpTo');
          }
        },

        // 🔮 Predictive Logic
        predictFuture: () => {
          const { nodes } = get();
          if (nodes.length === 0) return;

          // Simulate Quantum Neural Network Projection
          const validNodes = nodes.filter(n => !n.id.startsWith('future-'));

          // Create 'Ghost Nodes' representing potential future states
          const predictedNodes = validNodes.map(n => ({
            ...n,
            id: `future-${n.id}`,
            label: `${n.label} ?`,
            position: {
              x: n.position.x + 100,
              y: n.position.y + 50
            },
            data: { ...n.data, probability: Math.random() },
            className: 'opacity-60 border-2 border-dashed border-purple-500 bg-purple-50/50'
          }));

          set({ predictedNodes, isPredicting: true }, false, 'predictFuture');
        },

        clearPrediction: () => set({ predictedNodes: [], isPredicting: false }, false, 'clearPrediction'),

        // 🔗 Quantum Entanglement Logic
        processEntanglement: (streamPacket) => {
          const { nodes } = get();

          // Analyze correlation (Entanglement) between stream and nodes
          const newEntanglements = nodes
            .filter(n => n.label.toLowerCase().includes(streamPacket.metric.toLowerCase()))
            .map(n => ({
              id: `entangled-${streamPacket.id}-${n.id}`,
              source: 'stream', // Virtual source
              target: n.id,
              strength: Math.random() * 100,
              isQuantum: true,
              details: streamPacket
            }));

          if (newEntanglements.length > 0) {
            set(state => ({
              entangledEdges: [...state.entangledEdges, ...newEntanglements].slice(-5) // Keep active entangled states (Limit 5)
            }), false, 'processEntanglement');
          }
        },

        // 🌠 Quantum Collapse Logic
        collapseWavefunction: async () => {
          const { predictedNodes, entangledEdges } = get();

          // Dynamic import to avoid SSR/Build issues with raw JS engine if any
          const { QuantumCollapse } = await import('../services/QuantumCollapse.js');
          const collapser = new QuantumCollapse();

          const result = await collapser.collapse(predictedNodes, entangledEdges);

          set({ collapsedState: result }, false, 'collapseWavefunction');
        },

        autoRemediate: () => {
          const { collapsedState, nodes } = get();
          if (!collapsedState) return;

          // Apply the decision:
          // 1. Convert the 'Ghost' node (future) into a real 'Resolved' node
          // 2. Clear predictions

          const resolutionNode = {
            id: `resolution-${Date.now()}`,
            label: `🛡️ ${collapsedState.decision.name}`,
            position: { x: nodes[0]?.position.x || 0, y: (nodes[0]?.position.y || 0) + 200 },
            data: { ...collapsedState.decision, resolved: true, timestamp: Date.now() },
            className: 'border-2 border-indigo-500 bg-indigo-50'
          };

          set({
            // Add resolution node to graph
            nodes: [...nodes, resolutionNode],
            // Clear quantum states
            predictedNodes: [],
            isPredicting: false,
            collapsedState: null,
            entangledEdges: [] // Reset entanglement as we reached a stable state
          }, false, 'autoRemediate');
        },

        // 👁️ Quantum Observability Logic
        updateQuantumMetrics: async () => {
          const { nodes, entangledEdges, predictedNodes } = get();

          // Dynamic import to access the class
          // NOTE: The file exports `QuantumInspiredAI` class.

          try {
            const { QuantumInspiredAI } = await import('../../QuantumEngine.js');
            const engine = new QuantumInspiredAI(); // No client needed for health check

            // We consider predictions as 'ghost nodes' for the measure
            const allNodes = [...nodes, ...predictedNodes];

            const metrics = engine.measureSystemHealth(allNodes, entangledEdges);

            set({ quantumMetrics: metrics }, false, 'updateQuantumMetrics');
          } catch (e) {
            console.error("Quantum Engine Link Failure:", e);
          }
        }
      }),
      {
        name: 'appforge-causal-storage',
      }
    )
  )
);
