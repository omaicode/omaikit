import { z } from 'zod';

export const RiskFactorSchema = z.object({
  description: z.string().min(1),
  likelihood: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  mitigation: z.string().min(1),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['feature', 'refactor', 'bugfix', 'test', 'documentation', 'infrastructure']),
  estimatedEffort: z.number().int().positive('Effort must be positive'),
  effortBreakdown: z
    .object({
      analysis: z.number().int().nonnegative(),
      implementation: z.number().int().nonnegative(),
      testing: z.number().int().nonnegative(),
      documentation: z.number().int().nonnegative(),
    })
    .optional(),
  acceptanceCriteria: z.array(z.string()).min(1),
  inputDependencies: z.array(z.string()),
  outputDependencies: z.array(z.string()),
  targetModule: z.string().optional(),
  affectedModules: z.array(z.string()),
  suggestedApproach: z.string().optional(),
  technicalNotes: z.string().optional(),
  riskFactors: z.array(RiskFactorSchema).optional(),
  status: z.enum(['planned', 'in-progress', 'blocked', 'completed', 'deferred']),
  blockers: z.array(z.string()).optional(),
});

export const MilestoneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.number().int().positive('Duration must be positive'),
  tasks: z.array(TaskSchema).min(1, 'Milestone must have at least one task'),
  successCriteria: z.array(z.string()).min(1),
});

export const PlanSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  milestones: z.array(MilestoneSchema).min(1, 'Plan must have at least one milestone'),
  clarifications: z.array(z.string()).optional(),
  projectContext: z.any().optional(),
});

export const PlanInputSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  projectType: z
    .enum(['backend', 'frontend', 'fullstack', 'mobile', 'monorepo', 'tool', 'web'])
    .optional(),
  techStack: z.array(z.string()).optional(),
});

export const CodeFileSchema = z.object({
  path: z.string().min(1),
  language: z.string().min(1),
  content: z.string(),
  dependencies: z.array(z.string()).optional(),
});

export const CodeGenerationSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  prompt: z.string().min(1),
  files: z.array(CodeFileSchema),
  metadata: z
    .object({
      model: z.string().optional(),
      tokensUsed: z.number().optional(),
      generatedAt: z.string().optional(),
    })
    .optional(),
});

export const TestCaseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['unit', 'integration', 'e2e']),
});

export const TestFileSchema = z.object({
  path: z.string().min(1),
  language: z.string().min(1),
  framework: z.string().min(1),
  testCases: z.array(TestCaseSchema),
  content: z.string(),
});

export const TestSuiteSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  files: z.array(TestFileSchema),
  coverage: z.number().min(0).max(100).optional(),
  metadata: z
    .object({
      generatedAt: z.string().optional(),
      model: z.string().optional(),
    })
    .optional(),
});

export const ReviewFindingSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(['info', 'warn', 'error']),
  code: z.string().min(1),
  message: z.string().min(1),
  line: z.number().optional(),
  suggestion: z.string().optional(),
});

export const CodeReviewSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  codeId: z.string().min(1),
  findings: z.array(ReviewFindingSchema),
  score: z.number().min(0).max(100),
  approved: z.boolean(),
  metadata: z
    .object({
      reviewedAt: z.string().optional(),
      model: z.string().optional(),
    })
    .optional(),
});
