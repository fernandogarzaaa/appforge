import { create } from 'zustand';
export const useAuditStore = create((set) => ({
    logs: [],
    addLog: (log) => set((state) => ({
        logs: [
            {
                ...log,
                id: Math.random().toString(36).substring(7),
                timestamp: Date.now(),
            },
            ...state.logs
        ].slice(0, 50) // Keep last 50 logs
    })),
    clearLogs: () => set({ logs: [] }),
}));
