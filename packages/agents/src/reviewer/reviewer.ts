import { Agent } from "../agent";
import { Logger } from "../logger";
import { AgentInput, AgentOutput } from "../types";

export class ReviewerAgent extends Agent {
  protected logger: Logger;
  public name: string = 'Agent';

  constructor(logger?: Logger) {
    super();
    this.logger = logger ?? new Logger();
  }

  /**
   * Initialize agent resources. Called once before execution.
   */
  async init(): Promise<void> {}

  /**
   * Hook before execution.
   */
  async beforeExecute(_input: AgentInput): Promise<void> {}

  /**
   * Execute the agent's main logic.
   */
  execute(input: AgentInput): Promise<AgentOutput> {
    this.logger.info('Executing ReviewerAgent with input', { input });
    // Placeholder implementation
    const output: AgentOutput = {
      result: 'Review generation not yet implemented.',
    };
    return Promise.resolve(output);
  }

  /**
   * Hook after execution.
   */
  async afterExecute(_output: AgentOutput): Promise<void> {}

  /**
   * Error handler hook.
   */
  async onError(error: Error): Promise<void> {
    this.logger.error('Agent error', { error: String(error) });
  }    
}