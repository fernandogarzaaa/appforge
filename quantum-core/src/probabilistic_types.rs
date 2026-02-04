use wasm_bindgen::prelude::*;
use rand::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
struct PossibleState {
    value: String,
    probability: f64,
}

#[wasm_bindgen]
pub struct QuantumVar {
    states: Vec<PossibleState>,
    is_collapsed: bool,
    collapsed_value: Option<String>,
}

#[wasm_bindgen]
impl QuantumVar {
    #[wasm_bindgen(constructor)]
    pub fn new() -> QuantumVar {
        QuantumVar {
            states: Vec::new(),
            is_collapsed: false,
            collapsed_value: None,
        }
    }

    /// Add a potential value this variable could have.
    /// Values are stored as JSON strings for interop with JS.
    pub fn add_state(&mut self, value: String, probability: f64) {
        if self.is_collapsed {
            return;
        }

        if !probability.is_finite() {
            return;
        }

        let clamped = probability.max(0.0);
        self.states.push(PossibleState {
            value,
            probability: clamped,
        });
        self.normalize();
    }

    /// Observe the variable and collapse the superposition into a single value.
    pub fn observe(&mut self) -> String {
        if self.is_collapsed {
            return self
                .collapsed_value
                .clone()
                .unwrap_or_else(|| "undefined".to_string());
        }

        if self.states.is_empty() {
            self.is_collapsed = true;
            self.collapsed_value = Some("undefined".to_string());
            return "undefined".to_string();
        }

        let mut rng = rand::thread_rng();
        let random_val: f64 = rng.gen();
        let mut cumulative = 0.0;
        let mut selected_value = "undefined".to_string();

        for state in &self.states {
            cumulative += state.probability;
            if random_val <= cumulative {
                selected_value = state.value.clone();
                break;
            }
        }

        self.is_collapsed = true;
        self.collapsed_value = Some(selected_value.clone());
        self.states.clear();

        selected_value
    }

    /// Return the most likely value without collapsing the state.
    pub fn peek_most_likely(&self) -> String {
        if self.is_collapsed {
            return self
                .collapsed_value
                .clone()
                .unwrap_or_else(|| "undefined".to_string());
        }

        let mut best_prob = -1.0;
        let mut best_val = "undefined".to_string();

        for state in &self.states {
            if state.probability > best_prob {
                best_prob = state.probability;
                best_val = state.value.clone();
            }
        }

        best_val
    }

    /// Shannon entropy: 0.0 = certainty, higher = uncertainty.
    pub fn uncertainty_index(&self) -> f64 {
        if self.is_collapsed {
            return 0.0;
        }

        self.states
            .iter()
            .map(|state| {
                if state.probability > 0.0 {
                    -state.probability * state.probability.log2()
                } else {
                    0.0
                }
            })
            .sum()
    }

    /// Merge another QuantumVar into this one (interference).
    pub fn entangle(&mut self, other: &QuantumVar) {
        if self.is_collapsed {
            return;
        }

        for other_state in &other.states {
            self.states.push(PossibleState {
                value: other_state.value.clone(),
                probability: other_state.probability * 0.5,
            });
        }

        self.normalize();
    }

    fn normalize(&mut self) {
        let total: f64 = self.states.iter().map(|s| s.probability).sum();
        if total > 0.0 {
            for state in &mut self.states {
                state.probability /= total;
            }
        }
    }
}
