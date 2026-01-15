import { describe, it, expect } from 'vitest';
import type { TestSuite } from '@omaikit/models';

describe('TestSuite Contract', () => {
  it('should match required structure', () => {
    const suite: TestSuite = {
      id: 'ts-1',
      taskId: 'task-1',
      files: [
        {
          path: 'tests/sample.test.ts',
          language: 'typescript',
          framework: 'vitest',
          testCases: [{ name: 'works', type: 'unit' }],
          content: 'describe("sample", () => { it("works", () => {}); });',
        },
      ],
      coverage: 85,
      metadata: { generatedAt: new Date().toISOString() },
    };

    expect(suite.id).toBeDefined();
    expect(suite.taskId).toBeDefined();
    expect(Array.isArray(suite.files)).toBe(true);
    expect(suite.files[0].path).toBeTruthy();
    expect(suite.files[0].content).toBeTruthy();
  });
});
