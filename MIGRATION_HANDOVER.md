# Migration Handover

## Architecture Summary
- Rust `MultiverseEngine` in `quantum-core/src/multiverse.rs` exposes `spawn_universe`, `simulate_evolution`, `get_multiverse_state`, and `reset` via `wasm_bindgen`. Entropy is applied per cycle inside `simulate_evolution` using `rand::thread_rng()`.
- The React hook `useQuantumMultiverse` (`src/hooks/useQuantumMultiverse.js`) lazy-loads the generated WASM bundle (`../quantum-core/pkg/quantum_core`), constructs a single `MultiverseEngine`, and exposes `simulateTimeline` to spawn universes, run evolution cycles, and return parsed Rust state for UI consumption.
- `MultiverseViewer` (`src/components/quantum/MultiverseViewer.jsx`) is the consumer UI: it displays universes, a timeline summary, and metrics cards. It currently creates universes and toggles simulation state locally, while relying on the hook to drive backend multiverse evolution (needs further wiring to call `simulateTimeline`).

## Critical State (recently touched files)
- `src/components/quantum/MultiverseViewer.jsx`
- `src/hooks/useQuantumMultiverse.js`
- `quantum-core/src/multiverse.rs`

## Next Steps Roadmap (immediate, ordered)
1. Wire `MultiverseViewer` actions to `simulateTimeline` so Start/Reset routes through the Rust engine and the UI state reflects `get_multiverse_state` output (viability, performance, active branches).
2. Add deterministic entropy control in Rust (`simulate_evolution`) by accepting a seed from JS or exposing a `set_seed` method; surface it through the hook to enable reproducible simulations.
3. Persist universe definitions in the hook (or a zustand store) so React state and Rust engine stay in sync across toggles and resets; prevent duplicate spawns and handle unknown IDs from Rust safely.
4. Replace placeholder UI randomness (fidelity, T1, coherence/entanglement sliders) with real values derived from Rust state; extend Rust struct to emit these metrics if needed.
5. Harden WASM lifecycle: loading/error states, cancellation on unmount, and a lightweight health check that re-inits the engine when `init()` or `get_multiverse_state` fails.

## Technical Debt & Risks
- Entropy uses `rand::thread_rng()` inside `simulate_evolution` without seed injection, preventing reproducible runs; add explicit seeding or deterministic PRNG to stabilize simulations.
- UI metrics in `MultiverseViewer` (fidelity, relaxation, coherence visuals) rely on `Math.random` placeholders, not Rust outputs; risk of misleading telemetry.
- Hook/UI drift: `MultiverseViewer` expects `createUniverse`, `switchUniverse`, etc., but the current hook only exposes `simulateTimeline`; integration logic is incomplete and could lead to stale or unsynced universes.
- Error handling is minimal: WASM init failures only set local error state; no retry/backoff or engine reset on corrupted state. Add guards before calling engine methods.
