"""
Meta-Learning Implementation for Self-Evolving AI

This module implements core meta-learning algorithms enabling AI systems
to learn how to learn, enabling rapid adaptation and self-improvement.

Components:
- MAML: Model-Agnostic Meta-Learning
- HyperNetworks: Dynamic weight generation
- Self-Referential Layers: Recursive self-modification
- Adaptive Learning Rate Systems
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.autograd import grad
from typing import List, Tuple, Dict, Optional, Callable
from dataclasses import dataclass
from abc import ABC, abstractmethod
import copy
import numpy as np


# =============================================================================
# Configuration & Data Structures
# =============================================================================

@dataclass
class MetaLearningConfig:
    """Configuration for meta-learning systems."""
    inner_lr: float = 0.01          # Learning rate for task adaptation
    outer_lr: float = 0.001         # Meta-learning rate
    inner_steps: int = 5            # Gradient steps in inner loop
    first_order: bool = False       # Use first-order approximation
    meta_batch_size: int = 4        # Tasks per meta-update
    
    # Hypernetwork config
    hypernet_hidden_dim: int = 256
    hypernet_num_layers: int = 2
    
    # Self-referential config
    self_ref_lr: float = 0.001
    modification_scale: float = 0.01


@dataclass
class Task:
    """Represents a meta-learning task."""
    support_x: torch.Tensor
    support_y: torch.Tensor
    query_x: torch.Tensor
    query_y: torch.Tensor
    task_id: Optional[int] = None


# =============================================================================
# Base Classes
# =============================================================================

class MetaLearner(nn.Module, ABC):
    """Abstract base class for meta-learning algorithms."""
    
    @abstractmethod
    def adapt(self, task: Task) -> nn.Module:
        """Adapt to a new task using support set."""
        pass
    
    @abstractmethod
    def meta_update(self, tasks: List[Task]) -> Dict[str, float]:
        """Perform meta-update across tasks."""
        pass


class ParameterizedModel(nn.Module):
    """Base model that can be used with meta-learning."""
    
    def __init__(self, input_dim: int, output_dim: int, hidden_dims: List[int] = [128, 128]):
        super().__init__()
        
        layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.ReLU())
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, output_dim))
        
        self.network = nn.Sequential(*layers)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)
    
    def clone(self) -> 'ParameterizedModel':
        """Create a detached clone for task-specific adaptation."""
        clone = copy.deepcopy(self)
        return clone


# =============================================================================
# MAML Implementation
# =============================================================================

class MAML(MetaLearner):
    """
    Model-Agnostic Meta-Learning (MAML) implementation.
    
    Learns model parameters that can be quickly adapted to new tasks
    with just a few gradient steps.
    
    Reference: Finn et al., "Model-Agnostic Meta-Learning for Fast Adaptation 
               of Deep Networks", ICML 2017
    """
    
    def __init__(
        self,
        model: nn.Module,
        config: MetaLearningConfig = None
    ):
        super().__init__()
        self.config = config or MetaLearningConfig()
        self.model = model
        self.meta_optimizer = torch.optim.Adam(
            self.model.parameters(),
            lr=self.config.outer_lr
        )
        
    def adapt(self, task: Task) -> nn.Module:
        """
        Inner loop: Adapt model to a specific task.
        
        Args:
            task: Task containing support and query sets
            
        Returns:
            Adapted model for this task
        """
        # Clone model for task-specific adaptation
        adapted_model = copy.deepcopy(self.model)
        adapted_params = list(adapted_model.parameters())
        
        # Inner loop: Take gradient steps on support set
        for step in range(self.config.inner_steps):
            support_pred = adapted_model(task.support_x)
            support_loss = F.cross_entropy(support_pred, task.support_y)
            
            # Compute gradients
            grads = torch.autograd.grad(
                support_loss,
                adapted_params,
                create_graph=not self.config.first_order
            )
            
            # Manual SGD update
            for param, grad in zip(adapted_params, grads):
                param.data = param.data - self.config.inner_lr * grad
                
        return adapted_model
    
    def meta_update(self, tasks: List[Task]) -> Dict[str, float]:
        """
        Outer loop: Update meta-parameters across tasks.
        
        Args:
            tasks: Batch of tasks for meta-learning
            
        Returns:
            Metrics dictionary
        """
        meta_loss = 0.0
        task_losses = []
        
        for task in tasks:
            # Adapt to task
            adapted_model = self.adapt(task)
            
            # Evaluate on query set
            query_pred = adapted_model(task.query_x)
            query_loss = F.cross_entropy(query_pred, task.query_y)
            
            meta_loss += query_loss
            task_losses.append(query_loss.item())
        
        # Average loss across tasks
        meta_loss = meta_loss / len(tasks)
        
        # Meta-optimization step
        self.meta_optimizer.zero_grad()
        meta_loss.backward()
        self.meta_optimizer.step()
        
        return {
            'meta_loss': meta_loss.item(),
            'mean_task_loss': np.mean(task_losses),
            'std_task_loss': np.std(task_losses)
        }
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through current meta-parameters."""
        return self.model(x)


