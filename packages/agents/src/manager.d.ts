import type { AgentInput, AgentOutput } from './types';
export interface ManagerAgentInput extends AgentInput {
    rootPath?: string;
    description?: string;
    action?: 'init-context' | 'analyze';
}
export declare class ManagerAgent {
    writeContext(rootPath: string, description?: string): Promise<string>;
    execute(input: ManagerAgentInput): Promise<AgentOutput>;
}
//# sourceMappingURL=manager.d.ts.map
