import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeStaticText, type StaticIssue } from "@/utils/staticAnalyzerBridge";

type AnalyzeParams = {
  path?: string;
  source: string;
};

type UseStaticAnalyzerOptions = {
  enabled?: boolean;
  debounceMs?: number;
};

type UseStaticAnalyzerResult = {
  analyze: (input: AnalyzeParams) => void;
  issues: StaticIssue[];
  isAnalyzing: boolean;
  lastDurationMs: number | null;
  error: string | null;
};

export function useStaticAnalyzer(
  options: UseStaticAnalyzerOptions = {},
): UseStaticAnalyzerResult {
  const { enabled = true, debounceMs = 150 } = options;
  const [issues, setIssues] = useState<StaticIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceHandle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequest = useRef<AnalyzeParams | null>(null);

  useEffect(() => {
    return () => {
      if (debounceHandle.current) {
        clearTimeout(debounceHandle.current);
      }
    };
  }, []);

  const analyze = useCallback(
    (input: AnalyzeParams) => {
      if (!enabled) return;
      latestRequest.current = input;

      if (debounceHandle.current) {
        clearTimeout(debounceHandle.current);
      }

      debounceHandle.current = setTimeout(async () => {
        if (!latestRequest.current) return;
        setIsAnalyzing(true);
        const started = typeof performance !== "undefined" ? performance.now() : Date.now();

        try {
          const result = await analyzeStaticText(latestRequest.current);
          setIssues(result);
          setError(null);
        } catch (err) {
          setError((err as Error)?.message ?? "Static analyzer failed");
        } finally {
          const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
          setLastDurationMs(ended - started);
          setIsAnalyzing(false);
        }
      }, debounceMs);
    },
    [enabled, debounceMs],
  );

  return { analyze, issues, isAnalyzing, lastDurationMs, error };
}
