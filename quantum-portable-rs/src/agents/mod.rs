//! Agents Module - Specialized AI Agents for Quantum Swarm
//!
//! Contains all agent implementations:
//! - Sentinel: Security monitoring and anomaly detection
//! - CryptoSwarm: Cryptocurrency trading operations
//! - RevenueHunter: Revenue optimization and forecasting
//! - MarketAnalyzer: Market analysis and sentiment tracking
//! - ArbitrageHunter: Arbitrage trading opportunities
//! - YieldOptimizer: DeFi yield farming optimization

pub mod sentinel;
pub mod crypto_swarm;
pub mod revenue_hunter;
pub mod market_analyzer;
pub mod arbitrage_hunter;
pub mod yield_optimizer;

// Re-export Sentinel types
pub use sentinel::{
    Sentinel, 
    SentinelConfig, 
    SystemMetrics, 
    Alert, 
    Severity,
    SecurityAudit,
};

// Re-export CryptoSwarm types
pub use crypto_swarm::{
    CryptoSwarm, 
    CryptoConfig, 
    MarketData, 
    TradeRequest, 
    TradeSide, 
    OrderType,
    TradeResult,
    MarketAnalysis,
    Portfolio,
    SwapResult,
    TrendDirection as CryptoTrendDirection,
};

// Re-export RevenueHunter types
pub use revenue_hunter::{
    RevenueHunter, 
    RevenueConfig, 
    RevenueOpportunity, 
    ConversionFunnel,
    FunnelStage,
    ABTest,
    OptimizationResult,
    RevenueForecast,
};

// Re-export MarketAnalyzer types
pub use market_analyzer::{
    MarketAnalyzer, 
    MarketConfig, 
    MarketTrend, 
    TrendDirection, 
    SentimentAnalysis, 
    CompetitorAnalysis,
    ThreatLevel,
    MarketAnalysisSummary,
};

// Re-export ArbitrageHunter types
pub use arbitrage_hunter::{
    ArbitrageHunter, 
    ArbitrageConfig, 
    PriceData, 
    ArbitrageOpportunity,
    ExchangeExecution,
    ArbitrageTrade,
};

// Re-export YieldOptimizer types
pub use yield_optimizer::{
    YieldOptimizer, 
    YieldConfig, 
    ProtocolInfo, 
    PoolAllocation, 
    PortfolioRisk,
    YieldOptimization,
    ProtocolCategory,
};

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, mpsc};
use uuid::Uuid;

/// Common agent trait - all agents must implement this
#[async_trait]
pub trait Agent: Send + Sync {
    /// Get agent name
    fn name(&self) -> &str;

    /// Get agent description
    fn description(&self) -> &str;

    /// Get agent capabilities
    fn capabilities(&self) -> Vec<String>;

    /// Initialize the agent
    async fn initialize(&mut self) -> Result<(), anyhow::Error>;

    /// Start the agent
    async fn start(&mut self, listen: &str) -> Result<(), anyhow::Error>;

    /// Stop the agent
    async fn stop(&mut self) -> Result<(), anyhow::Error>;

    /// Process a message
    async fn process_message(&mut self, message: &AgentMessage) -> AgentResponse;

    /// Get agent status
    async fn status(&self) -> AgentStatus;
}

/// Message sent to an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    /// Message ID
    pub id: Uuid,
    
    /// Source agent/client
    pub source: String,

    /// Message type
    pub message_type: String,

    /// Payload
    pub payload: serde_json::Value,

    /// Priority (1-10, higher = more urgent)
    pub priority: u8,

    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Response from an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResponse {
    /// Response ID
    pub id: Uuid,

    /// Original message ID
    pub request_id: Uuid,

    /// Success status
    pub success: bool,

    /// Response data
    pub data: Option<serde_json::Value>,

    /// Error message if failed
    pub error: Option<String>,

    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Agent status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStatus {
    /// Agent name
    pub name: String,

    /// Whether running
    pub running: bool,

    /// Last activity timestamp
    pub last_activity: chrono::DateTime<chrono::Utc>,

    /// Messages processed count
    pub messages_processed: u64,
    
    /// Errors count
    pub errors: u64,

    /// Additional metrics
    pub metrics: serde_json::Value,
}

/// Agent registry for managing multiple agents
#[derive(Debug)]
pub struct AgentRegistry {
    /// Registered agents
    agents: HashMap<String, Arc<RwLock<Box<dyn Agent>>>>,

    /// Agent message channels
    channels: HashMap<String, mpsc::Sender<AgentMessage>>,

    /// Registry statistics
    stats: Arc<RwLock<RegistryStats>>,
}

/// Registry statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RegistryStats {
    /// Total agents registered
    pub total_agents: usize,

    /// Running agents
    pub running_agents: usize,

    /// Total messages processed
    pub total_messages: u64,
}

