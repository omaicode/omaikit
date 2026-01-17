import { CoderAgent, Logger } from '@omaikit/agents';
import { PlanWriter, ContextWriter } from '@omaikit/agents';
import * as fs from 'fs';
import * as path from 'path';
import { bold, cyan, green, yellow } from '../utils/colors';
import { ProgressBar } from '../utils/progress';
import { formatError, printError } from '../utils/error-formatter';
import { getTasks } from '@omaikit/agents';

function getLatestPlanFile(): string | undefined {
  const planDir = path.join('.omaikit', 'plans');
  if (!fs.existsSync(planDir)) {
    return undefined;
  }
  const indices = fs
    .readdirSync(planDir)
    .map((file) => /^P(\d+)\.json$/i.exec(file))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => !Number.isNaN(value));

  if (indices.length === 0) {
    return undefined;
  }
  const latest = Math.max(...indices);
  const planId = `P${String(latest).padStart(3, '0')}`;
  return path.join('plans', `${planId}.json`);
}

export interface CodeCommandOptions {
  planFile?: string;
  outputDir?: string;
  taskId?: string;
  force?: boolean;
}

export async function codeCommand(options?: CodeCommandOptions): Promise<void> {
  const logger = new Logger();
  const coder = new CoderAgent(logger);
  const planWriter = new PlanWriter();
  const contextWriter = new ContextWriter();
  const progress = new ProgressBar(100);

  try {
    console.log(cyan('🧩 Generating code from plan...'));
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

    const planFile = options?.planFile || getLatestPlanFile() || 'plan.json';
    const plan = await planWriter.readPlan(planFile);
    if (!plan) {
      const err = formatError('CODE_COMMAND_ERROR', 'No plan found. Run `omaikit plan` first.');
      printError(err);
      process.exit(1);
    }

    const tasks = getTasks(plan, options?.taskId);
    
    if (tasks.length === 0) {
      const err = formatError('CODE_COMMAND_ERROR', 'No matching tasks found in plan.');
      printError(err);
      process.exit(1);
    }

    await coder.init();

    const projectRoot = context.project?.rootPath || process.cwd();
    const writtenPaths: string[] = [];
    let previousResponseId = undefined;
    let generatedLOC = 0;
    let filesCreated = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const percent = Math.round(((i + 1) / tasks.length) * 100);
      progress.update(percent);
      console.log(yellow(`  → Generating code for task: ${task.title}`));

      const input = {
        task,
        plan,
        projectContext: context,
        force: options?.force,
        previousResponseId
      };

      const result = await coder.execute(input as any);
      previousResponseId = result.metadata.previousResponseId;

      if (result.status === 'failed' || result.error) {
        const err = formatError(
          result.error?.code || 'CODER_ERROR',
          result.error?.message || 'Code generation failed',
        );
        printError(err);
        process.exit(1);
      }
      
      const files = result.result.files || [];
      files.forEach((file) => {
        filesCreated += 1;
        generatedLOC += file.content.split('\n').length;
      });

      files.forEach((file) => {
        writtenPaths.push(path.join(projectRoot, file.path));
      });
    }

    console.log('');
    console.log(green(`✓ Code generated: ${projectRoot}`));

    console.log('');
    console.log(bold('📄 Generated Files'));
    console.log(bold('═'.repeat(40)));
    writtenPaths.slice(0, 10).forEach((filePath) => {
      console.log(`  ${cyan('•')} ${filePath}`);
    });
    if (writtenPaths.length > 10) {
      console.log(`  ${cyan('•')} ... and ${writtenPaths.length - 10} more`);
    }

    console.log('');
    console.log(bold('📊 Summary'));
    console.log(bold('═'.repeat(40)));
    console.log(`Files Created: ${filesCreated}`);
    console.log(`Total LOC: ${generatedLOC}`);

    console.log('');
    console.log(green('✨ Next steps:'));
    console.log('  1. Review the generated files in your project root');
    console.log('  2. Run `omaikit test` to generate tests');
  } catch (error) {
    const err = error as Error;
    const fmtErr = formatError('CODE_COMMAND_ERROR', err.message);
    printError(fmtErr);
    logger.error(err.message);
    process.exit(1);
  }
}

export default codeCommand;
