import { Logger, ManagerAgent } from '@omaikit/agents';
import { loadConfig, saveConfig } from '@omaikit/config';
import * as readline from 'readline';
import { cyan, green, yellow } from '../utils/colors';
import { formatError, printError } from '../utils/error-formatter';

export interface InitCommandOptions {
  rootPath?: string;
  force?: boolean;
  description?: string;
}

export async function initCommand(options?: InitCommandOptions): Promise<void> {
  const logger = new Logger();

  try {
    console.log(cyan('🧭 Initializing project context...'));

    const rootPath = options?.rootPath || process.cwd();
    if (process.env.VITEST === undefined && process.env.NODE_ENV !== 'test') {
      await ensureApiKey(logger);
    }
    const manager = new ManagerAgent(logger);
    const result = await manager.execute({
      action: 'init-context',
      rootPath,
      description: options?.description,
    });

    if (result.status === 'failed' || result.error) {
      throw new Error(result.error?.message || 'Manager failed to generate context');
    }

    const filepath = result.data?.contextPath as string | undefined;
    if (!filepath) {
      throw new Error('Manager did not return context path');
    }

    console.log(green(`✓ Context saved to ${filepath}`));
    console.log(yellow('  Next: run `omaikit plan` to generate a plan'));
  } catch (error) {
    const err = error as Error;
    const fmtErr = formatError('INIT_COMMAND_ERROR', err.message);
    printError(fmtErr);
    logger.error(err.message);
    if (process.env.VITEST !== undefined) {
      throw err;
    }
    process.exit(1);
  }
}

async function ensureApiKey(logger: Logger): Promise<void> {
  const cfg = loadConfig();

  if (cfg.openaiApiKey || cfg.anthropicApiKey) {
    return;
  }

  const key = await promptSecret('Enter your OPENAI_API_KEY: ');
  if (!key) {
    throw new Error('OPENAI_API_KEY is required to run init with AI analysis');
  }

  const updated = { ...cfg, openaiApiKey: key, provider: cfg.provider || 'openai' };
  const savedPath = saveConfig(updated, 'global');
  logger.info(`Saved API key to ${savedPath}`);
}

function promptSecret(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const onData = (char: Buffer) => {
      const str = char.toString();
      if (str === '\n' || str === '\r' || str === '\u0004') {
        return;
      }
      readline.moveCursor(process.stdout, -1, 0);
      readline.clearLine(process.stdout, 1);
      process.stdout.write('*');
    };

    process.stdin.on('data', onData);

    rl.question(prompt, (answer) => {
      process.stdin.off('data', onData);
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

export default initCommand;
