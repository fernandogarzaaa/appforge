# Quantum Chimera LLM Gateway (Kimi-Enhanced)

This directory contains the integrated multi-model LLM gateway, based on the Kimi-enhanced Quantum Chimera architecture. It provides:
- Multi-model routing with fallback (OpenRouter, Kimi, etc.)
- Semantic cache
- Conversation memory
- Quality scoring and optimizer
- Monitoring dashboard
- Robust error handling

## Usage
- Start the FastAPI server: `python -m llm.chimera_server`
- Configure models and keys in `llm/config.py` or via environment variables.
- Access the dashboard at `/dashboard` endpoint.

## Integration
- Main endpoints: `/v1/chat/completions`, `/v1/models`, `/dashboard`, `/health`
- See `chimera_server.py` for details.
