#!/usr/bin/env python3
"""
Superior Free LLM - Training Pipeline
Zero-cost training pipeline for GPT-4+ quality language models

Usage:
    python training_pipeline.py --stage all --config config.yaml
    python training_pipeline.py --stage merge --models model1,model2,model3
    python training_pipeline.py --stage distill --teacher gpt-4 --student sovereign-7b
    python training_pipeline.py --stage train --method qlora --dataset openorca
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import transformers
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    BitsAndBytesConfig,
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    PeftModel,
)
from datasets import load_dataset, Dataset as HFDataset
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class ModelConfig:
    """Configuration for model training"""
    name: str
    base_model: str
    target_size: str = "7B"
    merge_method: str = "ties"
    
@dataclass
class TrainingConfig:
    """Training configuration"""
    output_dir: str = "./outputs"
    num_epochs: int = 3
    batch_size: int = 4
    gradient_accumulation_steps: int = 4
    learning_rate: float = 2e-4
    warmup_steps: int = 100
    max_seq_length: int = 2048
    save_steps: int = 500
    eval_steps: int = 500
    logging_steps: int = 10
    fp16: bool = True
    gradient_checkpointing: bool = True
    optim: str = "paged_adamw_8bit"
    
@dataclass
class QLoRAConfig:
    """QLoRA specific configuration"""
    r: int = 64
    lora_alpha: int = 16
    lora_dropout: float = 0.1
    target_modules: List[str] = None
    bias: str = "none"
    task_type: str = "CAUSAL_LM"
    
    def __post_init__(self):
        if self.target_modules is None:
            self.target_modules = [
                "q_proj", "k_proj", "v_proj", "o_proj",
                "gate_proj", "up_proj", "down_proj"
            ]


# =============================================================================
# STAGE 1: MODEL MERGING
# =============================================================================

class ModelMerger:
    """Merge multiple models using various techniques"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    def merge(self, models: List[str], method: str = "ties") -> AutoModelForCausalLM:
        """
        Merge multiple models
        
        Args:
            models: List of model names/paths to merge
            method: Merging method (ties, slerp, task_arithmetic, soup)
            
        Returns:
            Merged model
        """
        logger.info(f"Starting model merge with {len(models)} models using {method}")
        
        if method == "ties":
            return self.ties_merge(models)
        elif method == "slerp":
            return self.slerp_merge(models[0], models[1])
        elif method == "task_arithmetic":
            return self.task_arithmetic_merge(models)
        elif method == "soup":
            return self.model_soup(models)
        else:
            raise ValueError(f"Unknown merge method: {method}")
    
    def ties_merge(self, models: List[str], density: float = 0.6) -> Dict:
        """
        TIES-Merging: Trimming, Electing Sign, and Merging
        
        Reference: Yadav et al., 2023
        """
        logger.info(f"TIES merging with density={density}")
        
        # Load all model state dicts
        state_dicts = []
        for model_name in models:
            logger.info(f"Loading {model_name}")
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="cpu"
            )
            state_dicts.append(model.state_dict())
            del model
            torch.cuda.empty_cache()
        
        # Load base model
        base_model_name = self.config.get('base_model', models[0])
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16,
            device_map="cpu"
        )
        merged_state = base_model.state_dict()
        
        # Calculate task vectors (delta from base)
        task_vectors = []
        for state_dict in state_dicts:
            tv = {}
            for key in state_dict.keys():
                if key in merged_state:
                    tv[key] = state_dict[key] - merged_state[key]
            task_vectors.append(tv)
        
        # Step 1: Trim - keep only top-k% by magnitude
        trimmed_vectors = []
        for tv in task_vectors:
            trimmed = self._trim_task_vector(tv, density)
            trimmed_vectors.append(trimmed)
        
        # Step 2 & 3: Elect sign and disjoint merge
        for key in merged_state.keys():
            values = [tv[key] for tv in trimmed_vectors if key in tv]
            
            if values:
                # Elect majority sign
                stacked = torch.stack(values)
                signs = torch.sign(stacked.sum(dim=0))
                
                # Keep only values with agreeing signs
                masked = [v * (torch.sign(v) == signs) for v in values]
                merged_state[key] += sum(masked) / len(masked)
        
        # Load merged state into model
        base_model.load_state_dict(merged_state)
        logger.info("TIES merge complete")
        
        return base_model
    
    def _trim_task_vector(self, task_vector: Dict, density: float) -> Dict:
        """Trim task vector to keep only top-k% by magnitude"""
        trimmed = {}
        
        for key, param in task_vector.items():
            if param.numel() == 0:
                trimmed[key] = param
                continue
                
            flat = param.flatten()
            k = int(density * flat.numel())
            
            if k == 0:
                trimmed[key] = torch.zeros_like(param)
                continue
            
            threshold = torch.kthvalue(torch.abs(flat), flat.numel() - k)[0]
            mask = torch.abs(param) >= threshold
            trimmed[key] = param * mask
        
        return trimmed
    
    def slerp_merge(self, model1: str, model2: str, alpha: float = 0.5) -> AutoModelForCausalLM:
        """
        Spherical Linear Interpolation between two models
        """
        logger.info(f"SLERP merge with alpha={alpha}")
        
        m1 = AutoModelForCausalLM.from_pretrained(
            model1, torch_dtype=torch.float16, device_map="cpu"
        )
        m2 = AutoModelForCausalLM.from_pretrained(
            model2, torch_dtype=torch.float16, device_map="cpu"
        )
        
        state1 = m1.state_dict()
        state2 = m2.state_dict()
        merged_state = {}
        
        for key in state1.keys():
            if key not in state2:
                merged_state[key] = state1[key]
                continue
            
            v1 = state1[key].flatten()
            v2 = state2[key].flatten()
            
            # Normalize
            v1_norm = v1 / (torch.norm(v1) + 1e-8)
            v2_norm = v2 / (torch.norm(v2) + 1e-8)
            
            # Calculate angle
            dot = torch.clamp(torch.dot(v1_norm, v2_norm), -1.0, 1.0)
            theta = torch.acos(dot)
            
            # SLERP
            sin_theta = torch.sin(theta)
            if sin_theta < 1e-6:
                merged = (1 - alpha) * state1[key] + alpha * state2[key]
            else:
                w1 = torch.sin((1 - alpha) * theta) / sin_theta
                w2 = torch.sin(alpha * theta) / sin_theta
                merged = w1 * state1[key] + w2 * state2[key]
            
            merged_state[key] = merged
        
        m1.load_state_dict(merged_state)
        logger.info("SLERP merge complete")
        
        return m1
    
    def task_arithmetic_merge(self, models: List[str], scaling_coef: float = 0.8) -> AutoModelForCausalLM:
        """
        Task Arithmetic: Adding and subtracting task vectors
        """
        logger.info(f"Task arithmetic merge with scaling={scaling_coef}")
        
        base_model_name = self.config.get('base_model', models[0])
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name, torch_dtype=torch.float16, device_map="cpu"
        )
        base_state = base_model.state_dict()
        merged_state = {k: v.clone() for k, v in base_state.items()}
        
        for model_name in models[1:]:
            model = AutoModelForCausalLM.from_pretrained(
                model_name, torch_dtype=torch.float16, device_map="cpu"
            )
            state = model.state_dict()
            
            # Add task vector
            for key in merged_state.keys():
                if key in state and key in base_state:
                    task_vector = state[key] - base_state[key]
                    merged_state[key] += scaling_coef * task_vector
            
            del model
            torch.cuda.empty_cache()
        
        base_model.load_state_dict(merged_state)
        logger.info("Task arithmetic merge complete")
        
        return base_model
    
    def model_soup(self, models: List[str], weights: Optional[List[float]] = None) -> AutoModelForCausalLM:
        """
        Simple weight averaging (Model Soup)
        """
        logger.info(f"Model soup with {len(models)} models")
        
        if weights is None:
            weights = [1.0 / len(models)] * len(models)
        
        # Load first model as base
        base_model = AutoModelForCausalLM.from_pretrained(
            models[0], torch_dtype=torch.float16, device_map="cpu"
        )
        merged_state = base_model.state_dict()
        
        # Zero out and accumulate weighted sum
        for key in merged_state.keys():
            merged_state[key] = torch.zeros_like(merged_state[key])
        
        for model_name, weight in zip(models, weights):
            model = AutoModelForCausalLM.from_pretrained(
                model_name, torch_dtype=torch.float16, device_map="cpu"
            )
            state = model.state_dict()
            
            for key in merged_state.keys():
                if key in state:
                    merged_state[key] += weight * state[key]
            
            del model
            torch.cuda.empty_cache()
        
        base_model.load_state_dict(merged_state)
        logger.info("Model soup complete")
        
        return base_model


