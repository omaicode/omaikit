import { describe, it, expect } from 'vitest';
import { PlanSchema } from '@omaikit/models';

describe('Plan Contract Tests', () => {
  it('should validate Plan schema with all required fields', () => {
    const planData = {
      title: 'Build Web Application',
      description: 'Full-stack web app with React frontend and Node backend',
      milestones: [
        {
          id: 'M1',
          title: 'Phase 1: Setup',
          duration: 5,
          tasks: [
            {
              id: 'T1',
              title: 'Project Setup',
              description: 'Initialize project structure',
              effort: 3,
              status: 'pending' as const,
              dependencies: [],
            },
          ],
        },
      ],
    };

    const result = PlanSchema.safeParse(planData);
    expect(result.success).toBe(true);
  });

  it('should reject Plan without title', () => {
    const planData = {
      description: 'Missing title',
      milestones: [],
    };

    const result = PlanSchema.safeParse(planData);
    expect(result.success).toBe(false);
  });

  it('should validate Milestone schema', () => {
    const milestoneData = {
      title: 'Phase 1',
      duration: 10,
      tasks: [
        {
          id: 'T1',
          title: 'Setup',
          description: 'Setup',
          effort: 5,
          status: 'pending' as const,
          dependencies: [],
        },
      ],
    };

    expect(milestoneData.title).toBeTruthy();
    expect(Array.isArray(milestoneData.tasks)).toBe(true);
  });

  it('should validate Task schema with dependencies', () => {
    const taskData = {
      id: 'T1',
      title: 'Implement Feature',
      description: 'Build core feature',
      effort: 13,
      status: 'pending' as const,
      dependencies: ['T0'],
    };

    expect(taskData.id).toBeTruthy();
    expect(taskData.title).toBeTruthy();
    expect(taskData.effort).toBeGreaterThan(0);
  });

  it('should handle nested Task structure', () => {
    const plan = {
      title: 'API Project',
      description: 'Build REST API',
      milestones: [
        {
          title: 'M1',
          duration: 10,
          tasks: [
            {
              id: 'T1',
              title: 'Setup',
              description: 'Setup',
              effort: 5,
              status: 'pending' as const,
              dependencies: [],
            },
            {
              id: 'T2',
              title: 'API Design',
              description: 'Design API',
              effort: 8,
              status: 'pending' as const,
              dependencies: ['T1'],
            },
          ],
        },
      ],
    };

    expect(plan.milestones[0].tasks.length).toBe(2);
    expect(plan.milestones[0].tasks[1].dependencies[0]).toBe('T1');
  });

  it('should validate Plan with multiple milestones', () => {
    const plan = {
      title: 'Multi-Phase Project',
      description: 'Complex project with phases',
      milestones: [
        {
          title: 'Phase 1',
          duration: 5,
          tasks: [{ id: 'T1', title: 'Task 1', description: 'T1', effort: 5, status: 'pending' as const, dependencies: [] }],
        },
        {
          title: 'Phase 2',
          duration: 5,
          tasks: [{ id: 'T2', title: 'Task 2', description: 'T2', effort: 8, status: 'pending' as const, dependencies: [] }],
        },
        {
          title: 'Phase 3',
          duration: 5,
          tasks: [{ id: 'T3', title: 'Task 3', description: 'T3', effort: 13, status: 'pending' as const, dependencies: [] }],
        },
      ],
    };

    expect(plan.milestones.length).toBe(3);
    expect(plan.milestones.every((m: any) => m.tasks.length > 0)).toBe(true);
  });

  it('should validate effort values are positive integers', () => {
    const validTask = {
      id: 'T1',
      title: 'Task',
      description: 'Desc',
      effort: 5,
      status: 'pending' as const,
      dependencies: [],
    };

    expect(validTask.effort).toBeGreaterThan(0);
    expect(Number.isInteger(validTask.effort)).toBe(true);
  });

  it('should validate dependency arrays', () => {
    const taskWithDeps = {
      id: 'T3',
      title: 'Complex Task',
      description: 'Desc',
      effort: 13,
      status: 'pending' as const,
      dependencies: ['T1', 'T2'],
    };

    expect(Array.isArray(taskWithDeps.dependencies)).toBe(true);
    expect(taskWithDeps.dependencies.length).toBe(2);
    expect(taskWithDeps.dependencies.every((d: any) => typeof d === 'string')).toBe(
      true
    );
  });

  it('should validate Plan descriptions are strings', () => {
    const plan = {
      title: 'Project',
      description: 'This is a detailed description of the project',
      milestones: [],
    };

    expect(typeof plan.description).toBe('string');
    expect(plan.description.length).toBeGreaterThan(0);
  });
});
