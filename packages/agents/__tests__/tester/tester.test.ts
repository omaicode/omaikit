/**
 * Unit tests for Tester agent interface
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TesterAgent, TesterAgentInput } from '../../src/tester';
import type { AgentOutput } from '../../src/types';
import type { TestSuite } from '@omaikit/models';

describe('TesterAgent', () => {
  let testerAgent: TesterAgent;

  beforeEach(() => {
    testerAgent = new TesterAgent();
  });

  describe('initialization', () => {
    it('should have correct agent name', () => {
      expect(testerAgent.name).toBe('tester');
    });

    it('should have a valid version', () => {
      expect(testerAgent.version).toBeDefined();
      expect(typeof testerAgent.version).toBe('string');
      expect(testerAgent.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('execute()', () => {
    it('should accept valid input and return output', async () => {
      const mockInput: TesterAgentInput = {
        projectContext: {
          name: 'test-project',
          rootPath: '/test',
          metadata: {
            totalLOC: 1000,
            fileCount: 10,
            languages: ['typescript'],
            conventions: { casing: 'camelCase' },
          },
        },
        plan: null,
        task: {
          id: 'task-1',
          title: 'Generate tests',
          description: 'Create tests for feature',
          type: 'test',
          estimatedEffort: 2,
          acceptanceCriteria: ['Tests cover happy path'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        history: [],
      };

      const output = await testerAgent.execute(mockInput);

      expect(output).toBeDefined();
      expect(output.agentName).toBe('tester');
      expect(output.status).toBe('success');
      expect(output.result).toBeDefined();
      expect(output.timestamp).toBeDefined();
      expect(output.metadata).toBeDefined();
      expect(output.metadata.durationMs).toBeGreaterThan(0);
    });

    it('should reject input with missing required fields', async () => {
      const invalidInput = {} as TesterAgentInput;
      await expect(testerAgent.execute(invalidInput)).rejects.toThrow();
    });

    it('should return TestSuite with valid structure', async () => {
      const mockInput: TesterAgentInput = {
        projectContext: {
          name: 'test-project',
          rootPath: '/test',
          metadata: {
            totalLOC: 1000,
            fileCount: 10,
            languages: ['typescript'],
            conventions: { casing: 'camelCase' },
          },
        },
        plan: null,
        task: {
          id: 'task-2',
          title: 'Generate tests',
          description: 'Create tests for module',
          type: 'test',
          estimatedEffort: 2,
          acceptanceCriteria: ['Tests cover edge cases'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        history: [],
      };

      const output = await testerAgent.execute(mockInput);
      const result = output.result as TestSuite;

      expect(result.id).toBeDefined();
      expect(result.taskId).toBe('task-2');
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('validate()', () => {
    it('should validate successful output', async () => {
      const mockOutput: AgentOutput = {
        agentName: 'tester',
        timestamp: new Date().toISOString(),
        status: 'success',
        result: {
          id: 'ts-1',
          taskId: 'task-1',
          files: [
            {
              path: 'tests/example.test.ts',
              language: 'typescript',
              framework: 'vitest',
              testCases: [{ name: 'works', type: 'unit' }],
              content: 'describe("example", () => { it("works", () => {}); });',
            },
          ],
        },
        metadata: {
          durationMs: 1000,
        },
      };

      const validation = await testerAgent.validate(mockOutput);

      expect(validation.isValid).toBe(true);
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(validation.issues.length).toBe(0);
    });
  });
});
