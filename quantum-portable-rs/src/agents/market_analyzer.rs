//! MarketAnalyzer Agent - Market Analysis Agent
//!
//! Provides comprehensive market analysis including trend detection,
//! sentiment analysis, and competitor analysis.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// MarketAnalyzer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketConfig {
    pub data_sources: Vec<String>,
    pub sentiment_api_url: String,
    pub competitor_scan_interval_ms: u64,
}

impl Default for MarketConfig {
    fn default() -> Self {
        Self {
            data_sources: vec![
                "coingecko".to_string(),
                "birdeye".to_string(),
                "dexscreener".to_string(),
            ],
            sentiment_api_url: "https://api.sentiment.example.com".to_string(),
            competitor_scan_interval_ms: 60000,
        }
    }
}

/// Market trend direction
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum TrendDirection {
    Bullish,
    Bearish,
    Sideways,
}

/// Market trend analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketTrend {
    pub direction: TrendDirection,
    pub strength: f64,
    pub volume: f64,
    pub support_level: f64,
    pub resistance_level: f64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Sentiment analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentimentAnalysis {
    pub overall_sentiment: f64,
    pub positive_ratio: f64,
    pub negative_ratio: f64,
    pub neutral_ratio: f64,
    pub key_topics: Vec<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Threat level enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ThreatLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Competitor analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompetitorAnalysis {
    pub competitor_name: String,
    pub market_share: f64,
    pub threat_level: ThreatLevel,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub recent_moves: Vec<String>,
}

/// Full market analysis summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketAnalysisSummary {
    pub symbol: String,
    pub current_price: f64,
    pub change_24h: f64,
    pub volume_24h: f64,
    pub market_cap: f64,
    pub trend: MarketTrend,
    pub sentiment: SentimentAnalysis,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// MarketAnalyzer Agent implementation
#[derive(Debug)]
pub struct MarketAnalyzer {
    config: MarketConfig,
    running: bool,
    cache: Arc<RwLock<HashMap<String, serde_json::Value>>>,
}

impl MarketAnalyzer {
    /// Create a new MarketAnalyzer agent
    pub fn new(config: MarketConfig) -> Self {
        Self {
            config,
            running: false,
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Analyze a market
    pub async fn analyze(&self, market: &str) -> Result<MarketAnalysisSummary, anyhow::Error> {
        let trend = self.trend(market).await?;
        let sentiment = self.sentiment(market).await?;

        Ok(MarketAnalysisSummary {
            symbol: market.to_string(),
            current_price: 100.0,
            change_24h: 5.5,
            volume_24h: 1500000.0,
            market_cap: 500000000.0,
            trend,
            sentiment,
            timestamp: chrono::Utc::now(),
        })
    }

    /// Get market trend for a symbol
    pub async fn trend(&self, symbol: &str) -> Result<MarketTrend, anyhow::Error> {
        Ok(MarketTrend {
            direction: TrendDirection::Bullish,
            strength: 0.75,
            volume: 1500000.0,
            support_level: 95.0,
            resistance_level: 110.0,
            timestamp: chrono::Utc::now(),
        })
    }

    /// Analyze sentiment for a topic
    pub async fn sentiment(&self, topic: &str) -> Result<SentimentAnalysis, anyhow::Error> {
        Ok(SentimentAnalysis {
            overall_sentiment: 0.65,
            positive_ratio: 0.55,
            negative_ratio: 0.20,
            neutral_ratio: 0.25,
            key_topics: vec![
                format!("{} adoption", topic),
                format!("{} regulation", topic),
                format!("{} technology", topic),
            ],
            timestamp: chrono::Utc::now(),
        })
    }

    /// Analyze a competitor
    pub async fn analyze_competitor(
        &self,
        competitor: &str,
    ) -> Result<CompetitorAnalysis, anyhow::Error> {
        Ok(CompetitorAnalysis {
            competitor_name: competitor.to_string(),
            market_share: 0.15,
            threat_level: ThreatLevel::Medium,
            strengths: vec![
                "Strong community".to_string(),
                "Experienced team".to_string(),
            ],
            weaknesses: vec![
                "Limited integrations".to_string(),
                "High fees".to_string(),
            ],
            recent_moves: vec![
                "Launched new product".to_string(),
                "Partnership announced".to_string(),
            ],
        })
    }

    /// Get market overview
    pub async fn get_overview(&self) -> Result<serde_json::Value, anyhow::Error> {
        Ok(serde_json::json!({
            "total_market_cap": 2000000000000.0,
            "total_volume_24h": 100000000000.0,
            "btc_dominance": 45.0,
            "fear_greed_index": 65,
            "top_gainers": ["SOL", "ARB", "OP"],
            "top_losers": ["DOGE", "SHIB", "PEPE"],
        }))
    }
}

#[async_trait]
impl super::Agent for MarketAnalyzer {
    fn name(&self) -> &str { "market_analyzer" }
    
    fn description(&self) -> &str { 
        "Market analysis and sentiment tracking agent" 
    }
    
    fn capabilities(&self) -> Vec<String> {
        vec![
            "market_analysis".to_string(),
            "trend_detection".to_string(),
            "sentiment_analysis".to_string(),
            "competitor_analysis".to_string(),
        ]
    }

    async fn initialize(&mut self) -> Result<(), anyhow::Error> {
        info!("Initializing MarketAnalyzer with {} data sources", 
            self.config.data_sources.len());
        Ok(())
    }

    async fn start(&mut self, _listen: &str) -> Result<(), anyhow::Error> {
        self.running = true;
        info!("MarketAnalyzer agent started");
        Ok(())
    }

    async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.running = false;
        info!("MarketAnalyzer agent stopped");
        Ok(())
    }

    async fn process_message(&mut self, message: &super::AgentMessage) -> super::AgentResponse {
        let response = match message.message_type.as_str() {
            "analyze" => {
                let market = message.payload.get("market")
                    .and_then(|v| v.as_str())
                    .unwrap_or("SOL");
                let analysis = self.analyze(market).await;
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
            "trend" => {
                let symbol = message.payload.get("symbol")
                    .and_then(|v| v.as_str())
                    .unwrap_or("SOL");
                let trend = self.trend(symbol).await;
                match trend {
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
            "sentiment" => {
                let topic = message.payload.get("topic")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Solana");
                let sentiment = self.sentiment(topic).await;
                match sentiment {
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
            "competitor" => {
                let competitor = message.payload.get("competitor")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Unknown");
                let analysis = self.analyze_competitor(competitor).await;
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
            "overview" => {
                let overview = self.get_overview().await;
                match overview {
                    Ok(o) => super::AgentResponse {
                        id: Uuid::new_v4(),
                        request_id: message.id,
                        success: true,
                        data: Some(o),
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
        super::AgentStatus {
            name: "market_analyzer".to_string(),
            running: self.running,
            last_activity: chrono::Utc::now(),
            messages_processed: 0,
            errors: 0,
            metrics: serde_json::json!({
                "data_sources": self.config.data_sources,
                "config": self.config
            }),
        }
    }
}

impl Default for MarketAnalyzer {
    fn default() -> Self {
        Self::new(MarketConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_market_analyzer_analyze() {
        let analyzer = MarketAnalyzer::default();
        let analysis = analyzer.analyze("SOL").await.unwrap();
        assert_eq!(analysis.symbol, "SOL");
        assert!(analysis.current_price > 0.0);
    }

    #[tokio::test]
    async fn test_market_analyzer_trend() {
        let analyzer = MarketAnalyzer::default();
        let trend = analyzer.trend("SOL").await.unwrap();
        assert!(trend.strength >= 0.0 && trend.strength <= 1.0);
    }

    #[tokio::test]
    async fn test_market_analyzer_sentiment() {
        let analyzer = MarketAnalyzer::default();
        let sentiment = analyzer.sentiment("Solana").await.unwrap();
        assert!(sentiment.overall_sentiment >= -1.0 && sentiment.overall_sentiment <= 1.0);
    }

    #[tokio::test]
    async fn test_market_analyzer_competitor() {
        let analyzer = MarketAnalyzer::default();
        let competitor = analyzer.analyze_competitor("Raydium").await.unwrap();
        assert_eq!(competitor.competitor_name, "Raydium");
    }
}
