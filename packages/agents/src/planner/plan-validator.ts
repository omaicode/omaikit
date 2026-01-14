import { Milestone, Task } from '@omaikit/models';
import { PlanSchema } from '@omaikit/models';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface DependencyValidationResult {
  hasCycles: boolean;
  cycles: string[][];
  invalidReferences: Array<{ task: string; reference: string }>;
}

export interface EffortValidationResult {
  valid: boolean;
  warnings: string[];
}

export interface MilestoneValidationResult {
  valid: boolean;
  warnings: string[];
}

export class PlanValidator {
  validate(plan: any): ValidationResult {
    // Use Zod schema for strict validation
    const result = PlanSchema.safeParse(plan);

    if (!result.success) {
      const errors = result.error.errors.map((e) => {
        const path = e.path.join('.');
        return `${path || 'root'}: ${e.message}`;
      });

      return {
        valid: false,
        errors,
      };
    }

    // Additional validations
    const validatedPlan = result.data;
    const additionalErrors: string[] = [];

    if (!validatedPlan.milestones || validatedPlan.milestones.length === 0) {
      additionalErrors.push('Plan must have at least one milestone');
    }

    for (const milestone of validatedPlan.milestones || []) {
      if (!milestone.tasks || milestone.tasks.length === 0) {
        additionalErrors.push(
          `Milestone "${milestone.title}" must have at least one task`
        );
      }
    }

    return {
      valid: additionalErrors.length === 0,
      errors: additionalErrors,
    };
  }

  validateDependencies(tasks: Task[]): DependencyValidationResult {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const cycles: string[][] = [];
    const invalidReferences: Array<{ task: string; reference: string }> = [];

    // Check for invalid references
    for (const task of tasks) {
      if (task.dependencies) {
        for (const dep of task.dependencies) {
          if (!taskMap.has(dep)) {
            invalidReferences.push({
              task: task.id,
              reference: dep,
            });
          }
        }
      }
    }

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string, path: string[]): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task && task.dependencies) {
        for (const dep of task.dependencies) {
          if (!visited.has(dep)) {
            if (hasCycle(dep, [...path, dep])) {
              return true;
            }
          } else if (recursionStack.has(dep)) {
            cycles.push([...path, dep]);
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        hasCycle(task.id, [task.id]);
      }
    }

    return {
      hasCycles: cycles.length > 0,
      cycles,
      invalidReferences,
    };
  }

  validateEffortEstimates(tasks: Task[]): EffortValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const task of tasks) {
      if (task.effort <= 0) {
        errors.push(`Task "${task.title}" has invalid effort: ${task.effort}`);
      }

      if (task.effort > 40) {
        warnings.push(
          `Task "${task.title}" has high effort estimate: ${task.effort} hours. Consider breaking it down.`
        );
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
    };
  }

  validateMilestones(milestones: Milestone[]): MilestoneValidationResult {
    const warnings: string[] = [];

    for (const milestone of milestones) {
      const totalEffort = milestone.tasks.reduce((sum: number, t: any) => sum + t.effort, 0);

      if (totalEffort > milestone.duration * 8) {
        warnings.push(
          `Milestone "${milestone.title}": total effort (${totalEffort}h) may exceed duration (${milestone.duration}d)`
        );
      }

      if (milestone.tasks.length > 15) {
        warnings.push(
          `Milestone "${milestone.title}": has many tasks (${milestone.tasks.length}), consider breaking it into smaller milestones`
        );
      }
    }

    return {
      valid: true,
      warnings,
    };
  }
}
