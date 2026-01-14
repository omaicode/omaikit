export type PipelineState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export interface StateTransition {
    from: PipelineState;
    to: PipelineState;
    timestamp: number;
}
export declare class StateMachine {
    private state;
    private transitions;
    private validTransitions;
    getState(): PipelineState;
    canTransition(to: PipelineState): boolean;
    transition(to: PipelineState): void;
    getHistory(): StateTransition[];
}
//# sourceMappingURL=state-machine.d.ts.map