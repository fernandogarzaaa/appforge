"""
Clawd-Phi2: Zero-Budget Cloud LLM
Free tier inference API using Microsoft Phi-2 (2.7B params)
Optimized for CPU inference with quantization
"""

from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import torch
import time
import os

app = Flask(__name__)

# Configuration
MODEL_NAME = os.getenv('MODEL_NAME', 'microsoft/phi-2')
MAX_LENGTH = int(os.getenv('MAX_LENGTH', '512'))
DEVICE = 'cpu'  # Free tier uses CPU

print(f"🤖 Loading {MODEL_NAME}...")
start_time = time.time()

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

# Configure quantization for CPU (4-bit to save memory)
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
) if torch.cuda.is_available() else None

# Load model with optimizations
model_kwargs = {
    'trust_remote_code': True,
    'torch_dtype': torch.float16,
    'low_cpu_mem_usage': True,
}

if quantization_config:
    model_kwargs['quantization_config'] = quantization_config

try:
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, **model_kwargs)
    print(f"✅ Model loaded in {time.time() - start_time:.2f}s")
except Exception as e:
    print(f"⚠️  Failed to load with quantization: {e}")
    print("🔄 Retrying without quantization...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
        torch_dtype=torch.float32,
        low_cpu_mem_usage=True
    )
    print(f"✅ Model loaded (no quantization) in {time.time() - start_time:.2f}s")

model.eval()

# System prompt for coding assistance
SYSTEM_PROMPT = """You are Clawd, a helpful AI coding assistant. You are concise, practical, and focused on writing working code.
When asked to write code:
1. Provide complete, runnable solutions
2. Include necessary imports
3. Add brief comments explaining key logic
4. Follow best practices for the language/framework

Current context: Working on AppForge project (React/Node.js/TypeScript)"""


def format_prompt(user_prompt: str, context: str = "") -> str:
    """Format prompt for Phi-2"""
    if context:
        return f"{SYSTEM_PROMPT}\n\nContext: {context}\n\nUser: {user_prompt}\n\nAssistant:"
    return f"{SYSTEM_PROMPT}\n\nUser: {user_prompt}\n\nAssistant:"


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': MODEL_NAME,
        'device': DEVICE,
        'quantized': quantization_config is not None
    })


@app.route('/generate', methods=['POST'])
def generate():
    """Main generation endpoint"""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        max_tokens = min(data.get('max_tokens', 256), MAX_LENGTH)
        temperature = data.get('temperature', 0.7)
        context = data.get('context', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Format prompt
        formatted_prompt = format_prompt(prompt, context)
        
        # Tokenize
        inputs = tokenizer(
            formatted_prompt,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=2048
        )
        
        # Generate
        start_gen = time.time()
        
        with torch.no_grad():
            outputs = model.generate(
                inputs['input_ids'],
                attention_mask=inputs['attention_mask'],
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=temperature > 0,
                top_p=0.9,
                top_k=50,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )
        
        # Decode
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the assistant's response
        response_text = generated_text[len(formatted_prompt):].strip()
        
        # Stop at common end markers
        for stop_token in ['\nUser:', '\nHuman:', 'User:', 'Human:']:
            if stop_token in response_text:
                response_text = response_text.split(stop_token)[0].strip()
        
        generation_time = time.time() - start_gen
        
        return jsonify({
            'response': response_text,
            'model': MODEL_NAME,
            'tokens_generated': len(outputs[0]) - len(inputs['input_ids'][0]),
            'generation_time_ms': round(generation_time * 1000, 2),
            'prompt_tokens': len(inputs['input_ids'][0])
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'model': MODEL_NAME
        }), 500


@app.route('/v1/chat/completions', methods=['POST'])
def openai_compatible():
    """OpenAI-compatible endpoint for easy integration"""
    try:
        data = request.json
        messages = data.get('messages', [])
        max_tokens = min(data.get('max_tokens', 256), MAX_LENGTH)
        temperature = data.get('temperature', 0.7)
        
        # Convert messages to prompt
        prompt_parts = []
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'system':
                prompt_parts.append(f"System: {content}")
            elif role == 'user':
                prompt_parts.append(f"User: {content}")
            elif role == 'assistant':
                prompt_parts.append(f"Assistant: {content}")
        
        prompt = "\n".join(prompt_parts)
        formatted_prompt = format_prompt(prompt)
        
        # Tokenize and generate
        inputs = tokenizer(
            formatted_prompt,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=2048
        )
        
        with torch.no_grad():
            outputs = model.generate(
                inputs['input_ids'],
                attention_mask=inputs['attention_mask'],
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=temperature > 0,
                top_p=0.9,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )
        
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response_text = generated_text[len(formatted_prompt):].strip()
        
        # OpenAI-compatible response format
        return jsonify({
            'id': f'clawd-{int(time.time())}',
            'object': 'chat.completion',
            'created': int(time.time()),
            'model': MODEL_NAME,
            'choices': [{
                'index': 0,
                'message': {
                    'role': 'assistant',
                    'content': response_text
                },
                'finish_reason': 'stop'
            }],
            'usage': {
                'prompt_tokens': len(inputs['input_ids'][0]),
                'completion_tokens': len(outputs[0]) - len(inputs['input_ids'][0]),
                'total_tokens': len(outputs[0])
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', methods=['GET'])
def index():
    """Root endpoint with instructions"""
    return jsonify({
        'name': 'Clawd-Phi2 LLM API',
        'version': '1.0.0',
        'model': MODEL_NAME,
        'endpoints': {
            'health': '/health',
            'generate': '/generate (POST)',
            'openai_compatible': '/v1/chat/completions (POST)'
        },
        'example': {
            'endpoint': '/generate',
            'method': 'POST',
            'body': {
                'prompt': 'Write a React component for a button',
                'max_tokens': 256,
                'temperature': 0.7
            }
        }
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 7860))
    app.run(host='0.0.0.0', port=port)
