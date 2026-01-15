import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  effort: z.number().int().positive('Effort must be positive'),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
  dependencies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const MilestoneSchema = z.object({
  title: z.string().min(1),
  duration: z.number().int().positive('Duration must be positive'),
  tasks: z.array(TaskSchema).min(1, 'Milestone must have at least one task'),
});

export const PlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  milestones: z.array(MilestoneSchema).min(1, 'Plan must have at least one milestone'),
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
