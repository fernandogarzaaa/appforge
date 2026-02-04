use wasm_bindgen::prelude::*;
use rand::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone)]
pub struct Universe {
    id: String,
    name: String,
    code_hash: String,
    viability_score: f64,
    performance_metric: f64,
}

#[wasm_bindgen]
pub struct MultiverseEngine {
    realities: HashMap<String, Universe>,
}

#[wasm_bindgen]
impl MultiverseEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> MultiverseEngine {
        MultiverseEngine {
            realities: HashMap::new(),
        }
    }

    /// Spawns a new parallel reality based on a decision branch.
    pub fn spawn_universe(&mut self, id: String, name: String, code_quality: f64) {
        let quality = code_quality.clamp(0.0, 1.0);
        let stability = 1.0 / (1.0 + (1.0 - quality).exp());

        let mut rng = rand::thread_rng();
        let perf = rng.gen_range(10.0..60.0);

        let universe = Universe {
            id: id.clone(),
            name,
            code_hash: format!("hash_{}", id),
            viability_score: stability,
            performance_metric: perf,
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
        let mut rng = rand::thread_rng();

        for (id, universe) in self.realities.iter_mut() {
            for _ in 0..cycles {
                let entropy = rng.gen_range(0.0..0.05);
                universe.viability_score = (universe.viability_score - entropy).max(0.0);
            }

            if universe.viability_score > best_score {
                best_score = universe.viability_score;
                best_universe = id.clone();
            }
        }

        best_universe
    }

    /// Returns JSON representation of all parallel universes for UI visualization.
    pub fn get_multiverse_state(&self) -> String {
        let values: Vec<&Universe> = self.realities.values().collect();
        serde_json::to_string(&values).unwrap_or_else(|_| "[]".to_string())
    }

    /// Resets the multiverse engine (clears all realities).
    pub fn reset(&mut self) {
        self.realities.clear();
    }
}
