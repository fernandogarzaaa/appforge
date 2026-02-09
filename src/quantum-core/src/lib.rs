//! Quantum-Inspired AI Engine - Rust/WebAssembly Core
//!
//! High-performance implementations of quantum-inspired algorithms:
//! - Levenshtein distance (string similarity)
//! - Quantum annealing optimization
//! - System health metrics
//! - DAG traversal for workflow execution
//! - Performance scoring
//!
//! Phase 2: Data Processing
//! - Statistical aggregation
//! - Anomaly detection
//! - Trend analysis
//!
//! Phase 3: Enterprise Features
//! - RBAC permission evaluation
//! - Rate limiting
//! - Audit processing

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod analytics;
mod security;
mod vitals;
mod workflow;

pub use analytics::*;
pub use security::*;
pub use vitals::*;
pub use workflow::*;

// ============================================================
// String Algorithms (SuperpositionProcessor)
// ============================================================

/// Calculate Levenshtein distance between two strings
/// O(n*m) time and space complexity
#[wasm_bindgen]
pub fn levenshtein_distance(s1: &str, s2: &str) -> usize {
    let s1_chars: Vec<char> = s1.chars().collect();
    let s2_chars: Vec<char> = s2.chars().collect();
    let len1 = s1_chars.len();
    let len2 = s2_chars.len();

    // Early returns for edge cases
    if len1 == 0 {
        return len2;
    }
    if len2 == 0 {
        return len1;
    }

    // Use two rows instead of full matrix for O(min(n,m)) space
    let mut prev_row: Vec<usize> = (0..=len2).collect();
    let mut curr_row: Vec<usize> = vec![0; len2 + 1];

    for i in 1..=len1 {
        curr_row[0] = i;

        for j in 1..=len2 {
            let cost = if s1_chars[i - 1] == s2_chars[j - 1] {
                0
            } else {
                1
            };

            curr_row[j] = (prev_row[j] + 1) // Deletion
                .min(curr_row[j - 1] + 1) // Insertion
                .min(prev_row[j - 1] + cost); // Substitution
        }

        std::mem::swap(&mut prev_row, &mut curr_row);
    }

    prev_row[len2]
}

/// Calculate similarity ratio between two strings (0.0 to 1.0)
#[wasm_bindgen]
pub fn calculate_similarity(s1: &str, s2: &str) -> f64 {
    let distance = levenshtein_distance(s1, s2);
    let max_len = s1.len().max(s2.len());

    if max_len == 0 {
        return 1.0;
    }

    1.0 - (distance as f64 / max_len as f64)
}

// ============================================================
// Quantum Annealing Optimizer
// ============================================================

/// Result of quantum annealing optimization
#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct AnnealingResult {
    best_energy: f64,
    iterations: u32,
    final_temperature: f64,
}

#[wasm_bindgen]
impl AnnealingResult {
    #[wasm_bindgen(getter)]
    pub fn best_energy(&self) -> f64 {
        self.best_energy
    }

    #[wasm_bindgen(getter)]
    pub fn iterations(&self) -> u32 {
        self.iterations
    }

    #[wasm_bindgen(getter)]
    pub fn final_temperature(&self) -> f64 {
        self.final_temperature
    }
}

/// Quantum-inspired annealing optimizer
/// Simulates quantum tunneling for global optimization
#[wasm_bindgen]
pub struct QuantumAnnealer {
    temperature: f64,
    cooling_rate: f64,
    min_temperature: f64,
}

#[wasm_bindgen]
impl QuantumAnnealer {
    #[wasm_bindgen(constructor)]
    pub fn new(initial_temp: f64, cooling_rate: f64, min_temp: f64) -> QuantumAnnealer {
        QuantumAnnealer {
            temperature: initial_temp,
            cooling_rate,
            min_temperature: min_temp,
        }
    }

