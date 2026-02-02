use wasm_bindgen::prelude::*;
use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct DependencyNode {
    pub name: String,
    pub version: String,
    pub dependencies: Vec<String>,
    pub conflicts: Vec<String>,
}

#[wasm_bindgen]
pub struct QuantumAnnealer {
    temperature: f64,
    cooling_rate: f64,
    min_temperature: f64,
}

#[wasm_bindgen]
impl QuantumAnnealer {
    #[wasm_bindgen(constructor)]
    pub fn new(start_temp: f64, cooling_rate: f64) -> QuantumAnnealer {
        QuantumAnnealer {
            temperature: start_temp,
            cooling_rate,
            min_temperature: 0.01,
        }
    }

    /// Simulates quantum tunneling to find optimal configuration
    /// Returns true if the new state should be accepted
    pub fn optimize_energy(&mut self, current_cost: f64, new_cost: f64) -> bool {
        if new_cost < current_cost {
            return true; // Always accept better state (downhill move)
        }

        if self.temperature <= self.min_temperature {
            return false; // System frozen, reject uphill moves
        }

        // Quantum Tunneling Probability: e^((current - new) / temp)
        // This allows "tunneling through barriers" to escape local minima
        let delta_e = new_cost - current_cost;
        let probability = (-delta_e / self.temperature).exp();
        let mut rng = rand::thread_rng();

        // Cool down the system (simulated quantum decoherence)
        self.temperature *= self.cooling_rate;

        rng.gen::<f64>() < probability
    }

    /// Calculate energy (conflict score) of a dependency configuration
    pub fn calculate_energy(&self, conflicts: usize, missing: usize, version_distance: f64) -> f64 {
        // Energy function: higher = worse
        (conflicts as f64 * 100.0) + (missing as f64 * 50.0) + version_distance
    }

    /// Reset the annealer for a new optimization run
    pub fn reset(&mut self, start_temp: f64) {
        self.temperature = start_temp;
    }

    /// Get current temperature (for monitoring)
    pub fn get_temperature(&self) -> f64 {
        self.temperature
    }

    /// Check if the system has reached thermal equilibrium
    pub fn is_frozen(&self) -> bool {
        self.temperature <= self.min_temperature
    }
}

#[wasm_bindgen]
pub struct DependencyOptimizer {
    annealer: QuantumAnnealer,
    max_iterations: usize,
}

#[wasm_bindgen]
impl DependencyOptimizer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> DependencyOptimizer {
        DependencyOptimizer {
            annealer: QuantumAnnealer::new(100.0, 0.95),
            max_iterations: 10000,
        }
    }

    /// Optimize dependency tree using quantum annealing
    /// Returns the number of iterations taken
    pub fn optimize(&mut self, initial_conflicts: usize) -> usize {
        let mut current_energy = self.annealer.calculate_energy(initial_conflicts, 0, 0.0);
        let mut best_energy = current_energy;
        let mut iterations = 0;

        while !self.annealer.is_frozen() && iterations < self.max_iterations {
            // Simulate a random neighbor state
            let new_conflicts = if current_energy > 0.0 {
                (initial_conflicts as f64 * rand::thread_rng().gen::<f64>()).round() as usize
            } else {
                0
            };

            let new_energy = self.annealer.calculate_energy(new_conflicts, 0, 0.0);

            if self.annealer.optimize_energy(current_energy, new_energy) {
                current_energy = new_energy;
                if new_energy < best_energy {
                    best_energy = new_energy;
                }
            }

            iterations += 1;

            // Early termination if perfect solution found
            if best_energy == 0.0 {
                break;
            }
        }

        iterations
    }

    /// Get optimization statistics
    pub fn get_stats(&self) -> String {
        format!(
            "Temperature: {:.4}, Frozen: {}",
            self.annealer.get_temperature(),
            self.annealer.is_frozen()
        )
    }
}
