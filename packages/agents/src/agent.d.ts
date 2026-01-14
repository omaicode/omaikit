/**
 * Base agent implementation
 */
import { AgentInput, AgentOutput } from './types';
import { Logger } from './logger';
export declare abstract class Agent {
    protected logger: Logger;
    name: string;
    constructor(logger?: Logger);
    /**
     * Initialize agent resources. Called once before execution.
     */
    init(): Promise<void>;
    /**
     * Hook before execution.
     */
    beforeExecute(input: AgentInput): Promise<void>;
    /**
     * Execute the agent's main logic.
     */
    abstract execute(input: AgentInput): Promise<AgentOutput>;
    /**
     * Hook after execution.
     */
    afterExecute(output: AgentOutput): Promise<void>;
    /**
     * Error handler hook.
     */
    onError(error: Error): Promise<void>;
}
//# sourceMappingURL=agent.d.ts.map