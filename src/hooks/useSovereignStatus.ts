import { useState, useEffect } from 'react';

export interface SovereignStatus {
    kernel: {
        integrity: string;
        status: string;
        version: string;
    };
    axioms: {
        AX_PRIV: boolean;
        AX_MEM: boolean;
        AX_THROUGHPUT: boolean;
    };
    throughput: number;
}

export function useSovereignStatus() {
    const [status, setStatus] = useState<SovereignStatus | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/sovereign/status');
            const data = await res.json();
            setStatus(data);
        } catch (e) {
            console.error("Failed to fetch Sovereign Status", e);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return status;
}
