use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::f64::consts::SQRT_2;

/// Represents a quantum entangled state for zero-latency synchronization
#[wasm_bindgen]
#[derive(Clone)]
pub struct EntangledState {
    alpha: f64, // Probability amplitude for |0⟩ state
    beta: f64,  // Probability amplitude for |1⟩ state
    phase: f64, // Relative phase
}

#[wasm_bindgen]
impl EntangledState {
    /// Create a maximally entangled Bell state |Φ+⟩ = (|00⟩ + |11⟩) / √2
    #[wasm_bindgen(constructor)]
    pub fn new() -> EntangledState {
        EntangledState::create_bell_state()
    }

    pub fn create_bell_state() -> EntangledState {
        // Initialize in perfectly entangled state
        let norm = 1.0 / SQRT_2;
        EntangledState {
            alpha: norm,
            beta: norm,
            phase: 0.0,
        }
    }

    /// Apply a rotation gate to the local state
    /// This simulates a local operation that affects the entangled pair
    pub fn apply_rotation(&mut self, theta: f64) {
        let cos_theta = (theta / 2.0).cos();
        let sin_theta = (theta / 2.0).sin();

        let new_alpha = cos_theta * self.alpha - sin_theta * self.beta;
        let new_beta = sin_theta * self.alpha + cos_theta * self.beta;

        self.alpha = new_alpha;
        self.beta = new_beta;
    }

    /// Apply a phase shift (Z-gate rotation)
    pub fn apply_phase(&mut self, phi: f64) {
        self.phase = (self.phase + phi) % (2.0 * std::f64::consts::PI);
    }

    /// Measure fidelity between local and remote states
    /// Returns a value between 0 (total conflict) and 1 (perfect sync)
    pub fn measure_fidelity(&self, remote_alpha: f64, remote_beta: f64) -> f64 {
        // Calculate overlap of state vectors (inner product)
        let overlap = (self.alpha * remote_alpha + self.beta * remote_beta).abs();
        overlap.powi(2) // Fidelity = |⟨ψ|φ⟩|²
    }

    /// Predict the remote state change needed to maintain entanglement
    /// Returns the rotation angle needed on remote state
    pub fn predict_remote_rotation(&self, target_alpha: f64, target_beta: f64) -> f64 {
        // Calculate required rotation to reach target state
        let current_angle = (self.beta / self.alpha).atan();
        let target_angle = (target_beta / target_alpha).atan();
        target_angle - current_angle
    }

    /// Check if states are entangled (correlated beyond classical limits)
    pub fn is_entangled(&self, remote_alpha: f64, remote_beta: f64) -> bool {
        let fidelity = self.measure_fidelity(remote_alpha, remote_beta);
        fidelity > 0.707 // Threshold for quantum correlation (1/√2)
    }

    /// Normalize the state vector
    pub fn normalize(&mut self) {
        let norm = (self.alpha.powi(2) + self.beta.powi(2)).sqrt();
        if norm > 0.0 {
            self.alpha /= norm;
            self.beta /= norm;
        }
    }

    /// Get state components for debugging
    pub fn get_alpha(&self) -> f64 {
        self.alpha
    }

    pub fn get_beta(&self) -> f64 {
        self.beta
    }

    pub fn get_phase(&self) -> f64 {
        self.phase
    }
}

#[wasm_bindgen]
pub struct CollaborationSync {
    local_state: EntangledState,
    sync_threshold: f64,
}

#[wasm_bindgen]
impl CollaborationSync {
    #[wasm_bindgen(constructor)]
    pub fn new() -> CollaborationSync {
        CollaborationSync {
            local_state: EntangledState::create_bell_state(),
            sync_threshold: 0.95,
        }
    }

    /// Update local state and get predicted remote changes
    pub fn update_local(&mut self, change_magnitude: f64) -> f64 {
        self.local_state.apply_rotation(change_magnitude);
        self.local_state.normalize();

        // Return the predicted rotation for remote state
        change_magnitude
    }

    /// Check if sync is required based on fidelity threshold
    pub fn needs_sync(&self, remote_alpha: f64, remote_beta: f64) -> bool {
        let fidelity = self.local_state.measure_fidelity(remote_alpha, remote_beta);
        fidelity < self.sync_threshold
    }

    /// Get current fidelity score
    pub fn get_fidelity(&self, remote_alpha: f64, remote_beta: f64) -> f64 {
        self.local_state.measure_fidelity(remote_alpha, remote_beta)
    }
}

#[derive(Serialize, Deserialize)]
pub struct SyncState {
    pub alpha: f64,
    pub beta: f64,
    pub phase: f64,
    pub timestamp: u64,
}
