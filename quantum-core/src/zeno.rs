use wasm_bindgen::prelude::*;

/// Quantum Zeno Code Stabilizer
///
/// Implements the Quantum Zeno Effect (Watched Pot Never Boils): the phenomenon where
/// continuous observation of a quantum system prevents it from evolving or decaying.
///
/// Applied to software: A code module can "decay" (introduce bugs) over time. By
/// continuously observing it (running tests, type checks, static analysis), we can
/// suppress bug introduction and maintain code integrity.
///
/// Theory: A quantum system evolving under Hamiltonian H has decay rate that depends
/// on the time between measurements. If we measure frequently enough, the system has
/// insufficient time to decay.
///
/// Mathematical Formula:
/// P(t) = [1 - (Δt / τ)²]^N
/// where:
/// - Δt = time between observations
/// - τ = coherence time (natural decay rate)
/// - N = number of observations
/// - P(t) = survival probability (state integrity)
#[wasm_bindgen]
pub struct ZenoStabilizer {
    coherence_time: f64, // How fast code "decays" (bugs appear) naturally
}

#[wasm_bindgen]
impl ZenoStabilizer {
    /// Create a new Zeno stabilizer for code integrity
    ///
    /// # Arguments
    /// * `coherence_time` - Natural decay time without observation (0.0-1.0)
    ///   0.1 = Very unstable (bugs appear quickly)
    ///   0.5 = Moderate stability
    ///   0.9 = Very stable (needs fewer checks)
    pub fn new(coherence_time: f64) -> ZenoStabilizer {
        ZenoStabilizer {
            coherence_time: coherence_time.clamp(0.01, 1.0),
        }
    }

    /// Calculate the "Survival Probability" of code logic integrity
    ///
    /// The Quantum Zeno Effect: frequent observation suppresses decay.
    /// If observation_frequency is high (frequent checks), the code stays stable.
    /// If observation_frequency is low (infrequent checks), bugs accumulate.
    ///
    /// # Arguments
    /// * `observation_frequency` - How often code is tested/checked (Hz)
    ///   1 Hz = tested once per second
    ///   0.1 Hz = tested once per 10 seconds
    ///   0.01 Hz = tested once per 100 seconds (infrequent)
    /// * `time_elapsed` - Time since last commit (seconds)
    ///
    /// # Returns
    /// Survival probability (0.0-1.0)
    /// - 0.99+ = Code is "frozen" in good state (Zeno Effect active)
    /// - 0.5-0.99 = Gradual degradation
    /// - < 0.5 = System collapsing (bugs introduced)
    pub fn calculate_stability(&self, observation_frequency: f64, time_elapsed: f64) -> f64 {
        if observation_frequency <= 0.0 || time_elapsed < 0.0 {
            return 0.0;
        }

        // Time interval between measurements
        let delta_t = 1.0 / observation_frequency;

        // Number of measurements performed
        let n = (time_elapsed / delta_t).ceil() as i32;

        if n <= 0 {
            return 1.0; // No time has passed
        }

        // Zeno Effect Formula: P(t) = [1 - (Δt / τ)²]^N
        let decay_factor = (delta_t / self.coherence_time).powi(2);

        if decay_factor >= 1.0 {
            return 0.0; // System collapsed
        }

        let step_probability = 1.0 - decay_factor;

        // Apply Zeno suppression over N steps
        step_probability.powi(n).clamp(0.0, 1.0)
    }

    /// Check if the Zeno Effect is successfully "freezing" the code state
    ///
    /// The state is frozen when survival probability > 0.99 (very high stability)
    pub fn is_state_frozen(&self, stability_score: f64) -> bool {
        stability_score > 0.99
    }

    /// Determine the minimum observation frequency needed to maintain stability
    ///
    /// Given a time period and desired stability level, compute how often
    /// the code needs to be checked (tested, analyzed, etc.)
    ///
    /// # Arguments
    /// * `time_period` - Duration over which to maintain stability
    /// * `min_stability` - Minimum desired survival probability (0.5-1.0)
    ///
    /// # Returns
    /// Required observation frequency in Hz
    pub fn required_observation_frequency(&self, time_period: f64, min_stability: f64) -> f64 {
        if time_period <= 0.0 || min_stability <= 0.0 || min_stability > 1.0 {
            return 0.0;
        }

        // Binary search for required frequency
        let mut low = 0.001;
        let mut high = 100.0;

        for _ in 0..30 {
            let mid = (low + high) / 2.0;
            let stability = self.calculate_stability(mid, time_period);

            if stability < min_stability {
                low = mid;
            } else {
                high = mid;
            }
        }

        high
    }

