"""
OPERATION IRON BRAIN — TASK 2: THE FORGE (v2.0)
2-Stage Training: SFT (Alpaca) → DPO (Preference Optimization)

Hardware Target: RTX 2060 (6GB VRAM)
Method: QLoRA (4-bit quantization + LoRA adapters)
Output: appforge-v1.gguf (Q4_K_M quantization)

Usage:
    conda activate appforge-train
    python swarm/factory/train.py
    python swarm/factory/train.py --max-steps 10 --dry-run   # Smoke test
"""

import argparse
import json
import os
import sys
from pathlib import Path
import torch

# 🛑 WINDOWS PATCH: Forcefully disable torch.compile (Dynamo)
# Unsloth/TRL tries to use it but it fails with graph breaks on Windows
def no_op_compile(model=None, *args, **kwargs):
    if model is None:
        return lambda x: x
    return model

torch.compile = no_op_compile
print("   🛡️ Windows Patch: torch.compile disabled (monkeypatched)")

def parse_args():
    parser = argparse.ArgumentParser(description="Iron Brain Model Forge v2.0")
    parser.add_argument("--dataset", type=str, default="swarm/factory/dataset/sovereign_dataset.jsonl",
                       help="Path to SFT JSONL training dataset")
    parser.add_argument("--dpo-dataset", type=str, default="swarm/factory/dataset/sovereign_dpo.jsonl",
                       help="Path to DPO JSONL preference dataset")
    parser.add_argument("--base-model", type=str, default="unsloth/Llama-3.2-3B-Instruct",
                       help="Base model to fine-tune")
    parser.add_argument("--output-dir", type=str, default="swarm/factory/models",
                       help="Directory to save the trained model")
    parser.add_argument("--epochs", type=int, default=3, help="Number of SFT training epochs")
    parser.add_argument("--dpo-epochs", type=int, default=1, help="Number of DPO training epochs")
    parser.add_argument("--batch-size", type=int, default=2, help="Training batch size")
    parser.add_argument("--grad-accum", type=int, default=4, help="Gradient accumulation steps")
    parser.add_argument("--lr", type=float, default=2e-4, help="SFT learning rate")
    parser.add_argument("--dpo-lr", type=float, default=5e-5, help="DPO learning rate")
    parser.add_argument("--lora-r", type=int, default=16, help="LoRA rank")
    parser.add_argument("--lora-alpha", type=int, default=32, help="LoRA alpha")
    parser.add_argument("--max-seq-length", type=int, default=2048, help="Maximum sequence length")
    parser.add_argument("--max-steps", type=int, default=-1, help="Max training steps (-1 = full)")
    parser.add_argument("--dry-run", action="store_true", help="Validate setup without training")
    parser.add_argument("--skip-sft", action="store_true", help="Skip SFT stage (load existing adapter)")
    parser.add_argument("--skip-dpo", action="store_true", help="Skip DPO stage")
    parser.add_argument("--no-quantize", action="store_true",
                       help="Use 16-bit LoRA instead of 4-bit QLoRA (Windows compatibility)")
    parser.add_argument("--export-gguf", action="store_true", default=True,
                       help="Export to GGUF after training")
    return parser.parse_args()


def check_dependencies():
    """Verify all required packages are installed."""
    missing = []
    try:
        import torch
        print(f"   ✅ PyTorch {torch.__version__}")
        if torch.cuda.is_available():
            print(f"   ✅ CUDA available: {torch.cuda.get_device_name(0)}")
            print(f"   ✅ VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        else:
            print("   ⚠️ CUDA not available — training will be slow on CPU")
    except ImportError:
        missing.append("torch")

    try:
        from unsloth import FastLanguageModel
        print("   ✅ Unsloth")
    except ImportError:
        missing.append("unsloth")

    try:
        from datasets import Dataset
        print("   ✅ datasets")
    except ImportError:
        missing.append("datasets")

    try:
        from trl import SFTTrainer
        print("   ✅ trl (SFTTrainer)")
    except ImportError:
        missing.append("trl")

    try:
        from trl import DPOTrainer
        print("   ✅ trl (DPOTrainer)")
    except ImportError:
        pass  # DPO is optional if --skip-dpo is used

    if missing:
        print(f"\n   ❌ Missing dependencies: {', '.join(missing)}")
        print(f"   Run: pip install {' '.join(missing)}")
        return False
    return True


def load_dataset(path: str):
    """Load Alpaca-format JSONL dataset."""
    from datasets import Dataset

    entries = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))

    print(f"   ✅ Loaded {len(entries)} training examples from {path}")
    return Dataset.from_list(entries)


