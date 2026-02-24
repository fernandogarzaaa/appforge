/**
 * types.ts - Core type definitions for the LLM infrastructure
 *
 * Covers model merging, distillation, benchmarking, speculative decoding,
 * and free infrastructure management.
 */

// ─── Model Registry ────────────────────────────────────────────────────────────

export const SUPPORTED_MODELS = [
  'mistralai/Mistral-7B-v0.1',
  'teknium/OpenHermes-2.5-Mistral-7B',
  'HuggingFaceH4/zephyr-7b-beta',
  'Intel/neural-chat-7b-v3-3',
] as const;

export type SupportedModelId = (typeof SUPPORTED_MODELS)[number];

export interface ModelIdentifier {
  id: SupportedModelId | string;
  revision?: string;
  /** HuggingFace repo or local path */
  source: 'huggingface' | 'local' | 'url';
  path: string;
}

// ─── Model Weights ─────────────────────────────────────────────────────────────

export interface ModelWeight {
  /** Layer name (e.g. "model.layers.0.self_attn.q_proj.weight") */
  name: string;
  /** Shape as tuple (e.g. [4096, 4096]) */
  shape: number[];
  /** Data type: float16, bfloat16, float32 */
  dtype: 'float16' | 'bfloat16' | 'float32';
  /** Raw weight tensor as typed array buffer */
  data: Float32Array | Float64Array;
  /** Optional metadata attached to the weight */
  metadata?: Record<string, unknown>;
}

export interface ModelWeightMap {
  weights: Map<string, ModelWeight>;
  config: ModelArchConfig;
}

export interface ModelArchConfig {
  architectureType: 'llama' | 'mistral' | 'gpt-neox' | 'phi';
  hiddenSize: number;
  intermediateSize: number;
  numHiddenLayers: number;
  numAttentionHeads: number;
  numKeyValueHeads: number;
  vocabSize: number;
  maxPositionEmbeddings: number;
  rmsNormEps: number;
  ropeTheta?: number;
}

// ─── Model Merging ─────────────────────────────────────────────────────────────

export type MergeTechnique = 'slerp' | 'task_arithmetic' | 'model_soup' | 'ties' | 'dare';

export interface MergeConfig {
  /** Unique name for the merged model */
  outputName: string;
  /** Merge technique to apply */
  technique: MergeTechnique;
  /** Base model (used as reference for task arithmetic, anchor for SLERP) */
  baseModel: ModelIdentifier;
  /** Models to merge */
  models: MergeModelEntry[];
  /** Global interpolation factor for SLERP (0.0 – 1.0) */
  slerpFactor?: number;
  /** Per-layer interpolation overrides keyed by layer name glob */
  layerWeights?: Record<string, number>;
  /** Scaling coefficient for task arithmetic */
  taskArithmeticScaling?: number;
  /** Output directory for the merged safetensors */
  outputDir: string;
  /** Precision for output weights */
  outputDtype?: 'float16' | 'bfloat16' | 'float32';
  /** Whether to normalize merged weights */
  normalize?: boolean;
  /** TIES-specific: density parameter (fraction of params to keep) */
  tiesDensity?: number;
  /** DARE-specific: drop rate */
  dareDropRate?: number;
}

export interface MergeModelEntry {
  model: ModelIdentifier;
  /** Weight/importance of this model in the merge (0.0 – 1.0) */
  weight: number;
  /** Optional per-layer weight overrides */
  layerWeights?: Record<string, number>;
}

export interface MergeResult {
  success: boolean;
  outputPath: string;
  technique: MergeTechnique;
  totalParams: number;
  mergedLayers: number;
  elapsedMs: number;
  warnings: string[];
  /** SHA-256 checksum of the output */
  checksum?: string;
}

// ─── Distillation ──────────────────────────────────────────────────────────────

export type DistillationStrategy =
  | 'orca_explanation'
  | 'knowledge_distillation'
  | 'progressive'
  | 'self_play';

