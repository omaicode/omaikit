import { Agent } from '../agent';
import { Logger } from '../logger';
import { AgentInput, AgentOutput } from '../types';
export declare class Planner extends Agent {
    private promptTemplates;
    private planParser;
    private validator;
    private clarificationHandler;
    private provider;
    private progressCallbacks;
    constructor(logger: Logger);
    init(): Promise<void>;
    onProgress(callback: (event: any) => void): void;
    private emit;
    execute(input: AgentInput): Promise<AgentOutput>;
    private callProvider;
    private generateMockPlan;
}
//# sourceMappingURL=planner.d.ts.map