use wasm_bindgen::prelude::*;
use std::f64::consts::E;

/// Quantum Tunneling Penetration Tester
///
/// Uses the WKB (Wentzel-Kramers-Brillouin) Approximation method to calculate the
/// probability of a security attack vector "tunneling" through a security barrier
/// (firewall, authentication, encryption) even without classical credentials.
///
/// In quantum mechanics, particles can tunnel through energy barriers that would
/// classically be impossible to cross. This applies the same principle to security:
/// an attack may bypass defenses through quantum-like "probability channels".
///
/// Theory: If an attack has energy E less than barrier potential V, classically
/// it's blocked. But the WKB transmission coefficient gives the quantum tunneling
/// probability: T ≈ exp(-2 * width * sqrt(2m(V - E)) / h_bar)
#[wasm_bindgen]
pub struct TunnelingScanner {
    barrier_width: f64,   // Represents firewall complexity (0.0-1.0, higher = thicker defense)
    decay_constant: f64,  // Planck-like constant for quantum simulation
}

#[wasm_bindgen]
impl TunnelingScanner {
    /// Create a new tunneling scanner with specified barrier width
    ///
    /// # Arguments
    /// * `barrier_width` - Thickness of security barrier (0.0-1.0)
    ///   0.1 = thin/simple firewall, 0.9 = thick/complex defense
    pub fn new(barrier_width: f64) -> TunnelingScanner {
        TunnelingScanner {
            barrier_width: barrier_width.clamp(0.0, 1.0),
            decay_constant: 10.0, // Planck-like constant for simulation
        }
    }

    /// Calculate the probability of an attack tunneling through a security barrier
    ///
    /// # Arguments
    /// * `barrier_height` - Strength of security rule (0.0-1.0)
    ///   Examples:
    ///   - 0.2 = Basic password check
    ///   - 0.5 = Multi-factor authentication
    ///   - 0.8 = Hardware security module
    ///   - 0.95 = Military-grade encryption
    /// * `attack_energy` - Sophistication/strength of attack (0.0-1.0)
    ///   Examples:
    ///   - 0.1 = Brute force (simple, weak)
    ///   - 0.4 = Dictionary attack
    ///   - 0.6 = SQL injection
    ///   - 0.8 = Zero-day exploit
    ///   - 0.95 = Nation-state level
    ///
    /// # Returns
    /// Transmission coefficient: probability of successful tunneling (0.0-1.0)
    /// - 0.0 = No chance of tunneling
    /// - 0.5 = 50% probability of bypassing security
    /// - 1.0 = Definite breach (energy >= barrier)
    pub fn calculate_tunneling_probability(&self, barrier_height: f64, attack_energy: f64) -> f64 {
        let barrier_height = barrier_height.clamp(0.0, 1.0);
        let attack_energy = attack_energy.clamp(0.0, 1.0);

        // Classical Physics Check: If attack_energy >= barrier_height, classical breach
        if attack_energy >= barrier_height {
            return 1.0; // Definite penetration
        }

        // Quantum Tunneling: WKB Approximation
        // T ≈ exp(-2 * width * sqrt(2m(V - E)) / h_bar)
        // Simplified for security context:
        let potential_diff = barrier_height - attack_energy;
        
        // The deeper the barrier (larger V-E), the exponentially smaller transmission
        let exponent = -2.0 
            * self.barrier_width 
            * (2.0 * potential_diff).sqrt() 
            * self.decay_constant;

        // Return transmission coefficient (probability of tunneling)
        E.powf(exponent).clamp(0.0, 1.0)
    }

    /// Run a Monte Carlo penetration test simulation
    ///
    /// Simulates multiple attack attempts with varying sophistication levels
    /// to determine overall security resilience.
    ///
    /// # Arguments
    /// * `iterations` - Number of simulated attacks
    /// * `avg_barrier` - Average barrier strength across all security measures
    ///
    /// # Returns
    /// Vector of tunneling probabilities for each simulated attack
    pub fn run_penetration_test(&self, iterations: usize, avg_barrier: f64) -> Vec<f64> {
        let mut results = Vec::with_capacity(iterations);
        let avg_barrier = avg_barrier.clamp(0.0, 1.0);

        for i in 0..iterations {
            // Pseudo-random fluctuation based on iteration (deterministic for testing)
            // Simulates quantum fluctuations in attack sophistication
            let fluctuation = (i as f64).sin().abs() * 0.2;
            let attack_energy = 0.4 + fluctuation; // Base attack + fluctuation
            
            let prob = self.calculate_tunneling_probability(avg_barrier, attack_energy);
            results.push(prob);
        }

        results
    }

    /// Identify critical weaknesses by finding maximum tunneling probability
    ///
    /// Returns the maximum tunneling probability found
    pub fn find_critical_weakness(&self, barriers: &[f64]) -> f64 {
        let mut max_prob = 0.0;

        for &barrier in barriers.iter() {
            // Test median sophistication attack
            let prob = self.calculate_tunneling_probability(barrier, 0.5);
            if prob > max_prob {
                max_prob = prob;
            }
        }

        max_prob
    }

    /// Analyze required barrier strength to block an attack
    ///
    /// Given attack sophistication, determine minimum barrier needed
    pub fn required_barrier_for_attack(&self, attack_energy: f64, target_blocking: f64) -> f64 {
        let attack_energy = attack_energy.clamp(0.0, 1.0);
        let target_blocking = target_blocking.clamp(0.5, 1.0);

        // Binary search for required barrier height
        let mut low = attack_energy;
        let mut high = 1.0;

        for _ in 0..20 {
            let mid = (low + high) / 2.0;
            let tunneling_prob = self.calculate_tunneling_probability(mid, attack_energy);

            if tunneling_prob > (1.0 - target_blocking) {
                low = mid;
            } else {
                high = mid;
            }
        }

        high.clamp(0.0, 1.0)
    }

    /// Get the barrier width (firewall complexity)
    pub fn get_barrier_width(&self) -> f64 {
        self.barrier_width
    }

    /// Get the decay constant (quantum simulation parameter)
    pub fn get_decay_constant(&self) -> f64 {
        self.decay_constant
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classical_breach() {
        let scanner = TunnelingScanner::new(0.5);
        let prob = scanner.calculate_tunneling_probability(0.5, 0.9);
        assert!(prob > 0.99, "Attack with energy >= barrier should breach");
    }

    #[test]
    fn test_tunneling_probability_decreases_with_barrier() {
        let scanner = TunnelingScanner::new(0.5);
        let prob_weak = scanner.calculate_tunneling_probability(0.3, 0.1);
        let prob_strong = scanner.calculate_tunneling_probability(0.8, 0.1);
        assert!(prob_weak > prob_strong, "Stronger barrier should have lower tunneling prob");
    }

    #[test]
    fn test_penetration_test_returns_correct_length() {
        let scanner = TunnelingScanner::new(0.5);
        let results = scanner.run_penetration_test(100, 0.7);
        assert_eq!(results.len(), 100);
    }

    #[test]
    fn test_all_probabilities_valid() {
        let scanner = TunnelingScanner::new(0.5);
        let results = scanner.run_penetration_test(50, 0.6);
        for prob in results {
            assert!(prob >= 0.0 && prob <= 1.0);
        }
    }
}
