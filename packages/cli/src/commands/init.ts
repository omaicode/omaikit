import { ContextWriter } from '@omaikit/analysis';
import { Logger } from '@omaikit/agents';
import * as path from 'path';
import { cyan, green, yellow } from '../utils/colors';
import { formatError, printError } from '../utils/error-formatter';

export interface InitCommandOptions {
  rootPath?: string;
  force?: boolean;
}

export async function initCommand(options?: InitCommandOptions): Promise<void> {
  const logger = new Logger();

  try {
    console.log(cyan('🧭 Initializing project context...'));

    const rootPath = options?.rootPath || process.cwd();
    const baseDir = path.join(rootPath, '.omaikit');
    const writer = new ContextWriter(baseDir);
    const filepath = await writer.writeContext(rootPath);

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

export default initCommand;
