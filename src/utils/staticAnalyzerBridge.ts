type AnalyzerModule = {
  default?: (wasmPath?: string) => Promise<unknown>;
  analyze_source?: (path: string, source: string) => unknown;
};

export type StaticIssue = {
  path: string;
  rule: string;
  severity: "info" | "warn" | "error";
  message: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
  snippet: string;
};

const wasmPath =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.
      VITE_STATIC_ANALYZER_WASM) ||
  "/static-analyzer-core/pkg/static_analyzer_core_bg.wasm";

let modulePromise: Promise<AnalyzerModule | null> | null = null;

const loadModule = async (): Promise<AnalyzerModule | null> => {
  if (!modulePromise) {
    modulePromise = import("@/static-analyzer-core/pkg/static_analyzer_core.js")
      .then(async (mod) => {
        try {
          if (typeof mod.default === "function") {
            await mod.default(wasmPath);
          }
        } catch (error) {
          console.warn("[StaticAnalyzer] WASM init failed, using fallback", error);
        }
        return mod as AnalyzerModule;
      })
      .catch((error) => {
        console.warn("[StaticAnalyzer] Failed to load module", error);
        return null;
      });
  }
  return modulePromise;
};

export const analyzeStaticText = async (
  input: { path?: string; source: string },
): Promise<StaticIssue[]> => {
  if (!input.source) return [];
  const mod = await loadModule();
  if (!mod?.analyze_source) return [];

  try {
    const result = mod.analyze_source(input.path ?? "unknown", input.source);
    if (Array.isArray(result)) {
      return result as StaticIssue[];
    }
    if (result && typeof result === "object") {
      return result as StaticIssue[];
    }
  } catch (error) {
    console.warn("[StaticAnalyzer] analyze failed", error);
  }
  return [];
};
