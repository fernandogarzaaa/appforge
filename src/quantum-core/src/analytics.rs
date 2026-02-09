//! Statistical Analysis Module - Rust/WebAssembly
//!
//! Phase 2: Data Processing algorithms
//! - Statistical aggregation
//! - Anomaly detection
//! - Trend analysis
//! - Metric correlation

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ============================================================
// Statistical Aggregation
// ============================================================

/// Basic statistics for a dataset
#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Statistics {
    mean: f64,
    median: f64,
    std_dev: f64,
    min: f64,
    max: f64,
    count: u32,
}

#[wasm_bindgen]
impl Statistics {
    #[wasm_bindgen(getter)]
    pub fn mean(&self) -> f64 {
        self.mean
    }

    #[wasm_bindgen(getter)]
    pub fn median(&self) -> f64 {
        self.median
    }

    #[wasm_bindgen(getter)]
    pub fn std_dev(&self) -> f64 {
        self.std_dev
    }

    #[wasm_bindgen(getter)]
    pub fn min(&self) -> f64 {
        self.min
    }

    #[wasm_bindgen(getter)]
    pub fn max(&self) -> f64 {
        self.max
    }

    #[wasm_bindgen(getter)]
    pub fn count(&self) -> u32 {
        self.count
    }
}

/// Calculate statistics for a dataset (CSV format)
#[wasm_bindgen]
pub fn calculate_statistics(values_csv: &str) -> Statistics {
    let mut values: Vec<f64> = values_csv
        .split(',')
        .filter_map(|v| v.trim().parse().ok())
        .collect();

    if values.is_empty() {
        return Statistics {
            mean: 0.0,
            median: 0.0,
            std_dev: 0.0,
            min: 0.0,
            max: 0.0,
            count: 0,
        };
    }

    let count = values.len() as u32;
    let sum: f64 = values.iter().sum();
    let mean = sum / count as f64;

    // Sort for median and min/max
    values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let min = *values.first().unwrap();
    let max = *values.last().unwrap();

    let median = if count % 2 == 0 {
        (values[(count / 2 - 1) as usize] + values[(count / 2) as usize]) / 2.0
    } else {
        values[(count / 2) as usize]
    };

    // Standard deviation
    let variance: f64 = values.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / count as f64;
    let std_dev = variance.sqrt();

    Statistics {
        mean,
        median,
        std_dev,
        min,
        max,
        count,
    }
}

// ============================================================
// Anomaly Detection
// ============================================================

/// Anomaly detection result
#[wasm_bindgen]
#[derive(Clone)]
pub struct AnomalyResult {
    is_anomaly: bool,
    z_score: f64,
    severity: u8, // 0=normal, 1=warning, 2=critical
}

#[wasm_bindgen]
impl AnomalyResult {
    #[wasm_bindgen(getter)]
    pub fn is_anomaly(&self) -> bool {
        self.is_anomaly
    }

    #[wasm_bindgen(getter)]
    pub fn z_score(&self) -> f64 {
        self.z_score
    }

    #[wasm_bindgen(getter)]
    pub fn severity(&self) -> u8 {
        self.severity
    }
}

/// Detect if a value is anomalous compared to historical data
#[wasm_bindgen]
pub fn detect_anomaly(value: f64, mean: f64, std_dev: f64, threshold: f64) -> AnomalyResult {
    // Avoid division by zero
    let z_score = if std_dev > 0.0 {
        (value - mean).abs() / std_dev
    } else {
        if (value - mean).abs() > 0.0 {
            10.0
        } else {
            0.0
        }
    };

    let is_anomaly = z_score > threshold;

    let severity = if z_score > threshold * 2.0 {
        2 // Critical
    } else if z_score > threshold {
        1 // Warning
    } else {
        0 // Normal
    };

    AnomalyResult {
        is_anomaly,
        z_score,
        severity,
    }
}

/// Detect multiple anomalies in a dataset
#[wasm_bindgen]
pub fn detect_anomalies_batch(values_csv: &str, threshold: f64) -> String {
    let values: Vec<f64> = values_csv
        .split(',')
        .filter_map(|v| v.trim().parse().ok())
        .collect();

    let stats = calculate_statistics(values_csv);

    let results: Vec<String> = values
        .iter()
        .map(|v| {
            let result = detect_anomaly(*v, stats.mean, stats.std_dev, threshold);
            format!("{}:{}", result.is_anomaly, result.severity)
        })
        .collect();

    results.join(",")
}

// ============================================================
// Trend Analysis
// ============================================================

/// Trend direction
#[wasm_bindgen]
pub enum TrendDirection {
    Up,
    Down,
    Stable,
}

/// Trend analysis result
#[wasm_bindgen]
#[derive(Clone)]
pub struct TrendResult {
    direction: i8, // 1=up, -1=down, 0=stable
    slope: f64,
    r_squared: f64, // Goodness of fit (0-1)
}

#[wasm_bindgen]
impl TrendResult {
    #[wasm_bindgen(getter)]
    pub fn direction(&self) -> i8 {
        self.direction
    }

    #[wasm_bindgen(getter)]
    pub fn slope(&self) -> f64 {
        self.slope
    }

    #[wasm_bindgen(getter)]
    pub fn r_squared(&self) -> f64 {
        self.r_squared
    }

    #[wasm_bindgen(getter)]
    pub fn direction_str(&self) -> String {
        match self.direction {
            1 => "up".to_string(),
            -1 => "down".to_string(),
            _ => "stable".to_string(),
        }
    }
}

