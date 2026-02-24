#!/usr/bin/env python3
"""
Google Colab T4 Persistence Scripts
Keep training running even when disconnected
"""

import os
import time
import json
from datetime import datetime, timedelta
from google.colab import drive, output

def setup_colab_environment():
    """Initialize Colab environment for LLM training"""
    print("🚀 Setting up Colab environment...")
    
    # Mount Google Drive
    drive.mount('/content/drive')
    
    # Create working directories
    os.makedirs('/content/drive/MyDrive/llm_checkpoints', exist_ok=True)
    os.makedirs('/content/drive/MyDrive/llm_datasets', exist_ok=True)
    os.makedirs('/content/drive/MyDrive/llm_logs', exist_ok=True)
    
    print("✅ Drive mounted and directories created")
    
    return {
        'checkpoint_dir': '/content/drive/MyDrive/llm_checkpoints',
        'dataset_dir': '/content/drive/MyDrive/llm_datasets',
        'log_dir': '/content/drive/MyDrive/llm_logs'
    }

def keep_alive():
    """Prevent Colab from disconnecting due to inactivity"""
    from IPython.display import Javascript
    
    js_code = '''
    function keepAlive() {
        setInterval(() => {
            // Simulate activity
            document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Shift'}));
            console.log('Keeping alive at ' + new Date().toISOString());
        }, 60000);  // Every minute
    }
    keepAlive();
    '''
    
    display(Javascript(js_code))
    print("🛡️ Keep-alive script injected")

def install_dependencies():
    """Install required packages for LLM training"""
    print("📦 Installing dependencies...")
    
    packages = [
        'torch==2.1.0',
        'transformers>=4.36.0',
        'accelerate>=0.25.0',
        'peft>=0.7.0',
        'bitsandbytes>=0.41.0',
        'datasets>=2.14.0',
        'trl>=0.7.0',
        'wandb',
        'sentencepiece',
        'protobuf'
    ]
    
    for pkg in packages:
        os.system(f'pip install -q {pkg}')
    
    print("✅ Dependencies installed")

def load_model_for_training(model_name: str, use_qlora: bool = True):
    """Load model with optimizations for Colab T4"""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    
    print(f"🤖 Loading {model_name}...")
    
    if use_qlora:
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
            trust_remote_code=True
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True
        )
    
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    
    if use_qlora:
        model = prepare_model_for_kbit_training(model)
    
    print("✅ Model loaded")
    return model, tokenizer

def setup_lora_config(rank: int = 64, alpha: int = 16, dropout: float = 0.1):
    """Configure LoRA for efficient fine-tuning"""
    from peft import LoraConfig
    
    return LoraConfig(
        r=rank,
        lora_alpha=alpha,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        lora_dropout=dropout,
        bias="none",
        task_type="CAUSAL_LM"
    )

class CheckpointManager:
    """Manage training checkpoints with automatic saving"""
    
    def __init__(self, checkpoint_dir: str, save_every_n_steps: int = 500):
        self.checkpoint_dir = checkpoint_dir
        self.save_every = save_every_n_steps
        self.last_save = 0
        
    def should_save(self, step: int) -> bool:
        return step - self.last_save >= self.save_every
    
    def save(self, model, tokenizer, step: int, epoch: int):
        """Save checkpoint to Drive"""
        checkpoint_path = f"{self.checkpoint_dir}/checkpoint-step-{step}"
        os.makedirs(checkpoint_path, exist_ok=True)
        
        model.save_pretrained(checkpoint_path)
        tokenizer.save_pretrained(checkpoint_path)
        
        # Save metadata
        metadata = {
            'step': step,
            'epoch': epoch,
            'timestamp': datetime.now().isoformat()
        }
        
        with open(f"{checkpoint_path}/metadata.json", 'w') as f:
            json.dump(metadata, f)
        
        self.last_save = step
        print(f"💾 Checkpoint saved: {checkpoint_path}")
    
    def load_latest(self, model, tokenizer):
        """Load most recent checkpoint"""
        checkpoints = [
            d for d in os.listdir(self.checkpoint_dir)
            if d.startswith('checkpoint-step-')
        ]
        
        if not checkpoints:
            return None
        
        # Sort by step number
        latest = sorted(checkpoints, key=lambda x: int(x.split('-')[-1]))[-1]
        checkpoint_path = f"{self.checkpoint_dir}/{latest}"
        
        print(f"📂 Loading checkpoint: {latest}")
        
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, checkpoint_path)
        
        with open(f"{checkpoint_path}/metadata.json", 'r') as f:
            metadata = json.load(f)
        
        return model, metadata

def train_with_persistence(
    model,
    tokenizer,
    dataset,
    checkpoint_manager: CheckpointManager,
    num_epochs: int = 3,
    batch_size: int = 1,
    gradient_accumulation: int = 8
):
    """Training loop with automatic checkpointing"""
    from transformers import TrainingArguments, Trainer
    from trl import SFTTrainer
    
    training_args = TrainingArguments(
        output_dir="./temp_output",
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation,
        warmup_steps=100,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        optim="paged_adamw_8bit",
        lr_scheduler_type="cosine",
        report_to="none"
    )
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        args=training_args,
        max_seq_length=2048
    )
    
    # Add checkpoint callback
    original_save = trainer.save_model
    
    def save_with_metadata(output_dir, **_):
        original_save(output_dir)
        step = trainer.state.global_step
        if checkpoint_manager.should_save(step):
            checkpoint_manager.save(model, tokenizer, step, trainer.state.epoch)
    
    trainer.save_model = save_with_metadata
    
    print("🏋️ Starting training...")
    trainer.train()
    
    # Final save
    checkpoint_manager.save(
        model, tokenizer,
        trainer.state.global_step,
        trainer.state.epoch
    )
    
    return trainer

def resume_training(
    model_name: str,
    checkpoint_manager: CheckpointManager,
    dataset
):
    """Resume training from last checkpoint"""
    model, tokenizer = load_model_for_training(model_name)
    
    # Try to load checkpoint
    result = checkpoint_manager.load_latest(model, tokenizer)
    
    if result:
        model, metadata = result
        start_epoch = metadata.get('epoch', 0)
        print(f"Resuming from epoch {start_epoch}")
    else:
        print("No checkpoint found, starting fresh")
    
    return train_with_persistence(model, tokenizer, dataset, checkpoint_manager)

# Main execution
def main():
    """Main Colab training workflow"""
    print("=" * 50)
    print("Superior Free LLM - Colab Training")
    print("=" * 50)
    
    # Setup
    paths = setup_colab_environment()
    keep_alive()
    install_dependencies()
    
    # Configuration
    MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"
    DATASET_NAME = "tatsu-lab/alpaca"
    
    # Load model
    model, tokenizer = load_model_for_training(MODEL_NAME)
    
    # Setup LoRA
    lora_config = setup_lora_config()
    model = get_peft_model(model, lora_config)
    
    # Load dataset
    from datasets import load_dataset
    dataset = load_dataset(DATASET_NAME, split="train[:1000]")
    
    # Setup checkpointing
    checkpoint_manager = CheckpointManager(
        paths['checkpoint_dir'],
        save_every_n_steps=500
    )
    
    # Train
    trainer = train_with_persistence(
        model, tokenizer, dataset,
        checkpoint_manager
    )
    
    print("✅ Training complete!")

if __name__ == "__main__":
    main()
