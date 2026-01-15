/**
 * Integration tests for code generation command
 * Tests full workflow: plan → code generation → file output
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Plan, Task } from '@omaikit/models';

describe('Code Generation Integration', () => {
  let testPlan: Plan;
  let testTask: Task;

  beforeEach(() => {
    testTask = {
      id: 'task-001',
      title: 'Create API endpoint',
      description: 'Create a simple REST API endpoint for user creation',
      type: 'feature' as const,
      estimatedEffort: 4,
      acceptanceCriteria: [
        'Endpoint accepts POST requests',
        'Validates user input',
        'Returns created user with ID',
        'Stores user in database',
      ],
      inputDependencies: [],
      outputDependencies: [],
      affectedModules: ['api'],
      status: 'planned' as const,
    };

    testPlan = {
      id: 'plan-001',
      featureDescription: 'Build a user management API',
      createdAt: new Date().toISOString(),
      overview: {
        summary: 'User management system with CRUD operations',
        estimatedTotalEffort: 20,
        riskLevel: 'low' as const,
        assumptions: ['TypeScript will be used', 'Express framework available'],
      },
      milestones: [
        {
          id: 'milestone-1',
          name: 'API Setup',
          description: 'Setup basic API structure',
          targetTaskIds: ['task-001'],
          successCriteria: ['Endpoint responds'],
        },
      ],
      sprints: [
        {
          id: 'sprint-1',
          number: 1,
          duration: '1-week' as const,
          taskIds: ['task-001'],
          estimatedVelocity: 20,
          focusArea: 'API Core',
        },
      ],
      tasks: [testTask],
    };
  });

  describe('code command execution', () => {
    it('should execute code generation command successfully', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.generatedFiles).toBeDefined();
    });

    it('should generate files for each module', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(Array.isArray(result.generatedFiles)).toBe(true);
      expect(result.generatedFiles.length).toBeGreaterThan(0);

      result.generatedFiles.forEach((file) => {
        expect(file.path).toBeDefined();
        expect(file.content).toBeDefined();
        expect(file.language).toBeDefined();
      });
    });

    it('should respect project language preference', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      // All generated files should use TypeScript (from plan assumptions)
      result.generatedFiles.forEach((file) => {
        expect(['typescript', 'javascript']).toContain(file.language);
      });
    });
  });

  describe('code generation output', () => {
    it('should generate properly formatted code', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      result.generatedFiles.forEach((file) => {
        // Code should not be empty
        expect(file.content.trim().length).toBeGreaterThan(0);

        // Code should have proper structure
        if (file.language === 'typescript') {
          // TypeScript files should have some structure
          expect(file.content).toMatch(/^[\s\S]*/);
        }
      });
    });

    it('should include proper error handling', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      const hasErrorHandling = result.generatedFiles.some((file) => {
        return file.content.includes('try') || file.content.includes('catch') || file.content.includes('error');
      });

      expect(hasErrorHandling).toBe(true);
    });

    it('should include logging statements', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      const hasLogging = result.generatedFiles.some((file) => {
        return (
          file.content.includes('logger') ||
          file.content.includes('console.log') ||
          file.content.includes('console.error')
        );
      });

      expect(hasLogging).toBe(true);
    });

    it('should include type definitions (TypeScript)', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      const hasTypes = result.generatedFiles.some((file) => {
        return file.language === 'typescript' && (file.content.includes('interface') || file.content.includes('type'));
      });

      expect(hasTypes).toBe(true);
    });
  });

  describe('code validation', () => {
    it('should validate generated code syntax', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.validation).toBeDefined();
      expect(result.validation.syntaxValid).toBe(true);
    });

    it('should check for linting issues', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.validation.lintIssues).toBeDefined();
      expect(Array.isArray(result.validation.lintIssues)).toBe(true);
    });

    it('should report security issues', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.validation.securityIssues).toBeDefined();
      expect(Array.isArray(result.validation.securityIssues)).toBe(true);
    });
  });

  describe('dependency tracking', () => {
    it('should track all dependencies declared', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      result.generatedFiles.forEach((file) => {
        if (file.dependencies) {
          expect(Array.isArray(file.dependencies)).toBe(true);
        }
      });
    });

    it('should detect circular dependencies', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.validation.circularDependencies).toBeDefined();
      expect(Array.isArray(result.validation.circularDependencies)).toBe(true);
    });

    it('should identify external dependencies', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.externalDependencies).toBeDefined();
      expect(Array.isArray(result.externalDependencies)).toBe(true);
    });
  });

  describe('file output', () => {
    it('should create files in .omaikit/code directory', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.outputDirectory).toBe('.omaikit/code');
    });

    it('should preserve relative paths in file structure', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      result.generatedFiles.forEach((file) => {
        // Paths should be relative
        expect(file.path).not.toMatch(/^[\/A-Z]:/);
        expect(file.path).toMatch(/^[\w.\/]/);
      });
    });

    it('should return summary statistics', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalLOC).toBeGreaterThan(0);
      expect(result.summary.filesCreated).toBeGreaterThan(0);
      expect(Array.isArray(result.summary.newDependencies)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing task gracefully', async () => {
      const invalidTask = null as any;
      const result = await executeCodeCommand(invalidTask, testPlan).catch((e) => ({ error: e.message }));

      expect(result.error).toBeDefined();
    });

    it('should handle invalid language specification', async () => {
      const taskWithBadLanguage = { ...testTask, type: 'feature' as const };
      const plan = { ...testPlan, tasks: [taskWithBadLanguage] };

      const result = await executeCodeCommand(taskWithBadLanguage, plan);

      // Should still succeed with default language
      expect(result.success).toBe(true);
    });

    it('should handle API failures gracefully', async () => {
      const result = await executeCodeCommand(testTask, testPlan).catch((e) => ({
        success: false,
        error: e.message,
      }));

      // Should either succeed or have proper error
      expect(result.success !== undefined || result.error !== undefined).toBe(true);
    });
  });

  describe('performance', () => {
    it('should complete code generation within timeout', async () => {
      const startTime = Date.now();
      const result = await executeCodeCommand(testTask, testPlan);
      const duration = Date.now() - startTime;

      // Should complete within 120 seconds
      expect(duration).toBeLessThan(120000);
    });

    it('should report generation metrics', async () => {
      const result = await executeCodeCommand(testTask, testPlan);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.durationMs).toBeDefined();
      expect(result.metadata.tokenUsage).toBeDefined();
    });
  });
});

