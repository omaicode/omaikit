import { StateMachine } from './state-machine';
import { EventBus } from './event-bus';
import { CancellationHandler } from './cancellation-handler';

export interface PipelineConfig {
  name?: string;
  timeout?: number;
}

export class PipelineOrchestrator {
  private stateMachine: StateMachine;
  private eventBus: EventBus;
  private cancellationHandler: CancellationHandler;
  private config: PipelineConfig;

  constructor(config?: PipelineConfig) {
    this.stateMachine = new StateMachine();
    this.eventBus = new EventBus();
    this.cancellationHandler = new CancellationHandler();
    this.config = config ?? {};
  }

  getStateMachine(): StateMachine {
    return this.stateMachine;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getCancellationHandler(): CancellationHandler {
    return this.cancellationHandler;
  }

  async start(): Promise<void> {
    if (!this.stateMachine.canTransition('running')) {
      throw new Error('Cannot start pipeline in current state');
    }
    this.stateMachine.transition('running');
    this.eventBus.emit('pipeline-state-change', { state: 'running' });
  }

  async complete(): Promise<void> {
    if (!this.stateMachine.canTransition('completed')) {
      throw new Error('Cannot complete pipeline in current state');
    }
    this.stateMachine.transition('completed');
    this.eventBus.emit('pipeline-state-change', { state: 'completed' });
  }

  async fail(reason: string): Promise<void> {
    if (!this.stateMachine.canTransition('failed')) {
      throw new Error('Cannot fail pipeline in current state');
    }
    this.stateMachine.transition('failed');
    this.eventBus.emit('pipeline-state-change', { state: 'failed', reason });
  }

  async cancel(): Promise<void> {
    this.cancellationHandler.cancel();
    if (this.stateMachine.canTransition('cancelled')) {
      this.stateMachine.transition('cancelled');
      this.eventBus.emit('pipeline-state-change', { state: 'cancelled' });
    }
  }
}