/// Analyze trend using linear regression
#[wasm_bindgen]
pub fn analyze_trend(values_csv: &str) -> TrendResult {
    let values: Vec<f64> = values_csv
        .split(',')
        .filter_map(|v| v.trim().parse().ok())
        .collect();

    let n = values.len() as f64;

    if n < 2.0 {
        return TrendResult {
            direction: 0,
            slope: 0.0,
            r_squared: 0.0,
        };
    }

    // Linear regression: y = mx + b
    let sum_x: f64 = (0..values.len()).map(|i| i as f64).sum();
    let sum_y: f64 = values.iter().sum();
    let sum_xy: f64 = values.iter().enumerate().map(|(i, y)| i as f64 * y).sum();
    let sum_x2: f64 = (0..values.len()).map(|i| (i as f64).powi(2)).sum();

    let slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x.powi(2));
    let intercept = (sum_y - slope * sum_x) / n;

    // R-squared (coefficient of determination)
    let mean_y = sum_y / n;
    let ss_tot: f64 = values.iter().map(|y| (y - mean_y).powi(2)).sum();
    let ss_res: f64 = values
        .iter()
        .enumerate()
        .map(|(i, y)| (y - (slope * i as f64 + intercept)).powi(2))
        .sum();
    let r_squared = if ss_tot > 0.0 {
        1.0 - (ss_res / ss_tot)
    } else {
        0.0
    };

    // Determine direction
    let direction = if slope.abs() < 0.001 {
        0 // Stable
    } else if slope > 0.0 {
        1 // Up
    } else {
        -1 // Down
    };

    TrendResult {
        direction,
        slope,
        r_squared: r_squared.max(0.0).min(1.0),
    }
}

// ============================================================
// Metric Correlation
// ============================================================

/// Calculate Pearson correlation coefficient between two datasets
#[wasm_bindgen]
pub fn calculate_correlation(values1_csv: &str, values2_csv: &str) -> f64 {
    let v1: Vec<f64> = values1_csv
        .split(',')
        .filter_map(|v| v.trim().parse().ok())
        .collect();
    let v2: Vec<f64> = values2_csv
        .split(',')
        .filter_map(|v| v.trim().parse().ok())
        .collect();

    let n = v1.len().min(v2.len());
    if n < 2 {
        return 0.0;
    }

    let mean1: f64 = v1.iter().take(n).sum::<f64>() / n as f64;
    let mean2: f64 = v2.iter().take(n).sum::<f64>() / n as f64;

    let mut sum_product = 0.0;
    let mut sum_sq1 = 0.0;
    let mut sum_sq2 = 0.0;

    for i in 0..n {
        let d1 = v1[i] - mean1;
        let d2 = v2[i] - mean2;
        sum_product += d1 * d2;
        sum_sq1 += d1 * d1;
        sum_sq2 += d2 * d2;
    }

    let denominator = (sum_sq1 * sum_sq2).sqrt();
    if denominator == 0.0 {
        return 0.0;
    }

    (sum_product / denominator).max(-1.0).min(1.0)
}

// ============================================================
// Moving Averages
// ============================================================

/// Calculate simple moving average
#[wasm_bindgen]
pub fn moving_average(values_csv: &str, window: u32) -> String {
    let values: Vec<f64> = values_csv
        .split(',')
        .filter_map(|v| v.trim().parse().ok())
        .collect();
    let window = window as usize;

    if values.len() < window || window == 0 {
        return String::new();
    }

    let results: Vec<String> = (0..=values.len() - window)
        .map(|i| {
            let sum: f64 = values[i..i + window].iter().sum();
            format!("{:.2}", sum / window as f64)
        })
        .collect();

    results.join(",")
}

/// Calculate exponential moving average
#[wasm_bindgen]
pub fn exponential_moving_average(values_csv: &str, alpha: f64) -> String {
    let values: Vec<f64> = values_csv
        .split(',')
        .filter_map(|v| v.trim().parse().ok())
        .collect();

    if values.is_empty() {
        return String::new();
    }

    let mut ema = values[0];
    let mut results: Vec<String> = vec![format!("{:.2}", ema)];

    for value in values.iter().skip(1) {
        ema = alpha * value + (1.0 - alpha) * ema;
        results.push(format!("{:.2}", ema));
    }

    results.join(",")
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_statistics() {
        let stats = calculate_statistics("1,2,3,4,5");
        assert_eq!(stats.mean, 3.0);
        assert_eq!(stats.median, 3.0);
        assert_eq!(stats.min, 1.0);
        assert_eq!(stats.max, 5.0);
        assert_eq!(stats.count, 5);
    }

    #[test]
    fn test_anomaly() {
        let result = detect_anomaly(100.0, 50.0, 10.0, 2.0);
        assert!(result.is_anomaly);
        assert_eq!(result.severity, 2); // Critical
    }

    #[test]
    fn test_trend_up() {
        let result = analyze_trend("1,2,3,4,5");
        assert_eq!(result.direction, 1); // Up
        assert!(result.slope > 0.0);
    }

    #[test]
    fn test_trend_down() {
        let result = analyze_trend("5,4,3,2,1");
        assert_eq!(result.direction, -1); // Down
        assert!(result.slope < 0.0);
    }

    #[test]
    fn test_correlation() {
        let corr = calculate_correlation("1,2,3,4,5", "1,2,3,4,5");
        assert!((corr - 1.0).abs() < 0.01); // Perfect positive correlation
    }

    #[test]
    fn test_moving_average() {
        let ma = moving_average("1,2,3,4,5", 3);
        assert!(ma.starts_with("2.00")); // (1+2+3)/3 = 2
    }
}
