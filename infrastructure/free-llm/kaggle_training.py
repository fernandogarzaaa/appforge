#!/usr/bin/env python3
"""
Kaggle P100 Training Setup
30 hours/week of free P100 GPU time
"""

import os
import json
from datetime import datetime

def setup_kaggle_environment():
    """Setup Kaggle notebook environment"""
    print("🚀 Setting up Kaggle environment...")
    
    # Kaggle paths
    input_dir = '/kaggle/input'
    working_dir = '/kaggle/working'
    
    # Create subdirectories
    os.makedirs(f'{working_dir}/checkpoints', exist_ok=True)
    os.makedirs(f'{working_dir}/outputs', exist_ok=True)
    os.makedirs(f'{working_dir}/logs', exist_ok=True)
    
    print("✅ Environment ready")
    
    return {
        'input_dir': input_dir,
        'working_dir': working_dir,
        'checkpoint_dir': f'{working_dir}/checkpoints',
        'output_dir': f'{working_dir}/outputs',
        'log_dir': f'{working_dir}/logs'
    }

def verify_gpu():
    """Verify GPU availability and specs"""
    import torch
    
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA not available! Enable GPU in Kaggle settings.")
    
    gpu_name = torch.cuda.get_device_name(0)
    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
    
    print(f"✅ GPU: {gpu_name}")
    print(f"✅ VRAM: {gpu_memory:.1f} GB")
    
    return {
        'name': gpu_name,
        'memory_gb': gpu_memory
    }

def optimize_for_p100():
    """Optimize training settings for P100 GPU"""
    import torch
    
    # P100 specific optimizations
    torch.backends.cudnn.benchmark = True
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    
    # Clear cache
    torch.cuda.empty_cache()
    
    print("✅ P100 optimizations applied")

def install_packages():
    """Install required packages on Kaggle"""
    packages = [
        'transformers==4.36.2',
        'accelerate==0.25.0',
        'peft==0.7.1',
        'bitsandbytes==0.41.3',
        'trl==0.7.4',
        'datasets==2.15.0',
        'scipy',
        'sentencepiece'
    ]
    
    for pkg in packages:
        os.system(f'pip install -q {pkg}')
    
    print("✅ Packages installed")

def load_model_optimized(model_name: str):
    """Load model with P100-specific optimizations"""
    import torch
    from transformers import (
        AutoModelForCausalLM, 
        AutoTokenizer,
        BitsAndBytesConfig
    )
    
    print(f"🤖 Loading {model_name} with P100 optimizations...")
    
    # P100 doesn't support bfloat16, use float16
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )
    
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.float16
    )
    
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        trust_remote_code=True
    )
    tokenizer.pad_token = tokenizer.eos_token
    
    print(f"✅ Model loaded on {torch.cuda.get_device_name(0)}")
    
    return model, tokenizer

def setup_training_config():
    """Optimized training configuration for P100"""
    from transformers import TrainingArguments
    
    return TrainingArguments(
        output_dir="/kaggle/working/outputs",
        num_train_epochs=1,  # Adjust based on time budget
        per_device_train_batch_size=2,  # P100 can handle larger batches
        gradient_accumulation_steps=4,
        warmup_steps=50,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        save_steps=500,
        save_total_limit=2,
        optim="paged_adamw_8bit",
        lr_scheduler_type="cosine",
        report_to="none",
        remove_unused_columns=False
    )

def create_kaggle_dataset(
    checkpoint_dir: str,
    dataset_name: str = "superior-llm-checkpoints"
):
    """Create Kaggle dataset from checkpoints for persistence"""
    import subprocess
    
    metadata = {
        "title": dataset_name,
        "id": f"your-username/{dataset_name}",
        "licenses": [{"name": "Apache-2.0"}]
    }
    
    # Save metadata
    with open(f'{checkpoint_dir}/dataset-metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📦 Dataset metadata created for {dataset_name}")
    print("Run the following in a new cell to upload:")
    print(f"!kaggle datasets create -p {checkpoint_dir}")

def train_with_efficiency(
    model,
    tokenizer,
    dataset,
    training_args,
    checkpoint_dir: str
):
    """Training loop with efficiency monitoring"""
    import torch
    from trl import SFTTrainer
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    
    # Setup LoRA
    lora_config = LoraConfig(
        r=64,
        lora_alpha=16,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        lora_dropout=0.1,
        bias="none",
        task_type="CAUSAL_LM"
    )
    
    model = prepare_model_for_kbit_training(model)
    model = get_peft_model(model, lora_config)
    
    # Efficiency tracking
    start_time = datetime.now()
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        args=training_args,
        max_seq_length=2048,
        dataset_text_field="text"
    )
    
    print("🏋️ Starting training...")
    print(f"Start time: {start_time}")
    
    # Train
    trainer.train()
    
    # Report efficiency
    end_time = datetime.now()
    duration = end_time - start_time
    
    print(f"✅ Training complete!")
    print(f"Duration: {duration}")
    
    # Save final model
    final_path = f"{checkpoint_dir}/final"
    trainer.save_model(final_path)
    tokenizer.save_pretrained(final_path)
    
    print(f"✅ Model saved to {final_path}")
    
    return trainer

def main():
    """Main Kaggle training workflow"""
    print("=" * 50)
    print("Superior Free LLM - Kaggle P100 Training")
    print("=" * 50)
    
    # Setup
    paths = setup_kaggle_environment()
    gpu_info = verify_gpu()
    optimize_for_p100()
    install_packages()
    
    # Model configuration
    MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"
    DATASET_PATH = "/kaggle/input/your-dataset"  # Add your dataset
    
    # Load model
    model, tokenizer = load_model_optimized(MODEL_NAME)
    
    # Load dataset
    from datasets import load_dataset
    # dataset = load_dataset(DATASET_PATH, split="train")
    # For demo, using a public dataset
    dataset = load_dataset("tatsu-lab/alpaca", split="train[:2000]")
    
    # Prepare dataset
    def format_example(example):
        if 'instruction' in example:
            text = f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"
        else:
            text = example['text']
        return {'text': text}
    
    dataset = dataset.map(format_example)
    
    # Training config
    training_args = setup_training_config()
    
    # Train
    trainer = train_with_efficiency(
        model, tokenizer, dataset,
        training_args, paths['checkpoint_dir']
    )
    
    # Create dataset for persistence
    create_kaggle_dataset(paths['checkpoint_dir'])
    
    print("\n✅ All done! Remember to commit your notebook.")

if __name__ == "__main__":
    main()
