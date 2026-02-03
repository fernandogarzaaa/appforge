use wasm_bindgen::prelude::*;
use num_complex::Complex;
use std::f64::consts::PI;

// Expose quantum annealer for AI model selection
pub mod annealer_model_selection;
pub use annealer_model_selection::{QuantumAnnealer, ModelMetrics};

// Expose holographic consensus engine for multi-model AI consensus
pub mod holographic;
pub use holographic::HolographicConsensus;

// Expose quantum tunneling penetration tester for security analysis
pub mod quantum_tunneling;
pub use quantum_tunneling::TunnelingScanner;

// Expose quantum Zeno stabilizer for code integrity monitoring
pub mod zeno;
pub use zeno::ZenoStabilizer;

// Expose renormalization group engine for criticality prediction
pub mod renormalization;
pub use renormalization::RenormalizationEngine;

// Expose entanglement for team collaboration
pub mod entanglement;
pub use entanglement::{EntangledState, CollaborationSync};

// Expose superposition synthesizer for code generation
pub mod superposition;
pub use superposition::{SuperpositionSynthesizer, QuantumCodeGenerator};

/// QuantumState represents a semantic confidence state.
#[wasm_bindgen]
pub struct QuantumState {
    amplitude: f64,
    phase: f64,
}

#[wasm_bindgen]
impl QuantumState {
    /// Initialize a state based on an AI model confidence score.
    #[wasm_bindgen(constructor)]
    pub fn new(confidence_score: f64) -> QuantumState {
        let amplitude = if confidence_score.is_sign_negative() {
            0.0
        } else {
            confidence_score.sqrt()
        };

        QuantumState {
            amplitude,
            phase: 0.0,
        }
    }

    /// Apply interference from another model's confidence and semantic agreement.
    #[wasm_bindgen]
    pub fn apply_interference(&mut self, other_confidence: f64, agreement_metric: f64) {
        // Clamp inputs to sane bounds
        let agreement = agreement_metric.clamp(0.0, 1.0);
        let other_conf = other_confidence.max(0.0);

        // Phase shift encodes disagreement
        let phase_shift = (1.0 - agreement) * PI;

        let self_complex = Complex::from_polar(self.amplitude, self.phase);
        let other_complex = Complex::from_polar(other_conf.sqrt(), phase_shift);

        let superposition = self_complex + other_complex;
        self.amplitude = superposition.norm();
        self.phase = superposition.arg();
    }

    /// Measure the final probability of truthfulness (0.0 - 1.0).
    #[wasm_bindgen]
    pub fn measure_probability(&self) -> f64 {
        let probability = self.amplitude.powi(2);
        probability.clamp(0.0, 1.0)
    }
}

    #[cfg(test)]
    mod tests {
        use super::*;
        use proptest::prelude::*;

        proptest! {
            #[test]
            fn probability_is_clamped(conf in -10.0f64..10.0) {
                let state = QuantumState::new(conf);
                let p = state.measure_probability();
                prop_assert!(p >= 0.0 && p <= 1.0);
            }
        }

        proptest! {
            #[test]
            fn high_agreement_never_worse(base_conf in 0.0f64..1.0, other_conf in 0.0f64..1.0) {
                let mut high_agree = QuantumState::new(base_conf);
                high_agree.apply_interference(other_conf, 1.0);

                let mut low_agree = QuantumState::new(base_conf);
                low_agree.apply_interference(other_conf, 0.0);

                prop_assert!(high_agree.measure_probability() + 1e-9 >= low_agree.measure_probability());
            }
        }

        #[test]
        fn zero_confidence_stays_zero() {
            let state = QuantumState::new(0.0);
            assert_eq!(state.measure_probability(), 0.0);
        }
    }
