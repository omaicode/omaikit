import { StateMachine } from './state-machine';
import { EventBus } from './event-bus';
import { CancellationHandler } from './cancellation-handler';
export interface PipelineConfig {
    name?: string;
    timeout?: number;
}
export declare class PipelineOrchestrator {
    private stateMachine;
    private eventBus;
    private cancellationHandler;
    private config;
    constructor(config?: PipelineConfig);
    getStateMachine(): StateMachine;
    getEventBus(): EventBus;
    getCancellationHandler(): CancellationHandler;
    start(): Promise<void>;
    complete(): Promise<void>;
    fail(reason: string): Promise<void>;
    cancel(): Promise<void>;
}
//# sourceMappingURL=orchestrator.d.ts.map