# Clawd Hybrid RTX - Deployment Infrastructure

Complete DevOps pipeline for deploying Clawd Hybrid on RTX 2060 systems with GPU passthrough, monitoring, and hybrid cloud fallback.

## 📁 Project Structure

```
clawd-hybrid-rtx/
├── Dockerfile                 # Multi-stage CUDA 11.8 build for RTX 2060
├── docker-compose.yml         # Full stack with GPU support
├── setup_rtx2060.bat         # Windows setup script
├── setup_rtx2060.sh          # Linux/WSL setup script
├── requirements.txt          # Python dependencies
├── monitor.py                # Performance monitoring dashboard
├── config.yaml               # Application configuration
├── .env.example              # Environment template
├── src/
│   └── main.py               # FastAPI application placeholder
├── monitoring/
│   ├── prometheus.yml        # Prometheus configuration
│   └── grafana/
│       ├── datasources/
│       │   └── prometheus.yml
│       └── dashboards/
│           └── clawd-rtx2060.json
├── models/                   # Local model storage
├── cache/                    # Cache directory
└── logs/                     # Log files
```

## 🚀 Quick Start

### Windows (with Docker Desktop + WSL2)

```powershell
# Run as Administrator
.\setup_rtx2060.bat
```

### Linux / WSL

```bash
chmod +x setup_rtx2060.sh
./setup_rtx2060.sh
```

### Manual Docker Deployment

```bash
# Clone and enter directory
cd clawd-hybrid-rtx

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🔧 RTX 2060 Optimizations

### GPU Configuration
- **CUDA Version**: 11.8 (RTX 2060 optimal)
- **VRAM Management**: 5.5GB usable (512MB reserved)
- **Quantization**: 8-bit loading enabled
- **Batch Size**: 1 (single worker)

### Memory Strategy
```yaml
# config.yaml highlights
max_memory: {0: "5GiB", "cpu": "16GiB"}  # GPU + CPU offload
load_in_8bit: true                        # Reduce VRAM usage
offload_when_gpu_full: true               # Automatic fallback
```

## 📊 Monitoring Stack

| Service | URL | Description |
|---------|-----|-------------|
| Clawd API | http://localhost:8000 | Main API endpoint |
| Health Check | http://localhost:8000/health | Service health |
| Prometheus | http://localhost:9091 | Metrics collection |
| Grafana | http://localhost:3000 | Dashboard (admin/admin) |

### Dashboard Metrics
- **GPU**: VRAM usage, temperature, power draw, utilization
- **Cache**: Hit rate, response times, total requests
- **Costs**: API usage by provider, daily spend tracking
- **System**: CPU, RAM, disk usage

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Required API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_TOKEN=hf_...

# GPU Settings
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Redis Cache
REDIS_URL=redis://localhost:6379/0

# Monitoring
METRICS_ENABLED=true
PROMETHEUS_PORT=9090
```

### Hybrid Strategy Modes

1. **local_first** - Try local GPU first, fallback to cloud on failure
2. **cloud_first** - Use cloud APIs, local as backup
3. **adaptive** (default) - Dynamic based on VRAM availability
4. **cost_optimized** - Maximize local usage within daily budget

## 💾 Caching

### Redis Cache
- Embeddings: 24 hour TTL
- Completions: 5 minute TTL
- Chat history: 30 minute TTL

### Cache Keys
```
emb:<hash>     - Text embeddings
cmp:<hash>     - Completion results
chat:<hash>    - Conversation history
```

## 🔍 Troubleshooting

### GPU Not Detected

```bash
# Check NVIDIA drivers
nvidia-smi

# Verify Docker GPU support
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# Install NVIDIA Container Toolkit (Linux/WSL)
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Out of Memory Errors

1. Reduce `max_sequence_length` in config.yaml
2. Enable `CPU_OFFLOAD=true`
3. Use smaller models (e.g., DistilGPT2)
4. Lower `INFERENCE_BATCH_SIZE` to 1

### High GPU Temperature

```yaml
# config.yaml
monitoring:
  gpu:
    temperature_warning_c: 75    # Lower threshold
    vram_critical_threshold: 0.90  # More conservative
```

## 📈 Cost Tracking

### Default Pricing (per 1K tokens)

| Provider | Model | Cost |
|----------|-------|------|
| OpenAI | GPT-4 | $0.03 |
| OpenAI | GPT-3.5 | $0.0015 |
| Anthropic | Claude 3 Opus | $0.015 |
| Anthropic | Claude 3 Sonnet | $0.003 |
| Local | RTX 2060 | $0.00 |

### Daily Budget Alerts

Set `DAILY_CLOUD_BUDGET` in .env to receive alerts when exceeded.

## 🛠️ Development

### Local Python Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run application
python src/main.py
```

### Monitoring Script

```bash
# Console mode
python monitor.py --once

# Continuous monitoring
python monitor.py --interval 5

# Web dashboard
python monitor.py --web --port 9090
```

## 🔒 Security Notes

1. **API Keys**: Never commit `.env` file
2. **Authentication**: Enable `auth.enabled` in production
3. **CORS**: Restrict `CORS_ORIGINS` in production
4. **Rate Limiting**: Configure per-IP limits

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

**Note**: This is a deployment infrastructure template. The actual AI model inference implementation should be added to `src/main.py` and integrated with the monitoring system.
