//! ArbitrageHunter Agent - Arbitrage Trading Agent
//!
//! Identifies and executes cryptocurrency arbitrage opportunities across
//! multiple exchanges.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// ArbitrageHunter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrageConfig {
    pub exchanges: Vec<String>,
    pub min_profit_threshold: f64,
    pub gas_buffer: f64,
    pub scan_interval_ms: u64,
}

impl Default for ArbitrageConfig {
    fn default() -> Self {
        Self {
            exchanges: vec![
                "raydium".to_string(),
                "orca".to_string(),
                "saber".to_string(),
                "mercurial".to_string(),
            ],
            min_profit_threshold: 0.5,
            gas_buffer: 0.1,
            scan_interval_ms: 5000,
        }
    }
}

/// Price data from an exchange
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceData {
    pub exchange: String,
    pub symbol: String,
    pub bid: f64,
    pub ask: f64,
    pub timestamp: i64,
}

/// Arbitrage opportunity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrageOpportunity {
    pub id: String,
    pub symbol: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub profit_after_gas: f64,
    pub confidence: f64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Exchange execution details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeExecution {
    pub exchange: String,
    pub tx_signature: String,
    pub amount: f64,
    pub price: f64,
    pub gas_cost: f64,
    pub status: String,
}

/// Arbitrage trade result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrageTrade {
    pub opportunity_id: String,
    pub buy_execution: ExchangeExecution,
    pub sell_execution: ExchangeExecution,
    pub profit: f64,
    pub gas_cost: f64,
    pub net_profit: f64,
    pub status: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// ArbitrageHunter Agent implementation
#[derive(Debug)]
pub struct ArbitrageHunter {
    config: ArbitrageConfig,
    running: bool,
    opportunities: Arc<RwLock<Vec<ArbitrageOpportunity>>>,
    trades: Arc<RwLock<Vec<ArbitrageTrade>>>,
    price_cache: Arc<RwLock<HashMap<String, HashMap<String, PriceData>>>>,
}