export interface DistillationConfig {
  /** Human-readable pipeline name */
  pipelineName: string;
  /** Teacher model for generating explanations / soft labels */
  teacherModel: ModelIdentifier;
  /** Student model to distill into */
  studentModel: ModelIdentifier;
  /** Distillation strategy */
  strategy: DistillationStrategy;
  /** Dataset source (HuggingFace dataset id or local JSONL path) */
  dataset: string;
  /** Number of training epochs */
  epochs: number;
  /** Batch size per device */
  batchSize: number;
  /** Learning rate */
  learningRate: number;
  /** Warmup steps */
  warmupSteps: number;
  /** Max sequence length */
  maxSeqLength: number;
  /** Temperature for teacher soft-label generation */
  temperature: number;
  /** Alpha weighting between hard and soft loss */
  alpha: number;
  /** Output directory for checkpoints */
  outputDir: string;
  /** LoRA rank (0 = full fine-tune) */
  loraRank?: number;
  /** LoRA alpha */
  loraAlpha?: number;
  /** LoRA dropout */
  loraDropout?: number;
  /** Target modules for LoRA */
  loraTargetModules?: string[];
  /** Gradient accumulation steps */
  gradientAccumulationSteps?: number;
  /** Enable gradient checkpointing (saves memory) */
  gradientCheckpointing?: boolean;
  /** Max number of teacher samples to generate */
  maxTeacherSamples?: number;
  /** System prompt for Orca-style explanation tuning */
  systemPrompt?: string;
  /** Explanation prompt template */
  explanationTemplate?: string;
  /** Enable mixed-precision training */
  fp16?: boolean;
  bf16?: boolean;
  /** Evaluation steps interval */
  evalSteps?: number;
  /** Save steps interval */
  saveSteps?: number;
  /** Logging steps interval */
  loggingSteps?: number;
}

