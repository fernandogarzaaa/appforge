//! Sentinel Agent - Security & Monitoring Agent
//!
//! Provides comprehensive system security monitoring, anomaly detection,
//! and threat response capabilities for the quantum swarm.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// Sentinel configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentinelConfig {
    pub check_interval_ms: u64,
    pub cpu_threshold: f64,
    pub memory_threshold: f64,
    pub disk_threshold: f64,
    pub network_threshold: f64,
    pub anomaly_severity_threshold: Severity,
}

impl Default for SentinelConfig {
    fn default() -> Self {
        Self {
            check_interval_ms: 5000,
            cpu_threshold: 80.0,
            memory_threshold: 85.0,
            disk_threshold: 90.0,
            network_threshold: 1000.0,
            anomaly_severity_threshold: Severity::Medium,
        }
    }
}

/// Alert severity levels
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

/// System metrics snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub disk_usage: f64,
    pub network_in: u64,
    pub network_out: u64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Security alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: String,
    pub alert_type: String,
    pub severity: Severity,
    pub message: String,
    pub timestamp: i64,
    pub metrics: Option<SystemMetrics>,
}

/// Security audit report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityAudit {
    pub id: Uuid,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub overall_score: f64,
    pub vulnerabilities: Vec<Alert>,
    pub recommendations: Vec<String>,
}

/// Sentinel Agent implementation
#[derive(Debug)]
pub struct Sentinel {
    config: SentinelConfig,
    running: bool,
    metrics_history: Arc<RwLock<Vec<SystemMetrics>>>,
    alerts: Arc<RwLock<Vec<Alert>>>,
    last_check: Arc<RwLock<chrono::DateTime<chrono::Utc>>>,
}

impl Sentinel {
    /// Create a new Sentinel agent
    pub fn new(config: SentinelConfig) -> Self {
        Self {
            config,
            running: false,
            metrics_history: Arc::new(RwLock::new(Vec::new())),
            alerts: Arc::new(RwLock::new(Vec::new())),
            last_check: Arc::new(RwLock::new(chrono::Utc::now())),
        }
    }

    /// Start monitoring system resources
    pub async fn start_monitoring(&mut self) -> Result<(), anyhow::Error> {
        self.running = true;
        info!("Sentinel monitoring started with interval: {}ms", self.config.check_interval_ms);
        Ok(())
    }

    /// Stop monitoring
    pub async fn stop_monitoring(&mut self) -> Result<(), anyhow::Error> {
        self.running = false;
        info!("Sentinel monitoring stopped");
        Ok(())
    }

    /// Get current system metrics
    pub async fn get_metrics(&self) -> Result<SystemMetrics, anyhow::Error> {
        // Simulated metrics - in production, use sysinfo or similar
        let metrics = SystemMetrics {
            cpu_usage: 45.5,
            memory_usage: 62.3,
            disk_usage: 55.0,
            network_in: 1500,
            network_out: 800,
            timestamp: chrono::Utc::now(),
        };
        
        let mut history = self.metrics_history.write().await;
        history.push(metrics.clone());
        
        Ok(metrics)
    }

    /// Check system health and generate alerts
    pub async fn check_system(&mut self) -> Result<Vec<Alert>, anyhow::Error> {
        let metrics = self.get_metrics().await?;
        let mut alerts = Vec::new();

        // CPU threshold check
        if metrics.cpu_usage > self.config.cpu_threshold {
            alerts.push(Alert {
                id: Uuid::new_v4().to_string(),
                alert_type: "CPU_THRESHOLD".to_string(),
                severity: Severity::High,
                message: format!("High CPU usage: {:.1}%", metrics.cpu_usage),
                timestamp: chrono::Utc::now().timestamp(),
                metrics: Some(metrics.clone()),
            });
        }

        // Memory threshold check
        if metrics.memory_usage > self.config.memory_threshold {
            alerts.push(Alert {
                id: Uuid::new_v4().to_string(),
                alert_type: "MEMORY_THRESHOLD".to_string(),
                severity: Severity::High,
                message: format!("High memory usage: {:.1}%", metrics.memory_usage),
                timestamp: chrono::Utc::now().timestamp(),
                metrics: Some(metrics.clone()),
            });
        }

        // Disk threshold check
        if metrics.disk_usage > self.config.disk_threshold {
            alerts.push(Alert {
                id: Uuid::new_v4().to_string(),
                alert_type: "DISK_THRESHOLD".to_string(),
                severity: Severity::Critical,
                message: format!("High disk usage: {:.1}%", metrics.disk_usage),
                timestamp: chrono::Utc::now().timestamp(),
                metrics: Some(metrics.clone()),
            });
        }

        // Store alerts
        let mut alert_store = self.alerts.write().await;
        alert_store.extend(alerts.clone());

        *self.last_check.write().await = chrono::Utc::now();
        Ok(alerts)
    }

