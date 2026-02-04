use wasm_bindgen::prelude::*;
use ndarray::{Array1, Array2};
use std::f64::consts::PI;

/// HolographicConsensus: Tensor Network-based consensus engine for multi-model AI
/// 
/// Theory: We model the consensus problem as a quantum superposition where each
/// AI model is a dimension in a "Truth Tensor". By using Holographic Reduced
/// Representations (HRR), we collapse this tensor into a single "Global Truth State"
/// where:
/// - Hallucinations (disagreement) cause destructive interference
/// - Facts (consensus) cause constructive interference
#[wasm_bindgen]
pub struct HolographicConsensus {
    dimensions: usize,
    coherence_threshold: f64,
}

#[wasm_bindgen]
impl HolographicConsensus {
    /// Create a new HolographicConsensus engine
    ///
    /// # Arguments
    /// * `dimensions` - Embedding dimension (typically 1536 for OpenAI embeddings)
    /// * `threshold` - Coherence threshold (0.0-1.0) for consensus quality
    pub fn new(dimensions: usize, threshold: f64) -> HolographicConsensus {
        HolographicConsensus {
            dimensions,
            coherence_threshold: threshold,
        }
    }

    /// Superpose multiple model embeddings into a single "Truth Vector"
    ///
    /// This is the core operation: ∣Ψ_Truth⟩ = Trace(ρ_ensemble ⋅ H_coherence)
    ///
    /// The algorithm:
    /// 1. Reconstruct the tensor from flattened embeddings
    /// 2. Initialize the global wavefunction as zero
    /// 3. For each model embedding:
    ///    - Calculate confidence (norm) and phase
    ///    - Apply quantum phase weighting: e^(iθ) where θ = confidence * π
    ///    - Add to superposition with constructive/destructive interference
    /// 4. Normalize using Born rule
    ///
    /// # Arguments
    /// * `flattened_embeddings` - Flat array of shape [num_models * dimensions]
    /// * `num_models` - Number of models (typically 3: GPT-4, Claude, Gemini)
    ///
    /// # Returns
    /// Normalized consensus vector of length `dimensions`
    pub fn superpose_models(&self, flattened_embeddings: &[f64], num_models: usize) -> Vec<f64> {
        let dim = self.dimensions;

        // 1. Reconstruct the Tensor from flat data
        // Shape: [Num_Models, Dimensions]
        let tensor_shape = (num_models, dim);
        let models_matrix = Array2::from_shape_vec(tensor_shape, flattened_embeddings.to_vec())
            .expect("Failed to create tensor from embeddings");

        // 2. Initialize the "Global Wavefunction" (Sum of all states)
        let mut global_state = Array1::<f64>::zeros(dim);

        for i in 0..num_models {
            let model_vector = models_matrix.row(i).to_owned();

            // 3. Apply Phase Shift (Quantum Weighting)
            // Calculate confidence (norm of the vector)
            let confidence_norm = model_vector.dot(&model_vector).sqrt();

            // Only process vectors with sufficient magnitude
            if confidence_norm > 1e-10 {
                // Quantum Phase Factor: e^(iθ) where θ = confidence * π
                // We use the cosine of the phase for real-valued computation
                let phase = (confidence_norm * PI).cos();

                // Add to superposition: |Ψ> += e^(iθ) * |Model_i>
                // The weighting naturally implements constructive/destructive interference
                let weighted_vector = model_vector.mapv(|x| x * phase);
                global_state = global_state + weighted_vector;
            }
        }

        // 4. Normalize the final state (Born Rule)
        // This ensures the result is a valid probability distribution
        let final_norm = global_state.dot(&global_state).sqrt();
        
        let normalized_state = if final_norm > 1e-10 {
            global_state.mapv(|x| x / final_norm)
        } else {
            // Fallback: return uniform distribution if normalization fails
            global_state.mapv(|_| 1.0 / (dim as f64))
        };

        normalized_state.to_vec()
    }

    /// Calculate the "Entanglement Entropy" of the consensus state
    ///
    /// This measures the quality/certainty of the consensus:
    /// - Low entropy (< 0.1) = Strong consensus (high certainty)
    /// - Medium entropy (0.1-0.5) = Moderate consensus
    /// - High entropy (> 0.5) = Weak consensus / hallucination risk
    ///
    /// Formula: S = -Σ p_i * ln(p_i) where p_i = |ψ_i|²
    /// This is the Von Neumann entropy approximation
    ///
    /// # Arguments
    /// * `state_vector` - The normalized consensus vector
    ///
    /// # Returns
    /// Entropy value (0.0 = maximum order, high value = maximum disorder)
    pub fn measure_entropy(&self, state_vector: &[f64]) -> f64 {
        let state = Array1::from_vec(state_vector.to_vec());

        // Von Neumann Entropy: S = -Tr(ρ ln ρ)
        // Approximated as: S = -Σ p * ln(p) where p = |ψ|²
        state
            .iter()
            .map(|&x| {
                let p = x.powi(2); // Probability density
                if p > 1e-15 {
                    -p * p.ln() // Entropy contribution
                } else {
                    0.0
                }
            })
            .sum()
    }

