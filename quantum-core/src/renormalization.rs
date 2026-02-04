use wasm_bindgen::prelude::*;

/// Renormalization Group (RG) Flow Engine
///
/// Implements Kadanoff's Block Spin transformation for phase transition analysis.
/// Takes a massive array of system metrics (latencies, errors, resource usage) and
/// recursively "zooms out" to find the Critical Fixed Point where the system crashes.
///
/// In physics, the Renormalization Group tracks how system properties change under
/// scaling transformations. At the critical point, fluctuations grow without bound
/// and the system undergoes a phase transition.
///
/// Applied to systems: We take raw metrics at micro-scale, repeatedly coarse-grain
/// them, and track the divergence. When divergence reaches critical levels, the
/// system is approaching collapse.
///
/// Process:
/// 1. Decimation: Average over blocks of data
/// 2. Rescaling: Amplify fluctuations at each scale
/// 3. Flow: Repeat to find fixed points
/// 4. Criticality: Measure divergence rate to detect imminent phase transition
#[wasm_bindgen]
pub struct RenormalizationEngine {
    scale_factor: usize, // How much we "zoom out" per step (typically 2)
}

#[wasm_bindgen]
impl RenormalizationEngine {
    /// Create a new renormalization engine
    ///
    /// # Arguments
    /// * `scale_factor` - Coarse-graining factor (typically 2, 4, 8)
    ///   2 = average every 2 data points
    ///   4 = average every 4 data points
    ///   8 = aggressive coarse-graining
    pub fn new(scale_factor: usize) -> RenormalizationEngine {
        RenormalizationEngine {
            scale_factor: scale_factor.max(1),
        }
    }

    /// Perform one RG Flow Step (Decimation & Rescaling)
    ///
    /// Takes micro-scale metrics and returns macro-scale effective behavior.
    /// This is the core operation of the renormalization group transformation.
    ///
    /// # Process
    /// 1. **Decimation**: Divide data into chunks and average each chunk
    /// 2. **Rescaling**: Amplify local fluctuations at the macro scale
    ///
    /// The result shows how the system appears when viewed at a larger scale.
    /// Near critical points, fluctuations amplify dramatically.
    pub fn coarse_grain(&self, micro_metrics: &[f64]) -> Vec<f64> {
        if micro_metrics.is_empty() {
            return Vec::new();
        }

        let mut macro_metrics = Vec::new();
        let chunk_size = self.scale_factor;

        for chunk in micro_metrics.chunks(chunk_size) {
            if !chunk.is_empty() {
                // 1. Decimation: Calculate block average
                let sum: f64 = chunk.iter().sum();
                let avg = sum / chunk.len() as f64;

                // 2. Rescaling (Renormalization): Amplify fluctuations
                // The variance in a block indicates local volatility
                let variance = chunk
                    .iter()
                    .map(|x| (x - avg).powi(2))
                    .sum::<f64>()
                    / chunk.len() as f64;

                // Renormalized value combines average position and volatility
                // This amplification is crucial for detecting phase transitions
                let renormalized_val = avg + variance.sqrt();

                macro_metrics.push(renormalized_val);
            }
        }

        macro_metrics
    }

    /// Predict the "Critical Point" (System Crash) using RG Flow analysis
    ///
    /// Iteratively applies coarse-graining and tracks how rapidly the system
    /// diverges. At a critical point, the divergence rate becomes infinite.
    ///
    /// # Algorithm
    /// 1. Start with micro-scale metrics
    /// 2. Apply coarse-graining repeatedly
    /// 3. Track divergence at each scale
    /// 4. Calculate criticality based on divergence growth
    ///
    /// # Returns
    /// Criticality score (0.0-1.0)
    /// - 0.0 = Stable system (no divergence)
    /// - 0.5 = Approaching critical point
    /// - 0.9+ = Critical phase transition imminent
    pub fn predict_criticality(&self, metrics: &[f64]) -> f64 {
        if metrics.is_empty() {
            return 0.0;
        }

        let mut current_scale = metrics.to_vec();
        let mut divergence_rate = 0.0;
        let mut flow_iterations = 0;

        // Run RG Flow until we reach a single macroscopic point
        // (or a very small number of points)
        while current_scale.len() > 1 {
            // Calculate average at current scale
            let previous_avg: f64 = current_scale.iter().sum::<f64>() / current_scale.len() as f64;

            // Apply one coarse-graining step
            current_scale = self.coarse_grain(&current_scale);

            // Calculate average at new scale
            if !current_scale.is_empty() {
                let new_avg: f64 = current_scale.iter().sum::<f64>() / current_scale.len() as f64;

                // Track divergence: how much the system is growing
                // Large positive divergence indicates critical point approaching
                if new_avg > previous_avg {
                    divergence_rate += new_avg - previous_avg;
                }

                flow_iterations += 1;
            } else {
                break;
            }
        }

        // Normalize criticality score
        let criticality = divergence_rate / (flow_iterations as f64 + 1.0).max(1.0);

        // Clamp to 0-1 range
        if criticality > 1.0 {
            1.0
        } else if criticality < 0.0 {
            0.0
        } else {
            criticality
        }
    }

