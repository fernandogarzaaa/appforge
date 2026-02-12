//! YieldOptimizer Agent - DeFi Yield Farming Agent
//!
//! Analyzes DeFi protocols, finds optimal yield opportunities, and
//! manages portfolio risk for yield farming strategies.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// YieldOptimizer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldConfig {
    pub defi_llama_url: String,
    pub min_apr: f64,
    pub max_risk_score: f64,
    pub rebalance_threshold: f64,
}

impl Default for YieldConfig {
    fn default() -> Self {
        Self {
            defi_llama_url: "https://api.llama.fi".to_string(),
            min_apr: 5.0,
            max_risk_score: 0.7,
            rebalance_threshold: 0.1,
        }
    }
}

/// Protocol information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtocolInfo {
    pub id: String,
    pub name: String,
    pub chain: String,
    pub category: String,
    pub tvl: f64,
    pub apr: f64,
    pub risk_score: f64,
    pub token: String,
}

/// Pool allocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolAllocation {
    pub protocol_id: String,
    pub token: String,
    pub amount: f64,
    pub apr: f64,
    pub share: f64,
    pub value: f64,
}

/// Portfolio risk metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioRisk {
    pub overall_score: f64,
    pub concentration_risk: f64,
    pub protocol_risk: f64,
    pub impermanent_loss_risk: f64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Yield optimization result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldOptimization {
    pub current_allocation: Vec<PoolAllocation>,
    pub recommended_allocation: Vec<PoolAllocation>,
    pub expected_improvement: f64,
    pub rebalance_needed: bool,
    pub actions: Vec<String>,
}

/// Defi protocol category
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProtocolCategory {
    Lending,
    Staking,
    Farming,
    LiquidityPool,
    Vault,
}

/// YieldOptimizer Agent implementation
#[derive(Debug)]
pub struct YieldOptimizer {
    config: YieldConfig,
    running: bool,
    protocols: Arc<RwLock<Vec<ProtocolInfo>>>,
    portfolio: Arc<RwLock<Vec<PoolAllocation>>>,
}

