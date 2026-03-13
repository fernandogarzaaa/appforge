import { useState, useEffect } from 'react';
export function useSovereignStatus() {
    const [status, setStatus] = useState(null);
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/sovereign/status');
            const data = await res.json();
            setStatus(data);
        }
        catch (e) {
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