    /// Analyze code degradation over time without observation
    ///
    /// Shows how stability decreases as time elapses with no checks
    pub fn degradation_timeline(&self, time_steps: usize) -> Vec<f64> {
        let mut timeline = Vec::with_capacity(time_steps);

        // No observation: frequency = 0.001 Hz (minimal checks)
        let observation_freq = 0.001;

        for i in 0..time_steps {
            let time = i as f64;
            let stability = self.calculate_stability(observation_freq, time);
            timeline.push(stability);
        }

        timeline
    }

    /// Calculate the "Freeze Depth" - how frozen is the code state?
    ///
    /// A measure from 0.0 (no freeze) to 1.0 (complete freeze)
    pub fn calculate_freeze_depth(&self, observation_frequency: f64, time_elapsed: f64) -> f64 {
        let stability = self.calculate_stability(observation_frequency, time_elapsed);
        
        // Freeze depth = 1 - decay
        // When stability is close to 1.0, freeze_depth is also close to 1.0
        if stability > 0.95 {
            1.0 - (1.0 - stability) * 20.0 // Amplify the effect
        } else {
            stability
        }
    }

    /// Recommend observation strategy based on risk tolerance
    pub fn get_observation_recommendation(&self, current_stability: f64) -> String {
        match current_stability {
            s if s > 0.99 => "✅ Excellent: Code state is frozen (Zeno Effect active)".to_string(),
            s if s > 0.95 => "🟢 Good: State is stable, maintain current observation frequency".to_string(),
            s if s > 0.90 => "🟡 Fair: Increase observation frequency slightly".to_string(),
            s if s > 0.75 => "🟠 Poor: Increase observation frequency significantly".to_string(),
            _ => "🔴 Critical: Constant observation needed to prevent collapse".to_string(),
        }
    }

    /// Get the coherence time of the system
    pub fn get_coherence_time(&self) -> f64 {
        self.coherence_time
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_high_frequency_observation_maintains_stability() {
        let stabilizer = ZenoStabilizer::new(0.5);
        let high_freq_stability = stabilizer.calculate_stability(10.0, 100.0);
        let low_freq_stability = stabilizer.calculate_stability(0.1, 100.0);
        
        assert!(
            high_freq_stability > low_freq_stability,
            "High frequency observation should maintain stability better"
        );
    }

    #[test]
    fn test_no_time_elapsed_is_perfect_stability() {
        let stabilizer = ZenoStabilizer::new(0.5);
        let stability = stabilizer.calculate_stability(1.0, 0.0);
        assert!((stability - 1.0).abs() < 0.01);
    }

    #[test]
    fn test_zero_frequency_decays_quickly() {
        let stabilizer = ZenoStabilizer::new(0.5);
        let stability = stabilizer.calculate_stability(0.001, 1000.0);
        assert!(stability < 0.5, "Very low observation frequency should lead to decay");
    }

    #[test]
    fn test_is_state_frozen_threshold() {
        let stabilizer = ZenoStabilizer::new(0.5);
        assert!(stabilizer.is_state_frozen(0.995));
        assert!(!stabilizer.is_state_frozen(0.98));
    }

    #[test]
    fn test_degradation_timeline_monotonically_decreases() {
        let stabilizer = ZenoStabilizer::new(0.5);
        let timeline = stabilizer.degradation_timeline(10);
        
        for i in 1..timeline.len() {
            assert!(
                timeline[i] <= timeline[i - 1],
                "Stability should decrease over time without observation"
            );
        }
    }

    #[test]
    fn test_required_observation_frequency_validity() {
        let stabilizer = ZenoStabilizer::new(0.5);
        let freq = stabilizer.required_observation_frequency(100.0, 0.95);
        
        // Verify the returned frequency actually achieves the desired stability
        let actual_stability = stabilizer.calculate_stability(freq, 100.0);
        assert!(actual_stability >= 0.94, "Should achieve desired stability");
    }
}
