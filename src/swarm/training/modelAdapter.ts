export interface ModelEvaluationResult {
  qualityScore: number;
  checkpointVersion: number;
}

export interface FineTunePayload {
  datasetVersion: number;
  samples: number;
  seed: number;
}

export interface ModelAdapter {
  evaluate(seed: number): Promise<ModelEvaluationResult>;
  fineTune(payload: FineTunePayload): Promise<ModelEvaluationResult>;
  loadCheckpoint(version: number): Promise<void>;
  saveCheckpoint(version: number): Promise<void>;
}

export class SimulatedModelAdapter implements ModelAdapter {
  private quality = 0.72;
  private checkpointVersion = 0;

  async evaluate(seed: number): Promise<ModelEvaluationResult> {
    const deterministicDelta = ((seed % 13) - 6) * 0.0005;
    const qualityScore = Number(Math.max(0, Math.min(1, this.quality + deterministicDelta)).toFixed(4));
    return { qualityScore, checkpointVersion: this.checkpointVersion };
  }

  async fineTune(payload: FineTunePayload): Promise<ModelEvaluationResult> {
    const gain = Math.min(0.03, payload.samples * 0.0002 + payload.datasetVersion * 0.0001);
    this.quality = Number(Math.max(0, Math.min(1, this.quality + gain)).toFixed(4));
    this.checkpointVersion += 1;
    return { qualityScore: this.quality, checkpointVersion: this.checkpointVersion };
  }

  async loadCheckpoint(version: number): Promise<void> {
    this.checkpointVersion = version;
  }

  async saveCheckpoint(version: number): Promise<void> {
    this.checkpointVersion = version;
  }
}