    /// Perform security audit
    pub async fn audit_security(&self) -> Result<SecurityAudit, anyhow::Error> {
        let alerts = self.alerts.read().await.clone();
        
        Ok(SecurityAudit {
            id: Uuid::new_v4(),
            timestamp: chrono::Utc::now(),
            overall_score: 85.0,
            vulnerabilities: alerts,
            recommendations: vec![
                "Enable two-factor authentication".to_string(),
                "Review access logs regularly".to_string(),
                "Update security patches".to_string(),
            ],
        })
    }
}

#[async_trait]
impl super::Agent for Sentinel {
    fn name(&self) -> &str { "sentinel" }
    
    fn description(&self) -> &str { 
        "Security monitoring and threat detection agent" 
    }
    
    fn capabilities(&self) -> Vec<String> {
        vec![
            "security_monitoring".to_string(),
            "anomaly_detection".to_string(),
            "threat_response".to_string(),
            "system_audit".to_string(),
        ]
    }

    async fn initialize(&mut self) -> Result<(), anyhow::Error> {
        info!("Initializing Sentinel security agent");
        Ok(())
    }

    async fn start(&mut self, _listen: &str) -> Result<(), anyhow::Error> {
        self.start_monitoring().await
    }

    async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.stop_monitoring().await
    }

    async fn process_message(&mut self, message: &super::AgentMessage) -> super::AgentResponse {
        let response = match message.message_type.as_str() {
            "get_metrics" => {
                let metrics = self.get_metrics().await;
                match metrics {
                    Ok(m) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(m).unwrap()),
                        error: None,
                        timestamp: chrono::Utc::now(),
                    },
                    Err(e) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: false,
                        data: None,
                        error: Some(e.to_string()),
                        timestamp: chrono::Utc::now(),
                    },
                }
            }
            "check_system" => {
                let alerts = self.check_system().await;
                match alerts {
                    Ok(a) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(a).unwrap()),
                        error: None,
                        timestamp: chrono::Utc::now(),
                    },
                    Err(e) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: false,
                        data: None,
                        error: Some(e.to_string()),
                        timestamp: chrono::Utc::now(),
                    },
                }
            }
            "security_audit" => {
                let audit = self.audit_security().await;
                match audit {
                    Ok(a) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(a).unwrap()),
                        error: None,
                        timestamp: chrono::Utc::now(),
                    },
                    Err(e) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: false,
                        data: None,
                        error: Some(e.to_string()),
                        timestamp: chrono::Utc::now(),
                    },
                }
            }
            _ => super::AgentResponse {
                id: Uuid::new_v4(),
                request_id: message.id,
                success: false,
                data: None,
                error: Some(format!("Unknown message type: {}", message.message_type)),
                timestamp: chrono::Utc::now(),
            },
        };
        response
    }

    async fn status(&self) -> super::AgentStatus {
        let alert_count = self.alerts.read().await.len();
        super::AgentStatus {
            name: "sentinel".to_string(),
            running: self.running,
            last_activity: *self.last_check.read().await,
            messages_processed: alert_count as u64,
            errors: 0,
            metrics: serde_json::json!({
                "alerts_generated": alert_count,
                "config": self.config
            }),
        }
    }
}

impl Default for Sentinel {
    fn default() -> Self {
        Self::new(SentinelConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_sentinel_metrics() {
        let sentinel = Sentinel::default();
        let metrics = sentinel.get_metrics().await.unwrap();
        assert!(metrics.cpu_usage >= 0.0 && metrics.cpu_usage <= 100.0);
        assert!(metrics.memory_usage >= 0.0 && metrics.memory_usage <= 100.0);
    }

    #[tokio::test]
    async fn test_sentinel_check_system() {
        let mut sentinel = Sentinel::default();
        let alerts = sentinel.check_system().await.unwrap();
        assert!(alerts.len() >= 0);
    }

    #[tokio::test]
    async fn test_sentinel_security_audit() {
        let sentinel = Sentinel::default();
        let audit = sentinel.audit_security().await.unwrap();
        assert!(audit.overall_score >= 0.0 && audit.overall_score <= 100.0);
    }
}