# =============================================================================
# HyperNetwork Implementation
# =============================================================================

class HyperNetwork(nn.Module):
    """
    HyperNetwork that generates weights for a target network.
    
    Enables dynamic network configuration based on task context,
    allowing the model to specialize without manual architecture search.
    
    Reference: Ha et al., "HyperNetworks", ICLR 2017
    """
    
    def __init__(
        self,
        target_network: nn.Module,
        context_dim: int,
        config: MetaLearningConfig = None
    ):
        super().__init__()
        self.config = config or MetaLearningConfig()
        self.target_network = target_network
        self.context_dim = context_dim
        
        # Calculate total parameters in target network
        self.target_param_shapes = []
        self.target_param_numels = []
        total_params = 0
        
        for param in target_network.parameters():
            self.target_param_shapes.append(param.shape)
            self.target_param_numels.append(param.numel())
            total_params += param.numel()
        
        self.total_target_params = total_params
        
        # Build hypernetwork
        layers = []
        input_dim = context_dim
        for i in range(self.config.hypernet_num_layers):
            layers.append(nn.Linear(input_dim, self.config.hypernet_hidden_dim))
            layers.append(nn.ReLU())
            input_dim = self.config.hypernet_hidden_dim
        
        # Final layer outputs all target network parameters
        layers.append(nn.Linear(input_dim, total_params))
        
        self.weight_generator = nn.Sequential(*layers)
        
    def generate_weights(self, context: torch.Tensor) -> List[torch.Tensor]:
        """
        Generate target network weights from context.
        
        Args:
            context: Task embedding or conditioning information
            
        Returns:
            List of weight tensors matching target network structure
        """
        flat_weights = self.weight_generator(context)
        
        # Reshape into target network parameter shapes
        weights = []
        offset = 0
        for shape, numel in zip(self.target_param_shapes, self.target_param_numels):
            w = flat_weights[:, offset:offset + numel].view(-1, *shape)
            weights.append(w.squeeze(0) if w.size(0) == 1 else w)
            offset += numel
            
        return weights
    
    def forward_with_generated_weights(
        self,
        x: torch.Tensor,
        context: torch.Tensor
    ) -> torch.Tensor:
        """
        Forward pass using dynamically generated weights.
        
        Args:
            x: Input data
            context: Task context for weight generation
            
        Returns:
            Network output
        """
        weights = self.generate_weights(context)
        
        # Apply weights manually to target network
        return self._manual_forward(x, weights)
    
    def _manual_forward(self, x: torch.Tensor, weights: List[torch.Tensor]) -> torch.Tensor:
        """Manual forward pass with custom weights."""
        # This is a simplified example - full implementation would
        # need to match the exact architecture of target_network
        weight_idx = 0
        for module in self.target_network.modules():
            if isinstance(module, nn.Linear):
                w = weights[weight_idx]
                b = weights[weight_idx + 1] if weight_idx + 1 < len(weights) else None
                x = F.linear(x, w, b)
                weight_idx += 2
            elif isinstance(module, nn.ReLU):
                x = F.relu(x)
        return x


class TaskConditionalNetwork(nn.Module):
    """
    Network that adapts its weights based on task embedding.
    Combines hypernetworks with task-specific conditioning.
    """
    
    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        task_embedding_dim: int = 64,
        hidden_dim: int = 128
    ):
        super().__init__()
        
        self.task_embedding = nn.Embedding(1000, task_embedding_dim)  # Support 1000 tasks
        
        # Base network architecture definition
        self.layer_sizes = [input_dim, hidden_dim, hidden_dim, output_dim]
        
        # Hypernetwork generates layer-specific weights
        self.hypernets = nn.ModuleList([
            nn.Sequential(
                nn.Linear(task_embedding_dim, hidden_dim),
                nn.ReLU(),
                nn.Linear(hidden_dim, in_size * out_size + out_size)
            )
            for in_size, out_size in zip(self.layer_sizes[:-1], self.layer_sizes[1:])
        ])
        
    def get_task_weights(self, task_id: int) -> List[Tuple[torch.Tensor, torch.Tensor]]:
        """Generate weights for a specific task."""
        task_emb = self.task_embedding(torch.tensor([task_id]))
        
        weights = []
        for hypernet, (in_size, out_size) in zip(self.hypernets, 
                                                   zip(self.layer_sizes[:-1], 
                                                       self.layer_sizes[1:])):
            params = hypernet(task_emb).squeeze()
            w = params[:in_size * out_size].view(out_size, in_size)
            b = params[in_size * out_size:]
            weights.append((w, b))
            
        return weights
    
    def forward(self, x: torch.Tensor, task_id: int) -> torch.Tensor:
        """Forward pass with task-specific weights."""
        weights = self.get_task_weights(task_id)
        
        for i, (w, b) in enumerate(weights):
            x = F.linear(x, w, b)
            if i < len(weights) - 1:
                x = F.relu(x)
                
        return x


