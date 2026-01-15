import { Milestone, Task } from '@omaikit/models';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}
export interface DependencyValidationResult {
    hasCycles: boolean;
    cycles: string[][];
    invalidReferences: Array<{
        task: string;
        reference: string;
    }>;
}
export interface EffortValidationResult {
    valid: boolean;
    warnings: string[];
}
export interface MilestoneValidationResult {
    valid: boolean;
    warnings: string[];
}
export declare class PlanValidator {
    validate(plan: any): ValidationResult;
    validateDependencies(tasks: Task[]): DependencyValidationResult;
    validateEffortEstimates(tasks: Task[]): EffortValidationResult;
    validateMilestones(milestones: Milestone[]): MilestoneValidationResult;
}
//# sourceMappingURL=plan-validator.d.ts.map