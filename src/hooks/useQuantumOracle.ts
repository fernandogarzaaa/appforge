import { useState, useCallback, useEffect } from 'react';

interface OracleResponse {
    isValid: boolean;
    confidence: number;
    issues?: string[];
}

export const useQuantumOracle = () => {
    const [isValidating, setIsValidating] = useState(false);
    const [oracleResult, setOracleResult] = useState<OracleResponse | null>(null);
    const [isOracleOnline, setIsOracleOnline] = useState(false);

    // Ping the Oracle on mount to check connection status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                // We send a dummy validation request to check connectivity
                const response = await fetch('http://localhost:3002/api/oracle/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: '// PING' })
                });
                if (response.ok) setIsOracleOnline(true);
            } catch (e) {
                setIsOracleOnline(false);
                console.log("Oracle Offline: Hybrid Mode Disabled");
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    const validateCode = useCallback(async (codeSnippet: string): Promise<OracleResponse> => {
        setIsValidating(true);
        try {
            const response = await fetch('http://localhost:3002/api/oracle/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: codeSnippet })
            });

            if (!response.ok) {
                // Fallback if the server returns an error but is technically "online"
                throw new Error(`Oracle Error: ${response.statusText}`);
            }

            const result = await response.json();

            // Map Rust server response to Frontend interface
            const decision: OracleResponse = {
                isValid: result.safe,
                confidence: result.confidence || (result.safe ? 0.99 : 0.0),
                issues: result.safe ? [] : [result.message]
            };

            setOracleResult(decision);
            setIsOracleOnline(true); // Connection confirmed successful
            return decision;

        } catch (error) {
            console.error("🔮 ORACLE ERROR:", error);
            setIsOracleOnline(false); // Connection failed
            const fallback: OracleResponse = {
                isValid: false, // Default to unsafe if Oracle is unreachable
                confidence: 0,
                issues: ['Oracle Disconnected - Hybrid Link Lost']
            };
            setOracleResult(fallback);
            return fallback;
        } finally {
            setIsValidating(false);
        }
    }, []);

    return {
        validateCode,
        isValidating,
        oracleResult,
        isOracleOnline
    };
};
