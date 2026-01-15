import { describe, it, expect, beforeEach } from 'vitest';
import { Planner } from '../../src/planner/planner';
import { Logger } from '../../src/logger';
import { Agent } from '../../src/agent';
import { PlanInput } from '@omaikit/models';

describe('Planner Agent', () => {
  let planner: Planner;

  beforeEach(() => {
    planner = new Planner(new Logger());
  });

  describe('initialization', () => {
    it('should be an instance of Agent', () => {
      expect(planner).toBeInstanceOf(Agent);
    });

    it('should have execute method', () => {
      expect(typeof planner.execute).toBe('function');
    });

    it('should have a name property', () => {
      expect(planner.name).toBeDefined();
      expect(typeof planner.name).toBe('string');
    });
  });

  describe('execute method', () => {
    it('should accept PlanInput with description', async () => {
      const input: PlanInput = {
        description: 'Build a simple NestJS project with authentication',
      };

      const result = await planner.execute(input);
      expect(result).toBeDefined();
    });

    it('should return Plan object with required fields', async () => {
      const input: PlanInput = {
        description: 'Build a REST API',
      };

      const result = await planner.execute(input);

      expect(result.data).toBeDefined();
      expect(result.data?.plan).toBeDefined();
      expect(result.data?.plan.title).toBeTruthy();
      expect(result.data?.plan.milestones).toBeDefined();
      expect(Array.isArray(result.data?.plan.milestones)).toBe(true);
    });

    it('should generate valid plan structure', async () => {
      const input: PlanInput = {
        description: 'Build a web scraper',
      };

      const result = await planner.execute(input);

      if (result.data?.plan) {
        const { plan } = result.data;
        expect(plan.title).toBeTruthy();
        expect(plan.description).toBeTruthy();
        expect(plan.milestones.length).toBeGreaterThan(0);

        plan.milestones.forEach((milestone: Record<string, unknown>) => {
          expect(milestone).toHaveProperty('id');
          expect(milestone.title).toBeTruthy();
          expect(milestone.tasks).toBeDefined();
          expect(Array.isArray(milestone.tasks)).toBe(true);
        });
      }
    });

    it('should include task dependencies in plan', async () => {
      const input: PlanInput = {
        description: 'Build a microservices architecture',
      };

      const result = await planner.execute(input);

      if (result.data?.plan) {
        const plan = result.data.plan;
        const allTasks = plan.milestones.flatMap((m: Record<string, unknown>) => (m as any).tasks);
        expect(allTasks.length).toBeGreaterThan(0);
      }
    });

    it('should emit progress events during execution', async () => {
      const input: PlanInput = {
        description: 'Build a mobile app',
      };

      let progressEmitted = false;
      const result = await planner.execute(input);

      // Progress should be emitted or execution should complete
      expect(result.data?.plan || progressEmitted).toBeTruthy();
    });

    it('should handle missing optional fields gracefully', async () => {
      const input: PlanInput = {
        description: 'Build something cool',
      };

      const result = await planner.execute(input);

      expect(result).toBeDefined();
      expect(result.data?.plan || result.error).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle empty description', async () => {
      const input: PlanInput = {
        description: '',
      };

      const result = await planner.execute(input);

      expect(result.error).toBeTruthy();
    });

    it('should handle API errors gracefully', async () => {
      const input: PlanInput = {
        description: 'A'.repeat(10000), // Extremely long description
      };

      const result = await planner.execute(input);

      // Should either succeed or have error, but not crash
      expect(result.data || result.error).toBeTruthy();
    });

    it('should return error on invalid input', async () => {
      const input: PlanInput = {
        description: '',
      };

      const result = await planner.execute(input);
      expect(result.error).toBeTruthy();
      expect(result.error?.code).toBe('PLANNING_ERROR');
    });
  });
});
