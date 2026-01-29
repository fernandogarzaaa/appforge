/**
 * Performance Benchmarking Module
 * Measure and track performance metrics across project
 */

/**
 * Performance benchmark suite
 */
export class PerformanceBenchmark {
  constructor(name) {
    this.name = name;
    this.measurements = [];
    this.startTime = null;
    this.results = {
      min: Infinity,
      max: -Infinity,
      mean: 0,
      median: 0,
      stdDev: 0,
      count: 0,
      totalTime: 0
    };
  }

  /**
   * Start timing measurement
   */
  start() {
    this.startTime = performance.now();
  }

  /**
   * End timing measurement
   */
  end() {
    if (this.startTime === null) return null;

    const duration = performance.now() - this.startTime;
    this.measurements.push(duration);
    this.updateResults();
    this.startTime = null;

    return duration;
  }

  /**
   * Mark point in time
   */
  mark(label) {
    performance.mark(`${this.name}-${label}`);
  }

  /**
   * Measure between two marks
   */
  measure(label, startMark, endMark) {
    try {
      performance.measure(
        `${this.name}-${label}`,
        `${this.name}-${startMark}`,
        `${this.name}-${endMark}`
      );
      const measure = performance.getEntriesByName(`${this.name}-${label}`)[0];
      return measure ? measure.duration : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Update aggregate results
   */
  updateResults() {
    if (this.measurements.length === 0) return;

    const sorted = [...this.measurements].sort((a, b) => a - b);
    this.results.min = Math.min(...this.measurements);
    this.results.max = Math.max(...this.measurements);
    this.results.count = this.measurements.length;
    this.results.totalTime = this.measurements.reduce((a, b) => a + b, 0);
    this.results.mean = this.results.totalTime / this.results.count;

    // Median
    const mid = Math.floor(sorted.length / 2);
    this.results.median = sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    // Standard deviation
    const variance = this.measurements.reduce((sum, val) => {
      return sum + Math.pow(val - this.results.mean, 2);
    }, 0) / this.results.count;
    this.results.stdDev = Math.sqrt(variance);
  }

  /**
   * Get formatted results
   */
  getResults() {
    return {
      name: this.name,
      ...this.results,
      formattedMean: `${this.results.mean.toFixed(2)}ms`,
      formattedMedian: `${this.results.median.toFixed(2)}ms`,
      formattedMin: `${this.results.min.toFixed(2)}ms`,
      formattedMax: `${this.results.max.toFixed(2)}ms`,
      formattedStdDev: `${this.results.stdDev.toFixed(2)}ms`
    };
  }

  /**
   * Clear measurements
   */
  clear() {
    this.measurements = [];
    this.startTime = null;
    this.results = {
      min: Infinity,
      max: -Infinity,
      mean: 0,
      median: 0,
      stdDev: 0,
      count: 0,
      totalTime: 0
    };
  }
}

/**
 * Benchmark suite manager
 */
export class BenchmarkSuite {
  constructor(name) {
    this.name = name;
    this.benchmarks = new Map();
    this.createdAt = new Date().toISOString();
  }

  /**
   * Create or get benchmark
   */
  benchmark(name) {
    if (!this.benchmarks.has(name)) {
      this.benchmarks.set(name, new PerformanceBenchmark(name));
    }
    return this.benchmarks.get(name);
  }

  /**
   * Get all results
   */
  getAllResults() {
    const results = {};
    this.benchmarks.forEach((bench, name) => {
      results[name] = bench.getResults();
    });
    return results;
  }

  /**
   * Compare benchmarks
   */
  compare(benchmark1, benchmark2) {
    const bench1 = this.benchmarks.get(benchmark1);
    const bench2 = this.benchmarks.get(benchmark2);

    if (!bench1 || !bench2) return null;

    const diff = bench1.results.mean - bench2.results.mean;
    const percentDiff = ((diff / bench2.results.mean) * 100).toFixed(2);

    return {
      benchmark1,
      benchmark2,
      benchmark1Mean: bench1.results.mean,
      benchmark2Mean: bench2.results.mean,
      difference: diff,
      percentDifference: percentDiff,
      faster: diff > 0 ? benchmark2 : benchmark1
    };
  }

  /**
   * Export results
   */
  exportResults() {
    return {
      suite: this.name,
      createdAt: this.createdAt,
      results: this.getAllResults(),
      summary: this.getSummary()
    };
  }

  /**
   * Get summary
   */
  getSummary() {
    const allResults = this.getAllResults();
    return {
      totalBenchmarks: this.benchmarks.size,
      totalMeasurements: Object.values(allResults).reduce((sum, r) => sum + r.count, 0),
      averageTime: (Object.values(allResults).reduce((sum, r) => sum + r.mean, 0) / this.benchmarks.size).toFixed(2)
    };
  }
}

/**
 * Memory profiler
 */
export class MemoryProfiler {
  constructor(name) {
    this.name = name;
    this.snapshots = [];
  }

  /**
   * Take memory snapshot
   */
  snapshot(label) {
    if (performance.memory) {
      this.snapshots.push({
        label,
        timestamp: new Date().toISOString(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      });
    }
  }

  /**
   * Get memory delta between snapshots
   */
  getDelta(startLabel, endLabel) {
    const start = this.snapshots.find(s => s.label === startLabel);
    const end = this.snapshots.find(s => s.label === endLabel);

    if (!start || !end) return null;

    const delta = end.usedJSHeapSize - start.usedJSHeapSize;
    return {
      startLabel,
      endLabel,
      deltaBytes: delta,
      deltaMB: (delta / 1024 / 1024).toFixed(2),
      startMemory: `${(start.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      endMemory: `${(end.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
    };
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return this.snapshots.map(s => ({
      ...s,
      usedJSHeapSizeMB: (s.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalJSHeapSizeMB: (s.totalJSHeapSize / 1024 / 1024).toFixed(2)
    }));
  }
}

/**
 * Throughput benchmark
 */
export function benchmarkThroughput(fn, iterations = 1000) {
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  const opsPerSecond = (iterations / (duration / 1000)).toFixed(2);

  return {
    iterations,
    duration: duration.toFixed(2),
    durationPerOp: (duration / iterations).toFixed(4),
    operationsPerSecond: opsPerSecond
  };
}

/**
 * Network benchmark
 */
export async function benchmarkNetwork(url, method = 'GET') {
  const startTime = performance.now();

  try {
    const response = await fetch(url, { method });
    const endTime = performance.now();

    return {
      url,
      method,
      status: response.status,
      duration: (endTime - startTime).toFixed(2),
      size: response.headers.get('content-length'),
      cached: response.headers.get('cache-control')
    };
  } catch (error) {
    return {
      url,
      method,
      error: error.message
    };
  }
}

/**
 * Save benchmark results to localStorage
 */
export function saveBenchmarkResults(suiteName, results) {
  const key = `appforge_benchmark_${suiteName}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({
    ...results,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(existing));
}

/**
 * Get benchmark history
 */
export function getBenchmarkHistory(suiteName, limit = 100) {
  const key = `appforge_benchmark_${suiteName}`;
  const results = JSON.parse(localStorage.getItem(key) || '[]');
  return results.slice(-limit);
}

/**
 * Analyze benchmark trends
 */
export function analyzeBenchmarkTrends(suiteName) {
  const history = getBenchmarkHistory(suiteName);

  if (history.length < 2) return null;

  const firstResult = history[0];
  const lastResult = history[history.length - 1];

  return {
    suite: suiteName,
    measurements: history.length,
    trend: firstResult.mean < lastResult.mean ? 'degrading' : 'improving',
    performanceChange: ((lastResult.mean - firstResult.mean) / firstResult.mean * 100).toFixed(2),
    firstRun: firstResult.timestamp,
    lastRun: lastResult.timestamp
  };
}
