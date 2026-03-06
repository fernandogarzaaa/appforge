import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SwarmTask } from './swarm_task_generator.ts';

const { ciMock, testMock, dependencyMock, optimizerMock } = vi.hoisted(() => ({
  ciMock: vi.fn(() => ({ success: true, log: 'ci' })),
  testMock: vi.fn(() => ({ success: true, log: 'test' })),
  dependencyMock: vi.fn(() => ({ success: true, log: 'deps' })),
  optimizerMock: vi.fn(() => ({ success: true, log: 'opt' }))
}));

vi.mock('./agents/ci_repair_agent.ts', () => ({
  runAgent: ciMock
}));

vi.mock('./agents/test_repair_agent.ts', () => ({
  runAgent: testMock
}));

vi.mock('./agents/dependency_update_agent.ts', () => ({
  runAgent: dependencyMock
}));

vi.mock('./agents/code_optimizer_agent.ts', () => ({
  runAgent: optimizerMock
}));

import { executeTask } from './swarm_task_executor.ts';

function buildTask(overrides: Partial<SwarmTask>): SwarmTask {
  return {
    id: 'task_1',
    signal: 'ci_failure',
    description: 'repair CI pipeline',
    priority: 1,
    severity: 1,
    signal_count: 1,
    signal_details: 'detail',
    urgency_score: 100,
    retries: 0,
    status: 'pending',
    failed_strategies: [],
    created_at: '2026-03-06T00:00:00.000Z',
    updated_at: '2026-03-06T00:00:00.000Z',
    ...overrides
  };
}

describe('swarm_task_executor routing', () => {
  beforeEach(() => {
    ciMock.mockClear();
    testMock.mockClear();
    dependencyMock.mockClear();
    optimizerMock.mockClear();
  });

  it('routes ci_failure signal to CI agent', () => {
    const task = buildTask({ signal: 'ci_failure', description: 'misc text' });

    executeTask(task);

    expect(ciMock).toHaveBeenCalledOnce();
    expect(testMock).not.toHaveBeenCalled();
    expect(dependencyMock).not.toHaveBeenCalled();
    expect(optimizerMock).not.toHaveBeenCalled();
  });

  it('routes test-related signals to test agent', () => {
    executeTask(buildTask({ signal: 'failing_tests' }));
    executeTask(buildTask({ signal: 'missing_tests' }));
    executeTask(buildTask({ signal: 'low_code_coverage' }));

    expect(testMock).toHaveBeenCalledTimes(3);
    expect(ciMock).not.toHaveBeenCalled();
    expect(dependencyMock).not.toHaveBeenCalled();
  });

  it('routes outdated_dependencies signal to dependency agent', () => {
    const task = buildTask({ signal: 'outdated_dependencies' });

    executeTask(task);

    expect(dependencyMock).toHaveBeenCalledOnce();
    expect(ciMock).not.toHaveBeenCalled();
    expect(testMock).not.toHaveBeenCalled();
  });

  it('routes benchmark_regression signal to optimizer agent', () => {
    const task = buildTask({ signal: 'benchmark_regression' });

    executeTask(task);

    expect(optimizerMock).toHaveBeenCalledOnce();
    expect(ciMock).not.toHaveBeenCalled();
    expect(testMock).not.toHaveBeenCalled();
  });

  it('uses description fallback when legacy task has no signal', () => {
    const legacyTask = buildTask({
      signal: undefined as unknown as SwarmTask['signal'],
      description: 'update dependencies now'
    });

    executeTask(legacyTask);

    expect(dependencyMock).toHaveBeenCalledOnce();
    expect(ciMock).not.toHaveBeenCalled();
    expect(testMock).not.toHaveBeenCalled();
    expect(optimizerMock).not.toHaveBeenCalled();
  });
});