export interface DistillationSample {
  /** The input/question */
  input: string;
  /** Teacher-generated explanation (Orca-style) */
  explanation: string;
  /** Final answer from teacher */
  answer: string;
  /** Soft logits from teacher (optional) */
  softLabels?: number[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface DistillationProgress {
  epoch: number;
  step: number;
  totalSteps: number;
  loss: number;
  softLoss: number;
  hardLoss: number;
  learningRate: number;
  samplesProcessed: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
}

export interface DistillationResult {
  success: boolean;
  outputPath: string;
  finalLoss: number;
  totalEpochs: number;
  totalSteps: number;
  totalSamples: number;
  elapsedMs: number;
  evalMetrics?: Record<string, number>;
  checkpoints: string[];
}

// ─── Speculative Decoding ──────────────────────────────────────────────────────

export interface SpeculativeDecodingConfig {
  /** Main (verifier) model */
  mainModel: ModelIdentifier;
  /** Draft model for speculation (smaller/faster) */
  draftModel: ModelIdentifier;
  /** Number of speculative tokens to generate per step */
  numSpeculativeTokens: number;
  /** Temperature for sampling */
  temperature: number;
  /** Top-p nucleus sampling */
  topP: number;
  /** Top-k sampling */
  topK: number;
  /** Max total tokens to generate */
  maxTokens: number;
  /** Medusa head count (multi-token prediction) */
  medusaHeads?: number;
  /** Medusa tree attention depth */
  medusaTreeDepth?: number;
  /** Acceptance threshold for speculative tokens */
  acceptanceThreshold?: number;
  /** Enable tree-structured speculation */
  treeSpeculation?: boolean;
  /** Batch size for parallel verification */
  verificationBatchSize?: number;
}

export interface SpeculativeToken {
  token: number;
  logprob: number;
  accepted: boolean;
  source: 'draft' | 'main' | 'medusa_head';
  headIndex?: number;
}

export interface SpeculativeDecodingStats {
  totalTokens: number;
  acceptedTokens: number;
  rejectedTokens: number;
  acceptanceRate: number;
  speedupFactor: number;
  avgTokensPerStep: number;
  mainModelCalls: number;
  draftModelCalls: number;
  tokensPerSecond: number;
  elapsedMs: number;
}

// ─── Benchmarking ──────────────────────────────────────────────────────────────

export type BenchmarkName = 'mmlu' | 'humaneval' | 'arc' | 'gsm8k' | 'hellaswag' | 'truthfulqa' | 'winogrande';

export interface BenchmarkConfig {
  /** Model under test */
  model: ModelIdentifier;
  /** Which benchmarks to run */
  benchmarks: BenchmarkName[];
  /** Number of few-shot examples */
  fewShot?: number;
  /** Max samples per benchmark (0 = all) */
  maxSamples?: number;
  /** Batch size for evaluation */
  batchSize?: number;
  /** Temperature for generation benchmarks */
  temperature?: number;
  /** Output directory for results */
  outputDir?: string;
  /** Number of parallel workers */
  numWorkers?: number;
  /** Enable Chain-of-Thought prompting */
  chainOfThought?: boolean;
}

export interface BenchmarkResult {
  /** Benchmark identifier */
  benchmark: BenchmarkName;
  /** Model tested */
  model: string;
  /** Overall accuracy / pass rate */
  score: number;
  /** Number of correct answers */
  correct: number;
  /** Total number of questions */
  total: number;
  /** Per-category scores (e.g. MMLU subjects) */
  categoryScores?: Record<string, { score: number; total: number }>;
  /** Individual sample results */
  sampleResults?: BenchmarkSampleResult[];
  /** Time taken in milliseconds */
  elapsedMs: number;
  /** Timestamp of run */
  timestamp: string;
  /** Configuration used */
  config: BenchmarkConfig;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface BenchmarkSampleResult {
  id: string;
  input: string;
  expectedOutput: string;
  modelOutput: string;
  correct: boolean;
  category?: string;
  elapsedMs: number;
}

export interface BenchmarkComparison {
  models: string[];
  results: Record<string, BenchmarkResult[]>;
  rankings: Record<BenchmarkName, string[]>;
  aggregateScores: Record<string, number>;
}

// ─── Free Infrastructure ───────────────────────────────────────────────────────

export type InfraProvider = 'colab' | 'kaggle' | 'runpod_spot' | 'lambda_spot' | 'modal' | 'huggingface_spaces';

export type GPUType = 'T4' | 'P100' | 'A100' | 'V100' | 'L4' | 'A10G' | 'RTX3090' | 'RTX4090';

export interface InfraInstance {
  id: string;
  provider: InfraProvider;
  gpu: GPUType;
  gpuMemoryGB: number;
  cpuCores: number;
  ramGB: number;
  diskGB: number;
  status: 'pending' | 'provisioning' | 'running' | 'idle' | 'terminated' | 'error';
  createdAt: string;
  expiresAt?: string;
  /** Cost per hour in USD (0 for free tiers) */
  costPerHour: number;
  /** SSH/API endpoint */
  endpoint?: string;
  /** Region / zone */
  region?: string;
  /** Current task running on this instance */
  currentTask?: string;
  metadata?: Record<string, unknown>;
}

export interface InfraConfig {
  /** Preferred providers in order */
  providers: InfraProvider[];
  /** Minimum GPU memory required (GB) */
  minGpuMemory: number;
  /** Maximum cost per hour (USD, 0 = free only) */
  maxCostPerHour: number;
  /** Maximum instances to maintain */
  maxInstances: number;
  /** Auto-terminate idle instances after N minutes */
  idleTimeoutMinutes: number;
  /** Auto-checkpoint interval in minutes */
  checkpointIntervalMinutes: number;
  /** Credentials (provider → token/key) */
  credentials: Partial<Record<InfraProvider, InfraCredential>>;
  /** Preemption handling strategy */
  preemptionStrategy: 'checkpoint_and_resume' | 'restart' | 'failover';
  /** Notification webhook on instance events */
  webhookUrl?: string;
}

export interface InfraCredential {
  apiKey?: string;
  token?: string;
  cookieJar?: string;
  username?: string;
  password?: string;
}

export interface InfraTask {
  id: string;
  type: 'training' | 'inference' | 'merge' | 'benchmark' | 'distillation';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'preempted';
  instanceId?: string;
  config: Record<string, unknown>;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  checkpoints: string[];
  logs: string[];
  error?: string;
}

// ─── Utility Types ─────────────────────────────────────────────────────────────

export interface ProgressCallback {
  (progress: {
    stage: string;
    step: number;
    totalSteps: number;
    message: string;
    percent: number;
  }): void;
}

export interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface CancellationToken {
  isCancelled: boolean;
  onCancel(callback: () => void): void;
  cancel(): void;
}
