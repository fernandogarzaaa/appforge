use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct CodeSolution {
    pub approach: String,
    pub code: String,
    pub amplitude: f64, // Probability amplitude
    pub constraints_met: usize,
    pub constraints_total: usize,
}

#[wasm_bindgen]
pub struct SuperpositionSynthesizer {
    solutions: Vec<CodeSolution>,
    interference_threshold: f64,
}

#[wasm_bindgen]
impl SuperpositionSynthesizer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SuperpositionSynthesizer {
        SuperpositionSynthesizer {
            solutions: Vec::new(),
            interference_threshold: 0.7,
        }
    }

    /// Step 1: Create superposition by generating multiple solution approaches
    /// This is the Hadamard gate - creating equal superposition
    pub fn create_superposition(&mut self, num_approaches: usize) {
        self.solutions.clear();
        
        // Initialize N solutions in equal superposition
        let initial_amplitude = 1.0 / (num_approaches as f64).sqrt();
        
        let approaches = vec![
            "Functional Approach",
            "Object-Oriented Approach",
            "Reactive Approach",
            "Event-Driven Approach",
            "Microservices Approach",
            "Monolithic Approach",
        ];

        for i in 0..num_approaches.min(approaches.len()) {
            self.solutions.push(CodeSolution {
                approach: approaches[i].to_string(),
                code: String::new(),
                amplitude: initial_amplitude,
                constraints_met: 0,
                constraints_total: 0,
            });
        }
    }

    /// Step 2: Apply interference based on constraint matching
    /// Solutions that violate constraints suffer destructive interference
    pub fn apply_interference(&mut self) {
        for solution in &mut self.solutions {
            if solution.constraints_total == 0 {
                continue;
            }

            let fit_ratio = solution.constraints_met as f64 / solution.constraints_total as f64;

            if fit_ratio >= self.interference_threshold {
                // Constructive interference: amplify good solutions
                solution.amplitude *= 1.0 + (fit_ratio - self.interference_threshold);
            } else {
                // Destructive interference: suppress bad solutions
                solution.amplitude *= fit_ratio;
            }
        }

        // Normalize amplitudes
        self.normalize_amplitudes();
    }

    /// Step 3: Collapse the wavefunction to the optimal solution
    /// Returns the index of the best solution
    pub fn collapse_to_optimal(&self) -> usize {
        let mut best_idx = 0;
        let mut best_amplitude = 0.0;

        for (idx, solution) in self.solutions.iter().enumerate() {
            if solution.amplitude > best_amplitude {
                best_amplitude = solution.amplitude;
                best_idx = idx;
            }
        }

        best_idx
    }

    /// Calculate probability of each solution (|amplitude|²)
    pub fn get_probabilities(&self) -> Vec<f64> {
        self.solutions
            .iter()
            .map(|s| s.amplitude.powi(2))
            .collect()
    }

    /// Normalize all amplitudes so sum of |amplitude|² = 1
    fn normalize_amplitudes(&mut self) {
        let sum_squares: f64 = self.solutions
            .iter()
            .map(|s| s.amplitude.powi(2))
            .sum();

        if sum_squares > 0.0 {
            let norm_factor = sum_squares.sqrt();
            for solution in &mut self.solutions {
                solution.amplitude /= norm_factor;
            }
        }
    }

    /// Get the optimal solution after collapse
    pub fn get_optimal_solution(&self) -> String {
        let idx = self.collapse_to_optimal();
        if let Some(solution) = self.solutions.get(idx) {
            format!(
                "Approach: {}\nFit: {:.1}%\nAmplitude: {:.3}",
                solution.approach,
                (solution.constraints_met as f64 / solution.constraints_total.max(1) as f64) * 100.0,
                solution.amplitude
            )
        } else {
            "No solution found".to_string()
        }
    }

    /// Simulate constraint checking for a solution
    pub fn evaluate_constraints(&mut self, solution_idx: usize, constraints_met: usize, constraints_total: usize) {
        if let Some(solution) = self.solutions.get_mut(solution_idx) {
            solution.constraints_met = constraints_met;
            solution.constraints_total = constraints_total;
        }
    }

    /// Get number of solutions in superposition
    pub fn get_solution_count(&self) -> usize {
        self.solutions.len()
    }

    /// Calculate entropy of the superposition (measure of uncertainty)
    pub fn calculate_entropy(&self) -> f64 {
        let probabilities = self.get_probabilities();
        -probabilities
            .iter()
            .filter(|&&p| p > 0.0)
            .map(|&p| p * p.log2())
            .sum::<f64>()
    }
}

#[wasm_bindgen]
pub struct QuantumCodeGenerator {
    synthesizer: SuperpositionSynthesizer,
}

#[wasm_bindgen]
impl QuantumCodeGenerator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> QuantumCodeGenerator {
        QuantumCodeGenerator {
            synthesizer: SuperpositionSynthesizer::new(),
        }
    }

    /// Generate optimal code architecture using quantum superposition
    pub fn generate_architecture(&mut self, num_approaches: usize, total_constraints: usize) -> String {
        // Step 1: Create superposition of approaches
        self.synthesizer.create_superposition(num_approaches);

        // Step 2: Simulate constraint evaluation for each approach
        for i in 0..num_approaches {
            // Simulate random constraint matching (in real implementation, this would be actual code analysis)
            let constraints_met = (rand::random::<f64>() * total_constraints as f64) as usize;
            self.synthesizer.evaluate_constraints(i, constraints_met, total_constraints);
        }

        // Step 3: Apply quantum interference
        self.synthesizer.apply_interference();

        // Step 4: Collapse to optimal solution
        let result = self.synthesizer.get_optimal_solution();
        let entropy = self.synthesizer.calculate_entropy();

        format!("{}\nEntropy: {:.3} bits", result, entropy)
    }

    /// Get all solution probabilities
    pub fn get_solution_analysis(&self) -> String {
        let probs = self.synthesizer.get_probabilities();
        let mut analysis = String::from("Solution Probabilities:\n");
        
        for (idx, prob) in probs.iter().enumerate() {
            analysis.push_str(&format!("  Solution {}: {:.1}%\n", idx + 1, prob * 100.0));
        }

        analysis
    }
}