def format_alpaca(example):
    """Format dataset into Alpaca prompt template."""
    instruction = example.get("instruction", "")
    input_text = example.get("input", "")
    output = example.get("output", "")

    if input_text:
        text = f"""### Instruction:
{instruction}

### Input:
{input_text}

### Response:
{output}"""
    else:
        text = f"""### Instruction:
{instruction}

### Response:
{output}"""

    return {"text": text}


def train_sft(args):
    """Stage 1: SFT (Supervised Fine-Tuning) with Alpaca dataset."""
    from unsloth import FastLanguageModel
    from trl import SFTTrainer
    from transformers import TrainingArguments

    use_4bit = not args.no_quantize
    if use_4bit:
        try:
            import bitsandbytes
            print("\n🔥 Stage 1: SFT — Loading Base Model (4-bit QLoRA)...")
        except ImportError:
            print("   ⚠️ bitsandbytes not available on Windows — falling back to 16-bit LoRA")
            use_4bit = False
    
    if not use_4bit:
        print("\n🔥 Stage 1: SFT — Loading Base Model (16-bit LoRA)...")
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.base_model,
        max_seq_length=args.max_seq_length,
        dtype=None,  # Auto-detect
        load_in_4bit=use_4bit,
    )

    print("\n🧬 Stage 1: Applying LoRA Adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_r,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                         "gate_proj", "up_proj", "down_proj"],
        lora_alpha=args.lora_alpha,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing=True,  # Standard checkpointing (avoid Unsloth Windows graph breaks)
        random_state=42,
    )

    print("\n📚 Stage 1: Loading Sovereign SFT Dataset...")
    dataset = load_dataset(args.dataset)
    dataset = dataset.map(format_alpaca)

    print(f"\n🏋️ Stage 1: SFT Training...")
    print(f"   Epochs: {args.epochs}")
    print(f"   Batch size: {args.batch_size}")
    print(f"   Gradient accumulation: {args.grad_accum}")
    print(f"   Effective batch size: {args.batch_size * args.grad_accum}")
    print(f"   Learning rate: {args.lr}")
    print(f"   LoRA rank: {args.lora_r}, alpha: {args.lora_alpha}")

    os.makedirs(args.output_dir, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        fp16=True,
        torch_compile=False,  # Explicitly disable Dynamo
        logging_steps=10,
        save_strategy="epoch",
        max_steps=args.max_steps if args.max_steps > 0 else -1,
        warmup_ratio=0.05,
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=42,
        report_to="none",
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
        print("\n🔍 DRY RUN — SFT training loop validated. Skipping actual training.")
        return model, tokenizer

    trainer.train()
    print("\n   ✅ SFT Training complete!")

    # Save LoRA adapter
    lora_path = os.path.join(args.output_dir, "appforge-v1-lora")
    model.save_pretrained(lora_path)
    tokenizer.save_pretrained(lora_path)
    print(f"   ✅ LoRA adapter saved to: {lora_path}")

    return model, tokenizer


def train_dpo(model, tokenizer, args):
    """Stage 2: DPO (Direct Preference Optimization) with chosen/rejected pairs."""
    from trl import DPOTrainer, DPOConfig

    dpo_path = args.dpo_dataset
    if not os.path.exists(dpo_path):
        print(f"\n   ⚠️ DPO dataset not found: {dpo_path}")
        print("   Skipping DPO stage.")
        return model, tokenizer

    print("\n⚖️ Stage 2: DPO — Loading Preference Dataset...")
    dpo_dataset = load_dataset(dpo_path)

    print(f"\n🏋️ Stage 2: DPO Training...")
    print(f"   Epochs: {args.dpo_epochs}")
    print(f"   Learning rate: {args.dpo_lr}")
    print(f"   Strategy: Sovereign solutions preferred over cloud-dependent solutions")

    dpo_config = DPOConfig(
        output_dir=os.path.join(args.output_dir, "dpo-checkpoints"),
        num_train_epochs=args.dpo_epochs,
        per_device_train_batch_size=1,  # Smaller batch for DPO (VRAM constraint)
        gradient_accumulation_steps=8,
        learning_rate=args.dpo_lr,
        fp16=True,
        torch_compile=False,           # Disable Dynamo for DPO too
        logging_steps=5,
        save_strategy="no",            # Disable checkpoints to avoid Windows crashes
        warmup_ratio=0.1,
        beta=0.1,  # DPO temperature
        seed=42,
        report_to="none",
        max_steps=args.max_steps if args.max_steps > 0 else -1,
    )

    trainer = DPOTrainer(
        model=model,
        ref_model=None,  # Use implicit reference (save VRAM)
        tokenizer=tokenizer,
        train_dataset=dpo_dataset,
        args=dpo_config,
    )

    if args.dry_run:
        print("\n🔍 DRY RUN — DPO training loop validated. Skipping actual training.")
        return model, tokenizer

    trainer.train()
    print("\n   ✅ DPO Training complete!")
    print("   The model now prefers Sovereign solutions over external-API-dependent ones.")

    # Save DPO adapter explicitly (in case GGUF export fails)
    dpo_lora_path = os.path.join(args.output_dir, "appforge-v1-dpo-lora")
    model.save_pretrained(dpo_lora_path)
    tokenizer.save_pretrained(dpo_lora_path)
    print(f"   ✅ DPO adapter saved to: {dpo_lora_path}")

    return model, tokenizer


def export_gguf(model, tokenizer, args):
    """Export the merged model to GGUF format for llama.cpp inference."""
    print("\n📦 Exporting to GGUF (Q4_K_M)...")

    gguf_path = os.path.join(args.output_dir, "appforge-v1-gguf")
    os.makedirs(gguf_path, exist_ok=True)

    # Unsloth has built-in GGUF export
    model.save_pretrained_gguf(
        gguf_path,
        tokenizer,
        quantization_method="q4_k_m"
    )

    print(f"   ✅ GGUF model exported to: {gguf_path}")

    # Check file size
    for f in Path(gguf_path).glob("*.gguf"):
        size_gb = f.stat().st_size / (1024 ** 3)
        print(f"   📊 {f.name}: {size_gb:.2f} GB")


def main():
    print("🧠 OPERATION IRON BRAIN — THE FORGE v2.0 (SFT + DPO)")
    print("═══════════════════════════════════════════════════\n")

    args = parse_args()

    # Preflight checks
    print("🔍 Checking dependencies...")
    if not check_dependencies():
        sys.exit(1)

    # Check dataset exists
    if not os.path.exists(args.dataset):
        print(f"\n   ❌ Dataset not found: {args.dataset}")
        print("   Run `npx tsx swarm/factory/distill.ts` first to generate the dataset.")
        sys.exit(1)

    model = None
    tokenizer = None

    # Stage 1: SFT
    if not args.skip_sft:
        model, tokenizer = train_sft(args)
    else:
        print("\n⏩ Skipping Stage 1 (SFT) — Loading existing adapter...")
        from unsloth import FastLanguageModel
        sft_path = os.path.join(args.output_dir, "appforge-v1-lora")
        if not os.path.exists(sft_path):
             print(f"❌ SFT adapter not found at {sft_path}. Cannot skip SFT.")
             sys.exit(1)
        
        # Load the SFT adapter
        use_4bit = not args.no_quantize
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=sft_path, # Load the SFT adapter
            max_seq_length=args.max_seq_length,
            load_in_4bit=use_4bit,
        )
        print("   ✅ SFT adapter loaded.")

    # Stage 2: DPO (optional)
    if not args.skip_dpo and not args.dry_run:
        model, tokenizer = train_dpo(model, tokenizer, args)

    # Export
    if args.export_gguf and not args.dry_run:
        export_gguf(model, tokenizer, args)

    print("\n🧠 IRON BRAIN FORGE v2.0: COMPLETE")
    print("═══════════════════════════════════════════════════")
    print(f"   Model: appforge-v1 (SFT" + (" + DPO" if not args.skip_dpo else "") + ")")
    print(f"   Format: GGUF Q4_K_M")
    print(f"   Location: {args.output_dir}")
    print(f"\n   Next: Start inference server:")
    print(f"   llama-server -m {args.output_dir}/appforge-v1-gguf/unsloth.Q4_K_M.gguf -ngl 33 --port 11434")


if __name__ == "__main__":
    main()

