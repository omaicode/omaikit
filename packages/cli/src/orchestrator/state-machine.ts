export type PipelineState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface StateTransition {
  from: PipelineState;
  to: PipelineState;
  timestamp: number;
}

export class StateMachine {
  private state: PipelineState = 'idle';
  private transitions: StateTransition[] = [];

  private validTransitions: Record<PipelineState, PipelineState[]> = {
    idle: ['running', 'cancelled'],
    running: ['paused', 'completed', 'failed', 'cancelled'],
    paused: ['running', 'cancelled'],
    completed: [],
    failed: ['running', 'cancelled'],
    cancelled: [],
  };

  getState(): PipelineState {
    return this.state;
  }

  canTransition(to: PipelineState): boolean {
    return this.validTransitions[this.state].includes(to);
  }

  transition(to: PipelineState): void {
    if (!this.canTransition(to)) {
      throw new Error(`Cannot transition from ${this.state} to ${to}`);
    }
    this.transitions.push({
      from: this.state,
      to,
      timestamp: Date.now(),
    });
    this.state = to;
  }

  getHistory(): StateTransition[] {
    return this.transitions;
  }
}
