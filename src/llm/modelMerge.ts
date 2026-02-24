/**
 * Model Merging System
 * Implements Model Soup, SLERP, Task Arithmetic, and TIES-Merging
 * 
 * Based on research:
 * - Model Soups (Wortsman et al., 2022)
 * - SLERP for model merging
 * - Task Arithmetic (Ilharco et al., 2022)
 * - TIES-Merging (Yadav et al., 2023)
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

export interface ModelConfig {
  repo: string;
  name: string;
  params: string;
  strengths: string[];
  license: string;
}

export interface TIESConfig {
  density: number;
  weightFormat: 'delta' | 'full';
  signConsensus: 'majority' | 'sum';
}

export interface MergeRecipe {
  name: string;
  description: string;
  method: 'ties' | 'slerp' | 'task_arithmetic' | 'frankenmerge' | 'soup';
  baseModel?: string;
  models?: Array<{
    model: string;
    weight: number;
    taskVector?: boolean;
  }>;
  modelA?: string;
  modelB?: string;
  alpha?: number;
  tiesConfig?: TIESConfig;
  taskVectors?: Array<{
    model: string;
    scalingCoef: number;
  }>;
  layers?: Array<{
    source: string;
    layerRange: [number, number];
    components: string[];
  }>;
}

export class ModelMerger {
  private recipesPath: string;
  private outputDir: string;
  private cacheDir: string;

  constructor(options: {
    recipesPath?: string;
    outputDir?: string;
    cacheDir?: string;
  } = {}) {
    this.recipesPath = options.recipesPath || './model_merge_recipes.json';
    this.outputDir = options.outputDir || './merged_models';
    this.cacheDir = options.cacheDir || './model_cache';
  }

  /**
   * Load merge recipes from JSON file
   */
  loadRecipes(): any {
    const content = fs.readFileSync(this.recipesPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Model Soup: Simple weight averaging
   * Best for combining multiple fine-tuned versions of the same base model
   */
  async modelSoup(
    modelPaths: string[],
    weights?: number[],
    outputName: string = 'soup_merged'
  ): Promise<string> {
    console.log(`🥣 Creating Model Soup from ${modelPaths.length} models...`);

    if (!weights) {
      weights = modelPaths.map(() => 1.0 / modelPaths.length);
    }

    const script = `
import torch
import json
from safetensors.torch import load_file, save_file
from collections import defaultdict

models = ${JSON.stringify(modelPaths)}
weights = ${JSON.stringify(weights)}
output_path = "${path.join(this.outputDir, outputName)}"

print(f"Loading {len(models)} models...")
state_dicts = []
for model_path in models:
    try:
        state_dict = load_file(f"{model_path}/model.safetensors")
        state_dicts.append(state_dict)
    except:
        # Fallback to pytorch bin
        state_dict = torch.load(f"{model_path}/pytorch_model.bin", map_location="cpu")
        state_dicts.append(state_dict)

print("Averaging weights...")
merged = {}
for key in state_dicts[0].keys():
    merged[key] = sum(w * sd[key] for w, sd in zip(weights, state_dicts))

# Save merged model
import os
os.makedirs(output_path, exist_ok=True)
save_file(merged, f"{output_path}/model.safetensors")

# Copy config from first model
import shutil
shutil.copy(f"{models[0]}/config.json", f"{output_path}/config.json")

print(f"✅ Model saved to {output_path}")
`;

    await this.runPythonScript(script);
    return path.join(this.outputDir, outputName);
  }

  /**
   * SLERP: Spherical Linear Interpolation
   * Best for merging two models with different specializations
   */
  async slerp(
    model1Path: string,
    model2Path: string,
    alpha: number = 0.5,
    outputName: string = 'slerp_merged'
  ): Promise<string> {
    console.log(`🔄 Performing SLERP merge (alpha=${alpha})...`);

    const script = `
import torch
import torch.nn.functional as F
from safetensors.torch import load_file, save_file
import os
import shutil

model1_path = "${model1Path}"
model2_path = "${model2Path}"
alpha = ${alpha}
output_path = "${path.join(this.outputDir, outputName)}"

print("Loading models...")
try:
    model1 = load_file(f"{model1_path}/model.safetensors")
    model2 = load_file(f"{model2_path}/model.safetensors")
except:
    model1 = torch.load(f"{model1_path}/pytorch_model.bin", map_location="cpu")
    model2 = torch.load(f"{model2_path}/pytorch_model.bin", map_location="cpu")

print("Applying SLERP...")
merged = {}
for key in model1.keys():
    v1 = model1[key].flatten()
    v2 = model2[key].flatten()
    
    # Normalize vectors
    v1_norm = F.normalize(v1, dim=0)
    v2_norm = F.normalize(v2, dim=0)
    
    # Calculate angle
    dot = torch.clamp(torch.dot(v1_norm, v2_norm), -1.0, 1.0)
    theta = torch.acos(dot)
    
    # SLERP formula
    sin_theta = torch.sin(theta)
    if sin_theta < 1e-6:
        # Fallback to linear interpolation
        merged[key] = (1 - alpha) * model1[key] + alpha * model2[key]
    else:
        w1 = torch.sin((1 - alpha) * theta) / sin_theta
        w2 = torch.sin(alpha * theta) / sin_theta
        merged[key] = (w1 * model1[key] + w2 * model2[key]).reshape(model1[key].shape)

os.makedirs(output_path, exist_ok=True)
save_file(merged, f"{output_path}/model.safetensors")
shutil.copy(f"{model1_path}/config.json", f"{output_path}/config.json")

print(f"✅ SLERP merge complete: {output_path}")
`;

    await this.runPythonScript(script);
    return path.join(this.outputDir, outputName);
  }

  /**
   * Task Arithmetic: Apply task vectors to base model
   * Best for adding capabilities without forgetting
   */
  async taskArithmetic(
    baseModelPath: string,
    fineTunedModels: string[],
    scalingCoef: number = 1.0,
    outputName: string = 'task_arithmetic_merged'
  ): Promise<string> {
    console.log(`➕ Applying Task Arithmetic with ${fineTunedModels.length} task vectors...`);

    const script = `
import torch
from safetensors.torch import load_file, save_file
import os
import shutil

base_path = "${baseModelPath}"
finetuned_paths = ${JSON.stringify(fineTunedModels)}
scaling_coef = ${scalingCoef}
output_path = "${path.join(this.outputDir, outputName)}"

print("Loading base model...")
try:
    base = load_file(f"{base_path}/model.safetensors")
except:
    base = torch.load(f"{base_path}/pytorch_model.bin", map_location="cpu")

print("Computing task vectors...")
task_vectors = []
for ft_path in finetuned_paths:
    try:
        finetuned = load_file(f"{ft_path}/model.safetensors")
    except:
        finetuned = torch.load(f"{ft_path}/pytorch_model.bin", map_location="cpu")
    
    # Task vector = fine-tuned - base
    tv = {k: finetuned[k] - base[k] for k in base.keys()}
    task_vectors.append(tv)

print("Applying task vectors...")
merged = {k: v.clone() for k, v in base.items()}
for tv in task_vectors:
    for key in merged.keys():
        if key in tv:
            merged[key] += scaling_coef * tv[key]

os.makedirs(output_path, exist_ok=True)
save_file(merged, f"{output_path}/model.safetensors")
shutil.copy(f"{base_path}/config.json", f"{output_path}/config.json")

print(f"✅ Task Arithmetic complete: {output_path}")
`;

    await this.runPythonScript(script);
    return path.join(this.outputDir, outputName);
  }

  /**
   * TIES-Merging: State-of-the-art model merging
   * Trim, Elect Sign, and Merge - best for merging >2 models
   */
  async tiesMerging(
    baseModelPath: string,
    fineTunedModels: string[],
    config: TIESConfig = { density: 0.6, weightFormat: 'delta', signConsensus: 'majority' },
    outputName: string = 'ties_merged'
  ): Promise<string> {
    console.log(`🔗 TIES-Merging ${fineTunedModels.length} models (density=${config.density})...`);

    const script = `
import torch
from safetensors.torch import load_file, save_file
import os
import shutil

base_path = "${baseModelPath}"
finetuned_paths = ${JSON.stringify(fineTunedModels)}
density = ${config.density}
output_path = "${path.join(this.outputDir, outputName)}"

print("Loading base model...")
try:
    base = load_file(f"{base_path}/model.safetensors")
except:
    base = torch.load(f"{base_path}/pytorch_model.bin", map_location="cpu")

print("Computing and trimming task vectors...")
task_vectors = []
for ft_path in finetuned_paths:
    try:
        finetuned = load_file(f"{ft_path}/model.safetensors")
    except:
        finetuned = torch.load(f"{ft_path}/pytorch_model.bin", map_location="cpu")
    
    # Compute task vector
    tv = {k: finetuned[k] - base[k] for k in base.keys()}
    
    # Trim: keep only top-k% by magnitude
    all_params = torch.cat([v.flatten().abs() for v in tv.values()])
    k = int(density * len(all_params))
    if k > 0:
        threshold = torch.kthvalue(all_params, len(all_params) - k)[0]
        
        trimmed = {}
        for key, param in tv.items():
            mask = param.abs() >= threshold
            trimmed[key] = param * mask
        task_vectors.append(trimmed)
    else:
        task_vectors.append(tv)

print("Electing signs and merging...")
merged = {k: v.clone() for k, v in base.items()}

for key in merged.keys():
    # Collect all values for this parameter
    values = []
    for tv in task_vectors:
        if key in tv:
            values.append(tv[key])
    
    if values:
        # Stack and compute majority sign
        stacked = torch.stack(values)
        signs = torch.sign(stacked.sum(dim=0))
        
        # Keep only values with agreeing signs
        masked_values = []
        for v in values:
            agree_mask = torch.sign(v) == signs
            masked_values.append(v * agree_mask)
        
        # Average agreeing values
        if masked_values:
            merged[key] += sum(masked_values) / len(masked_values)

os.makedirs(output_path, exist_ok=True)
save_file(merged, f"{output_path}/model.safetensors")
shutil.copy(f"{base_path}/config.json", f"{output_path}/config.json")

print(f"✅ TIES-Merging complete: {output_path}")
`;

    await this.runPythonScript(script);
    return path.join(this.outputDir, outputName);
  }

  /**
   * Frankenmerge: Layer-wise assembly
   * Best for combining different model architectures/capabilities
   */
  async frankenmerge(
    layerConfigs: Array<{
      source: string;
      layerRange: [number, number];
      components: string[];
    }>,
    outputName: string = 'frankenmerged'
  ): Promise<string> {
    console.log(`🧬 Frankenmerging ${layerConfigs.length} layer segments...`);

    const script = `
import torch
from safetensors.torch import load_file, save_file
import os
import shutil
import json

layer_configs = ${JSON.stringify(layerConfigs)}
output_path = "${path.join(this.outputDir, outputName)}"

print("Loading layer segments...")
merged = {}

for config in layer_configs:
    source_path = config['source']
    start_layer, end_layer = config['layer_range']
    components = config['components']
    
    try:
        state_dict = load_file(f"{source_path}/model.safetensors")
    except:
        state_dict = torch.load(f"{source_path}/pytorch_model.bin", map_location="cpu")
    
    # Extract layers in range
    for key, value in state_dict.items():
        # Check if this key belongs to a layer in our range
        import re
        layer_match = re.search(r'layers\\.(\\d+)', key)
        if layer_match:
            layer_num = int(layer_match.group(1))
            if start_layer <= layer_num < end_layer:
                merged[key] = value
        elif 'embed' in key or 'norm' in key or 'lm_head' in key:
            # Keep embedding and head from first config
            if key not in merged:
                merged[key] = value

os.makedirs(output_path, exist_ok=True)
save_file(merged, f"{output_path}/model.safetensors")

# Copy config from first source
shutil.copy(f"{layer_configs[0]['source']}/config.json", f"{output_path}/config.json")

print(f"✅ Frankenmerge complete: {output_path}")
`;

    await this.runPythonScript(script);
    return path.join(this.outputDir, outputName);
  }

  /**
   * Execute a merge recipe from the recipes file
   */
  async executeRecipe(recipeName: string): Promise<string> {
    const recipes = this.loadRecipes();
    const recipe = recipes.merge_recipes.find((r: MergeRecipe) => r.name === recipeName);
    
    if (!recipe) {
      throw new Error(`Recipe '${recipeName}' not found`);
    }

    console.log(`📋 Executing recipe: ${recipe.name}`);
    console.log(`   Description: ${recipe.description}`);

    switch (recipe.method) {
      case 'soup':
        return this.modelSoup(
          recipe.models!.map(m => m.model),
          recipe.models!.map(m => m.weight),
          recipe.name.toLowerCase().replace(/\s+/g, '_')
        );

      case 'slerp':
        return this.slerp(
          recipe.modelA!,
          recipe.modelB!,
          recipe.alpha!,
          recipe.name.toLowerCase().replace(/\s+/g, '_')
        );

      case 'task_arithmetic':
        return this.taskArithmetic(
          recipe.baseModel!,
          recipe.taskVectors!.map(tv => tv.model),
          recipe.taskVectors![0].scalingCoef,
          recipe.name.toLowerCase().replace(/\s+/g, '_')
        );

      case 'ties':
        return this.tiesMerging(
          recipe.baseModel!,
          recipe.models!.map(m => m.model),
          recipe.tiesConfig || { density: 0.6, weightFormat: 'delta', signConsensus: 'majority' },
          recipe.name.toLowerCase().replace(/\s+/g, '_')
        );

      case 'frankenmerge':
        return this.frankenmerge(
          recipe.layers!,
          recipe.name.toLowerCase().replace(/\s+/g, '_')
        );

      default:
        throw new Error(`Unknown merge method: ${recipe.method}`);
    }
  }

  /**
   * Run the complete Superior LLM pipeline
   */
  async runFullPipeline(): Promise<string> {
    console.log('🚀 Starting Superior Free LLM Pipeline...\n');

    // Stage 1: TIES Merge
    console.log('=== Stage 1: TIES Merge ===');
    const stage1Output = await this.executeRecipe('Superior Soup v1 (TIES)');

    // Stage 2: Code Enhancement
    console.log('\n=== Stage 2: Code Enhancement ===');
    const stage2Output = await this.slerp(
      stage1Output,
      'codellama/CodeLlama-7b-Instruct-hf',
      0.65,
      'superior_code_enhanced'
    );

    // Stage 3: Math Enhancement
    console.log('\n=== Stage 3: Math Enhancement ===');
    const stage3Output = await this.taskArithmetic(
      stage2Output,
      ['WizardLM/WizardMath-7B-V1.1'],
      0.5,
      'superior_math_enhanced'
    );

    console.log('\n✅ Pipeline complete!');
    console.log(`Final model: ${stage3Output}`);

    return stage3Output;
  }

  /**
   * Helper to run Python scripts
   */
  private runPythonScript(script: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', script], {
        stdio: 'inherit',
        shell: true
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });
    });
  }
}

// CLI interface
if (require.main === module) {
  const merger = new ModelMerger();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'pipeline':
      merger.runFullPipeline().catch(console.error);
      break;
    case 'recipe':
      const recipeName = args[1];
      if (!recipeName) {
        console.error('Usage: ts-node modelMerge.ts recipe <recipe-name>');
        process.exit(1);
      }
      merger.executeRecipe(recipeName).catch(console.error);
      break;
    case 'list':
      const recipes = merger.loadRecipes();
      console.log('Available recipes:');
      recipes.merge_recipes.forEach((r: MergeRecipe) => {
        console.log(`  - ${r.name} (${r.method})`);
      });
      break;
    default:
      console.log('Model Merging System');
      console.log('Usage:');
      console.log('  ts-node modelMerge.ts pipeline          # Run full pipeline');
      console.log('  ts-node modelMerge.ts recipe <name>     # Execute specific recipe');
      console.log('  ts-node modelMerge.ts list              # List available recipes');
  }
}

export default ModelMerger;
