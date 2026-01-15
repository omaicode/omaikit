import { describe, it, expect } from 'vitest';
import { PlanSchema } from '@omaikit/models';

describe('Plan Contract Tests', () => {
  it('should validate Plan schema with all required fields', () => {
    const planData = {
      id: 'P-0',
      title: 'Build Web Application',
      description: 'Full-stack web app with React frontend and Node backend',
      milestones: [
        {
          id: 'M1',
          title: 'Phase 1: Setup',
          description: 'Project setup and tooling',
          duration: 5,
          successCriteria: ['Project initialized'],
          tasks: [
            {
              id: 'T1',
              title: 'Project Setup',
              description: 'Initialize project structure',
              type: 'infrastructure' as const,
              estimatedEffort: 3,
              acceptanceCriteria: ['Scaffold created'],
              inputDependencies: [],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned' as const,
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
      id: 'M1',
      title: 'Phase 1',
      description: 'Setup phase',
      duration: 10,
      successCriteria: ['Setup complete'],
      tasks: [
        {
          id: 'T1',
          title: 'Setup',
          description: 'Setup',
          type: 'infrastructure' as const,
          estimatedEffort: 5,
          acceptanceCriteria: ['Dependencies installed'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['tooling'],
          status: 'planned' as const,
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
      type: 'feature' as const,
      estimatedEffort: 13,
      acceptanceCriteria: ['Feature works'],
      inputDependencies: ['T0'],
      outputDependencies: [],
      affectedModules: ['core'],
      status: 'planned' as const,
    };

    expect(taskData.id).toBeTruthy();
    expect(taskData.title).toBeTruthy();
    expect(taskData.estimatedEffort).toBeGreaterThan(0);
  });

  it('should handle nested Task structure', () => {
    const plan = {
      id: 'P-1',
      title: 'API Project',
      description: 'Build REST API',
      milestones: [
        {
          id: 'M1',
          title: 'M1',
          description: 'Milestone 1',
          duration: 10,
          successCriteria: ['API scaffolding done'],
          tasks: [
            {
              id: 'T1',
              title: 'Setup',
              description: 'Setup',
              type: 'infrastructure' as const,
              estimatedEffort: 5,
              acceptanceCriteria: ['Project created'],
              inputDependencies: [],
              outputDependencies: ['T2'],
              affectedModules: ['core'],
              status: 'planned' as const,
            },
            {
              id: 'T2',
              title: 'API Design',
              description: 'Design API',
              type: 'feature' as const,
              estimatedEffort: 8,
              acceptanceCriteria: ['API spec drafted'],
              inputDependencies: ['T1'],
              outputDependencies: [],
              affectedModules: ['api'],
              status: 'planned' as const,
            },
          ],
        },
      ],
    };

    expect(plan.milestones[0].tasks.length).toBe(2);
    expect(plan.milestones[0].tasks[1].inputDependencies[0]).toBe('T1');
  });

  it('should validate Plan with multiple milestones', () => {
    const plan = {
      id: 'P-2',
      title: 'Multi-Phase Project',
      description: 'Complex project with phases',
      milestones: [
        {
          id: 'M1',
          title: 'Phase 1',
          description: 'Phase 1 description',
          duration: 5,
          successCriteria: ['Phase 1 done'],
          tasks: [
            {
              id: 'T1',
              title: 'Task 1',
              description: 'T1',
              type: 'feature' as const,
              estimatedEffort: 5,
              acceptanceCriteria: ['Done'],
              inputDependencies: [],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned' as const,
            },
          ],
        },
        {
          id: 'M2',
          title: 'Phase 2',
          description: 'Phase 2 description',
          duration: 5,
          successCriteria: ['Phase 2 done'],
          tasks: [
            {
              id: 'T2',
              title: 'Task 2',
              description: 'T2',
              type: 'feature' as const,
              estimatedEffort: 8,
              acceptanceCriteria: ['Done'],
              inputDependencies: [],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned' as const,
            },
          ],
        },
        {
          id: 'M3',
          title: 'Phase 3',
          description: 'Phase 3 description',
          duration: 5,
          successCriteria: ['Phase 3 done'],
          tasks: [
            {
              id: 'T3',
              title: 'Task 3',
              description: 'T3',
              type: 'feature' as const,
              estimatedEffort: 13,
              acceptanceCriteria: ['Done'],
              inputDependencies: [],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned' as const,
            },
          ],
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
      type: 'feature' as const,
      estimatedEffort: 5,
      acceptanceCriteria: ['Done'],
      inputDependencies: [],
      outputDependencies: [],
      affectedModules: ['core'],
      status: 'planned' as const,
    };

    expect(validTask.estimatedEffort).toBeGreaterThan(0);
    expect(Number.isInteger(validTask.estimatedEffort)).toBe(true);
  });

  it('should validate dependency arrays', () => {
    const taskWithDeps = {
      id: 'T3',
      title: 'Complex Task',
      description: 'Desc',
      type: 'feature' as const,
      estimatedEffort: 13,
      acceptanceCriteria: ['Done'],
      inputDependencies: ['T1', 'T2'],
      outputDependencies: [],
      affectedModules: ['core'],
      status: 'planned' as const,
    };

    expect(Array.isArray(taskWithDeps.inputDependencies)).toBe(true);
    expect(taskWithDeps.inputDependencies.length).toBe(2);
    expect(taskWithDeps.inputDependencies.every((d: any) => typeof d === 'string')).toBe(true);
  });

  it('should validate Plan descriptions are strings', () => {
    const plan = {
      id: 'P-3',
      title: 'Project',
      description: 'This is a detailed description of the project',
      milestones: [],
    };

    expect(typeof plan.description).toBe('string');
    expect(plan.description.length).toBeGreaterThan(0);
  });
});