impl ArbitrageHunter {
    /// Create a new ArbitrageHunter agent
    pub fn new(config: ArbitrageConfig) -> Self {
        Self {
            config,
            running: false,
            opportunities: Arc::new(RwLock::new(Vec::new())),
            trades: Arc::new(RwLock::new(Vec::new())),
            price_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Find arbitrage opportunities for a symbol
    pub async fn find_arbitrage(
        &self,
        symbol: &str,
    ) -> Result<Vec<ArbitrageOpportunity>, anyhow::Error> {
        // Simulated arbitrage discovery
        let opportunities = vec![
            ArbitrageOpportunity {
                id: Uuid::new_v4().to_string(),
                symbol: symbol.to_string(),
                buy_exchange: "raydium".to_string(),
                sell_exchange: "orca".to_string(),
                buy_price: 99.5,
                sell_price: 100.5,
                profit_after_gas: 0.75,
                confidence: 0.85,
                timestamp: chrono::Utc::now(),
            },
            ArbitrageOpportunity {
                id: Uuid::new_v4().to_string(),
                symbol: symbol.to_string(),
                buy_exchange: "saber".to_string(),
                sell_exchange: "mercurial".to_string(),
                buy_price: 98.0,
                sell_price: 99.2,
                profit_after_gas: 0.95,
                confidence: 0.72,
                timestamp: chrono::Utc::now(),
            },
        ];

        let mut store = self.opportunities.write().await;
        store.extend(opportunities.clone());

        Ok(opportunities)
    }

    /// Execute an arbitrage trade
    pub async fn execute_trade(
        &self,
        opportunity: &ArbitrageOpportunity,
    ) -> Result<ArbitrageTrade, anyhow::Error> {
        let buy_execution = ExchangeExecution {
            exchange: opportunity.buy_exchange.clone(),
            tx_signature: format!("buy_{}", Uuid::new_v4()),
            amount: 100.0,
            price: opportunity.buy_price,
            gas_cost: 0.05,
            status: "COMPLETED".to_string(),
        };

        let sell_execution = ExchangeExecution {
            exchange: opportunity.sell_exchange.clone(),
            tx_signature: format!("sell_{}", Uuid::new_v4()),
            amount: 100.0,
            price: opportunity.sell_price,
            gas_cost: 0.05,
            status: "COMPLETED".to_string(),
        };

        let gross_profit = (opportunity.sell_price - opportunity.buy_price) * 100.0;
        let total_gas = buy_execution.gas_cost + sell_execution.gas_cost;
        let net_profit = gross_profit - total_gas;

        let trade = ArbitrageTrade {
            opportunity_id: opportunity.id.clone(),
            buy_execution,
            sell_execution,
            profit: gross_profit,
            gas_cost: total_gas,
            net_profit,
            status: "COMPLETED".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let mut trades = self.trades.write().await;
        trades.push(trade.clone());

        info!("Arbitrage trade executed: {} -> {}, profit: {:.2}", 
            opportunity.buy_exchange, opportunity.sell_exchange, net_profit);

        Ok(trade)
    }

    /// Scan all exchanges for opportunities
    pub async fn scan_all(&self) -> Result<Vec<ArbitrageOpportunity>, anyhow::Error> {
        let mut all_opportunities = Vec::new();

        for exchange in &self.config.exchanges {
            let opportunities = self.find_arbitrage(exchange).await?;
            all_opportunities.extend(opportunities);
        }

        // Filter by minimum profit threshold
        all_opportunities.retain(|o| o.profit_after_gas >= self.config.min_profit_threshold);

        Ok(all_opportunities)
    }

    /// Get trade history
    pub async fn get_trades(&self) -> Result<Vec<ArbitrageTrade>, anyhow::Error> {
        Ok(self.trades.read().await.clone())
    }

    /// Get total profit
    pub async fn get_total_profit(&self) -> Result<f64, anyhow::Error> {
        let trades = self.trades.read().await;
        Ok(trades.iter().map(|t| t.net_profit).sum())
    }
}

#[async_trait]
impl super::Agent for ArbitrageHunter {
    fn name(&self) -> &str { "arbitrage_hunter" }
    
    fn description(&self) -> &str { 
        "Arbitrage trading and opportunity detection agent" 
    }
    
    fn capabilities(&self) -> Vec<String> {
        vec![
            "opportunity_detection".to_string(),
            "trade_execution".to_string(),
            "multi_exchange".to_string(),
            "profit_tracking".to_string(),
        ]
    }

    async fn initialize(&mut self) -> Result<(), anyhow::Error> {
        info!("Initializing ArbitrageHunter with {} exchanges", 
            self.config.exchanges.len());
        Ok(())
    }

    async fn start(&mut self, _listen: &str) -> Result<(), anyhow::Error> {
        self.running = true;
        info!("ArbitrageHunter agent started");
        Ok(())
    }

    async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.running = false;
        info!("ArbitrageHunter agent stopped");
        Ok(())
    }

    async fn process_message(&mut self, message: &super::AgentMessage) -> super::AgentResponse {
        let response = match message.message_type.as_str() {
            "find" => {
                let symbol = message.payload.get("symbol")
                    .and_then(|v| v.as_str())
                    .unwrap_or("SOL/USDC");
                let opportunities = self.find_arbitrage(symbol).await;
                match opportunities {
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
            "execute" => {
                let opportunity: ArbitrageOpportunity = 
                    serde_json::from_value(message.payload.clone())
                        .unwrap_or_default();
                let result = self.execute_trade(&opportunity).await;
                match result {
                    Ok(t) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(t).unwrap()),
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
            "scan" => {
                let opportunities = self.scan_all().await;
                match opportunities {
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
            "trades" => {
                let trades = self.get_trades().await;
                match trades {
                    Ok(t) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(t).unwrap()),
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
            "profit" => {
                let profit = self.get_total_profit().await;
                match profit {
                    Ok(p) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::json!({"total_profit": p})),
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
        let trade_count = self.trades.read().await.len();
        let profit = self.get_total_profit().await.unwrap_or(0.0);
        super::AgentStatus {
            name: "arbitrage_hunter".to_string(),
            running: self.running,
            last_activity: chrono::Utc::now(),
            messages_processed: trade_count as u64,
            errors: 0,
            metrics: serde_json::json!({
                "trades_executed": trade_count,
                "total_profit": profit,
                "exchanges": self.config.exchanges
            }),
        }
    }
}

impl Default for ArbitrageHunter {
    fn default() -> Self {
        Self::new(ArbitrageConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_arbitrage_hunter_find() {
        let hunter = ArbitrageHunter::default();
        let opportunities = hunter.find_arbitrage("SOL/USDC").await.unwrap();
        assert!(!opportunities.is_empty());
    }

    #[tokio::test]
    async fn test_arbitrage_hunter_scan() {
        let hunter = ArbitrageHunter::default();
        let opportunities = hunter.scan_all().await.unwrap();
        assert!(!opportunities.is_empty());
    }

    #[tokio::test]
    async fn test_arbitrage_hunter_execute() {
        let hunter = ArbitrageHunter::default();
        let opportunity = ArbitrageOpportunity {
            id: Uuid::new_v4().to_string(),
            symbol: "SOL/USDC".to_string(),
            buy_exchange: "raydium".to_string(),
            sell_exchange: "orca".to_string(),
            buy_price: 99.5,
            sell_price: 100.5,
            profit_after_gas: 0.75,
            confidence: 0.85,
            timestamp: chrono::Utc::now(),
        };
        let trade = hunter.execute_trade(&opportunity).await.unwrap();
        assert!(trade.net_profit > 0.0);
    }
}
