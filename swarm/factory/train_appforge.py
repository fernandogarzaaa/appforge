"""
OPERATION IRON BRAIN — TASK 3: TRAINING INFRASTRUCTURE (HITCHHIKE EXTRACTION)
Phase 63

Fine-tunes Llama-3.2-3B on the "Golden Data" harvested from external teachers.
Enforces Sovereign Axioms via data filtering (upstream) and SFT.

Usage:
    python swarm/factory/train_appforge.py
"""

import argparse
import os
import sys
import json
from pathlib import Path

# 🛑 WINDOWS PATCH: Disable Dynamo
import torch
def no_op_compile(model=None, *args, **kwargs):
    return model if model else lambda x: x
torch.compile = no_op_compile

def parse_args():
    parser = argparse.ArgumentParser(description="AppForge Sovereign Trainer v1.0")
    parser.add_argument("--dataset", type=str, default="swarm/factory/dataset/refined_dataset.jsonl",
                       help="Path to Golden Data (Refined Harvest)")
    parser.add_argument("--base-model", type=str, default="unsloth/Llama-3.2-3B-Instruct",
                       help="Base model to fine-tune")
    parser.add_argument("--output-dir", type=str, default="swarm/factory/models/hitchhiker-v1",
                       help="Directory to save the trained model")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--max-seq-length", type=int, default=2048)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()

def load_dataset(path: str):
    from datasets import Dataset
    if not os.path.exists(path):
        print(f"❌ Dataset not found: {path}")
        print("Run 'harvester.ts' and 'quantum_validator.ts' first.")
        sys.exit(1)
        
    entries = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                entries.append(json.loads(line))
    
    print(f"✅ Loaded {len(entries)} golden examples from {path}")
    return Dataset.from_list(entries)

def format_alpaca(example):
    # Standard Alpaca format
    return {
        "text": f"""### Instruction:
{example['instruction']}

### Input:
{example['input']}

### Response:
{example['output']}"""
    }

def train(args):
    print("🧠 Starting AppForge Sovereign Training...")
    
    from unsloth import FastLanguageModel
    from trl import SFTTrainer
    from transformers import TrainingArguments

    # Load Model
    print("🔥 Loading Base Model (4-bit QLoRA)...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.base_model,
        max_seq_length=args.max_seq_length,
        load_in_4bit=True,
    )

    # Add LoRA
    print("🧬 Applying LoRA Adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_r,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                         "gate_proj", "up_proj", "down_proj"],
        lora_alpha=args.lora_alpha,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing=True,
    )

    # Prepare Dataset
    dataset = load_dataset(args.dataset)
    dataset = dataset.map(format_alpaca)

    # Training Args
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        fp16=True,
        torch_compile=False,
        logging_steps=1,
        save_strategy="no", # Avoid Windows I/O issues for small runs
        optim="adamw_8bit",
        seed=42,
        report_to="none"
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        args=training_args,
    )

    if args.dry_run:
        print("🔍 DRY RUN: Setup complete. Exiting.")
        return

    # Train
    print("🏋️ Training...")
    trainer.train()
    
    # Save
    print(f"💾 Saving adapter to {args.output_dir}...")
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print("✅ Training Complete.")

if __name__ == "__main__":
    train(parse_args())
