/**
 * Base agent implementation
 */

import { AgentInput, AgentOutput } from './types';
import { Logger } from './logger';

export abstract class Agent {
  protected logger: Logger;
  public name: string = 'Agent';

  constructor(logger?: Logger) {
    this.logger = logger ?? new Logger();
  }

  /**
   * Initialize agent resources. Called once before execution.
   */
  async init(): Promise<void> {}

  /**
   * Hook before execution.
   */
  async beforeExecute(input: AgentInput): Promise<void> {}

  /**
   * Execute the agent's main logic.
   */
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  /**
   * Hook after execution.
   */
  async afterExecute(output: AgentOutput): Promise<void> {}

  /**
   * Error handler hook.
   */
  async onError(error: Error): Promise<void> {
    this.logger.error('Agent error', { error: String(error) });
  }
}