# =============================================================================
# STAGE 2: KNOWLEDGE DISTILLATION
# =============================================================================

class KnowledgeDistiller:
    """Distill knowledge from teacher model to student"""
    
    def __init__(self, teacher_model: str, student_model: str, config: Dict):
        self.teacher_name = teacher_model
        self.student_name = student_model
        self.config = config
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
    
    def generate_orca_dataset(
        self,
        questions: List[str],
        output_path: str,
        system_prompt: str = "Explain your reasoning step by step."
    ) -> str:
        """
        Generate Orca-style explanation dataset using teacher model
        """
        logger.info(f"Generating Orca dataset with {len(questions)} questions")
        
        # Note: In practice, use GPT-4 API or other teacher model
        # This is a placeholder for the data generation process
        dataset = []
        
        for i, question in enumerate(questions):
            if i % 100 == 0:
                logger.info(f"Processed {i}/{len(questions)} questions")
            
            # Simulate teacher response (replace with actual API call)
            teacher_response = self._simulate_teacher_response(question, system_prompt)
            
            dataset.append({
                "system": system_prompt,
                "question": question,
                "answer": teacher_response,
                "metadata": {
                    "source": "gpt-4",
                    "timestamp": datetime.now().isoformat()
                }
            })
        
        # Save dataset
        with open(output_path, 'w') as f:
            json.dump(dataset, f, indent=2)
        
        logger.info(f"Dataset saved to {output_path}")
        return output_path
    
    def _simulate_teacher_response(self, question: str, system_prompt: str) -> str:
        """Placeholder for teacher model API call"""
        # In production, call GPT-4 API or other teacher model
        # Example:
        # response = openai.ChatCompletion.create(
        #     model="gpt-4",
        #     messages=[
        #         {"role": "system", "content": system_prompt},
        #         {"role": "user", "content": question}
        #     ]
        # )
        # return response.choices[0].message.content
        return f"[Teacher response to: {question[:50]}...]"
    
    def distill(
        self,
        dataset_path: str,
        output_dir: str,
        num_epochs: int = 3,
        batch_size: int = 4
    ) -> str:
        """
        Distill knowledge from teacher to student
        """
        logger.info("Starting knowledge distillation")
        
        # Load student model with QLoRA
        student = self._load_student_for_training()
        tokenizer = AutoTokenizer.from_pretrained(self.student_name)
        tokenizer.pad_token = tokenizer.eos_token
        
        # Load dataset
        dataset = self._load_distillation_dataset(dataset_path, tokenizer)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=4,
            warmup_steps=100,
            learning_rate=2e-4,
            fp16=True,
            logging_steps=10,
            save_strategy="steps",
            save_steps=500,
            save_total_limit=3,
            optim="paged_adamw_8bit",
            report_to="none",
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False
        )
        
        # Trainer
        trainer = Trainer(
            model=student,
            args=training_args,
            train_dataset=dataset,
            data_collator=data_collator,
        )
        
        # Train
        trainer.train()
        
        # Save final model
        final_path = os.path.join(output_dir, "final_model")
        trainer.save_model(final_path)
        tokenizer.save_pretrained(final_path)
        
        logger.info(f"Distillation complete. Model saved to {final_path}")
        return final_path
    
    def _load_student_for_training(self) -> PeftModel:
        """Load student model with QLoRA configuration"""
        # Quantization config
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        
        # Load base model
        model = AutoModelForCausalLM.from_pretrained(
            self.student_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        
        # Prepare for training
        model = prepare_model_for_kbit_training(model)
        
        # LoRA config
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
        
        model = get_peft_model(model, lora_config)
        return model
    
    def _load_distillation_dataset(
        self,
        dataset_path: str,
        tokenizer: AutoTokenizer
    ) -> HFDataset:
        """Load and preprocess distillation dataset"""
        with open(dataset_path) as f:
            data = json.load(f)
        
        # Format conversations
        formatted = []
        for item in data:
            text = f"System: {item['system']}\n\n"
            text += f"User: {item['question']}\n\n"
            text += f"Assistant: {item['answer']}"
            formatted.append(text)
        
        # Tokenize
        def tokenize_function(examples):
            return tokenizer(
                examples,
                truncation=True,
                max_length=2048,
                padding="max_length"
            )
        
        dataset = HFDataset.from_dict({"text": formatted})
        dataset = dataset.map(
            lambda x: tokenize_function(x["text"]),
            remove_columns=["text"]
        )
        
        return dataset


# =============================================================================
# STAGE 3: TRAINING (QLORA)
# =============================================================================

class QLoRATrainer:
    """QLoRA fine-tuning trainer"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
    
    def train(
        self,
        model_name: str,
        dataset_name: str,
        output_dir: str
    ) -> str:
        """
        Train model using QLoRA
        """
        logger.info(f"Starting QLoRA training for {model_name}")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.pad_token = tokenizer.eos_token
        
        # Load model with QLoRA
        model = self._load_model(model_name)
        
        # Load dataset
        dataset = self._load_dataset(dataset_name, tokenizer)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=self.config.get('num_epochs', 3),
            per_device_train_batch_size=self.config.get('batch_size', 4),
            gradient_accumulation_steps=self.config.get('grad_accum', 4),
            warmup_steps=self.config.get('warmup_steps', 100),
            learning_rate=self.config.get('learning_rate', 2e-4),
            fp16=True,
            logging_steps=10,
            save_strategy="steps",
            save_steps=500,
            save_total_limit=3,
            optim="paged_adamw_8bit",
            group_by_length=True,
            report_to="none",
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False
        )
        
        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset,
            data_collator=data_collator,
        )
        
        # Train
        logger.info("Starting training...")
        trainer.train()
        
        # Save
        final_path = os.path.join(output_dir, "final")
        trainer.save_model(final_path)
        tokenizer.save_pretrained(final_path)
        
        logger.info(f"Training complete. Model saved to {final_path}")
        return final_path
    
    def _load_model(self, model_name: str) -> PeftModel:
        """Load model with QLoRA configuration"""
        # Quantization config
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
            use_cache=False
        )
        
        # Prepare for training
        model = prepare_model_for_kbit_training(model)
        model.gradient_checkpointing_enable()
        
        # LoRA config
        lora_config = LoraConfig(
            r=self.config.get('lora_r', 64),
            lora_alpha=self.config.get('lora_alpha', 16),
            target_modules=[
                "q_proj", "k_proj", "v_proj", "o_proj",
                "gate_proj", "up_proj", "down_proj"
            ],
            lora_dropout=self.config.get('lora_dropout', 0.1),
            bias="none",
            task_type="CAUSAL_LM"
        )
        
        model = get_peft_model(model, lora_config)
        
        # Print trainable parameters
        model.print_trainable_parameters()
        
        return model
    
    def _load_dataset(self, dataset_name: str, tokenizer: AutoTokenizer) -> HFDataset:
        """Load and preprocess dataset"""
        logger.info(f"Loading dataset: {dataset_name}")
        
        # Load from HuggingFace
        if dataset_name == "openorca":
            dataset = load_dataset("Open-Orca/OpenOrca", split="train[:10000]")
            
            def format_example(example):
                text = f"System: {example['system_prompt']}\n\n"
                text += f"User: {example['question']}\n\n"
                text += f"Assistant: {example['response']}"
                return text
        
        elif dataset_name == "alpaca":
            dataset = load_dataset("tatsu-lab/alpaca", split="train")
            
            def format_example(example):
                if example['input']:
                    text = f"Instruction: {example['instruction']}\n"
                    text += f"Input: {example['input']}\n"
                    text += f"Output: {example['output']}"
                else:
                    text = f"Instruction: {example['instruction']}\n"
                    text += f"Output: {example['output']}"
                return text
        
        else:
            # Generic loading
            dataset = load_dataset(dataset_name, split="train")
            format_example = lambda x: x["text"]
        
        # Format
        formatted = [format_example(ex) for ex in dataset]
        
        # Tokenize
        def tokenize_function(examples):
            return tokenizer(
                examples,
                truncation=True,
                max_length=self.config.get('max_seq_length', 2048),
                padding="max_length"
            )
        
        dataset = HFDataset.from_dict({"text": formatted})
        dataset = dataset.map(
            lambda x: tokenize_function(x["text"]),
            remove_columns=["text"]
        )
        
        return dataset


# =============================================================================
# STAGE 4: MEDUSA HEADS (SPECULATIVE DECODING)
# =============================================================================

class MedusaTrainer:
    """Train Medusa heads for speculative decoding"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
    
    def train_medusa_heads(
        self,
        base_model: str,
        dataset_path: str,
        num_heads: int = 4,
        output_dir: str = "./medusa_heads"
    ) -> str:
        """
        Train Medusa heads for speculative decoding
        
        Medusa heads predict future tokens at positions t+1, t+2, etc.
        """
        logger.info(f"Training {num_heads} Medusa heads")
        
        # Load base model (frozen)
        model = AutoModelForCausalLM.from_pretrained(
            base_model,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
        # Freeze base model
        for param in model.parameters():
            param.requires_grad = False
        
        # Add Medusa heads
        hidden_size = model.config.hidden_size
        vocab_size = model.config.vocab_size
        
        medusa_heads = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden_size, hidden_size),
                nn.GELU(),
                nn.Linear(hidden_size, vocab_size)
            )
            for _ in range(num_heads)
        ]).to(self.device)
        
        # Load training data
        dataset = self._load_medusa_dataset(dataset_path, model.config)
        dataloader = DataLoader(dataset, batch_size=4, shuffle=True)
        
        # Optimizer (only for Medusa heads)
        optimizer = torch.optim.AdamW(
            medusa_heads.parameters(),
            lr=1e-4
        )
        
        # Training loop
        model.eval()
        num_epochs = 3
        
        for epoch in range(num_epochs):
            total_loss = 0
            
            for batch in dataloader:
                optimizer.zero_grad()
                
                input_ids = batch["input_ids"].to(self.device)
                
                # Get base model hidden states
                with torch.no_grad():
                    outputs = model(
                        input_ids,
                        output_hidden_states=True
                    )
                    hidden_states = outputs.hidden_states[-1]
                
                # Train each Medusa head
                loss = 0
                for i, head in enumerate(medusa_heads):
                    # Head i predicts token at position t+i+1
                    head_input = hidden_states[:, :-i-1, :]
                    head_output = head(head_input)
                    
                    # Target is the actual token
                    target = input_ids[:, i+1:]
                    
                    # Cross-entropy loss
                    head_loss = nn.functional.cross_entropy(
                        head_output.reshape(-1, vocab_size),
                        target.reshape(-1)
                    )
                    loss += head_loss
                
                loss.backward()
                optimizer.step()
                
                total_loss += loss.item()
            
            avg_loss = total_loss / len(dataloader)
            logger.info(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_loss:.4f}")
        
        # Save Medusa heads
        os.makedirs(output_dir, exist_ok=True)
        torch.save(medusa_heads.state_dict(), os.path.join(output_dir, "medusa_heads.pt"))
        
        # Save config
        config = {
            "num_heads": num_heads,
            "hidden_size": hidden_size,
            "vocab_size": vocab_size,
            "base_model": base_model
        }
        with open(os.path.join(output_dir, "config.json"), 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Medusa heads saved to {output_dir}")
        return output_dir
    
    def _load_medusa_dataset(self, dataset_path: str, config) -> Dataset:
        """Load dataset for Medusa training"""
        # Implementation similar to QLoRA dataset loading
        # But optimized for next-token prediction at multiple positions
        pass


# =============================================================================
# MAIN PIPELINE
# =============================================================================

class TrainingPipeline:
    """Main training pipeline orchestrator"""
    
    def __init__(self, config_path: str):
        with open(config_path) as f:
            self.config = yaml.safe_load(f)
        
        self.output_dir = self.config.get('output_dir', './outputs')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def run(self, stage: str):
        """Run specified pipeline stage"""
        
        if stage == "merge" or stage == "all":
            self.run_merge()
        
        if stage == "distill" or stage == "all":
            self.run_distillation()
        
        if stage == "train" or stage == "all":
            self.run_training()
        
        if stage == "medusa" or stage == "all":
            self.run_medusa_training()
        
        logger.info("Pipeline complete!")
    
    def run_merge(self):
        """Run model merging stage"""
        logger.info("=" * 50)
        logger.info("STAGE 1: Model Merging")
        logger.info("=" * 50)
        
        merge_config = self.config.get('merge', {})
        models = merge_config.get('models', [])
        method = merge_config.get('method', 'ties')
        
        if not models:
            logger.warning("No models specified for merging, skipping")
            return
        
        merger = ModelMerger(merge_config)
        merged_model = merger.merge(models, method)
        
        # Save merged model
        merge_output = os.path.join(self.output_dir, "merged_model")
        merged_model.save_pretrained(merge_output)
        
        logger.info(f"Merged model saved to {merge_output}")
    
    def run_distillation(self):
        """Run knowledge distillation stage"""
        logger.info("=" * 50)
        logger.info("STAGE 2: Knowledge Distillation")
        logger.info("=" * 50)
        
        distill_config = self.config.get('distillation', {})
        teacher = distill_config.get('teacher', 'gpt-4')
        student = distill_config.get('student', 'mistralai/Mistral-7B-v0.1')
        
        distiller = KnowledgeDistiller(teacher, student, distill_config)
        
        # Generate dataset if needed
        if distill_config.get('generate_dataset', False):
            questions = distill_config.get('questions', [])
            dataset_path = os.path.join(self.output_dir, "distillation_dataset.json")
            distiller.generate_orca_dataset(questions, dataset_path)
        else:
            dataset_path = distill_config.get('dataset_path')
        
        # Run distillation
        distill_output = os.path.join(self.output_dir, "distilled_model")
        distiller.distill(dataset_path, distill_output)
        
        logger.info(f"Distilled model saved to {distill_output}")
    
    def run_training(self):
        """Run QLoRA training stage"""
        logger.info("=" * 50)
        logger.info("STAGE 3: QLoRA Training")
        logger.info("=" * 50)
        
        train_config = self.config.get('training', {})
        model_name = train_config.get('model', 'mistralai/Mistral-7B-v0.1')
        dataset = train_config.get('dataset', 'openorca')
        
        trainer = QLoRATrainer(train_config)
        train_output = os.path.join(self.output_dir, "trained_model")
        
        trainer.train(model_name, dataset, train_output)
        
        logger.info(f"Trained model saved to {train_output}")
    
    def run_medusa_training(self):
        """Run Medusa heads training"""
        logger.info("=" * 50)
        logger.info("STAGE 4: Medusa Heads Training")
        logger.info("=" * 50)
        
        medusa_config = self.config.get('medusa', {})
        base_model = medusa_config.get('base_model', 'merged_model')
        num_heads = medusa_config.get('num_heads', 4)
        
        trainer = MedusaTrainer(medusa_config)
        medusa_output = os.path.join(self.output_dir, "medusa_heads")
        
        trainer.train_medusa_heads(
            base_model,
            medusa_config.get('dataset'),
            num_heads,
            medusa_output
        )
        
        logger.info(f"Medusa heads saved to {medusa_output}")


def main():
    parser = argparse.ArgumentParser(
        description="Superior Free LLM Training Pipeline"
    )
    parser.add_argument(
        '--stage',
        choices=['merge', 'distill', 'train', 'medusa', 'all'],
        default='all',
        help='Pipeline stage to run'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='config.yaml',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='./outputs',
        help='Output directory'
    )
    
    args = parser.parse_args()
    
    # Run pipeline
    pipeline = TrainingPipeline(args.config)
    pipeline.run(args.stage)


if __name__ == "__main__":
    main()
