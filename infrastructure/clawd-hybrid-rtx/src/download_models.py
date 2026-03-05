from huggingface_hub import hf_hub_download
import os

MODELS_DIR = r'D:\appforge-main\infrastructure\clawd-hybrid-rtx\src\models'

models = [
    {'repo': 'Qwen/Qwen2.5-7B-Instruct-GGUF', 'file': 'qwen2.5-7b-instruct-q4_k_m.gguf', 'name': 'Qwen2.5-7B'},
    {'repo': 'lmstudio-community/gemma-2-9b-it-GGUF', 'file': 'gemma-2-9b-it-q4_k_m.gguf', 'name': 'Gemma-2-9B'},
    {'repo': 'lmstudio-community/Llama-3.2-3B-Instruct-GGUF', 'file': 'Llama-3.2-3B-Instruct-Q8_0.gguf', 'name': 'Llama-3.2-3B'},
    {'repo': 'lmstudio-community/Phi-3.5-mini-instruct-GGUF', 'file': 'Phi-3.5-mini-instruct-Q8_0.gguf', 'name': 'Phi-3.5-Mini'},
]

print('Downloading CHIMERA models...')
for m in models:
    print(f"Downloading {m['name']}...")
    try:
        path = hf_hub_download(repo_id=m['repo'], filename=m['file'], local_dir=MODELS_DIR, local_dir_use_symlinks=False)
        print(f'OK: {path}')
    except Exception as e:
        print(f'Error: {e}')
print('Done!')
