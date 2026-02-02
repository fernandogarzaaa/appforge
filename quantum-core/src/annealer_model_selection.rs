use wasm_bindgen::prelude::*;
use rand::prelude::*;
use serde::{Deserialize, Serialize};

/// Represents metrics for an AI model
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ModelMetrics {
    pub cost: f64,      // Normalized 0-1 (higher = more expensive)
    pub latency: f64,   // Normalized 0-1 (higher = slower)
    pub quality: f64,   // Normalized 0-1 (higher = better)
}

/// Quantum Annealer for AI Model Selection
/// 
/// Solves the "Knapsack Problem" of selecting the optimal AI model
/// by minimizing energy: E = (cost × 0.4) + (latency × 0.3) + ((1-quality) × 0.3)
/// 
/// This approach avoids hardcoded rules and instead uses simulated quantum annealing
/// to find the mathematically optimal model selection given task complexity.
#[wasm_bindgen]
pub struct QuantumAnnealer {
    temperature: f64,
    cooling_rate: f64,
    min_temperature: f64,
}

#[wasm_bindgen]
impl QuantumAnnealer {
    /// Creates a new Quantum Annealer for model selection
    /// 
    /// # Arguments
    /// * `start_temp` - Initial temperature (typically 100.0)
    /// * `cooling_rate` - Temperature decay rate per iteration (typically 0.95)
    #[wasm_bindgen(constructor)]
    pub fn new(start_temp: f64, cooling_rate: f64) -> QuantumAnnealer {
        QuantumAnnealer {
            temperature: start_temp,
            cooling_rate,
            min_temperature: 0.001,
        }
    }

    /// Calculates the "Energy" of an AI model configuration
    /// 
    /// Lower energy represents a better state:
    /// - Lower cost (more budget-friendly)
    /// - Lower latency (faster response)
    /// - Higher quality (better performance)
    /// 
    /// Energy Function:
    /// E = (cost × 0.4) + (latency × 0.3) + ((1 - quality) × 0.3)
    fn calculate_energy(&self, cost: f64, latency: f64, quality: f64) -> f64 {
        // Weights: Cost (0.4), Latency (0.3), Quality-Inversion (0.3)
        // Quality is inverted because annealing minimizes energy
        (cost * 0.4) + (latency * 0.3) + ((1.0 - quality) * 0.3)
    }

    /// Optimizes model selection using simulated quantum annealing
    /// 
    /// This method runs the Metropolis criterion to select the best model
    /// by exploring the solution space and accepting both uphill and downhill moves
    /// with controlled probability.
    /// 
    /// # Arguments
    /// * `models_data` - Flat array of [cost, latency, quality, cost, latency, quality, ...]
    ///
    /// # Returns
    /// Index of the optimal model (0-based)
    pub fn optimize_selection(&mut self, models_data: &[f64]) -> usize {
        let num_models = models_data.len() / 3;
        if num_models == 0 {
            return 0;
        }

        let mut rng = SmallRng::from_entropy();

        // Start with a random model
        let mut current_model_idx = rng.gen_range(0..num_models);
        let mut best_model_idx = current_model_idx;

        // Calculate initial energy
        let c = models_data[current_model_idx * 3];
        let l = models_data[current_model_idx * 3 + 1];
        let q = models_data[current_model_idx * 3 + 2];

        let mut current_energy = self.calculate_energy(c, l, q);
        let mut best_energy = current_energy;

        // Annealing Loop: Explore solution space with decreasing temperature
        for _ in 0..100 {
            // Cool down the system
            self.temperature *= self.cooling_rate;

            // Check if system is frozen
            if self.temperature < self.min_temperature {
                break;
            }

            // Propose a random neighbor (switch to a different model)
            let neighbor_idx = rng.gen_range(0..num_models);
            let nc = models_data[neighbor_idx * 3];
            let nl = models_data[neighbor_idx * 3 + 1];
            let nq = models_data[neighbor_idx * 3 + 2];

            let neighbor_energy = self.calculate_energy(nc, nl, nq);

            // Metropolis Criterion: Accept or reject the move
            let delta = neighbor_energy - current_energy;
            let probability = if delta < 0.0 {
                // Always accept better states (downhill)
                1.0
            } else {
                // Accept worse states with probability e^(-ΔE/T)
                (-delta / self.temperature).exp()
            };

            // Make the decision
            if rng.gen::<f64>() < probability {
                current_model_idx = neighbor_idx;
                current_energy = neighbor_energy;

                // Track the best state found
                if current_energy < best_energy {
                    best_energy = current_energy;
                    best_model_idx = current_model_idx;
                }
            }
        }

        best_model_idx
    }

    /// Optimizes model selection with task-specific constraints
    /// 
    /// Allows dynamic weighting based on task complexity
    /// 
    /// # Arguments
    /// * `models_data` - Flat array of model metrics
    /// * `cost_weight` - Weight for cost (0.0-1.0)
    /// * `latency_weight` - Weight for latency (0.0-1.0)
    /// * `quality_weight` - Weight for quality (0.0-1.0)
    pub fn optimize_with_weights(
        &mut self,
        models_data: &[f64],
        cost_weight: f64,
        latency_weight: f64,
        quality_weight: f64,
    ) -> usize {
        let num_models = models_data.len() / 3;
        if num_models == 0 {
            return 0;
        }

        let mut rng = SmallRng::from_entropy();
        let mut current_model_idx = rng.gen_range(0..num_models);
        let mut best_model_idx = current_model_idx;

        // Normalize weights
        let total_weight = cost_weight + latency_weight + quality_weight;
        let w_cost = cost_weight / total_weight;
        let w_latency = latency_weight / total_weight;
        let w_quality = quality_weight / total_weight;

        // Calculate initial energy with custom weights
        let c = models_data[current_model_idx * 3];
        let l = models_data[current_model_idx * 3 + 1];
        let q = models_data[current_model_idx * 3 + 2];

        let mut current_energy = (c * w_cost) + (l * w_latency) + ((1.0 - q) * w_quality);
        let mut best_energy = current_energy;

        // Annealing Loop
        for _ in 0..100 {
            self.temperature *= self.cooling_rate;

            if self.temperature < self.min_temperature {
                break;
            }

            let neighbor_idx = rng.gen_range(0..num_models);
            let nc = models_data[neighbor_idx * 3];
            let nl = models_data[neighbor_idx * 3 + 1];
            let nq = models_data[neighbor_idx * 3 + 2];

            let neighbor_energy = (nc * w_cost) + (nl * w_latency) + ((1.0 - nq) * w_quality);

            let delta = neighbor_energy - current_energy;
            let probability = if delta < 0.0 {
                1.0
            } else {
                (-delta / self.temperature).exp()
            };

            if rng.gen::<f64>() < probability {
                current_model_idx = neighbor_idx;
                current_energy = neighbor_energy;

                if current_energy < best_energy {
                    best_energy = current_energy;
                    best_model_idx = current_model_idx;
                }
            }
        }

        best_model_idx
    }

    /// Get current temperature (for monitoring)
    pub fn get_temperature(&self) -> f64 {
        self.temperature
    }

    /// Check if the system has reached thermal equilibrium (frozen)
    pub fn is_frozen(&self) -> bool {
        self.temperature < self.min_temperature
    }

    /// Reset the annealer for a new optimization run
    pub fn reset(&mut self, start_temp: f64) {
        self.temperature = start_temp;
    }
}

/// Model Selection Result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionResult {
    pub model_index: usize,
    pub energy: f64,
    pub temperature_final: f64,
}
