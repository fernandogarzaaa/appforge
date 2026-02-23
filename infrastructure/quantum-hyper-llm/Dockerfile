# Quantum-Hyper LLM: Clawd Omega
# Zero-budget deployment with quantum engine and hyper intelligence
# Integrates Phi-2 with AppForge's quantum swarm architecture

FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    torch==2.1.0 \
    transformers==4.36.0 \
    accelerate==0.25.0 \
    flask==3.0.0 \
    gunicorn==21.2.0 \
    bitsandbytes==0.41.0 \
    sentencepiece==0.1.99 \
    numpy==1.24.3 \
    scipy==1.11.0 \
    scikit-learn==1.3.0 \
    redis==5.0.0 \
    requests==2.31.0 \
    apscheduler==3.10.0 \
    psutil==5.9.0

# Copy application
COPY *.py ./
COPY *.json ./
COPY requirements.txt ./

# Create data directory for persistence
RUN mkdir -p /app/data /app/memory /app/evolution

# Expose port
EXPOSE 7860

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/cache
ENV TRANSFORMERS_CACHE=/app/cache

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "4", "--timeout", "300", "--keep-alive", "5", "quantum_hyper_llm:app"]
