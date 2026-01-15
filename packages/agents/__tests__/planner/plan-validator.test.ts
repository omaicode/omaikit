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
        id: 'P-1',
        title: 'Build API',
        description: 'REST API project',
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
                title: 'Setup',
                description: 'Setup',
                type: 'infrastructure',
                estimatedEffort: 5,
                acceptanceCriteria: ['Project scaffolded'],
                inputDependencies: [],
                outputDependencies: [],
                affectedModules: ['core'],
                status: 'planned',
              },
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
            id: 'M1',
            title: 'Phase 1',
            description: 'Phase 1 description',
            duration: 5,
            successCriteria: ['Phase 1 done'],
            tasks: [
              {
                id: 'T1',
                title: 'Task 1',
                description: 'Task',
                type: 'feature',
                estimatedEffort: 5,
                acceptanceCriteria: ['Done'],
                inputDependencies: [],
                outputDependencies: [],
                affectedModules: ['core'],
                status: 'planned',
              },
            ],
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
        id: 'P-2',
        title: 'Build API',
        description: 'REST API',
        milestones: [
          {
            id: 'M1',
            title: 'M1',
            description: 'Milestone 1',
            duration: 10,
            successCriteria: ['Milestone 1 done'],
            tasks: [
              {
                id: 'T1',
                title: 'Setup',
                description: 'Setup',
                type: 'infrastructure',
                estimatedEffort: 5,
                acceptanceCriteria: ['Setup done'],
                inputDependencies: [],
                outputDependencies: ['T2'],
                affectedModules: ['core'],
                status: 'planned',
              },
              {
                id: 'T2',
                title: 'Implement',
                description: 'Impl',
                type: 'feature',
                estimatedEffort: 10,
                acceptanceCriteria: ['Implementation done'],
                inputDependencies: ['T1'],
                outputDependencies: [],
                affectedModules: ['core'],
                status: 'planned',
              },
            ],
          },
        ],
      };

      const result = validator.validate(plan);
      expect(result.valid).toBe(true);
    });

    it('should reject milestone without tasks', () => {
      const plan: any = {
        id: 'P-3',
        title: 'Build App',
        description: 'App',
        milestones: [
          {
            id: 'M1',
            title: 'Phase 1',
            description: 'Phase 1 description',
            duration: 10,
            successCriteria: ['Phase 1 done'],
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
        {
          id: 'T1',
          title: 'Task 1',
          description: 'T1',
          type: 'feature',
          estimatedEffort: 5,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T2'],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T2',
          title: 'Task 2',
          description: 'T2',
          type: 'feature',
          estimatedEffort: 3,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T3'],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T3',
          title: 'Task 3',
          description: 'T3',
          type: 'feature',
          estimatedEffort: 2,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T1'],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
      ];

      const result = validator.validateDependencies(tasks);
      expect(result.hasCycles).toBe(true);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it('should accept valid DAG', () => {
      const tasks: any = [
        {
          id: 'T1',
          title: 'Task 1',
          description: 'T1',
          type: 'feature',
          estimatedEffort: 5,
          acceptanceCriteria: ['Done'],
          inputDependencies: [],
          outputDependencies: ['T2', 'T3'],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T2',
          title: 'Task 2',
          description: 'T2',
          type: 'feature',
          estimatedEffort: 3,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T1'],
          outputDependencies: ['T3'],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T3',
          title: 'Task 3',
          description: 'T3',
          type: 'feature',
          estimatedEffort: 2,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T1', 'T2'],
          outputDependencies: ['T4'],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T4',
          title: 'Task 4',
          description: 'T4',
          type: 'feature',
          estimatedEffort: 8,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T3'],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
      ];

      const result = validator.validateDependencies(tasks);
      expect(result.hasCycles).toBe(false);
      expect(result.cycles).toEqual([]);
    });

    it('should detect missing dependency references', () => {
      const tasks: any = [
        {
          id: 'T1',
          title: 'Task 1',
          description: 'T1',
          type: 'feature',
          estimatedEffort: 5,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T2'],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T2',
          title: 'Task 2',
          description: 'T2',
          type: 'feature',
          estimatedEffort: 3,
          acceptanceCriteria: ['Done'],
          inputDependencies: ['T99'],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
      ];

      const result = validator.validateDependencies(tasks);
      expect(result.invalidReferences.length).toBeGreaterThan(0);
    });
  });

  describe('validateEffortEstimates', () => {
    it('should validate reasonable effort estimates', () => {
      const tasks: any = [
        {
          id: 'T1',
          title: 'Task 1',
          description: 'T1',
          type: 'feature',
          estimatedEffort: 5,
          acceptanceCriteria: ['Done'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T2',
          title: 'Task 2',
          description: 'T2',
          type: 'feature',
          estimatedEffort: 13,
          acceptanceCriteria: ['Done'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
        {
          id: 'T3',
          title: 'Task 3',
          description: 'T3',
          type: 'feature',
          estimatedEffort: 8,
          acceptanceCriteria: ['Done'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
      ];

      const result = validator.validateEffortEstimates(tasks);
      expect(result.valid).toBe(true);
    });

    it('should warn on very high effort estimates', () => {
      const tasks: any = [
        {
          id: 'T1',
          title: 'Big Task',
          description: 'Big',
          type: 'feature',
          estimatedEffort: 200,
          acceptanceCriteria: ['Done'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
      ];

      const result = validator.validateEffortEstimates(tasks);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject zero or negative effort', () => {
      const tasks: any = [
        {
          id: 'T1',
          title: 'Task',
          description: 'Task',
          type: 'feature',
          estimatedEffort: 0,
          acceptanceCriteria: ['Done'],
          inputDependencies: [],
          outputDependencies: [],
          affectedModules: ['core'],
          status: 'planned',
        },
      ];

      const result = validator.validateEffortEstimates(tasks);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMilestones', () => {
    it('should validate milestone sequence', () => {
      const milestones: any = [
        {
          id: 'M1',
          title: 'M1',
          description: 'M1 description',
          duration: 5,
          successCriteria: ['M1 done'],
          tasks: [
            {
              id: 'T1',
              title: 'Task',
              description: 'Task',
              type: 'feature',
              estimatedEffort: 5,
              acceptanceCriteria: ['Done'],
              inputDependencies: [],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned',
            },
          ],
        },
        {
          id: 'M2',
          title: 'M2',
          description: 'M2 description',
          duration: 8,
          successCriteria: ['M2 done'],
          tasks: [
            {
              id: 'T2',
              title: 'Task',
              description: 'Task',
              type: 'feature',
              estimatedEffort: 8,
              acceptanceCriteria: ['Done'],
              inputDependencies: [],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned',
            },
          ],
        },
      ];

      const result = validator.validateMilestones(milestones);
      expect(result.valid).toBe(true);
    });

    it('should validate milestone duration matches total task effort', () => {
      const milestones: any = [
        {
          id: 'M1',
          title: 'M1',
          description: 'M1 description',
          duration: 5,
          successCriteria: ['M1 done'],
          tasks: [
            {
              id: 'T1',
              title: 'Task 1',
              description: 'T1',
              type: 'feature',
              estimatedEffort: 100,
              acceptanceCriteria: ['Done'],
              inputDependencies: [],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned',
            },
          ],
        },
      ];

      const result = validator.validateMilestones(milestones);
      expect(result.warnings).toBeDefined();
    });
  });
});
