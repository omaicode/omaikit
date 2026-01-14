import { PlanInput } from '@omaikit/models';
import { Planner } from '@omaikit/agents';
import { Logger } from '@omaikit/agents';
import { PlanWriter } from '@omaikit/analysis';
import { cyan, bold, green, yellow } from '../utils/colors';
import { ProgressBar } from '../utils/progress';
import { formatError, printError } from '../utils/error-formatter';

export async function planCommand(description: string, options?: {
  projectType?: string;
  techStack?: string[];
  output?: string;
}): Promise<void> {
  const logger = new Logger();
  const planner = new Planner(logger);
  const writer = new PlanWriter();
  const progress = new ProgressBar(50);

  try {
    console.log(cyan('🎯 Generating project plan...'));
    console.log('');

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
      }
    });

    // Execute planner
    const result = await planner.execute(input);

    if (result.error) {
      const err = formatError(result.error.code, result.error.message);
      printError(err);
      process.exit(1);
    }

    if (!result.data || !result.data.plan) {
      const err = formatError('PLANNING_ERROR', 'Failed to generate plan');
      printError(err);
      process.exit(1);
    }

    const plan = result.data.plan;

    // Save plan
    console.log('');
    const filepath = await writer.writePlan(plan, options?.output);
    console.log(green(`✓ Plan saved to ${filepath}`));

    // Display summary
    console.log('');
    console.log(bold('📋 Plan Summary'));
    console.log(bold('═'.repeat(40)));
    console.log(`Title: ${cyan(plan.title)}`);
    console.log(
      `Milestones: ${plan.milestones.length}`
    );

    const totalTasks = plan.milestones.reduce((sum: number, m: any) => sum + m.tasks.length, 0);
    console.log(`Total Tasks: ${totalTasks}`);

    const totalEffort = plan.milestones.reduce(
      (sum: number, m: any) => sum + m.tasks.reduce((ts: number, t: any) => ts + t.effort, 0),
      0
    );
    console.log(`Total Effort: ${totalEffort} hours (~${Math.ceil(totalEffort / 8)} days)`);

    console.log('');
    console.log(bold('Milestones:'));
    for (const milestone of plan.milestones) {
      const milestoneEffort = milestone.tasks.reduce((sum: number, t: any) => sum + t.effort, 0);
      console.log(`  ${cyan('→')} ${milestone.title} (${milestone.duration}d, ${milestoneEffort}h)`);

      for (const task of milestone.tasks.slice(0, 3)) {
        console.log(`    ${yellow('•')} ${task.title} (${task.effort}h)`);
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
    process.exit(1);
  }
}

// Export for CLI integration
export default planCommand;
