/**
 * Unit tests for Coder agent interface
 * Tests agent initialization, basic execution flow, and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoderAgent, CoderAgentInput } from '../../src/coder';
import type { AgentOutput } from '../../src/types';
import type { CodeGeneration } from '@omaikit/models';

describe('CoderAgent', () => {
  let coderAgent: CoderAgent;

  beforeEach(() => {
    coderAgent = new CoderAgent();
  });

  describe('initialization', () => {
    it('should have correct agent name', () => {
      expect(coderAgent.name).toBe('coder');
    });

    it('should have a valid version', () => {
      expect(coderAgent.version).toBeDefined();
      expect(typeof coderAgent.version).toBe('string');
      expect(coderAgent.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('execute()', () => {
    it('should accept valid AgentInput and return AgentOutput', async () => {
      const mockInput: CoderAgentInput = {
        projectContext: {
          name: 'test-project',
          rootPath: '/test',
          modules: [],
          dependencies: { nodes: [], edges: [], cycles: [] },
          codePatterns: {
            namingConventions: {
              variables: /^[a-z]/,
              functions: /^[a-z]/,
              classes: /^[A-Z]/,
              constants: /^[A-Z_]/,
              files: /^[a-z-]/,
            },
            errorHandling: { pattern: 'try-catch', examples: [] },
            structuralPattern: {
              modulesPerFeature: 1,
              averageModuleSize: 'medium',
              organizationStyle: 'by-feature',
            },
            comments: { docstringFormat: 'jsdoc', commentCoverage: 50 },
            testOrganization: { colocated: true, pattern: '__tests__' },
          },
          metadata: {
            totalLOC: 1000,
            fileCount: 10,
            languages: ['typescript'],
            conventions: {
              casing: 'camelCase',
            },
          },
        },
        plan: null,
        task: {
          id: 'task-1',
          title: 'Generate API endpoint',
          description: 'Create a simple API endpoint',
          type: 'feature',
          estimatedEffort: 4,
          acceptanceCriteria: ['Endpoint accepts requests', 'Returns valid JSON'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['api'],
          status: 'planned',
        },
        history: [],
      };

      const output = await coderAgent.execute(mockInput);

      expect(output).toBeDefined();
      expect(output.agentName).toBe('coder');
      expect(output.status).toBe('success');
      expect(output.result).toBeDefined();
      expect(output.timestamp).toBeDefined();
      expect(output.metadata).toBeDefined();
      expect(output.metadata.durationMs).toBeGreaterThan(0);
    });

    it('should reject input with missing required fields', async () => {
      const invalidInput = {} as CoderAgentInput;
      await expect(coderAgent.execute(invalidInput)).rejects.toThrow();
    });

    it('should return CodeGeneration result with valid structure', async () => {
      const mockInput: CoderAgentInput = {
        projectContext: {
          name: 'test-project',
          rootPath: '/test',
          modules: [],
          dependencies: { nodes: [], edges: [], cycles: [] },
          codePatterns: {
            namingConventions: {
              variables: /^[a-z]/,
              functions: /^[a-z]/,
              classes: /^[A-Z]/,
              constants: /^[A-Z_]/,
              files: /^[a-z]/,
            },
            errorHandling: { pattern: 'try-catch', examples: [] },
            structuralPattern: {
              modulesPerFeature: 1,
              averageModuleSize: 'medium',
              organizationStyle: 'by-feature',
            },
            comments: { docstringFormat: 'jsdoc', commentCoverage: 50 },
            testOrganization: { colocated: true, pattern: '__tests__' },
          },
          metadata: {
            totalLOC: 1000,
            fileCount: 10,
            languages: ['typescript'],
            conventions: {
              casing: 'camelCase',
            },
          },
        },
        plan: null,
        task: {
          id: 'task-1',
          title: 'Generate module',
          description: 'Create a module',
          type: 'feature',
          estimatedEffort: 4,
          acceptanceCriteria: ['Module exports correctly'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        history: [],
      };

      const output = await coderAgent.execute(mockInput);
      const result = output.result as CodeGeneration;

      expect(result.id).toBeDefined();
      expect(result.taskId).toBe('task-1');
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('validate()', () => {
    it('should validate successful output', async () => {
      const mockOutput: AgentOutput = {
        agentName: 'coder',
        timestamp: new Date().toISOString(),
        status: 'success',
        result: {
          id: 'gen-1',
          taskId: 'task-1',
          prompt: 'test',
          files: [
            {
              path: 'src/index.ts',
              language: 'typescript',
              content: 'export const test = () => {};',
            },
          ],
        },
        metadata: {
          durationMs: 1000,
        },
      };

      const validation = await coderAgent.validate(mockOutput);

      expect(validation.isValid).toBe(true);
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect invalid output with missing files', async () => {
      const mockOutput: AgentOutput = {
        agentName: 'coder',
        timestamp: new Date().toISOString(),
        status: 'success',
        result: {
          id: 'gen-1',
          taskId: 'task-1',
          prompt: 'test',
          files: [],
        },
        metadata: {
          durationMs: 1000,
        },
      };

      const validation = await coderAgent.validate(mockOutput);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should return quality score', async () => {
      const mockOutput: AgentOutput = {
        agentName: 'coder',
        timestamp: new Date().toISOString(),
        status: 'success',
        result: {
          id: 'gen-1',
          taskId: 'task-1',
          prompt: 'test',
          files: [
            {
              path: 'src/index.ts',
              language: 'typescript',
              content: 'export const test = () => {};',
            },
          ],
        },
        metadata: {
          durationMs: 1000,
        },
      };

      const validation = await coderAgent.validate(mockOutput);

      expect(validation.qualityScore).toBeDefined();
      expect(validation.qualityScore).toBeGreaterThanOrEqual(0);
      expect(validation.qualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('canHandle()', () => {
    it('should handle feature tasks', () => {
      const task = {
        id: 'task-1',
        title: 'Feature',
        description: 'desc',
        type: 'feature' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      expect(coderAgent.canHandle(task)).toBe(true);
    });

    it('should handle refactor tasks', () => {
      const task = {
        id: 'task-1',
        title: 'Refactor',
        description: 'desc',
        type: 'refactor' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      expect(coderAgent.canHandle(task)).toBe(true);
    });

    it('should handle bugfix tasks', () => {
      const task = {
        id: 'task-1',
        title: 'Bugfix',
        description: 'desc',
        type: 'bugfix' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      expect(coderAgent.canHandle(task)).toBe(true);
    });

    it('should not handle test and documentation tasks alone', () => {
      const taskTest = {
        id: 'task-1',
        title: 'Test',
        description: 'desc',
        type: 'test' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      const taskDoc = {
        id: 'task-2',
        title: 'Doc',
        description: 'desc',
        type: 'documentation' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      expect(coderAgent.canHandle(taskTest)).toBe(false);
      expect(coderAgent.canHandle(taskDoc)).toBe(false);
    });
  });
});
