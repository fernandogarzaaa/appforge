/**
 * Clawd Hybrid RTX - TypeScript API Types
 * Type definitions for the Hybrid LLM API
 * 
 * @version 1.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum Provider {
  GROQ = "groq",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  LOCAL = "local",
  AUTO = "auto",
}

export enum ModelTier {
  FAST = "fast",         // Groq - Llama 3.1 8B
  BALANCED = "balanced", // Groq - Llama 3.3 70B
  QUALITY = "quality",   // Claude Sonnet
  CODING = "coding",     // DeepSeek Coder
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface GenerateRequest {
  /** Input prompt for generation */
  prompt: string;
  /** Quality tier - affects model selection */
  model_tier?: ModelTier;
  /** LLM provider - 'auto' for smart routing */
  provider?: Provider;
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** Check cache first before cloud API */
  use_cache?: boolean;
  /** Stream response as SSE */
  stream?: boolean;
  /** Optional metadata for tracking */
  metadata?: Record<string, unknown>;
}

export interface BatchRequest {
  /** List of prompts to generate (1-100) */
  prompts: string[];
  model_tier?: ModelTier;
  provider?: Provider;
  temperature?: number;
  max_tokens?: number;
  use_cache?: boolean;
}

export interface EmbedRequest {
  /** Texts to embed (1-1000) */
  texts: string[];
  /** Embedding model to use */
  model?: string;
  /** Normalize embeddings to unit length */
  normalize?: boolean;
}

export interface SimilarityRequest {
  /** First text for comparison */
  text1: string;
  /** Second text for comparison */
  text2: string;
  /** Embedding model to use */
  model?: string;
}

export interface SearchRequest {
  /** Search query */
  query: string;
  /** Number of results to return (1-100) */
  top_k?: number;
  /** Minimum similarity threshold (0-1) */
  threshold?: number;
  /** Specific index to search (optional) */
  index_name?: string;
}

export interface CostEstimateRequest {
  /** Prompt to estimate cost for */
  prompt: string;
  model_tier?: ModelTier;
  max_tokens?: number;
}

export interface CacheWarmRequest {
  /** Queries to pre-populate in cache */
  queries: string[];
  model_tier?: ModelTier;
}