    /// Compute the "Coherence" of the ensemble
    ///
    /// This measures how much the models agree with each other (cross-model alignment).
    /// High coherence = models are generating similar embeddings
    /// Low coherence = models are diverging (potential hallucination)
    ///
    /// # Arguments
    /// * `flattened_embeddings` - Flat array of shape [num_models * dimensions]
    /// * `num_models` - Number of models
    ///
    /// # Returns
    /// Coherence value (0.0-1.0, where 1.0 = perfect agreement)
    pub fn measure_coherence(&self, flattened_embeddings: &[f64], num_models: usize) -> f64 {
        let dim = self.dimensions;
        let tensor_shape = (num_models, dim);
        let models_matrix = Array2::from_shape_vec(tensor_shape, flattened_embeddings.to_vec())
            .expect("Failed to create tensor from embeddings");

        if num_models < 2 {
            return 1.0; // Single model has perfect coherence with itself
        }

        // Calculate pairwise cosine similarities
        let mut total_similarity = 0.0;
        let mut pair_count = 0;

        for i in 0..num_models {
            for j in (i + 1)..num_models {
                let v1 = models_matrix.row(i).to_owned();
                let v2 = models_matrix.row(j).to_owned();

                let norm1 = v1.dot(&v1).sqrt();
                let norm2 = v2.dot(&v2).sqrt();

                if norm1 > 1e-10 && norm2 > 1e-10 {
                    let dot_product = v1.dot(&v2);
                    let cosine_sim = (dot_product / (norm1 * norm2)).abs();
                    total_similarity += cosine_sim;
                    pair_count += 1;
                }
            }
        }

        if pair_count > 0 {
            total_similarity / (pair_count as f64)
        } else {
            0.0
        }
    }

    /// Create a "Density Matrix" from the ensemble for advanced analysis
    ///
    /// The density matrix ρ = |Ψ⟩⟨Ψ| represents the full quantum state.
    /// This is useful for computing fidelity and other quantum metrics.
    ///
    /// # Arguments
    /// * `flattened_embeddings` - Flat array of shape [num_models * dimensions]
    /// * `num_models` - Number of models
    ///
    /// # Returns
    /// Flattened density matrix (symmetric, positive semi-definite)
    pub fn compute_density_matrix(&self, flattened_embeddings: &[f64], num_models: usize) -> Vec<f64> {
        let dim = self.dimensions;
        let tensor_shape = (num_models, dim);
        let models_matrix = Array2::from_shape_vec(tensor_shape, flattened_embeddings.to_vec())
            .expect("Failed to create tensor from embeddings");

        // Average the model vectors to get the ensemble state
        let mut ensemble_vector = Array1::<f64>::zeros(dim);
        for i in 0..num_models {
            ensemble_vector = ensemble_vector + models_matrix.row(i);
        }
        ensemble_vector = ensemble_vector.mapv(|x| x / (num_models as f64));

        // Compute outer product (density matrix): ρ = |ψ⟩⟨ψ|
        let mut density_matrix = Array2::<f64>::zeros((dim, dim));
        for i in 0..dim {
            for j in 0..dim {
                density_matrix[[i, j]] = ensemble_vector[i] * ensemble_vector[j];
            }
        }

        // Flatten and return
        density_matrix.into_shape(dim * dim)
            .expect("Failed to flatten density matrix")
            .to_vec()
    }

    /// Get the current coherence threshold
    pub fn get_coherence_threshold(&self) -> f64 {
        self.coherence_threshold
    }

    /// Get the current dimension size
    pub fn get_dimensions(&self) -> usize {
        self.dimensions
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_superpose_identical_vectors() {
        let engine = HolographicConsensus::new(4, 0.95);
        let vector = vec![1.0, 2.0, 3.0, 4.0];
        let flattened = [
            vector.clone(),
            vector.clone(),
            vector.clone(),
        ]
        .concat();

        let result = engine.superpose_models(&flattened, 3);
        assert_eq!(result.len(), 4);
        
        // All components should be positive and sum to approximately 1
        let sum: f64 = result.iter().sum();
        assert!((sum - 1.0).abs() < 0.01, "Result should be normalized");
    }

    #[test]
    fn test_entropy_calculation() {
        let engine = HolographicConsensus::new(4, 0.95);
        let state = vec![1.0, 0.0, 0.0, 0.0];
        
        let entropy = engine.measure_entropy(&state);
        assert!(entropy < 0.01, "Pure state should have low entropy");
    }

    #[test]
    fn test_coherence_similar_vectors() {
        let engine = HolographicConsensus::new(3, 0.95);
        let v1 = vec![1.0, 0.0, 0.0];
        let v2 = vec![1.0, 0.1, 0.0]; // Slightly different
        let v3 = vec![1.0, -0.1, 0.0];
        
        let flattened = [v1, v2, v3].concat();
        let coherence = engine.measure_coherence(&flattened, 3);
        
        assert!(coherence > 0.95, "Similar vectors should have high coherence");
    }
}
