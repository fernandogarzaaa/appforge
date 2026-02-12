//! CryptoSwarm Agent - Cryptocurrency Trading Agent
//!
//! Provides cryptocurrency trading operations with Solana integration,
//! Jupiter DEX aggregation, and portfolio management.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// CryptoSwarm configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CryptoConfig {
    pub solana_rpc_url: String,
    pub jupiter_api_url: String,
    pub default_slippage: f64,
    pub max_position_size: f64,
    pub stop_loss_threshold: f64,
    pub take_profit_threshold: f64,
}

impl Default for CryptoConfig {
    fn default() -> Self {
        Self {
            solana_rpc_url: "https://api.mainnet-beta.solana.com".to_string(),
            jupiter_api_url: "https://api.jup.ag/v1".to_string(),
            default_slippage: 0.5,
            max_position_size: 1.0,
            stop_loss_threshold: 0.1,
            take_profit_threshold: 0.2,
        }
    }
}

/// Market data for a trading pair
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketData {
    pub symbol: String,
    pub price: f64,
    pub change_24h: f64,
    pub volume_24h: f64,
    pub timestamp: i64,
}

/// Trade side enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum TradeSide {
    Buy,
    Sell,
}

/// Order type enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum OrderType {
    Market,
    Limit,
    StopLoss,
    TakeProfit,
}

/// Trade request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeRequest {
    pub symbol: String,
    pub side: TradeSide,
    pub order_type: OrderType,
    pub quantity: f64,
    pub price: Option<f64>,
}

/// Trade result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeResult {
    pub id: Uuid,
    pub symbol: String,
    pub side: TradeSide,
    pub executed_price: f64,
    pub executed_quantity: f64,
    pub total_value: f64,
    pub fee: f64,
    pub status: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Market analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketAnalysis {
    pub symbol: String,
    pub trend: TrendDirection,
    pub confidence: f64,
    pub rsi: f64,
    pub macd: f64,
    pub support: f64,
    pub resistance: f64,
    pub recommendation: String,
}

/// Portfolio item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioItem {
    pub symbol: String,
    pub amount: f64,
    pub avg_price: f64,
    pub current_price: f64,
    pub value: f64,
    pub pnl: f64,
    pub pnl_percent: f64,
}

/// Portfolio summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Portfolio {
    pub total_value: f64,
    pub total_pnl: f64,
    pub items: Vec<PortfolioItem>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Swap result from Jupiter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapResult {
    pub id: Uuid,
    pub input_mint: String,
    pub output_mint: String,
    pub input_amount: f64,
    pub output_amount: f64,
    pub price_impact: f64,
    pub fee: f64,
    pub tx_signature: Option<String>,
    pub status: String,
}

/// Trend direction
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum TrendDirection {
    Bullish,
    Bearish,
    Sideways,
}

/// CryptoSwarm Agent implementation
#[derive(Debug)]
pub struct CryptoSwarm {
    config: CryptoConfig,
    running: bool,
    portfolio: Arc<RwLock<Portfolio>>,
    orders: Arc<RwLock<Vec<TradeResult>>>,
}

