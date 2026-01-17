import { PlanInput } from '@omaikit/models';
import { getTasks, Planner } from '@omaikit/agents';
import { Logger } from '@omaikit/agents';
import { PlanWriter, ContextWriter } from '@omaikit/agents';
import * as fs from 'fs';
import * as path from 'path';
import { cyan, bold, green, yellow } from '../utils/colors';
import { ProgressBar } from '../utils/progress';
import { formatError, printError } from '../utils/error-formatter';

const PLAN_DIR = path.join('.omaikit', 'plans');

function parsePlanIndex(filename: string): number | null {
  const match = /^P(\d+)(?:\.json)?$/i.exec(filename);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function formatPlanId(index: number): string {
  return `P${String(index).padStart(3, '0')}`;
}

function getLatestPlanFilename(planDir: string): string | undefined {
  const existing = getExistingPlanIndices(planDir);
  if (!existing.length) {
    return undefined;
  }
  const latest = Math.max(...existing);
  return `${formatPlanId(latest)}.json`;
}

function getExistingPlanIndices(planDir: string): number[] {
  if (!fs.existsSync(planDir)) {
    return [];
  }
  return fs
    .readdirSync(planDir)
    .map((file) => parsePlanIndex(file))
    .filter((value): value is number => value !== null);
}

export async function planCommand(
  description: string,
  options?: {
    projectDescription?: string;
    techStack?: string[];
    output?: string;
    mode?: 'new' | 'update';
    planId?: string;
  },
): Promise<void> {
  const logger = new Logger();
  const planner = new Planner(logger);
  const writer = new PlanWriter();
  const contextWriter = new ContextWriter();
  const progress = new ProgressBar(100);

  try {
    console.log(cyan('🎯 Generating project plan...'));
    console.log('');

    const context = await contextWriter.readContext();
    if (!context) {
      const err = formatError(
        'CONTEXT_MISSING',
        'Project context not found. Run `omaikit init` first.',
      );
      printError(err);
      if (process.env.VITEST !== undefined) {
        throw new Error('Project context not found');
      }
      process.exit(1);
    }

    // Get projectDescription & techStack from context if not provided
    const projectDescription = options?.projectDescription || context.project.description || '';
    const techStack = options?.techStack || context.analysis.languages || [];
    const input: PlanInput = {
      description,
      projectDescription,
      techStack,
    };

    // Setup progress tracking
    planner.onProgress((event: { status: string; message?: string, percent: number }) => {
      if (event.status === 'summarizing') {
        progress.update(event.percent);
        console.log(yellow(`  ⏳ ${event.message || 'Parsing response...'}`));
      } else if (event.status === 'optimizing') {
        progress.update(event.percent);
        console.log(yellow(`  ✓ ${event.message || 'Optimizing plan...'}`));
      } else if (event.status === 'complete') {
        progress.update(event.percent);
        console.log(green(`  ✓ ${event.message || 'Plan generation complete'}`));
      } else if (event.status === 'generating') {
        progress.update(event.percent);
        console.log(cyan(`  ⏳ ${event.message || 'Generating plan...'}`));
      }
    });

    // Execute planner
    const result = await planner.execute(input);

    if (result.error) {
      const err = formatError(result.error.code, result.error.message);
      printError(err);
      if (process.env.VITEST !== undefined) {
        throw new Error(result.error.message);
      }
      process.exit(1);
    }

    const plan =
      result.data?.plan ||
      (result.data && (result.data as any).title ? (result.data as any) : undefined);

    if (!plan) {
      const err = formatError('PLANNING_ERROR', 'Failed to generate plan');
      printError(err);
      if (process.env.VITEST !== undefined) {
        throw new Error('Failed to generate plan');
      }
      process.exit(1);
    }

    const planOutput = { ...plan } as any;
    if ('projectContext' in planOutput) {
      delete planOutput.projectContext;
    }

    if (!fs.existsSync(PLAN_DIR)) {
      fs.mkdirSync(PLAN_DIR, { recursive: true });
    }

    const latestPlanFilename = getLatestPlanFilename(PLAN_DIR);
    const latestArchiveFilename = latestPlanFilename
      ? `plans/${latestPlanFilename}`
      : `plans/${formatPlanId(1)}.json`;

    console.log(green(`✓ Plan saved to ${latestArchiveFilename}`));
    const planForSummary = (await writer.readPlan(latestArchiveFilename)) || plan;

    // Display summary
    console.log('');
    console.log(bold('📋 Plan Summary'));
    console.log(bold('═'.repeat(40)));
    console.log(`Title: ${cyan(planForSummary.title)}`);
    console.log(`Milestones: ${planForSummary.milestones.length}`);

    const tasks = getTasks(planForSummary);
    const totalTasks = tasks.length;
    console.log(`Total Tasks: ${totalTasks}`);

    const totalEffort = tasks.reduce(
      (sum: number, m: any) =>
        sum + (m.estimatedEffort ?? m.effort ?? 0),
      0,
    );
    
    console.log(`Total Effort: ${totalEffort} hours (~${Math.ceil(totalEffort / 8)} days)`);
    console.log(bold('Milestones:'));

    for (const milestone of planForSummary.milestones) {
      const milestoneEffort = (milestone.tasks || []).reduce(
        (sum: number, t: any) => sum + (t.estimatedEffort ?? t.effort ?? 0),
        0,
      );
      console.log(
        `  ${cyan('→')} ${milestone.title} (${milestone.duration}d, ${milestoneEffort}h)`,
      );

      for (const task of (milestone.tasks || []).slice(0, 3)) {
        const effort = task.estimatedEffort ?? task.effort ?? 0;
        console.log(`    ${yellow('•')} ${task.title} (${effort}h)`);
      }

      if ((milestone.tasks || []).length > 3) {
        console.log(`    ${yellow('•')} ... and ${(milestone.tasks || []).length - 3} more`);
      }
    }

    console.log('');
    console.log(green('✨ Next steps:'));
    console.log('  1. Review the plan in the generated file');
    console.log('  2. Run `omaikit code` to generate code for tasks');
    console.log('  3. Run `omaikit test` to create test suite');
  } catch (error) {
    const err = error as Error;
    const fmtErr = formatError('COMMAND_ERROR', err.message);
    printError(fmtErr);
    logger.error(err.message);
    if (process.env.VITEST !== undefined) {
      throw err;
    }
    process.exit(1);
  }
}

// Export for CLI integration
export default planCommand;
