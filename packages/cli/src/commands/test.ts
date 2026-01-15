import type { Plan, Task, TestFile } from '@omaikit/models';
import type { TesterAgentInput } from '@omaikit/agents';
import { TesterAgent, Logger } from '@omaikit/agents';
import { PlanWriter, TestWriter, ContextWriter } from '@omaikit/analysis';
import * as fs from 'fs';
import * as path from 'path';
import { bold, cyan, green, yellow } from '../utils/colors';
import { ProgressBar } from '../utils/progress';
import { formatError, printError } from '../utils/error-formatter';

function getLatestPlanFile(): string | undefined {
  const planDir = path.join('.omaikit', 'plans');
  if (!fs.existsSync(planDir)) {
    return undefined;
  }
  const indices = fs
    .readdirSync(planDir)
    .map((file) => /^P-(\d+)\.json$/i.exec(file))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => !Number.isNaN(value));

  if (indices.length === 0) {
    return undefined;
  }
  const latest = Math.max(...indices);
  return path.join('plans', `P-${latest}.json`);
}

export interface TestCommandOptions {
  planFile?: string;
  outputDir?: string;
  taskId?: string;
  run?: boolean;
  force?: boolean;
  coverageTarget?: number;
}

export async function testCommand(options?: TestCommandOptions): Promise<void> {
  const logger = new Logger();
  const tester = new TesterAgent(logger);
  const planWriter = new PlanWriter();
  const testWriter = new TestWriter();
  const contextWriter = new ContextWriter();
  const progress = new ProgressBar(50);

  try {
    console.log(cyan('🧪 Generating tests from plan...'));
    console.log('');

    const context = await contextWriter.readContext();
    if (!context) {
      const err = formatError('CONTEXT_MISSING', 'Project context not found. Run `omaikit init` first.');
      printError(err);
      if (process.env.VITEST !== undefined) {
        process.exit(1);
        throw new Error('Project context not found');
      }
      process.exit(1);
    }

    const planFile = options?.planFile || getLatestPlanFile() || 'plan.json';
    const plan = await planWriter.readPlan(planFile);
    if (!plan) {
      const err = formatError('TEST_COMMAND_ERROR', 'No plan found. Run `omaikit plan` first.');
      printError(err);
      process.exit(1);
    }

    const tasks = selectTasks(plan, options?.taskId);
    if (tasks.length === 0) {
      const err = formatError('TEST_COMMAND_ERROR', 'No matching tasks found in plan.');
      printError(err);
      process.exit(1);
    }

    await tester.init();

    const allFiles: TestFile[] = [];
    let generatedLOC = 0;
    let filesCreated = 0;
    let totalTests = 0;
    let coverageSum = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const percent = Math.round(((i + 1) / tasks.length) * 100);
      progress.update(percent);
      console.log(yellow(`  → Generating tests for task: ${task.title}`));

      const testerInput: TesterAgentInput = {
        task,
        plan,
        projectContext: context,
        run: options?.run,
        force: options?.force,
        coverageTarget: options?.coverageTarget,
      };

      const result = await tester.execute(testerInput);

      if (result.status === 'failed' || result.error) {
        const err = formatError(
          result.error?.code || 'TESTER_ERROR',
          result.error?.message || 'Test generation failed'
        );
        printError(err);
        process.exit(1);
      }

      const files = result.result.files || [];
      files.forEach((file) => {
        filesCreated += 1;
        generatedLOC += file.content.split('\n').length;
        totalTests += file.testCases.length;
        allFiles.push({
          path: file.path,
          content: file.content,
          language: file.language,
          framework: file.framework,
          testCases: file.testCases,
        });
      });

      if (typeof result.result.coverage === 'number') {
        coverageSum += result.result.coverage;
      }
    }

    const writtenPaths = await testWriter.writeFiles(allFiles, options?.outputDir || '.omaikit/tests');

    console.log('');
    console.log(green(`✓ Tests generated: ${options?.outputDir || '.omaikit/tests'}`));

    console.log('');
    console.log(bold('📄 Generated Test Files'));
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
    console.log(`Total Tests: ${totalTests}`);
    if (tasks.length > 0) {
      const avgCoverage = Math.round(coverageSum / tasks.length);
      console.log(`Average Coverage: ${avgCoverage}%`);
    }

    console.log('');
    console.log(green('✨ Next steps:'));
    console.log('  1. Review the generated tests in .omaikit/tests');
    console.log('  2. Run `omaikit test --run` to execute them locally');
  } catch (error) {
    const err = error as Error;
    const fmtErr = formatError('TEST_COMMAND_ERROR', err.message);
    printError(fmtErr);
    logger.error(err.message);
    if (process.env.VITEST !== undefined) {
      throw err;
    }
    process.exit(1);
  }
}

function selectTasks(plan: Plan, taskId?: string): Task[] {
  const tasks = plan.milestones.flatMap((milestone) => milestone.tasks || []);
  if (taskId) {
    const match = tasks.find((t) => t.id === taskId || t.title === taskId);
    return match ? [match] : [];
  }
  return tasks;
}

export default testCommand;
