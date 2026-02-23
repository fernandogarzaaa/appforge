# =============================================================================
# Clawd Hybrid RTX - Dockerfile for RTX 2060
# CUDA 11.8 optimized with multi-stage build
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Compile dependencies and install requirements
# -----------------------------------------------------------------------------
FROM nvidia/cuda:11.8.0-cudnn8-devel-ubuntu22.04 AS builder

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-dev \
    python3-pip \
    python3-venv \
    build-essential \
    cmake \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python3.10 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch with CUDA 11.8 support (RTX 2060 compatible)
RUN pip install --no-cache-dir \
    torch==2.0.1+cu118 \
    torchvision==0.15.2+cu118 \
    torchaudio==2.0.2+cu118 \
    --extra-index-url https://download.pytorch.org/whl/cu118

# Install other ML/AI dependencies
RUN pip install --no-cache-dir \
    transformers==4.35.0 \
    accelerate==0.24.0 \
    bitsandbytes==0.41.0 \
    sentencepiece \
    protobuf \
    numpy \
    scipy \
    pandas \
    scikit-learn

# Install monitoring and API dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.0 \
    uvicorn[standard]==0.24.0 \
    pydantic==2.5.0 \
    pynvml==11.5.0 \
    psutil==5.9.6 \
    prometheus-client==0.19.0 \
    redis==5.0.1 \
    python-dotenv==1.0.0 \
    pyyaml==6.0.1 \
    httpx==0.25.0 \
    aiohttp==3.9.0

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Minimal image with only runtime dependencies
# -----------------------------------------------------------------------------
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    libgomp1 \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create app directory
WORKDIR /app

# Copy application code
COPY ./src /app/src
COPY ./monitor.py /app/
COPY ./config.yaml /app/
COPY ./.env.example /app/.env

# Create directories for models and cache
RUN mkdir -p /app/models /app/cache /app/logs /app/metrics

# Create non-root user for security
RUN groupadd -r clawd && useradd -r -g clawd -d /app -s /sbin/nologin clawd \
    && chown -R clawd:clawd /app

# Set environment variables for RTX 2060 optimization
ENV CUDA_VISIBLE_DEVICES=0
ENV CUDA_MODULE_LOADING=LAZY
ENV PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
ENV TRANSFORMERS_CACHE=/app/cache
ENV HF_HOME=/app/cache

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 8000 9090

# Switch to non-root user
USER clawd

# Default command
CMD ["python3", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
