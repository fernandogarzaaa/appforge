# Clawd Omega Production Deployment
# Multi-stage build for optimized image size

# Stage 1: Build dependencies
FROM nvidia/cuda:12.1-devel-ubuntu22.04 AS builder

WORKDIR /build

# Install Python and build tools
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip3 install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM nvidia/cuda:12.1-runtime-ubuntu22.04

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts are in PATH
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app/src:$PYTHONPATH

# Copy application code
COPY src/ ./src/
COPY config/ ./config/

# Pre-download models (optional - speeds up cold start)
# RUN python3 -c "from transformers import AutoModel; AutoModel.from_pretrained('microsoft/phi-2')"

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python3 -c "import requests; requests.get('http://localhost:7860/health')" || exit 1

# Run with multiple workers for production
CMD ["uvicorn", "src.api_server:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
