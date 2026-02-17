
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import torch
from unsloth import FastLanguageModel
import os

app = FastAPI(title="Iron Brain Neural Bridge")

# Configuration
BASE_MODEL = "unsloth/Llama-3.2-3B-Instruct"
ADAPTER_PATH = "swarm/factory/models/hitchhiker-v1"
PORT = 8000

# Global Model Container
class Engine:
    model = None
    tokenizer = None

engine = Engine()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7

@app.on_event("startup")
async def startup_event():
    print(f"🌉 Neural Bridge: Loading {BASE_MODEL}...")
    
    # 1. Load Base Model
    engine.model, engine.tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL,
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )
    
    # 2. Check for Adapter
    if os.path.exists(ADAPTER_PATH):
        print(f"🧬 Neural Bridge: Loading Hitchhiker Adapter from {ADAPTER_PATH}...")
        engine.model.load_adapter(ADAPTER_PATH)
        print("✅ Adapter Loaded Successfully.")
    else:
        print("⚠️ Adapter not found. Running Base Model only.")

    FastLanguageModel.for_inference(engine.model)
    print("🚀 Iron Brain is Online via Neural Bridge.")

@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [
            {"id": "iron-brain-v1", "object": "model", "created": 1678888888, "owned_by": "sovereign-swarm"},
            {"id": "llama-3.2-3b", "object": "model", "created": 1678888888, "owned_by": "meta"}
        ]
    }

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest, extra: Request = None):
    # Retrieve body for extra_body (Kimi compatibility)
    body = await extra.json()
    extra_body = body.get("extra_body", {})
    thinking_enabled = extra_body.get("thinking", {}).get("type") == "enabled"
    
    messages = [msg.dict() for msg in request.messages]
    
    # 🧠 [KIMI PATTERN] Interleaved Thinking
    if thinking_enabled:
        # Prepend thinking prompt if not structured
        if not any("think" in m["content"].lower() for m in messages):
            messages.insert(0, {"role": "system", "content": "You are the IRON BRAIN with Kimi Neural Acceleration. Think step-by-step before answering. Use <thought> tags for your reasoning."})

    # Apply Chat Template
    inputs = engine.tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt"
    ).to("cuda")

    # Generate
    outputs = engine.model.generate(
        inputs,
        max_new_tokens=request.max_tokens,
        temperature=request.temperature if not thinking_enabled else 0.7,
        use_cache=True
    )
    
    # Decode (strip prompt)
    full_text = engine.tokenizer.batch_decode(outputs[:, inputs.shape[1]:], skip_special_tokens=True)[0]
    
    # 🧠 [KIMI PATTERN] Split Thinking from Content
    reasoning_content = ""
    content = full_text
    
    if "<thought>" in full_text and "</thought>" in full_text:
        parts = full_text.split("</thought>")
        reasoning_content = parts[0].replace("<thought>", "").strip()
        content = parts[1].strip()
    elif "THOUGHT:" in full_text:
        parts = full_text.split("ANSWER:")
        reasoning_content = parts[0].replace("THOUGHT:", "").strip()
        content = parts[1].strip() if len(parts) > 1 else full_text

    return {
        "id": "chatcmpl-neuralbridge",
        "object": "chat.completion",
        "created": 1678888888,
        "model": request.model,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": content,
                "reasoning_content": reasoning_content
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": inputs.shape[1],
            "completion_tokens": len(outputs[0]) - inputs.shape[1],
            "total_tokens": len(outputs[0])
        }
    }

if __name__ == "__main__":
    # Disable Dynamo for Windows
    torch.compile = None
    uvicorn.run(app, host="0.0.0.0", port=PORT)
