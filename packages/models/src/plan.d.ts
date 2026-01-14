export interface Task {
    id: string;
    title: string;
    description: string;
    effort: number;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    dependencies?: string[];
    tags?: string[];
}
export interface Milestone {
    title: string;
    duration: number;
    tasks: Task[];
}
export interface Plan {
    title: string;
    description: string;
    milestones: Milestone[];
}
export interface PlanInput {
    description: string;
    projectType?: 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'monorepo' | 'tool' | 'web';
    techStack?: string[];
}
export interface PlanOutput {
    plan: Plan;
    clarifications?: string[];
}
//# sourceMappingURL=plan.d.ts.map