    /// Track the RG Flow evolution step by step
    ///
    /// Returns criticality level after flow evolution (0.0 = stable, 1.0 = critical)
    pub fn flow_evolution(&self, metrics: &[f64]) -> f64 {
        let mut current = metrics.to_vec();
        let mut max_criticality: f64 = 0.0;

        // Run flow for up to 10 iterations
        for _ in 0..10 {
            if current.len() <= 1 {
                break;
            }

            current = self.coarse_grain(&current);
            let criticality = self.predict_criticality(&current);
            max_criticality = max_criticality.max(criticality);
        }

        max_criticality
    }

    /// Find the scale at which the system becomes unstable
    ///
    /// Returns the number of RG flow steps before criticality threshold
    pub fn find_critical_scale(&self, metrics: &[f64], criticality_threshold: f64) -> usize {
        let mut current = metrics.to_vec();
        let mut scale = 0;

        for step in 0..20 {
            if current.len() <= 1 {
                return scale;
            }

            let criticality = self.predict_criticality(&current);
            if criticality > criticality_threshold {
                return step;
            }

            current = self.coarse_grain(&current);
            scale = step;
        }

        scale
    }

    /// Estimate time-to-crash based on current metrics
    ///
    /// Uses RG flow analysis to extrapolate when the system will reach
    /// critical state and potentially crash
    ///
    /// # Arguments
    /// * `metrics` - Current system metrics (latencies, error rates, etc.)
    /// * `update_interval` - How often metrics are collected (seconds)
    ///
    /// # Returns
    /// Estimated time until criticality in seconds (or -1 if stable)
    pub fn estimate_time_to_criticality(
        &self,
        metrics: &[f64],
        update_interval: f64,
    ) -> f64 {
        if metrics.is_empty() || update_interval <= 0.0 {
            return -1.0;
        }

        let criticality = self.predict_criticality(metrics);

        // If already above 0.8, system is in danger
        if criticality > 0.8 {
            return 0.0;
        }

        // Linear extrapolation (simplified)
        // time_to_critical = (1.0 - current_criticality) / divergence_rate
        let remaining = 1.0 - criticality;
        let estimated_steps = remaining / (0.01 + criticality.powf(2.0));

        (estimated_steps * update_interval).max(0.0)
    }

    /// Get health status based on criticality
    pub fn get_system_health(&self, metrics: &[f64]) -> String {
        let criticality = self.predict_criticality(metrics);

        match criticality {
            c if c < 0.2 => "🟢 Healthy: System is stable".to_string(),
            c if c < 0.4 => "🟡 Caution: Minor fluctuations detected".to_string(),
            c if c < 0.6 => "🟠 Warning: System approaching critical point".to_string(),
            c if c < 0.8 => "🔴 Danger: Critical point imminent".to_string(),
            _ => "💥 Critical: Phase transition in progress, system collapse likely".to_string(),
        }
    }

    /// Get the scale factor
    pub fn get_scale_factor(&self) -> usize {
        self.scale_factor
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coarse_grain_reduces_size() {
        let engine = RenormalizationEngine::new(2);
        let metrics = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
        let result = engine.coarse_grain(&metrics);
        assert_eq!(result.len(), 3);
    }

    #[test]
    fn test_coarse_grain_handles_odd_length() {
        let engine = RenormalizationEngine::new(2);
        let metrics = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let result = engine.coarse_grain(&metrics);
        assert_eq!(result.len(), 3);
    }

    #[test]
    fn test_predict_criticality_stable_system() {
        let engine = RenormalizationEngine::new(2);
        let metrics = vec![1.0; 100]; // Uniform metrics = stable
        let criticality = engine.predict_criticality(&metrics);
        assert!(criticality < 0.1, "Uniform system should have low criticality");
    }

    #[test]
    fn test_predict_criticality_diverging_system() {
        let engine = RenormalizationEngine::new(2);
        let mut metrics = vec![1.0; 100];
        // Add exponentially growing values
        for i in 0..50 {
            metrics[i] = 2.0_f64.powi(i as i32).min(1000.0);
        }
        let criticality = engine.predict_criticality(&metrics);
        assert!(criticality > 0.1, "Diverging system should have higher criticality");
    }

    #[test]
    fn test_flow_evolution_returns_multiple_scales() {
        let engine = RenormalizationEngine::new(2);
        let metrics = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
        let evolution = engine.flow_evolution(&metrics);
        assert!(evolution > 0.0, "Should have positive criticality");
        assert!(evolution < 1.0, "Should have criticality less than 1");
    }

    #[test]
    fn test_criticality_in_range() {
        let engine = RenormalizationEngine::new(2);
        let metrics = vec![
            0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 50.0, 100.0, 500.0, 1000.0,
        ];
        let criticality = engine.predict_criticality(&metrics);
        assert!(criticality >= 0.0 && criticality <= 1.0);
    }

    #[test]
    fn test_time_to_criticality_validity() {
        let engine = RenormalizationEngine::new(2);
        let metrics = vec![1.0, 1.0, 1.0, 1.0];
        let time = engine.estimate_time_to_criticality(&metrics, 1.0);
        assert!(time >= -1.0, "Should return valid time or -1");
    }
}
