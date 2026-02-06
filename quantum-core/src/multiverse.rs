use wasm_bindgen::prelude::*;
use rand::prelude::*;
use rand::rngs::StdRng;
use rand::SeedableRng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone)]
pub struct Universe {
    id: String,
    name: String,
    code_hash: String,
    viability_score: f64,
    performance_metric: f64,
    entanglement: f64,
    coherence: f64,
    decoherence_rate: f64,
    branches: u32,
    fidelity: f64,
    t1_relaxation: f64,
    iteration: u32,
}

#[wasm_bindgen]
pub struct MultiverseEngine {
    realities: HashMap<String, Universe>,
    rng: Option<StdRng>,
    seed: Option<u64>,
}

#[wasm_bindgen]
impl MultiverseEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> MultiverseEngine {
        MultiverseEngine {
            realities: HashMap::new(),
            rng: None,
            seed: None,
        }
    }

    /// Spawns a new parallel reality based on a decision branch.
    pub fn spawn_universe(&mut self, id: String, name: String, code_quality: f64) {
        self.spawn_universe_with_params(id, name, code_quality, 50.0, 95.0, 0.02);
    }

    /// Spawns a new parallel reality with explicit quantum parameters.
    pub fn spawn_universe_with_params(
        &mut self,
        id: String,
        name: String,
        code_quality: f64,
        entanglement: f64,
        coherence: f64,
        decoherence_rate: f64,
    ) {
        let quality = code_quality.clamp(0.0, 1.0);
        let stability = 1.0 / (1.0 + (1.0 - quality).exp());

        let perf = self.gen_range(10.0..60.0);
        let entanglement = entanglement.clamp(0.0, 100.0);
        let coherence = coherence.clamp(0.0, 100.0);
        let decoherence_rate = decoherence_rate.clamp(0.0, 0.2);
        let fidelity = (85.0 + (stability * 10.0) + (coherence * 0.05)).clamp(0.0, 100.0);
        let t1_relaxation = (50.0 + perf).clamp(30.0, 150.0);

        let universe = Universe {
            id: id.clone(),
            name,
            code_hash: format!("hash_{}", id),
            viability_score: stability,
            performance_metric: perf,
            entanglement,
            coherence,
            decoherence_rate,
            branches: 1,
            fidelity,
            t1_relaxation,
            iteration: 0,
        };

        self.realities.insert(id, universe);
    }

    /// Simulates time passing in all universes to see which one survives.
    /// Returns the ID of the best universe.
    pub fn simulate_evolution(&mut self, cycles: u32) -> String {
        if self.realities.is_empty() {
            return "unknown".to_string();
        }

        let mut best_universe = "unknown".to_string();
        let mut best_score = -1.0;
        let mut owned_rng = self.rng.take();
        let mut thread_rng = rand::thread_rng();

        for (id, universe) in self.realities.iter_mut() {
            for _ in 0..cycles {
                let entropy = match owned_rng.as_mut() {
                    Some(rng) => rng.gen_range(0.0..0.05),
                    None => thread_rng.gen_range(0.0..0.05),
                };
                universe.viability_score = (universe.viability_score - entropy).max(0.0);

                let entanglement_noise = match owned_rng.as_mut() {
                    Some(rng) => rng.gen_range(-2.5..2.5),
                    None => thread_rng.gen_range(-2.5..2.5),
                };
                universe.entanglement = (universe.entanglement + entanglement_noise).clamp(0.0, 100.0);

                let coherence_drop = universe.decoherence_rate * 5.0;
                universe.coherence = (universe.coherence - coherence_drop).clamp(0.0, 100.0);

                let perf_noise = match owned_rng.as_mut() {
                    Some(rng) => rng.gen_range(-1.5..1.5),
                    None => thread_rng.gen_range(-1.5..1.5),
                };
                universe.performance_metric = (universe.performance_metric + perf_noise).clamp(5.0, 120.0);

                universe.iteration = universe.iteration.saturating_add(1);
                let branch_value = ((universe.iteration + 1) as f64).ln() / 2f64.ln() + 1.0;
                universe.branches = branch_value.max(1.0) as u32;
                universe.fidelity = (85.0
                    + (universe.viability_score * 10.0)
                    + (universe.coherence * 0.05))
                    .clamp(0.0, 100.0);
                universe.t1_relaxation = (50.0 + universe.performance_metric).clamp(30.0, 150.0);
            }

            if universe.viability_score > best_score {
                best_score = universe.viability_score;
                best_universe = id.clone();
            }
        }

        self.rng = owned_rng;
        best_universe
    }

    /// Returns JSON representation of all parallel universes for UI visualization.
    pub fn get_multiverse_state(&self) -> String {
        let values: Vec<&Universe> = self.realities.values().collect();
        serde_json::to_string(&values).unwrap_or_else(|_| "[]".to_string())
    }

    /// Sets a deterministic seed for entropy, enabling reproducible simulations.
    pub fn set_seed(&mut self, seed: u64) {
        self.seed = Some(seed);
        self.rng = Some(StdRng::seed_from_u64(seed));
    }

    /// Resets the multiverse engine (clears all realities).
    pub fn reset(&mut self) {
        self.realities.clear();
    }
}

impl MultiverseEngine {
    fn gen_range(&mut self, range: std::ops::Range<f64>) -> f64 {
        if let Some(rng) = self.rng.as_mut() {
            rng.gen_range(range)
        } else {
            let mut rng = rand::thread_rng();
            rng.gen_range(range)
        }
    }
}
