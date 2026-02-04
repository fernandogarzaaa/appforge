use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// Represents a quantum state that can be evolved reversibly using Toffoli gates
#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct ReversibleState {
    /// Amplitude values for quantum state
    amplitudes: Vec<f64>,
    /// Phase information
    phase: f64,
    /// Current iteration/timestep
    iteration: u64,
    /// Arbitrary metadata (serialized as JSON string for WASM compatibility)
    #[wasm_bindgen(skip)]
    pub metadata: String,
}

#[wasm_bindgen]
impl ReversibleState {
    #[wasm_bindgen(constructor)]
    pub fn new(size: usize) -> ReversibleState {
        ReversibleState {
            amplitudes: vec![0.0; size],
            phase: 0.0,
            iteration: 0,
            metadata: String::from("{}"),
        }
    }

    /// Apply Toffoli gate (controlled-controlled-NOT) operation
    /// control1, control2: indices of control qubits
    /// target: index of target qubit to flip
    #[wasm_bindgen]
    pub fn apply_toffoli(&mut self, control1: usize, control2: usize, target: usize) -> bool {
        if control1 >= self.amplitudes.len()
            || control2 >= self.amplitudes.len()
            || target >= self.amplitudes.len()
        {
            return false;
        }

        // Toffoli gate: flip target if both controls are |1⟩ (amplitude > 0.5)
        if self.amplitudes[control1] > 0.5 && self.amplitudes[control2] > 0.5 {
            // Reversible NOT operation
            self.amplitudes[target] = 1.0 - self.amplitudes[target];
            self.phase += std::f64::consts::PI; // Phase flip
        }

        self.iteration += 1;
        true
    }

    /// Reversible increment operation: x' = x + 1 (without destroying old value)
    #[wasm_bindgen]
    pub fn reversible_increment(&mut self, index: usize) -> bool {
        if index >= self.amplitudes.len() {
            return false;
        }

        // Store old value in metadata before incrementing
        let old_value = self.amplitudes[index];
        self.amplitudes[index] = (old_value + 0.1).min(1.0); // Bounded increment
        
        // Record the transformation for reversibility
        let metadata: serde_json::Value = serde_json::from_str(&self.metadata).unwrap_or(serde_json::json!({}));
        let mut meta_obj = metadata.as_object().cloned().unwrap_or_default();
        meta_obj.insert(
            format!("inc_{}", self.iteration),
            serde_json::json!({"index": index, "old": old_value, "new": self.amplitudes[index]}),
        );
        self.metadata = serde_json::to_string(&meta_obj).unwrap_or(String::from("{}"));
        
        self.iteration += 1;
        true
    }

    /// Get current state as JSON
    #[wasm_bindgen]
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or(String::from("{}"))
    }

    #[wasm_bindgen(getter)]
    pub fn iteration(&self) -> u64 {
        self.iteration
    }

    #[wasm_bindgen(getter)]
    pub fn phase(&self) -> f64 {
        self.phase
    }
}

/// Snapshot of a reversible state at a specific point in time
#[derive(Clone, Serialize, Deserialize)]
pub struct StateSnapshot {
    pub timestamp: u64,
    pub iteration: u64,
    pub state: ReversibleState,
    pub description: String,
}

/// Diff between two states for efficient storage
#[derive(Clone, Serialize, Deserialize)]
struct StateDiff {
    from_iteration: u64,
    to_iteration: u64,
    changed_indices: Vec<usize>,
    amplitude_changes: Vec<f64>,
    phase_change: f64,
}

/// Manages timeline of reversible state snapshots with differential encoding
#[wasm_bindgen]
pub struct StateHistory {
    /// Full snapshots at key points (every Nth iteration)
    #[wasm_bindgen(skip)]
    snapshots: BTreeMap<u64, StateSnapshot>,
    /// Diffs between snapshots for efficient storage
    #[wasm_bindgen(skip)]
    diffs: Vec<StateDiff>,
    /// Maximum number of snapshots to keep
    max_snapshots: usize,
    /// Snapshot interval (full snapshot every N iterations)
    snapshot_interval: u64,
}

#[wasm_bindgen]
impl StateHistory {
    #[wasm_bindgen(constructor)]
    pub fn new(max_snapshots: usize, snapshot_interval: u64) -> StateHistory {
        StateHistory {
            snapshots: BTreeMap::new(),
            diffs: Vec::new(),
            max_snapshots,
            snapshot_interval,
        }
    }

    /// Record a new state snapshot
    #[wasm_bindgen]
    pub fn record_snapshot(
        &mut self,
        state: &ReversibleState,
        description: String,
    ) -> bool {
        let iteration = state.iteration;
        let timestamp = js_sys::Date::now() as u64;

        let snapshot = StateSnapshot {
            timestamp,
            iteration,
            state: state.clone(),
            description,
        };

        // Check if we need to create a diff or full snapshot
        if iteration % self.snapshot_interval == 0 {
            // Full snapshot
            self.snapshots.insert(iteration, snapshot);
        } else {
            // Create diff from previous snapshot
            if let Some((_, prev_snapshot)) = self.snapshots.range(..iteration).next_back() {
                let diff = self.compute_diff(&prev_snapshot.state, state);
                self.diffs.push(diff);
            }
        }

        // Prune old snapshots if we exceed max
        if self.snapshots.len() > self.max_snapshots {
            if let Some(&first_key) = self.snapshots.keys().next() {
                self.snapshots.remove(&first_key);
            }
        }

        true
    }