impl CryptoSwarm {
    /// Create a new CryptoSwarm agent
    pub fn new(config: CryptoConfig) -> Self {
        Self {
            config,
            running: false,
            portfolio: Arc::new(RwLock::new(Portfolio {
                total_value: 0.0,
                total_pnl: 0.0,
                items: Vec::new(),
                timestamp: chrono::Utc::now(),
            })),
            orders: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Analyze market for a symbol
    pub async fn analyze(&self, symbol: &str) -> Result<MarketAnalysis, anyhow::Error> {
        // Simulated market analysis
        Ok(MarketAnalysis {
            symbol: symbol.to_string(),
            trend: TrendDirection::Bullish,
            confidence: 0.75,
            rsi: 55.0,
            macd: 0.5,
            support: 95.0,
            resistance: 110.0,
            recommendation: "BUY".to_string(),
        })
    }

    /// Execute a trade
    pub async fn trade(&self, request: &TradeRequest) -> Result<TradeResult, anyhow::Error> {
        let price = request.price.unwrap_or(100.0);
        let total_value = request.quantity * price;
        let fee = total_value * 0.001; // 0.1% fee

        let result = TradeResult {
            id: Uuid::new_v4(),
            symbol: request.symbol.clone(),
            side: request.side.clone(),
            executed_price: price,
            executed_quantity: request.quantity,
            total_value,
            fee,
            status: "EXECUTED".to_string(),
            timestamp: chrono::Utc::now(),
        };

        let mut orders = self.orders.write().await;
        orders.push(result.clone());

        info!("Trade executed: {} {} {} @ {}", 
            request.side, request.quantity, request.symbol, price);
        Ok(result)
    }

    /// Get portfolio summary
    pub async fn portfolio(&self) -> Result<Portfolio, anyhow::Error> {
        Ok(self.portfolio.read().await.clone())
    }

    /// Execute Jupiter swap
    pub async fn jupiter_swap(
        &self,
        input_mint: &str,
        output_mint: &str,
        amount: f64,
    ) -> Result<SwapResult, anyhow::Error> {
        // Simulated Jupiter swap
        let output_amount = amount * 0.98; // Simulated price impact

        Ok(SwapResult {
            id: Uuid::new_v4(),
            input_mint: input_mint.to_string(),
            output_mint: output_mint.to_string(),
            input_amount: amount,
            output_amount,
            price_impact: 0.02,
            fee: amount * 0.001,
            tx_signature: Some("simulated_tx_sig".to_string()),
            status: "COMPLETED".to_string(),
        })
    }

    /// Get order history
    pub async fn get_orders(&self) -> Result<Vec<TradeResult>, anyhow::Error> {
        Ok(self.orders.read().await.clone())
    }
}

#[async_trait]
impl super::Agent for CryptoSwarm {
    fn name(&self) -> &str { "crypto_swarm" }
    
    fn description(&self) -> &str { 
        "Cryptocurrency trading agent with Solana/Jupiter integration" 
    }
    
    fn capabilities(&self) -> Vec<String> {
        vec![
            "market_analysis".to_string(),
            "trading".to_string(),
            "portfolio_management".to_string(),
            "jupiter_swap".to_string(),
        ]
    }

    async fn initialize(&mut self) -> Result<(), anyhow::Error> {
        info!("Initializing CryptoSwarm with RPC: {}", self.config.solana_rpc_url);
        Ok(())
    }

    async fn start(&mut self, _listen: &str) -> Result<(), anyhow::Error> {
        self.running = true;
        info!("CryptoSwarm trading agent started");
        Ok(())
    }

    async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.running = false;
        info!("CryptoSwarm trading agent stopped");
        Ok(())
    }

    async fn process_message(&mut self, message: &super::AgentMessage) -> super::AgentResponse {
        let response = match message.message_type.as_str() {
            "analyze" => {
                let symbol = message.payload.get("symbol")
                    .and_then(|v| v.as_str())
                    .unwrap_or("SOL/USDC");
                let analysis = self.analyze(symbol).await;
                match analysis {
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
            "trade" => {
                let request: TradeRequest = serde_json::from_value(message.payload.clone())
                    .unwrap_or_default();
                let result = self.trade(&request).await;
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
            "portfolio" => {
                let portfolio = self.portfolio().await;
                match portfolio {
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
            "jupiter_swap" => {
                let input_mint = message.payload.get("input_mint")
                    .and_then(|v| v.as_str())
                    .unwrap_or("So11111111111111111111111111111111111111112");
                let output_mint = message.payload.get("output_mint")
                    .and_then(|v| v.as_str())
                    .unwrap_or("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
                let amount = message.payload.get("amount")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(1.0);
                
                let swap = self.jupiter_swap(input_mint, output_mint, amount).await;
                match swap {
                    Ok(s) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(serde_json::to_value(s).unwrap()),
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
        let order_count = self.orders.read().await.len();
        super::AgentStatus {
            name: "crypto_swarm".to_string(),
            running: self.running,
            last_activity: chrono::Utc::now(),
            messages_processed: order_count as u64,
            errors: 0,
            metrics: serde_json::json!({
                "orders_executed": order_count,
                "config": self.config
            }),
        }
    }
}

impl Default for CryptoSwarm {
    fn default() -> Self {
        Self::new(CryptoConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_crypto_swarm_analyze() {
        let swarm = CryptoSwarm::default();
        let analysis = swarm.analyze("SOL/USDC").await.unwrap();
        assert_eq!(analysis.symbol, "SOL/USDC");
        assert!(analysis.confidence >= 0.0 && analysis.confidence <= 1.0);
    }

    #[tokio::test]
    async fn test_crypto_swarm_trade() {
        let swarm = CryptoSwarm::default();
        let request = TradeRequest {
            symbol: "SOL/USDC".to_string(),
            side: TradeSide::Buy,
            order_type: OrderType::Market,
            quantity: 10.0,
            price: Some(100.0),
        };
        let result = swarm.trade(&request).await.unwrap();
        assert_eq!(result.symbol, "SOL/USDC");
        assert_eq!(result.side, TradeSide::Buy);
    }

    #[tokio::test]
    async fn test_crypto_swarm_jupiter_swap() {
        let swarm = CryptoSwarm::default();
        let result = swarm.jupiter_swap(
            "So11111111111111111111111111111111111111112",
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            1.0,
        ).await.unwrap();
        assert!(result.output_amount > 0.0);
    }
}
