import { create } from 'zustand';

export interface AuditLog {
    id: string;
    timestamp: number;
    status: 'PASS' | 'WARN' | 'BLOCKED';
    message: string;
    programId?: string;
    riskScore: number;
}

interface AuditState {
    logs: AuditLog[];
    addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
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
