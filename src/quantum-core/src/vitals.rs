//! Web Vitals Performance Calculations - Rust/WebAssembly
//!
//! High-performance metrics processing:
//! - Performance score calculation
//! - Threshold evaluation
//! - Metric interpolation

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Web Vitals thresholds (Google's recommended values)
#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct VitalThreshold {
    good: f64,
    poor: f64,
}

#[wasm_bindgen]
impl VitalThreshold {
    #[wasm_bindgen(constructor)]
    pub fn new(good: f64, poor: f64) -> VitalThreshold {
        VitalThreshold { good, poor }
    }
}

/// Default thresholds for Core Web Vitals
#[wasm_bindgen]
pub fn get_lcp_threshold() -> VitalThreshold {
    VitalThreshold::new(2500.0, 4000.0)
}

#[wasm_bindgen]
pub fn get_fid_threshold() -> VitalThreshold {
    VitalThreshold::new(100.0, 300.0)
}

#[wasm_bindgen]
pub fn get_cls_threshold() -> VitalThreshold {
    VitalThreshold::new(0.1, 0.25)
}

#[wasm_bindgen]
pub fn get_fcp_threshold() -> VitalThreshold {
    VitalThreshold::new(1800.0, 3000.0)
}

#[wasm_bindgen]
pub fn get_ttfb_threshold() -> VitalThreshold {
    VitalThreshold::new(800.0, 1800.0)
}

/// Calculate score for a single metric (0-100)
#[wasm_bindgen]
pub fn calculate_metric_score(value: f64, good: f64, poor: f64) -> f64 {
    if value <= good {
        100.0
    } else if value >= poor {
        0.0
    } else {
        // Linear interpolation between good and poor
        100.0 - ((value - good) / (poor - good)) * 100.0
    }
}

/// Calculate overall performance score from individual metrics
/// Weights: LCP (25%), FID (25%), CLS (25%), FCP (12.5%), TTFB (12.5%)
#[wasm_bindgen]
pub fn calculate_performance_score(lcp: f64, fid: f64, cls: f64, fcp: f64, ttfb: f64) -> f64 {
    // Check for sentinel values (-1 = not measured)
    let mut total_weight = 0.0;
    let mut weighted_sum = 0.0;

    if lcp >= 0.0 {
        let score = calculate_metric_score(lcp, 2500.0, 4000.0);
        weighted_sum += score * 0.25;
        total_weight += 0.25;
    }

    if fid >= 0.0 {
        let score = calculate_metric_score(fid, 100.0, 300.0);
        weighted_sum += score * 0.25;
        total_weight += 0.25;
    }

    if cls >= 0.0 {
        let score = calculate_metric_score(cls, 0.1, 0.25);
        weighted_sum += score * 0.25;
        total_weight += 0.25;
    }

    if fcp >= 0.0 {
        let score = calculate_metric_score(fcp, 1800.0, 3000.0);
        weighted_sum += score * 0.125;
        total_weight += 0.125;
    }

    if ttfb >= 0.0 {
        let score = calculate_metric_score(ttfb, 800.0, 1800.0);
        weighted_sum += score * 0.125;
        total_weight += 0.125;
    }

    if total_weight > 0.0 {
        (weighted_sum / total_weight).round()
    } else {
        0.0
    }
}

/// Get status color based on metric value
/// Returns: 0 = green (good), 1 = yellow (needs improvement), 2 = red (poor)
#[wasm_bindgen]
pub fn get_status_code(value: f64, good: f64, poor: f64) -> u8 {
    if value <= good {
        0
    } else if value <= poor {
        1
    } else {
        2
    }
}

/// Batch process multiple metrics and return scores
#[wasm_bindgen]
pub fn batch_score_metrics(values_csv: &str, thresholds_csv: &str) -> String {
    // Format: values = "2000,80,0.05,1500,600"
    // Format: thresholds = "2500:4000,100:300,0.1:0.25,1800:3000,800:1800"

    let values: Vec<f64> = values_csv
        .split(',')
        .filter_map(|v| v.parse().ok())
        .collect();

    let thresholds: Vec<(f64, f64)> = thresholds_csv
        .split(',')
        .filter_map(|t| {
            let parts: Vec<&str> = t.split(':').collect();
            if parts.len() == 2 {
                Some((
                    parts[0].parse().unwrap_or(0.0),
                    parts[1].parse().unwrap_or(100.0),
                ))
            } else {
                None
            }
        })
        .collect();

    let scores: Vec<String> = values
        .iter()
        .zip(thresholds.iter())
        .map(|(v, (good, poor))| format!("{:.1}", calculate_metric_score(*v, *good, *poor)))
        .collect();

    scores.join(",")
}

/// Calculate progress bar width percentage
#[wasm_bindgen]
pub fn calculate_progress_width(value: f64, poor_threshold: f64) -> f64 {
    ((poor_threshold / value) * 100.0).min(100.0)
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metric_score_good() {
        let score = calculate_metric_score(2000.0, 2500.0, 4000.0);
        assert_eq!(score, 100.0);
    }

    #[test]
    fn test_metric_score_poor() {
        let score = calculate_metric_score(5000.0, 2500.0, 4000.0);
        assert_eq!(score, 0.0);
    }

    #[test]
    fn test_metric_score_middle() {
        let score = calculate_metric_score(3250.0, 2500.0, 4000.0);
        assert!((score - 50.0).abs() < 0.1);
    }

    #[test]
    fn test_performance_score() {
        // All perfect metrics
        let score = calculate_performance_score(2000.0, 50.0, 0.05, 1500.0, 500.0);
        assert_eq!(score, 100.0);
    }

    #[test]
    fn test_performance_score_mixed() {
        // Mix of good and bad
        let score = calculate_performance_score(2000.0, 500.0, 0.5, 1500.0, 2000.0);
        assert!(score > 0.0 && score < 100.0);
    }

    #[test]
    fn test_status_code() {
        assert_eq!(get_status_code(2000.0, 2500.0, 4000.0), 0); // Green
        assert_eq!(get_status_code(3000.0, 2500.0, 4000.0), 1); // Yellow
        assert_eq!(get_status_code(5000.0, 2500.0, 4000.0), 2); // Red
    }

    #[test]
    fn test_batch_score() {
        let values = "2000,50,0.05";
        let thresholds = "2500:4000,100:300,0.1:0.25";
        let scores = batch_score_metrics(values, thresholds);

        assert!(scores.contains("100.0")); // All good
    }
}