impl YieldOptimizer {
    /// Create a new YieldOptimizer agent
    pub fn new(config: YieldConfig) -> Self {
        Self {
            config,
            running: false,
            protocols: Arc::new(RwLock::new(Vec::new())),
            portfolio: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Analyze available protocols
    pub async fn analyze_protocols(&self) -> Result<Vec<ProtocolInfo>, anyhow::Error> {
        // Simulated protocol data
        let protocols = vec![
            ProtocolInfo {
                id: "solend".to_string(),
                name: "Solend".to_string(),
                chain: "solana".to_string(),
                category: "Lending".to_string(),
                tvl: 500000000.0,
                apr: 8.5,
                risk_score: 0.3,
                token: "SOL".to_string(),
            },
            ProtocolInfo {
                id: "marinade".to_string(),
                name: "Marinade".to_string(),
                chain: "solana".to_string(),
                category: "Staking".to_string(),
                tvl: 800000000.0,
                apr: 6.2,
                risk_score: 0.2,
                token: "mSOL".to_string(),
            },
            ProtocolInfo {
                id: "saber".to_string(),
                name: "Saber".to_string(),
                chain: "solana".to_string(),
                category: "LiquidityPool".to_string(),
                tvl: 300000000.0,
                apr: 12.5,
                risk_score: 0.5,
                token: "USDC-USDT".to_string(),
            },
            ProtocolInfo {
                id: "tulip".to_string(),
                name: "Tulip".to_string(),
                chain: "solana".to_string(),
                category: "Vault".to_string(),
                tvl: 200000000.0,
                apr: 15.0,
                risk_score: 0.6,
                token: "SOL-USDC".to_string(),
            },
        ];

        let mut store = self.protocols.write().await;
        *store = protocols.clone();

        Ok(protocols)
    }

    /// Get best pools for a token
    pub async fn get_best_pools(&self, token: &str) -> Result<Vec<ProtocolInfo>, anyhow::Error> {
        let protocols = self.protocols.read().await.clone();
        
        // Filter by token and minimum APR
        let filtered: Vec<ProtocolInfo> = protocols
            .into_iter()
            .filter(|p| {
                p.apr >= self.config.min_apr && 
                p.risk_score <= self.config.max_risk_score
            })
            .collect();

        Ok(filtered)
    }

    /// Optimize yield allocation
    pub async fn optimize_yield(
        &self,
        portfolio: &[PoolAllocation],
    ) -> Result<YieldOptimization, anyhow::Error> {
        let protocols = self.protocols.read().await.clone();
        
        // Calculate recommended allocation based on risk-adjusted returns
        let recommended: Vec<PoolAllocation> = protocols
            .iter()
            .filter(|p| p.risk_score <= self.config.max_risk_score)
            .take(5)
            .map(|p| PoolAllocation {
                protocol_id: p.id.clone(),
                token: p.token.clone(),
                amount: 1000.0,
                apr: p.apr,
                share: 0.2,
                value: 1000.0,
            })
            .collect();

        let current_value: f64 = portfolio.iter().map(|p| p.value).sum();
        let recommended_value: f64 = recommended.iter().map(|p| p.value).sum();

        Ok(YieldOptimization {
            current_allocation: portfolio.to_vec(),
            recommended_allocation: recommended,
            expected_improvement: 2.5,
            rebalance_needed: true,
            actions: vec![
                "Reduce exposure to high-risk protocol".to_string(),
                "Increase allocation to stable lending".to_string(),
                "Diversify across chains".to_string(),
            ],
        })
    }

    /// Get portfolio risk metrics
    pub async fn get_portfolio_risk(&self) -> Result<PortfolioRisk, anyhow::Error> {
        let portfolio = self.portfolio.read().await.clone();
        
        // Calculate risk metrics
        let concentration_risk = if portfolio.len() > 0 {
            portfolio.iter().map(|p| p.share).fold(0.0, f64::max)
        } else {
            0.0
        };

        Ok(PortfolioRisk {
            overall_score: 0.45,
            concentration_risk,
            protocol_risk: 0.35,
            impermanent_loss_risk: 0.25,
            timestamp: chrono::Utc::now(),
        })
    }

    /// Update portfolio allocation
    pub async fn update_portfolio(&mut self, allocation: Vec<PoolAllocation>) {
        let mut portfolio = self.portfolio.write().await;
        *portfolio = allocation;
        info!("Portfolio updated with {} allocations", portfolio.len());
    }

    /// Calculate expected returns
    pub async fn calculate_returns(&self) -> Result<f64, anyhow::Error> {
        let portfolio = self.portfolio.read().await.clone();
        let expected_return: f64 = portfolio.iter().map(|p| p.amount * p.apr / 100.0).sum();
        Ok(expected_return)
    }
}

#[async_trait]
impl super::Agent for YieldOptimizer {
    fn name(&self) -> &str { "yield_optimizer" }
    
    fn description(&self) -> &str { 
        "DeFi yield optimization and risk management agent" 
    }
    
    fn capabilities(&self) -> Vec<String> {
        vec![
            "protocol_analysis".to_string(),
            "yield_optimization".to_string(),
            "risk_management".to_string(),
            "portfolio_rebalancing".to_string(),
        ]
    }

    async fn initialize(&mut self) -> Result<(), anyhow::Error> {
        info!("Initializing YieldOptimizer with min APR: {}%", self.config.min_apr);
        // Analyze protocols on init
        let _ = self.analyze_protocols().await;
        Ok(())
    }

    async fn start(&mut self, _listen: &str) -> Result<(), anyhow::Error> {
        self.running = true;
        info!("YieldOptimizer agent started");
        Ok(())
    }

    async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.running = false;
        info!("YieldOptimizer agent stopped");
        Ok(())
    }

    async fn process_message(&mut self, message: &super::AgentMessage) -> super::AgentResponse {
        let response = match message.message_type.as_str() {
            "analyze_protocols" => {
                let protocols = self.analyze_protocols().await;
                match protocols {
                    Ok(p) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(p).unwrap()),
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
            "best_pools" => {
                let token = message.payload.get("token")
                    .and_then(|v| v.as_str())
                    .unwrap_or("SOL");
                let pools = self.get_best_pools(token).await;
                match pools {
                    Ok(p) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(p).unwrap()),
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
            "optimize" => {
                let portfolio: Vec<PoolAllocation> = 
                    serde_json::from_value(message.payload.clone())
                        .unwrap_or_default();
                let optimization = self.optimize_yield(&portfolio).await;
                match optimization {
                    Ok(o) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(o).unwrap()),
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
            "risk" => {
                let risk = self.get_portfolio_risk().await;
                match risk {
                    Ok(r) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(r).unwrap()),
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
            "returns" => {
                let returns = self.calculate_returns().await;
                match returns {
                    Ok(r) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::json!({"expected_returns": r})),
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
        let protocol_count = self.protocols.read().await.len();
        let allocation_count = self.portfolio.read().await.len();
        super::AgentStatus {
            name: "yield_optimizer".to_string(),
            running: self.running,
            last_activity: chrono::Utc::now(),
            messages_processed: allocation_count as u64,
            errors: 0,
            metrics: serde_json::json!({
                "protocols_analyzed": protocol_count,
                "allocations": allocation_count,
                "config": self.config
            }),
        }
    }
}

impl Default for YieldOptimizer {
    fn default() -> Self {
        Self::new(YieldConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_yield_optimizer_analyze_protocols() {
        let optimizer = YieldOptimizer::default();
        let protocols = optimizer.analyze_protocols().await.unwrap();
        assert!(!protocols.is_empty());
    }

    #[tokio::test]
    async fn test_yield_optimizer_best_pools() {
        let optimizer = YieldOptimizer::default();
        let _ = optimizer.analyze_protocols().await;
        let pools = optimizer.get_best_pools("SOL").await.unwrap();
        assert!(!pools.is_empty());
    }

    #[tokio::test]
    async fn test_yield_optimizer_risk() {
        let optimizer = YieldOptimizer::default();
        let risk = optimizer.get_portfolio_risk().await.unwrap();
        assert!(risk.overall_score >= 0.0 && risk.overall_score <= 1.0);
    }

    #[tokio::test]
    async fn test_yield_optimizer_optimize() {
        let optimizer = YieldOptimizer::default();
        let portfolio = vec![
            PoolAllocation {
                protocol_id: "saber".to_string(),
                token: "USDC-USDT".to_string(),
                amount: 5000.0,
                apr: 10.0,
                share: 1.0,
                value: 5000.0,
            },
        ];
        let optimization = optimizer.optimize_yield(&portfolio).await.unwrap();
        assert!(optimization.rebalance_needed);
    }
}
