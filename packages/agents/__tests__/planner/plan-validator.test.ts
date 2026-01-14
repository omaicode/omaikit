import { describe, it, expect, beforeEach } from 'vitest';
import { PlanValidator } from '../../src/planner/plan-validator';
import { Plan, Milestone, Task } from '@omaikit/models';

describe('Plan Validator', () => {
  let validator: PlanValidator;

  beforeEach(() => {
    validator = new PlanValidator();
  });

  describe('validate', () => {
    it('should validate a correct plan', () => {
      const plan: any = {
        title: 'Build API',
        description: 'REST API project',
        milestones: [
          {
            title: 'Phase 1',
            duration: 5,
            tasks: [
              { id: 'T1', title: 'Setup', description: 'Setup', effort: 5, status: 'pending', dependencies: [] },
            ],
          },
        ],
      };

      const result = validator.validate(plan);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject plan without title', () => {
      const plan: any = {
        description: 'Missing title',
        milestones: [
          {
            title: 'Phase 1',
            duration: 5,
            tasks: [{ id: 'T1', title: 'Task 1', description: 'Task', effort: 5, status: 'pending', dependencies: [] }],
          },
        ],
      };

      const result = validator.validate(plan);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject plan without milestones', () => {
      const plan: any = {
        title: 'Build App',
        description: 'App project',
      };

      const result = validator.validate(plan);
      expect(result.valid).toBe(false);
    });

    it('should reject empty milestones array', () => {
      const plan: any = {
        title: 'Build App',
        description: 'App project',
        milestones: [],
      };

      const result = validator.validate(plan);
      expect(result.valid).toBe(false);
    });

    it('should validate milestone structure', () => {
      const plan: any = {
        title: 'Build API',
        description: 'REST API',
        milestones: [
          {
            title: 'M1',
            duration: 10,
            tasks: [
              { id: 'T1', title: 'Setup', description: 'Setup', effort: 5, status: 'pending', dependencies: [] },
              { id: 'T2', title: 'Implement', description: 'Impl', effort: 10, status: 'pending', dependencies: ['T1'] },
            ],
          },
        ],
      };

      const result = validator.validate(plan);
      expect(result.valid).toBe(true);
    });

    it('should reject milestone without tasks', () => {
      const plan: any = {
        title: 'Build App',
        description: 'App',
        milestones: [
          {
            title: 'Phase 1',
            duration: 10,
            tasks: [],
          },
        ],
      };

      const result = validator.validate(plan);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDependencies', () => {
    it('should detect circular dependencies', () => {
      const tasks: any = [
        { id: 'T1', title: 'Task 1', description: 'T1', effort: 5, status: 'pending', dependencies: ['T2'] },
        { id: 'T2', title: 'Task 2', description: 'T2', effort: 3, status: 'pending', dependencies: ['T3'] },
        { id: 'T3', title: 'Task 3', description: 'T3', effort: 2, status: 'pending', dependencies: ['T1'] },
      ];

      const result = validator.validateDependencies(tasks);
      expect(result.hasCycles).toBe(true);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it('should accept valid DAG', () => {
      const tasks: any = [
        { id: 'T1', title: 'Task 1', description: 'T1', effort: 5, status: 'pending', dependencies: [] },
        { id: 'T2', title: 'Task 2', description: 'T2', effort: 3, status: 'pending', dependencies: ['T1'] },
        { id: 'T3', title: 'Task 3', description: 'T3', effort: 2, status: 'pending', dependencies: ['T1', 'T2'] },
        { id: 'T4', title: 'Task 4', description: 'T4', effort: 8, status: 'pending', dependencies: ['T3'] },
      ];

      const result = validator.validateDependencies(tasks);
      expect(result.hasCycles).toBe(false);
      expect(result.cycles).toEqual([]);
    });

    it('should detect missing dependency references', () => {
      const tasks: any = [
        { id: 'T1', title: 'Task 1', description: 'T1', effort: 5, status: 'pending', dependencies: ['T2'] },
        { id: 'T2', title: 'Task 2', description: 'T2', effort: 3, status: 'pending', dependencies: ['T99'] },
      ];

      const result = validator.validateDependencies(tasks);
      expect(result.invalidReferences.length).toBeGreaterThan(0);
    });
  });

  describe('validateEffortEstimates', () => {
    it('should validate reasonable effort estimates', () => {
      const tasks: any = [
        { id: 'T1', title: 'Task 1', description: 'T1', effort: 5, status: 'pending', dependencies: [] },
        { id: 'T2', title: 'Task 2', description: 'T2', effort: 13, status: 'pending', dependencies: [] },
        { id: 'T3', title: 'Task 3', description: 'T3', effort: 8, status: 'pending', dependencies: [] },
      ];

      const result = validator.validateEffortEstimates(tasks);
      expect(result.valid).toBe(true);
    });

    it('should warn on very high effort estimates', () => {
      const tasks: any = [{ id: 'T1', title: 'Big Task', description: 'Big', effort: 200, status: 'pending', dependencies: [] }];

      const result = validator.validateEffortEstimates(tasks);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject zero or negative effort', () => {
      const tasks: any = [{ id: 'T1', title: 'Task', description: 'Task', effort: 0, status: 'pending', dependencies: [] }];

      const result = validator.validateEffortEstimates(tasks);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMilestones', () => {
    it('should validate milestone sequence', () => {
      const milestones: any = [
        {
          title: 'M1',
          duration: 5,
          tasks: [
            { id: 'T1', title: 'Task', description: 'Task', effort: 5, status: 'pending', dependencies: [] },
          ],
        },
        {
          title: 'M2',
          duration: 8,
          tasks: [
            { id: 'T2', title: 'Task', description: 'Task', effort: 8, status: 'pending', dependencies: [] },
          ],
        },
      ];

      const result = validator.validateMilestones(milestones);
      expect(result.valid).toBe(true);
    });

    it('should validate milestone duration matches total task effort', () => {
      const milestones: any = [
        {
          title: 'M1',
          duration: 5,
          tasks: [
            { id: 'T1', title: 'Task 1', description: 'T1', effort: 100, status: 'pending', dependencies: [] },
          ],
        },
      ];

      const result = validator.validateMilestones(milestones);
      expect(result.warnings).toBeDefined();
    });
  });
});