# =============================================================================
# Self-Referential Networks
# =============================================================================

class SelfReferentialLayer(nn.Module):
    """
    A neural network layer that can modify its own weights.
    
    Implements self-referential mechanisms where the network learns
to update itself based on performance feedback.
    """
    
    def __init__(
        self,
        in_features: int,
        out_features: int,
        config: MetaLearningConfig = None
    ):
        super().__init__()
        self.config = config or MetaLearningConfig()
        self.in_features = in_features
        self.out_features = out_features
        
        # Primary weights
        self.weight = nn.Parameter(torch.randn(out_features, in_features) * 0.01)
        self.bias = nn.Parameter(torch.zeros(out_features))
        
        # Self-modification network
        # Takes input/output statistics and produces weight updates
        mod_input_dim = in_features + out_features + 2  # +2 for loss and step info
        self.modifier = nn.Sequential(
            nn.Linear(mod_input_dim, hidden_dim := 64),
            nn.ReLU(),
            nn.Linear(hidden_dim, out_features * in_features + out_features)
        )
        
        # Modification accumulator
        self.register_buffer('accumulated_modification', 
                           torch.zeros(out_features * in_features + out_features))
        self.modification_count = 0
        
    def forward(self, x: torch.Tensor, loss: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Forward pass with optional self-modification signal.
        
        Args:
            x: Input tensor [batch_size, in_features]
            loss: Optional loss scalar for guided modification
            
        Returns:
            Output tensor [batch_size, out_features]
        """
        # Standard linear transformation
        out = F.linear(x, self.weight, self.bias)
        
        # Compute self-modification signal during training
        if self.training and loss is not None:
            with torch.no_grad():
                # Compute statistics
                input_stats = x.mean(dim=0)
                output_stats = out.mean(dim=0)
                
                # Build context vector
                step_info = torch.tensor([
                    loss.item() if loss is not None else 0.0,
                    float(self.modification_count)
                ], device=x.device)
                
                context = torch.cat([input_stats, output_stats, step_info])
                
                # Generate modification
                modification = self.modifier(context)
                
                # Accumulate
                self.accumulated_modification += modification
                self.modification_count += 1
        
        return out
    
    def apply_self_modification(self):
        """
        Apply accumulated self-modifications to weights.
        Should be called after each batch/episode.
        """
        if self.modification_count == 0:
            return
        
        # Average modifications
        avg_modification = self.accumulated_modification / self.modification_count
        avg_modification *= self.config.modification_scale
        
        # Split into weight and bias updates
        w_size = self.out_features * self.in_features
        delta_w = avg_modification[:w_size].view(self.out_features, self.in_features)
        delta_b = avg_modification[w_size:w_size + self.out_features]
        
        # Apply updates
        self.weight.data += delta_w
        self.bias.data += delta_b
        
        # Reset accumulator
        self.accumulated_modification.zero_()
        self.modification_count = 0


class SelfModifyingNetwork(nn.Module):
    """
    Complete network composed of self-referential layers.
    """
    
    def __init__(
        self,
        layer_dims: List[int],
        config: MetaLearningConfig = None
    ):
        super().__init__()
        self.config = config or MetaLearningConfig()
        
        self.layers = nn.ModuleList([
            SelfReferentialLayer(in_d, out_d, config)
            for in_d, out_d in zip(layer_dims[:-1], layer_dims[1:])
        ])
        
    def forward(self, x: torch.Tensor, loss: Optional[torch.Tensor] = None) -> torch.Tensor:
        for layer in self.layers[:-1]:
            x = layer(x, loss)
            x = F.relu(x)
        
        # Final layer without activation
        x = self.layers[-1](x, loss)
        return x
    
    def apply_modifications(self):
        """Apply accumulated modifications to all layers."""
        for layer in self.layers:
            layer.apply_self_modification()


# =============================================================================
# Adaptive Learning Rate Systems
# =============================================================================

class AdaptiveLearningRate(nn.Module):
    """
    Learned learning rate scheduler.
    
    Uses meta-learning to predict optimal learning rates
    based on gradient history and loss landscape.
    """
    
    def __init__(
        self,
        param_groups: int = 1,
        history_length: int = 10,
        hidden_dim: int = 32
    ):
        super().__init__()
        self.history_length = history_length
        
        # LSTM processes gradient/loss history
        self.lstm = nn.LSTM(
            input_size=3,  # [loss, grad_norm, improvement]
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True
        )
        
        # Output: learning rate multiplier
        self.predictor = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, param_groups),
            nn.Softplus()  # Ensure positive output
        )
        
        self.history = []
        
    def update_history(
        self,
        loss: float,
        grad_norm: float,
        improvement: float
    ):
        """Add new measurement to history."""
        self.history.append([loss, grad_norm, improvement])
        if len(self.history) > self.history_length:
            self.history.pop(0)
    
    def get_lr_multiplier(self) -> torch.Tensor:
        """Predict learning rate multiplier based on history."""
        if len(self.history) < 2:
            return torch.ones(1)
        
        # Pad if necessary
        hist = self.history + [[0, 0, 0]] * (self.history_length - len(self.history))
        hist_tensor = torch.tensor(hist, dtype=torch.float32).unsqueeze(0)
        
        lstm_out, _ = self.lstm(hist_tensor)
        multiplier = self.predictor(lstm_out[:, -1, :])
        
        return multiplier.squeeze()


class MetaOptimizer:
    """
    Optimizer that meta-learns update rules.
    
    Implements learned optimizers that can adapt their
    behavior based on the specific optimization landscape.
    """
    
    def __init__(
        self,
        params,
        lr: float = 0.01,
        meta_lr: float = 0.001
    ):
        self.params = list(params)
        self.lr = lr
        self.meta_lr = meta_lr
        
        # Meta-learned momentum coefficients
        self.momentum_params = [
            nn.Parameter(torch.zeros_like(p))
            for p in self.params
        ]
        
        # Second moment estimates (like Adam)
        self.v = [torch.zeros_like(p) for p in self.params]
        self.beta1 = 0.9
        self.beta2 = 0.999
        self.t = 0
        
        # Meta-optimizer for momentum parameters
        self.meta_optimizer = torch.optim.Adam(
            self.momentum_params,
            lr=meta_lr
        )
        
    def step(self, grads: List[torch.Tensor], loss: torch.Tensor):
        """
        Optimization step with meta-learned momentum.
        
        Args:
            grads: Gradients for each parameter
            loss: Loss tensor for meta-learning
        """
        self.t += 1
        
        for i, (param, grad, m_param, v) in enumerate(
            zip(self.params, grads, self.momentum_params, self.v)
        ):
            # Meta-learned momentum
            m = self.beta1 * m_param + (1 - self.beta1) * grad
            v_new = self.beta2 * v + (1 - self.beta2) * (grad ** 2)
            
            # Bias correction
            m_hat = m / (1 - self.beta1 ** self.t)
            v_hat = v_new / (1 - self.beta2 ** self.t)
            
            # Update parameter
            update = self.lr * m_hat / (torch.sqrt(v_hat) + 1e-8)
            param.data -= update
            
            # Store second moment
            self.v[i] = v_new.detach()
        
        # Meta-update: improve momentum parameters
        self.meta_optimizer.zero_grad()
        # Simplified meta-loss: we want to minimize future loss
        loss.backward(retain_graph=True)
        self.meta_optimizer.step()


# =============================================================================
# Meta-Learning Training Loop
# =============================================================================

class MetaLearningTrainer:
    """
    Training orchestrator for meta-learning systems.
    """
    
    def __init__(
        self,
        meta_learner: MetaLearner,
        task_sampler: Callable[[], Task],
        config: MetaLearningConfig = None
    ):
        self.meta_learner = meta_learner
        self.task_sampler = task_sampler
        self.config = config or MetaLearningConfig()
        self.history = []
        
    def train_step(self) -> Dict[str, float]:
        """Single meta-training step."""
        # Sample batch of tasks
        tasks = [self.task_sampler() for _ in range(self.config.meta_batch_size)]
        
        # Meta-update
        metrics = self.meta_learner.meta_update(tasks)
        self.history.append(metrics)
        
        return metrics
    
    def train(self, num_iterations: int, log_interval: int = 100):
        """Full training loop."""
        for iteration in range(num_iterations):
            metrics = self.train_step()
            
            if iteration % log_interval == 0:
                print(f"Iteration {iteration}: {metrics}")
        
        return self.history
    
    def evaluate(self, test_tasks: List[Task]) -> Dict[str, float]:
        """Evaluate on test tasks."""
        accuracies = []
        
        for task in test_tasks:
            # Adapt to task
            adapted_model = self.meta_learner.adapt(task)
            
            # Evaluate on query set
            with torch.no_grad():
                logits = adapted_model(task.query_x)
                preds = logits.argmax(dim=-1)
                accuracy = (preds == task.query_y).float().mean().item()
                accuracies.append(accuracy)
        
        return {
            'mean_accuracy': np.mean(accuracies),
            'std_accuracy': np.std(accuracies),
            'min_accuracy': np.min(accuracies),
            'max_accuracy': np.max(accuracies)
        }


# =============================================================================
# Example Usage & Testing
# =============================================================================

def create_synthetic_task(
    input_dim: int = 10,
    output_dim: int = 5,
    support_size: int = 20,
    query_size: int = 20
) -> Task:
    """Create a synthetic classification task."""
    # Random classification problem
    support_x = torch.randn(support_size, input_dim)
    support_y = torch.randint(0, output_dim, (support_size,))
    query_x = torch.randn(query_size, input_dim)
    query_y = torch.randint(0, output_dim, (query_size,))
    
    return Task(support_x, support_y, query_x, query_y)


def demo_maml():
    """Demonstrate MAML training."""
    print("=" * 60)
    print("MAML Demo")
    print("=" * 60)
    
    # Setup
    config = MetaLearningConfig(
        inner_lr=0.01,
        outer_lr=0.001,
        inner_steps=5,
        meta_batch_size=4
    )
    
    base_model = ParameterizedModel(input_dim=10, output_dim=5)
    maml = MAML(base_model, config)
    
    # Task sampler
    task_sampler = lambda: create_synthetic_task()
    
    # Train
    trainer = MetaLearningTrainer(maml, task_sampler, config)
    history = trainer.train(num_iterations=1000, log_interval=200)
    
    # Evaluate
    test_tasks = [create_synthetic_task() for _ in range(20)]
    results = trainer.evaluate(test_tasks)
    
    print("\nFinal Evaluation:")
    print(f"  Mean Accuracy: {results['mean_accuracy']:.4f}")
    print(f"  Std Accuracy: {results['std_accuracy']:.4f}")
    
    return maml, results


def demo_hypernetwork():
    """Demonstrate HyperNetwork."""
    print("\n" + "=" * 60)
    print("HyperNetwork Demo")
    print("=" * 60)
    
    # Target network
    target = ParameterizedModel(input_dim=10, output_dim=5, hidden_dims=[32, 32])
    
    # Hypernetwork
    config = MetaLearningConfig(hypernet_hidden_dim=128)
    hypernet = HyperNetwork(target, context_dim=16, config=config)
    
    # Generate task-specific weights
    task_context = torch.randn(1, 16)
    weights = hypernet.generate_weights(task_context)
    
    print(f"Generated {len(weights)} weight tensors")
    print(f"Total parameters: {sum(w.numel() for w in weights)}")
    
    return hypernet


def demo_self_referential():
    """Demonstrate self-referential network."""
    print("\n" + "=" * 60)
    print("Self-Referential Network Demo")
    print("=" * 60)
    
    config = MetaLearningConfig(modification_scale=0.001)
    
    # Create network
    network = SelfModifyingNetwork(
        layer_dims=[10, 64, 64, 5],
        config=config
    )
    
    # Training simulation
    optimizer = torch.optim.Adam(network.parameters(), lr=0.001)
    
    for step in range(100):
        # Forward pass
        x = torch.randn(32, 10)
        target = torch.randint(0, 5, (32,))
        
        logits = network(x, loss=None)
        loss = F.cross_entropy(logits, target)
        
        # Backward and optimize
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # Apply self-modifications
        network.apply_modifications()
        
        if step % 20 == 0:
            print(f"Step {step}: Loss = {loss.item():.4f}")
    
    return network


if __name__ == "__main__":
    # Run demos
    print("Meta-Learning Implementation Demo")
    print("=" * 60)
    
    # MAML
    maml_model, maml_results = demo_maml()
    
    # HyperNetwork
    hypernet = demo_hypernetwork()
    
    # Self-Referential
    self_ref_net = demo_self_referential()
    
    print("\n" + "=" * 60)
    print("All demos completed successfully!")
    print("=" * 60)
