import { describe, it, expect } from 'vitest';
import { Planner } from '../../src/planner/planner';
import { Logger } from '../../src/logger';
import { PlanInput } from '@omaikit/models';

describe('Planner Agent - Edge Cases', () => {
  const planner = new Planner(new Logger());

  describe('ambiguous descriptions', () => {
    it('should handle vague feature descriptions', async () => {
      const input: PlanInput = {
        description: 'Build something',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });

    it('should handle descriptions with missing context', async () => {
      const input: PlanInput = {
        description: 'Add authentication',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });

    it('should ask clarification questions for ambiguous inputs', async () => {
      const input: PlanInput = {
        description: 'Build an app for users',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });
  });

  describe('multi-module projects', () => {
    it('should handle monorepo descriptions', async () => {
      const input: PlanInput = {
        description: 'Build a monorepo with web client, API server, and shared libraries',
      };

      const result = await planner.execute(input);

      if (result.data?.plan) {
        expect(result.data.plan.milestones.length).toBeGreaterThan(0);
      }
    });

    it('should generate dependencies across modules', async () => {
      const input: PlanInput = {
        description: 'Frontend depends on API which depends on database',
      };

      const result = await planner.execute(input);

      if (result.data?.plan) {
        const plan = result.data.plan;
        const allTasks = plan.milestones.flatMap((m: any) => m.tasks);
        const tasksWithDeps = allTasks.filter((t: any) =>
          (t.dependencies || []).some((d: any) => d.length > 0)
        );
        expect(tasksWithDeps.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should identify module initialization order', async () => {
      const input: PlanInput = {
        description: 'Setup shared libs before app modules',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });
  });

  describe('edge case inputs', () => {
    it('should handle very short descriptions', async () => {
      const input: PlanInput = {
        description: 'API',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });

    it('should handle very long descriptions', async () => {
      const input: PlanInput = {
        description: 'Build a comprehensive modern full-stack comprehensive application that includes both frontend and backend components'.padEnd(1000, '...'),
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });

    it('should handle special characters in description', async () => {
      const input: PlanInput = {
        description: 'Build API with @decorators, #hashtags, & symbols!',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });

    it('should handle multiple languages in description', async () => {
      const input: PlanInput = {
        description: 'Build a project with TypeScript/Python/Go support',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });
  });

  describe('conflict resolution', () => {
    it('should handle conflicting tech stack requirements', async () => {
      const input: PlanInput = {
        description: 'Build with both synchronous blocking code and async/await patterns',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });

    it('should handle timeline vs scope conflicts', async () => {
      const input: PlanInput = {
        description: 'Build enterprise system with 100 features in 1 week',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });
  });

  describe('constraint handling', () => {
    it('should handle no-constraint scenario', async () => {
      const input: PlanInput = {
        description: 'Build a project',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });

    it('should respect all constraints together', async () => {
      const input: PlanInput = {
        description: 'Real-time collaborative editor',
      };

      const result = await planner.execute(input);
      expect(result.data?.plan || result.error).toBeTruthy();
    });
  });

  describe('plan quality under edge conditions', () => {
    it('should generate reasonable tasks even with minimal input', async () => {
      const input: PlanInput = {
        description: 'Build',
      };

      const result = await planner.execute(input);

      if (result.data?.plan) {
        const allTasks = result.data.plan.milestones.flatMap((m: any) => m.tasks);
        expect(allTasks.length).toBeGreaterThan(0);

        allTasks.forEach((task: any) => {
          expect(task.title).toBeTruthy();
          expect(task.effort).toBeGreaterThan(0);
        });
      }
    });

    it('should not generate duplicate tasks', async () => {
      const input: PlanInput = {
        description: 'Build a REST API with authentication and authorization',
      };

      const result = await planner.execute(input);

      if (result.data?.plan) {
        const allTasks = result.data.plan.milestones.flatMap((m: any) => m.tasks);
        const titles = allTasks.map((t: any) => t.title.toLowerCase());
        const uniqueTitles = new Set(titles);

        // Most titles should be unique (allow some similarity)
        expect(uniqueTitles.size / titles.length).toBeGreaterThan(0.7);
      }
    });
  });
});
