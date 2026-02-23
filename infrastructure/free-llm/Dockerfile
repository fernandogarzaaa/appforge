# Phi-2 LLM Inference API
# Optimized for zero-budget deployment on Hugging Face Spaces
# Free tier: Unlimited CPU, works with quantized models

FROM python:3.9-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    torch \
    transformers \
    accelerate \
    flask \
    gunicorn \
    bitsandbytes \
    sentencepiece

# Copy application
COPY app.py .
COPY requirements.txt .

# Expose port
EXPOSE 7860

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--timeout", "120", "app:app"]
