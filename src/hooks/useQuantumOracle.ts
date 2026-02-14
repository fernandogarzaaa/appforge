import { useState, useCallback, useEffect } from 'react';

interface OracleResponse {
    isValid: boolean;
    confidence: number;
    issues?: string[];
}

interface TxVerificationResponse {
    verified: boolean;
    risk_score: number;
    details: string;
}

import { useAuditStore } from '@/store/auditStore';

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
                throw new Error(`Oracle Error: ${response.statusText}`);
            }

            const result = await response.json();

            const decision: OracleResponse = {
                isValid: result.safe,
                confidence: result.confidence || (result.safe ? 0.99 : 0.0),
                issues: result.safe ? [] : [result.message]
            };

            setOracleResult(decision);
            setIsOracleOnline(true);
            return decision;

        } catch (error) {
            console.error("🔮 ORACLE ERROR:", error);
            setIsOracleOnline(false);
            const fallback: OracleResponse = {
                isValid: false,
                confidence: 0,
                issues: ['Oracle Disconnected - Hybrid Link Lost']
            };
            setOracleResult(fallback);
            return fallback;
        } finally {
            setIsValidating(false);
        }
    }, []);

    const verifyTransaction = useCallback(async (txBase64: string): Promise<TxVerificationResponse> => {
        setIsValidating(true);
        try {
            const response = await fetch('http://localhost:3002/api/oracle/verify-tx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tx: txBase64 })
            });

            if (!response.ok) throw new Error('Oracle-Iron Link Failure');

            const result: TxVerificationResponse = await response.json();

            // GLASS FIREWALL: Log to Global Store
            const status = result.verified ? 'PASS' : (result.risk_score >= 0.7 ? 'BLOCKED' : 'WARN');
            useAuditStore.getState().addLog({
                status: status,
                message: result.details,
                riskScore: result.risk_score,
                programId: result.details.includes('(') ? result.details.split('(')[1].split(')')[0] : undefined
            });

            return result;

        } catch (error) {
            console.error("💸 TX AUDIT ERROR:", error);
            useAuditStore.getState().addLog({
                status: 'BLOCKED',
                message: 'Oracle Connection Failed',
                riskScore: 1.0
            });
            return { verified: false, risk_score: 1.0, details: "Oracle Connection Failed" };
        } finally {
            setIsValidating(false);
        }
    }, []);

    return {
        validateCode,
        verifyTransaction,
        isValidating,
        oracleResult,
        isOracleOnline
    };
};
