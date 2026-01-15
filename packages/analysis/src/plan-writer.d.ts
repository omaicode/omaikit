import { Plan } from '@omaikit/models';
export declare class PlanWriter {
    private baseDir;
    private planFile;
    constructor(baseDir?: string);
    writePlan(plan: Plan, filename?: string): Promise<string>;
    readPlan(filename?: string): Promise<Plan | null>;
    listPlans(): Promise<string[]>;
    deletePlan(filename?: string): Promise<boolean>;
}
//# sourceMappingURL=plan-writer.d.ts.map