export interface ProviderSwitchRequest {
  /** Provider to switch to */
  provider: Provider;
  /** Specific model (optional) */
  model?: string;
  /** API key for the provider (optional) */
  api_key?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface GenerateResponse {
  /** Generated text response */
  response: string;
  /** Whether result was from cache */
  cache_hit: boolean;
  /** Provider that handled the request */
  provider_used: string;
  /** Model used for generation */
  model_used: string;
  /** Cost in USD for this request */
  cost_usd: number;
  /** Whether local GPU was used */
  local_gpu_used: boolean;
  /** Input token count */
  tokens_input: number;
  /** Output token count */
  tokens_output: number;
  /** Tokens saved by cache hit */
  tokens_saved: number;
  /** Request latency in milliseconds */
  latency_ms: number;
  /** Unique request identifier */
  request_id: string;
  /** Timestamp of response */
  timestamp: string;
}

export interface BatchResponse {
  /** Individual responses for each prompt */
  responses: GenerateResponse[];
  /** Total cost for the batch */
  total_cost_usd: number;
  /** Total tokens saved by caching */
  total_tokens_saved: number;
  /** Number of prompts in batch */
  batch_size: number;
  /** Unique batch identifier */
  batch_id: string;
}

export interface EmbedResponse {
  /** List of embedding vectors */
  embeddings: number[][];
  /** Dimensionality of embeddings */
  dimensions: number;
  /** Model used for embedding */
  model_used: string;
  /** Whether local GPU was used */
  local_gpu_used: boolean;
  /** Latency in milliseconds */
  latency_ms: number;
}

export interface SimilarityResponse {
  /** Cosine similarity score (0-1) */
  similarity: number;
  /** Euclidean distance (0-2) */
  distance: number;
  model_used: string;
  local_gpu_used: boolean;
}

export interface SearchResult {
  /** Document ID */
  id: string;
  /** Document text */
  text: string;
  /** Similarity score */
  score: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  /** Matching documents */
  results: SearchResult[];
  /** Time to embed query (ms) */
  query_embedding_time_ms: number;
  /** Time to search index (ms) */
  search_time_ms: number;
  /** Total results found */
  total_results: number;
  local_gpu_used: boolean;
}

export interface CacheStats {
  /** Total cached entries */
  total_entries: number;
  /** Cache hit rate (24h) */
  hit_rate_24h: number;
  /** Cache hit rate (7d) */
  hit_rate_7d: number;
  /** Total cache hits */
  total_hits: number;
  /** Total cache misses */
  total_misses: number;
  /** Total tokens saved by cache */
  tokens_saved_total: number;
  /** Estimated savings in USD */
  estimated_savings_usd: number;
  /** Cache size in megabytes */
  cache_size_mb: number;
  /** Oldest cache entry */
  oldest_entry?: string;
  /** Newest cache entry */
  newest_entry?: string;
}

export interface CostStats {
  /** Total API spending */
  total_spent_usd: number;
  /** Total input tokens */
  total_tokens_input: number;
  /** Total output tokens */
  total_tokens_output: number;
  /** Total API requests */
  total_requests: number;
  /** Spending by provider */
  provider_breakdown: Record<string, number>;
  /** Daily average (7d) */
  daily_average_7d: number;
  /** Projected monthly spend */
  projected_monthly_usd: number;
}

export interface CostEstimateResponse {
  /** Predicted cost in USD */
  estimated_cost_usd: number;
  /** Estimated input tokens */
  estimated_tokens_input: number;
  /** Estimated output tokens */
  estimated_tokens_output: number;
  /** Provider for this tier */
  provider: string;
  /** Model that would be used */
  model: string;
  /** Probability of cache hit (0-1) */
  cache_potential: number;
}

export interface CacheWarmResponse {
  /** Number of queries warmed */
  warmed_count: number;
  /** Number of failed queries */
  failed_count: number;
  /** Total cost of warming */
  total_cost_usd: number;
}

export interface ProviderSwitchResponse {
  /** Whether switch succeeded */
  success: boolean;
  provider: string;
  model: string;
  message: string;
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

export interface StreamToken {
  /** Token text */
  token: string;
  /** Number of tokens buffered so far */
  buffered?: number;
}

export interface StreamDone {
  /** Stream complete flag */
  done: true;
  /** Total tokens generated */
  total_tokens?: number;
}

export type StreamEvent = StreamToken | StreamDone;

// ============================================================================
// HEALTH & INFO
// ============================================================================

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  services: {
    cache: "up" | "down";
    llm: "up" | "down";
    gpu: "up" | "down";
  };
  version: string;
}

export interface ApiInfo {
  name: string;
  version: string;
  docs: string;
  endpoints: Record<string, string>;
}

// ============================================================================
// SDK CONFIGURATION
// ============================================================================

export interface ClawdConfig {
  /** API base URL */
  baseUrl: string;
  /** API key (if required) */
  apiKey?: string;
  /** Default model tier */
  defaultTier?: ModelTier;
  /** Default provider */
  defaultProvider?: Provider;
  /** Request timeout (ms) */
  timeout?: number;
  /** Enable request retries */
  retries?: number;
}

export interface RequestOptions {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Override timeout */
  timeout?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Request ID for debugging */
  request_id?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

export enum ErrorCode {
  INVALID_REQUEST = "INVALID_REQUEST",
  RATE_LIMITED = "RATE_LIMITED",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  CACHE_ERROR = "CACHE_ERROR",
  GPU_ERROR = "GPU_ERROR",
  TIMEOUT = "TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Pricing information per model */
export interface ModelPricing {
  model: string;
  provider: Provider;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  context_window: number;
}

/** Usage statistics for a time period */
export interface UsagePeriod {
  period: "hour" | "day" | "week" | "month";
  start: string;
  end: string;
  requests: number;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
}

/** Cache entry metadata */
export interface CacheEntry {
  key: string;
  created_at: string;
  last_accessed: string;
  access_count: number;
  tokens_saved: number;
  size_bytes: number;
}
