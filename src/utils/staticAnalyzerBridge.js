const wasmPath = (typeof import.meta !== "undefined" &&
    import.meta.env?.
        VITE_STATIC_ANALYZER_WASM) ||
    "/static-analyzer-core/pkg/static_analyzer_core_bg.wasm";
let modulePromise = null;
const loadModule = async () => {
    if (!modulePromise) {
        modulePromise = import("@/static-analyzer-core/pkg/static_analyzer_core.js")
            .then(async (mod) => {
            try {
                if (typeof mod.default === "function") {
                    await mod.default(wasmPath);
                }
            }
            catch (error) {
                console.warn("[StaticAnalyzer] WASM init failed, using fallback", error);
            }
            return mod;
        })
            .catch((error) => {
            console.warn("[StaticAnalyzer] Failed to load module", error);
            return null;
        });
    }
    return modulePromise;
};
export const analyzeStaticText = async (input) => {
    if (!input.source)
        return [];
    const mod = await loadModule();
    if (!mod?.analyze_source)
        return [];
    try {
        const result = mod.analyze_source(input.path ?? "unknown", input.source);
        if (Array.isArray(result)) {
            return result;
        }
        if (result && typeof result === "object") {
            return result;
        }
    }
    catch (error) {
        console.warn("[StaticAnalyzer] analyze failed", error);
    }
    return [];
};
