import { PlanInput } from '@omaikit/models';
import { Planner } from '@omaikit/agents';
import { Logger } from '@omaikit/agents';
import { PlanWriter, ContextWriter } from '@omaikit/analysis';
import * as fs from 'fs';
import * as path from 'path';
import { cyan, bold, green, yellow } from '../utils/colors';
import { ProgressBar } from '../utils/progress';
import { formatError, printError } from '../utils/error-formatter';

const PLAN_DIR = path.join('.omaikit', 'plans');

function parsePlanIndex(filename: string): number | null {
  const match = /^P-(\d+)(?:\.json)?$/i.exec(filename);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
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

function resolvePlanIndex(
  planDir: string,
  options?: { mode?: 'new' | 'update'; planId?: string },
): number {
  const existing = getExistingPlanIndices(planDir);
  const maxExisting = existing.length ? Math.max(...existing) : -1;

  if (options?.mode === 'update') {
    if (options?.planId) {
      const parsed = parsePlanIndex(options.planId) ?? Number.parseInt(options.planId, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return maxExisting >= 0 ? maxExisting : 0;
  }

  return maxExisting + 1;
}

export async function planCommand(
  description: string,
  options?: {
    projectType?: string;
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
  const progress = new ProgressBar(50);

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

    const input: PlanInput = {
      description,
      projectType: options?.projectType as any,
      techStack: options?.techStack,
    };

    // Setup progress tracking
    planner.onProgress((event: any) => {
      if (event.status === 'parsing') {
        progress.update(33);
        console.log(yellow('  ⏳ Parsing response...'));
      } else if (event.status === 'validating') {
        progress.update(66);
        console.log(yellow('  ✓ Validating plan...'));
      } else if (event.status === 'complete') {
        progress.update(100);
        console.log(green('  ✓ Plan generated'));
      } else if (event.status === 'generating') {
        console.log(cyan('  → Receiving plan from AI...'));
        progress.update(10);
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

    const planIndex = resolvePlanIndex(PLAN_DIR, options);
    const planId = `P-${planIndex}`;
    const archiveFilename = `plans/${planId}.json`;

    // Save plan
    console.log('');
    let filepath: string;
    if (options?.output && path.isAbsolute(options.output)) {
      const dirPath = path.dirname(options.output);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(
        options.output,
        JSON.stringify({ ...planOutput, id: planId }, null, 2),
        'utf-8',
      );
      filepath = options.output;
    } else {
      const target = options?.output || archiveFilename;
      filepath = await writer.writePlan({ ...planOutput, id: planId }, target);
    }
    console.log(green(`✓ Plan saved to ${filepath}`));

    // Display summary
    console.log('');
    console.log(bold('📋 Plan Summary'));
    console.log(bold('═'.repeat(40)));
    console.log(`Title: ${cyan(plan.title)}`);
    console.log(`Milestones: ${plan.milestones.length}`);

    const totalTasks = plan.milestones.reduce((sum: number, m: any) => sum + m.tasks.length, 0);
    console.log(`Total Tasks: ${totalTasks}`);

    const totalEffort = plan.milestones.reduce(
      (sum: number, m: any) =>
        sum + m.tasks.reduce((ts: number, t: any) => ts + (t.estimatedEffort ?? t.effort ?? 0), 0),
      0,
    );
    console.log(`Total Effort: ${totalEffort} hours (~${Math.ceil(totalEffort / 8)} days)`);

    console.log('');
    console.log(bold('Milestones:'));
    for (const milestone of plan.milestones) {
      const milestoneEffort = milestone.tasks.reduce(
        (sum: number, t: any) => sum + (t.estimatedEffort ?? t.effort ?? 0),
        0,
      );
      console.log(
        `  ${cyan('→')} ${milestone.title} (${milestone.duration}d, ${milestoneEffort}h)`,
      );

      for (const task of milestone.tasks.slice(0, 3)) {
        const effort = task.estimatedEffort ?? task.effort ?? 0;
        console.log(`    ${yellow('•')} ${task.title} (${effort}h)`);
      }

      if (milestone.tasks.length > 3) {
        console.log(`    ${yellow('•')} ... and ${milestone.tasks.length - 3} more`);
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
