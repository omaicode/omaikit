#!/usr/bin/env node
/**
 * Omaikit CLI entry point
 */

import { bold, cyan } from '../utils/colors';
import { formatError, printError } from '../utils/error-formatter';
import planCommand from '../commands/plan';
import initCommand from '../commands/init';
import codeCommand from '../commands/code';

const VERSION = '0.1.0';

interface CLIArgs {
  command?: string;
  description?: string;
  projectDescription?: string;
  techStack?: string[];
  output?: string;
  planFile?: string;
  taskId?: string;
  force?: boolean;
  rootPath?: string;
  help?: boolean;
  version?: boolean;
}

function parseArgs(args: string[]): CLIArgs {
  const result: CLIArgs = {};

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.version = true;
    } else if (arg === '--project-description' || arg === '-p') {
      result.projectDescription = args[++i];
    } else if (arg === '--tech-stack' || arg === '-t') {
      result.techStack = args[++i]?.split(',').map((s) => s.trim()) ?? [];
    } else if (arg === '--output' || arg === '-o') {
      result.output = args[++i];
    } else if (arg === '--plan') {
      result.planFile = args[++i];
    } else if (arg === '--task') {
      result.taskId = args[++i];
    } else if (arg === '--force' || arg === '-f') {
      result.force = true;
    } else if (arg === '--root' || arg === '--path') {
      result.rootPath = args[++i];
    } else if (!arg.startsWith('-')) {
      if (!result.command) {
        result.command = arg;
      } else if (!result.description) {
        result.description = arg;
      }
    }
  }

  return result;
}

function printHelp(): void {
  console.log(bold(`Omaikit CLI v${VERSION}`));
  console.log('Multi-Agent Development Toolkit');
  console.log('');
  console.log(bold('Usage:'));
  console.log('  omaikit <command> [options]');
  console.log('');
  console.log(bold('Commands:'));
  console.log('  init               Initialize project context');
  console.log('  plan <description>  Generate a project plan');
  console.log('  code [plan]         Generate code from a plan');
  console.log('  test <plan>         Generate tests from a plan');
  console.log('  analyze <path>      Analyze existing codebase');
  console.log('  review <path>       Review code quality');
  console.log('');
  console.log(bold('Options:'));
  console.log('  -p, --project-description  Project description (e.g., web app, API service)');
  console.log('  -t, --tech-stack    Comma-separated tech stack (e.g., typescript,node,express)');
  console.log('  -o, --output        Output directory for generated files');
  console.log('      --plan          Plan file path for code generation');
  console.log('      --task          Task ID or title to generate');
  console.log('  -f, --force         Force overwrite existing output');
  console.log('      --root          Project root path for init');
  console.log('  -h, --help          Show this help message');
  console.log('  -v, --version       Show version');
  console.log('');
  console.log(bold('Examples:'));
  console.log('  omaikit init');
  console.log('  omaikit plan "Build a REST API"');
  console.log('  omaikit plan "Web app" --project-description "web app" --tech-stack react,typescript');
  console.log('  omaikit plan "CLI tool" --output ./my-plan.json');
  console.log('  omaikit code P-0.json');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  // Handle version flag
  if (args.version) {
    console.log(`Omaikit v${VERSION}`);
    process.exit(0);
  }

  // Handle help flag or no command
  if (args.help || !args.command) {
    printHelp();
    process.exit(args.command ? 0 : 1);
  }

  try {
    switch (args.command.toLowerCase()) {
      case 'init': {
        await initCommand({ rootPath: args.rootPath, description: args.description });
        break;
      }

      case 'plan': {
        if (!args.description) {
          const err = formatError('INVALID_ARGS', 'Description is required for plan command');
          printError(err);
          console.log('');
          console.log('Usage: omaikit plan <description> [options]');
          process.exit(1);
        }
        await planCommand(args.description, {
          projectDescription: args.projectDescription,
          techStack: args.techStack,
          output: args.output,
        });
        break;
      }

      case 'code': {
        await codeCommand({
          planFile: args.planFile ?? args.description,
          outputDir: args.output,
          taskId: args.taskId,
          force: args.force,
        });
        break;
      }

      case 'test':
      case 'analyze':
      case 'review':
        console.log(cyan(`\n🚀 ${args.command} command is coming soon!\n`));
        process.exit(0);
        break;

      default: {
        const err = formatError('UNKNOWN_COMMAND', `Unknown command: ${args.command}`);
        printError(err);
        console.log('');
        console.log("Run 'omaikit --help' for usage information");
        process.exit(1);
      }
    }
  } catch (error) {
    const err = error as Error;
    const fmtErr = formatError('CLI_ERROR', err.message);
    printError(fmtErr);
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