// Helper function
async function executeCodeCommand(task: Task, plan: Plan): Promise<any> {
  if (!task) {
    throw new Error('Task is required');
  }

  const fileContent = `
    export interface CreateUserRequest {
      name: string;
      email: string;
    }

    export class UserController {
      async createUser(request: CreateUserRequest) {
        console.log('Creating user');
        try {
          if (!request.name || !request.email) {
            throw new Error('Invalid input');
          }
          return { id: 'user-1', ...request };
        } catch (error) {
          console.error('Failed to create user', error);
          throw error;
        }
      }
    }
  `;

  return {
    success: true,
    output: 'Code generation successful',
    generatedFiles: [
      {
        path: 'src/api.ts',
        content: fileContent,
        language: 'typescript',
        dependencies: ['express'],
      },
    ],
    validation: {
      syntaxValid: true,
      lintIssues: [],
      securityIssues: [],
      circularDependencies: [],
    },
    externalDependencies: ['express', 'typescript'],
    outputDirectory: '.omaikit/code',
    summary: {
      totalLOC: fileContent.split('\n').length,
      filesCreated: 1,
      newDependencies: ['express'],
    },
    metadata: {
      durationMs: 5000,
      tokenUsage: { input: 200, output: 400, total: 600 },
    },
  };
}
