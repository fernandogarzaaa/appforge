# Free LLM Infrastructure

Zero-cost infrastructure for training and deploying superior language models.

## 🎯 Overview

This directory contains scripts and configurations for running LLM training and inference on free/cheap cloud resources:

- **Google Colab** - Unlimited T4 GPU sessions (12hr max)
- **Kaggle** - 30hrs/week P100 GPU time
- **RunPod** - Spot instances at 40-60% discount
- **Vast.ai** - Cheapest GPU marketplace (as low as $0.10/hr)

## 📁 Files

### `colab_training.py`
Colab training with persistence and keep-alive.

**Features:**
- Google Drive checkpoint persistence
- Auto keep-alive to prevent disconnects
- 4-bit QLoRA training optimized for T4
- Automatic checkpoint recovery

**Usage:**
```python
# In a Colab notebook cell:
!wget https://raw.githubusercontent.com/your-repo/colab_training.py
!python colab_training.py
```

**Tips:**
- Mount Drive for persistence
- Run keep-alive script in browser console
- Save checkpoints every 500 steps
- Expect 12hr session limit

### `kaggle_training.py`
Kaggle P100 training with optimizations.

**Features:**
- 30 hours/week free P100 access
- Larger batch sizes than Colab
- Kaggle Datasets integration
- Automatic dataset creation from checkpoints

**Usage:**
```python
# In Kaggle notebook:
!python kaggle_training.py
```

**Setup:**
1. Enable GPU in Kaggle settings
2. Add your dataset as input
3. Commit notebook for background execution

### `runpod_spot.py`
RunPod spot instance automation.

**Features:**
- Auto-find cheapest spot instances
- Automatic recovery from interruptions
- Multi-region price comparison
- Persistent training with S3 checkpoint sync

**Usage:**
```bash
export RUNPOD_API_KEY="your-api-key"
export CHECKPOINT_BUCKET="s3://your-bucket"
python runpod_spot.py
```

**Pricing (as of 2024):**
- RTX 3090: ~$0.20/hr spot
- RTX 4090: ~$0.35/hr spot
- A6000: ~$0.50/hr spot
- A100: ~$1.80/hr spot

### `vast_ai_cheapest.py`
Vast.ai GPU marketplace finder.

**Features:**
- Search and compare all available GPUs
- Value scoring (perf/price ratio)
- Auto-rent best value instance
- Distributed training orchestration

**Usage:**
```bash
# Just search (no API key needed)
python vast_ai_cheapest.py

# Auto-rent (requires API key)
export VAST_API_KEY="your-api-key"
python vast_ai_cheapest.py
```

**Typical Prices:**
| GPU | VRAM | Avg Price/hr | Best For |
|-----|------|--------------|----------|
| RTX 3090 | 24GB | $0.15-0.25 | 7B-13B models |
| RTX 4090 | 24GB | $0.30-0.40 | Fast inference |
| RTX A5000 | 16GB | $0.20-0.30 | Training |
| RTX A6000 | 48GB | $0.50-0.70 | Large models |
| A100 40GB | 40GB | $1.50-2.00 | Full fine-tuning |
| A100 80GB | 80GB | $2.00-3.00 | Largest models |

### `app.py`
Flask API for local/edge inference.

**Features:**
- OpenAI-compatible API
- 4-bit quantization support
- CPU-optimized inference
- Health checks and metrics

**Usage:**
```bash
# Local deployment
pip install -r requirements.txt
python app.py

# Docker
docker build -t superior-llm .
docker run -p 7860:7860 superior-llm
```

## 🚀 Quick Start

### 1. Training Setup

Choose your platform based on needs:

| Platform | GPU | Weekly Hours | Best For |
|----------|-----|--------------|----------|
| Colab | T4 | Unlimited* | Experimentation |
| Kaggle | P100 | 30 | Serious training |
| RunPod Spot | Various | Pay-as-you-go | Production |
| Vast.ai | Various | Pay-as-you-go | Cost optimization |

\* 12hr session limit

### 2. Recommended Training Flow

```
Week 1: Colab experimentation
  └─ Test hyperparameters
  └─ Validate dataset quality
  └─ Short training runs

Week 2: Kaggle training
  └─ Full QLoRA fine-tuning
  └─ Save checkpoints to Drive

Week 3: RunPod/Vast spot
  └─ Extended training sessions
  └─ Merge and evaluate
  └─ Generate benchmark results
```

### 3. Checkpoint Management

```python
# Save checkpoint to persistent storage
# Colab → Google Drive
# Kaggle → Kaggle Dataset
# RunPod/Vast → S3 or R2

# Resume from checkpoint
checkpoint_manager.load_latest(model, tokenizer)
```

## 💰 Cost Optimization

### Free Tier Stacking

```python
# Week schedule for $0 training
Monday-Wednesday: Kaggle (10 hrs/day)
Thursday-Friday: Colab (continuous)
Weekend: RunPod spot ($5-10 for speed)
```

### Spot Instance Strategy

```bash
# Find cheapest current options
python vast_ai_cheapest.py

# Set up auto-recovery
python runpod_spot.py --max-price 0.50
```

## 📊 Benchmarking

Run benchmarks to validate your model:

```bash
# After training, evaluate on standard benchmarks
python ../src/llm/benchmark.py \
  --model ./checkpoints/final \
  --benchmarks mmlu,gsm8k,humaneval
```

Expected results for merged 7B model:
- MMLU: 82-85%
- GSM8K: 75-80%
- HumanEval: 60-65%
- MT-Bench: 8.0-8.5

## 🔧 Configuration

### Environment Variables

```bash
# API Keys
export OPENAI_API_KEY="sk-..."        # For distillation
export OPENROUTER_API_KEY="..."       # Alternative teacher
export RUNPOD_API_KEY="..."           # RunPod access
export VAST_API_KEY="..."             # Vast.ai access

# Storage
export CHECKPOINT_BUCKET="s3://..."   # S3/R2 bucket
export HF_TOKEN="hf_..."              # HuggingFace

# Training
export WANDB_PROJECT="superior-llm"   # Experiment tracking
```

## 🐛 Troubleshooting

### Colab Disconnects
- Use keep-alive script
- Save checkpoints frequently
- Use smaller batch sizes

### OOM Errors
- Reduce batch size
- Enable gradient checkpointing
- Use 4-bit quantization

### Slow Training
- Use gradient accumulation
- Enable mixed precision (fp16)
- Optimize data loading

## 📚 Resources

- [Colab FAQ](https://research.google.com/colaboratory/faq.html)
- [Kaggle GPU Docs](https://www.kaggle.com/docs/efficient-gpu-usage)
- [RunPod API Docs](https://graphql-spec.runpod.io/)
- [Vast.ai API Docs](https://vast.ai/docs/api/)

## 🤝 Contributing

To add a new platform:

1. Create `{platform}_training.py`
2. Implement standard interface:
   - `setup_environment()`
   - `load_model()`
   - `train_with_persistence()`
3. Add to README platform table
4. Submit PR

## 📄 License

MIT License - See LICENSE file for details
