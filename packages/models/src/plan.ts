export interface RiskFactor {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface Task {
  id: string;
  plan_id?: string;
  milestone_id?: string;
  title: string;
  description: string;
  type: 'feature' | 'refactor' | 'bugfix' | 'test' | 'documentation' | 'infrastructure';

  // Effort estimation
  estimatedEffort: number; // hours
  effortBreakdown?: {
    analysis: number;
    implementation: number;
    testing: number;
    documentation: number;
  };

  // Requirements
  acceptanceCriteria: string[];
  inputDependencies: string[]; // Task IDs that must complete first
  outputDependencies: string[]; // Task IDs that depend on this

  // Targeting
  targetModule?: string; // Module path this task primarily affects
  affectedModules: string[]; // All modules impacted

  // Implementation guidance
  suggestedApproach?: string;
  technicalNotes?: string;
  riskFactors?: RiskFactor[];

  // Status (updated during execution)
  status: 'planned' | 'in-progress' | 'blocked' | 'completed' | 'deferred';
  blockers?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  duration: number; // Total days or weeks
  tasks: Task[];
  successCriteria: string[];
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  milestones: Milestone[];
  clarifications?: string[];
  projectContext?: any;
}

export interface PlanInput {
  description: string;
  projectDescription?: string;
  techStack?: string[];
}