    /// Rollback to a specific iteration
    #[wasm_bindgen]
    pub fn rollback_to(&self, target_iteration: u64) -> Option<String> {
        // Find the nearest full snapshot before or at target
        let base_snapshot = self
            .snapshots
            .range(..=target_iteration)
            .next_back()
            .map(|(_, snapshot)| snapshot)?;

        // If exact match, return it
        if base_snapshot.iteration == target_iteration {
            return Some(serde_json::to_string(&base_snapshot.state).unwrap_or(String::from("{}")));
        }

        // Otherwise, apply diffs to reconstruct state
        let mut reconstructed = base_snapshot.state.clone();
        for diff in &self.diffs {
            if diff.from_iteration >= base_snapshot.iteration
                && diff.to_iteration <= target_iteration
            {
                // Apply diff
                for (i, &idx) in diff.changed_indices.iter().enumerate() {
                    if idx < reconstructed.amplitudes.len() {
                        reconstructed.amplitudes[idx] = diff.amplitude_changes[i];
                    }
                }
                reconstructed.phase += diff.phase_change;
                reconstructed.iteration = diff.to_iteration;
            }
        }

        Some(serde_json::to_string(&reconstructed).unwrap_or(String::from("{}")))
    }

    /// Get timeline as JSON array
    #[wasm_bindgen]
    pub fn get_timeline(&self) -> String {
        let timeline: Vec<_> = self
            .snapshots
            .values()
            .map(|snapshot| {
                serde_json::json!({
                    "iteration": snapshot.iteration,
                    "timestamp": snapshot.timestamp,
                    "description": snapshot.description,
                    "phase": snapshot.state.phase,
                })
            })
            .collect();

        serde_json::to_string(&timeline).unwrap_or(String::from("[]"))
    }

    /// Clear all history
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.snapshots.clear();
        self.diffs.clear();
    }

    #[wasm_bindgen(getter)]
    pub fn snapshot_count(&self) -> usize {
        self.snapshots.len()
    }
}

impl StateHistory {
    /// Compute diff between two states (internal method)
    fn compute_diff(&self, from: &ReversibleState, to: &ReversibleState) -> StateDiff {
        let mut changed_indices = Vec::new();
        let mut amplitude_changes = Vec::new();

        for (i, (&from_amp, &to_amp)) in from.amplitudes.iter().zip(&to.amplitudes).enumerate() {
            if (from_amp - to_amp).abs() > 1e-10 {
                changed_indices.push(i);
                amplitude_changes.push(to_amp);
            }
        }

        StateDiff {
            from_iteration: from.iteration,
            to_iteration: to.iteration,
            changed_indices,
            amplitude_changes,
            phase_change: to.phase - from.phase,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_toffoli_gate_reversibility() {
        let mut state = ReversibleState::new(3);
        state.amplitudes = vec![1.0, 1.0, 0.0]; // Both controls high, target low

        // Apply Toffoli
        state.apply_toffoli(0, 1, 2);
        assert_eq!(state.amplitudes[2], 1.0); // Target flipped

        // Apply again (should reverse)
        state.apply_toffoli(0, 1, 2);
        assert_eq!(state.amplitudes[2], 0.0); // Back to original
    }

    #[test]
    fn test_reversible_increment() {
        let mut state = ReversibleState::new(5);
        state.amplitudes[0] = 0.5;

        state.reversible_increment(0);
        assert_eq!(state.amplitudes[0], 0.6);
        
        // Metadata should contain old value
        let metadata: serde_json::Value = serde_json::from_str(&state.metadata).unwrap();
        assert!(metadata.as_object().unwrap().contains_key("inc_1"));
    }

    #[test]
    fn test_state_history_snapshot_and_rollback() {
        let mut history = StateHistory::new(10, 5);
        let mut state = ReversibleState::new(3);

        // Record snapshots at different iterations
        state.iteration = 0;
        history.record_snapshot(&state, String::from("Initial state"));

        state.amplitudes[0] = 0.5;
        state.iteration = 5;
        history.record_snapshot(&state, String::from("After operation"));

        state.amplitudes[1] = 0.8;
        state.iteration = 10;
        history.record_snapshot(&state, String::from("Final state"));

        assert_eq!(history.snapshot_count(), 3);

        // Rollback to iteration 5
        let rollback_json = history.rollback_to(5).unwrap();
        let rollback_state: ReversibleState = serde_json::from_str(&rollback_json).unwrap();
        assert_eq!(rollback_state.amplitudes[0], 0.5);
        assert_eq!(rollback_state.iteration, 5);
    }

    #[test]
    fn test_state_history_pruning() {
        let mut history = StateHistory::new(3, 1); // Max 3 snapshots
        let mut state = ReversibleState::new(2);

        for i in 0..5 {
            state.iteration = i;
            history.record_snapshot(&state, format!("Snapshot {}", i));
        }

        // Should keep only last 3 snapshots
        assert_eq!(history.snapshot_count(), 3);
    }
}
