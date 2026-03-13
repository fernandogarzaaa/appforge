import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeStaticText } from "@/utils/staticAnalyzerBridge";
export function useStaticAnalyzer(options = {}) {
    const { enabled = true, debounceMs = 150 } = options;
    const [issues, setIssues] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastDurationMs, setLastDurationMs] = useState(null);
    const [error, setError] = useState(null);
    const debounceHandle = useRef(null);
    const latestRequest = useRef(null);
    useEffect(() => {
        return () => {
            if (debounceHandle.current) {
                clearTimeout(debounceHandle.current);
            }
        };
    }, []);
    const analyze = useCallback((input) => {
        if (!enabled)
            return;
        latestRequest.current = input;
        if (debounceHandle.current) {
            clearTimeout(debounceHandle.current);
        }
        debounceHandle.current = setTimeout(async () => {
            if (!latestRequest.current)
                return;
            setIsAnalyzing(true);
            const started = typeof performance !== "undefined" ? performance.now() : Date.now();
            try {
                const result = await analyzeStaticText(latestRequest.current);
                setIssues(result);
                setError(null);
            }
            catch (err) {
                setError(err?.message ?? "Static analyzer failed");
            }
            finally {
                const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
                setLastDurationMs(ended - started);
                setIsAnalyzing(false);
            }
        }, debounceMs);
    }, [enabled, debounceMs]);
    return { analyze, issues, isAnalyzing, lastDurationMs, error };
}