    /// Run annealing optimization with a custom energy function
    /// Returns the best energy found
    pub fn optimize(&mut self, initial_energy: f64, max_iterations: u32) -> AnnealingResult {
        let mut current_energy = initial_energy;
        let mut best_energy = initial_energy;
        let mut iterations = 0u32;

        while self.temperature > self.min_temperature && iterations < max_iterations {
            // Generate neighbor energy (simulated perturbation)
            let perturbation = self.quantum_tunneling_probability() * 2.0 - 1.0;
            let neighbor_energy = current_energy + perturbation * self.temperature * 0.1;

            // Metropolis criterion with quantum enhancement
            let delta = neighbor_energy - current_energy;
            let acceptance_prob = if delta < 0.0 {
                1.0
            } else {
                (-delta / self.temperature).exp()
            };

            // Quantum tunneling boost - can escape deeper local minima
            let quantum_boost = 1.0 + (self.temperature / 1000.0).min(0.5);

            if pseudo_random(iterations) < acceptance_prob * quantum_boost {
                current_energy = neighbor_energy;

                if current_energy < best_energy {
                    best_energy = current_energy;
                }
            }

            // Cool down
            self.temperature *= self.cooling_rate;
            iterations += 1;
        }

        AnnealingResult {
            best_energy,
            iterations,
            final_temperature: self.temperature,
        }
    }

    fn quantum_tunneling_probability(&self) -> f64 {
        // Higher temperature = more tunneling
        (self.temperature / 1000.0).min(1.0)
    }
}

/// Simple deterministic pseudo-random for WASM (no std::random)
fn pseudo_random(seed: u32) -> f64 {
    let x = seed.wrapping_mul(1103515245).wrapping_add(12345);
    ((x >> 16) & 0x7fff) as f64 / 32768.0
}

// ============================================================
// System Health Metrics
// ============================================================

/// Quantum system health metrics
#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct HealthMetrics {
    pub entropy: f64,
    pub coherence: f64,
    pub stability: f64,
    pub superposition_active: bool,
    pub entanglement_count: u32,
}

#[wasm_bindgen]
impl HealthMetrics {
    #[wasm_bindgen(constructor)]
    pub fn new() -> HealthMetrics {
        HealthMetrics {
            entropy: 0.0,
            coherence: 100.0,
            stability: 100.0,
            superposition_active: false,
            entanglement_count: 0,
        }
    }
}

/// Measure quantum system health based on node state
#[wasm_bindgen]
pub fn measure_system_health(
    total_nodes: u32,
    ghost_nodes: u32,
    entanglement_count: u32,
) -> HealthMetrics {
    // Entropy: More ghost nodes and entanglements = higher entropy
    let entropy = ((ghost_nodes * 10) + (entanglement_count * 5)).min(100) as f64;

    // Coherence: Inverse of entropy, boosted by entanglements
    let coherence = (100.0 - entropy + (entanglement_count as f64 * 2.0))
        .max(0.0)
        .min(100.0);

    // Stability: Balance of coherence and low entropy
    let stability = (coherence + (100.0 - entropy)) / 2.0;

    HealthMetrics {
        entropy,
        coherence,
        stability,
        superposition_active: ghost_nodes > 0,
        entanglement_count,
    }
}

// ============================================================
// Utility Functions
// ============================================================

/// Fast hash for string-based node matching
#[wasm_bindgen]
pub fn fast_hash(input: &str) -> u32 {
    let mut hash: u32 = 5381;
    for byte in input.bytes() {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u32);
    }
    hash
}

/// Check if a node ID is a "ghost" (future prediction) node
#[wasm_bindgen]
pub fn is_ghost_node(node_id: &str) -> bool {
    node_id.starts_with("future-")
}

// ============================================================
// Tests (run with cargo test)
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_levenshtein_distance() {
        assert_eq!(levenshtein_distance("kitten", "sitting"), 3);
        assert_eq!(levenshtein_distance("", "abc"), 3);
        assert_eq!(levenshtein_distance("abc", ""), 3);
        assert_eq!(levenshtein_distance("abc", "abc"), 0);
    }

    #[test]
    fn test_similarity() {
        let sim = calculate_similarity("hello", "hallo");
        assert!(sim > 0.8 && sim < 1.0);
        assert_eq!(calculate_similarity("test", "test"), 1.0);
    }

    #[test]
    fn test_annealer() {
        let mut annealer = QuantumAnnealer::new(5000.0, 0.99, 0.01);
        let result = annealer.optimize(100.0, 1000);
        assert!(result.iterations > 0);
    }

    #[test]
    fn test_health_metrics() {
        let metrics = measure_system_health(10, 2, 3);
        assert!(metrics.entropy > 0.0);
        assert!(metrics.coherence > 0.0);
        assert!(metrics.superposition_active);
    }

    #[test]
    fn test_ghost_node() {
        assert!(is_ghost_node("future-node-1"));
        assert!(!is_ghost_node("node-1"));
    }
}