/// Agent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// Agent name
    pub name: String,

    /// Agent type
    pub agent_type: String,

    /// Configuration parameters
    pub parameters: serde_json::Value,
}

impl AgentRegistry {
    /// Create a new registry
    pub fn new() -> Self {
        Self {
            agents: HashMap::new(),
            channels: HashMap::new(),
            stats: Arc::new(RwLock::new(RegistryStats::default())),
        }
    }

    /// Register an agent
    pub async fn register(&mut self, name: &str, agent: Arc<RwLock<Box<dyn Agent>>>>) {
        self.agents.insert(name.to_string(), agent);
        let mut stats = self.stats.write().await;
        stats.total_agents += 1;
    }

    /// Get an agent by name
    pub fn get(&self, name: &str) -> Option<&Arc<RwLock<Box<dyn Agent>>>> {
        self.agents.get(name)
    }

    /// Get all agent names
    pub fn names(&self) -> Vec<String> {
        self.agents.keys().cloned().collect()
    }

    /// Get statistics
    pub async fn stats(&self) -> RegistryStats {
        self.stats.read().await.clone()
    }

    /// Send message to an agent
    pub async fn send_message(&self, agent_name: &str, message: AgentMessage) -> 
 Result<(), anyhow::Error> {
        if let Some(sender) = self.channels.get(agent_name) {
            sender.send(message).await.map_err(|e| anyhow::anyhow!(e))?;
            let mut stats = self.stats.write().await;
            stats.total_messages += 1;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Agent not found: {}", agent_name))
        }
    }

    /// Check if agent exists
    pub fn contains(&self, name: &str) -> bool {
        self.agents.contains_key(name)
    }

    /// Unregister an agent
    pub fn unregister(&mut self, name: &str) {
        self.agents.remove(name);
        self.channels.remove(name);
    }

    /// Get all running agents
    pub fn running_agents(&self) -> Vec<String> {
        self.channels.keys().cloned().collect()
    }

    /// Broadcast message to all agents
    pub async fn broadcast(&self, message: AgentMessage) {
        for sender in self.channels.values() {
            let _ = sender.send(message.clone()).await;
        }
    }
}

impl Default for AgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Builder for creating configured agents
#[derive(Debug, Default)]
pub struct AgentBuilder {
    config: Option<AgentConfig>,
}

impl AgentBuilder {
    /// Create new builder
    pub fn new() -> Self {
        Self { config: None }
    }

    /// Set agent configuration
    pub fn with_config(mut self, config: AgentConfig) -> Self {
        self.config = Some(config);
        self
    }

    /// Build agent configuration
    pub fn build(self) -> AgentConfig {
        self.config.unwrap_or_else(|| AgentConfig {
            name: "default".to_string(),
            agent_type: "generic".to_string(),
            parameters: serde_json::json!({}),
        })
    }
}

/// Helper function to create a message
pub fn create_message(
    source: &str,
    message_type: &str,
    payload: serde_json::Value,
) -> AgentMessage {
    AgentMessage {
        id: Uuid::new_v4(),
        source: source.to_string(),
        message_type: message_type.to_string(),
        payload,
        priority: 5,
        timestamp: chrono::Utc::now(),
    }
}

/// Helper function to create a success response
pub fn success_response(request_id: Uuid, data: serde_json::Value) -> AgentResponse {
    AgentResponse {
        id: Uuid::new_v4(),
        request_id,
        success: true,
        data: Some(data),
        error: None,
        timestamp: chrono::Utc::now(),
    }
}

/// Helper function to create an error response
pub fn error_response(request_id: Uuid, error: &str) -> AgentResponse {
    AgentResponse {
        id: Uuid::new_v4(),
        request_id,
        success: false,
        data: None,
        error: Some(error.to_string()),
        timestamp: chrono::Utc::now(),
    }
}
