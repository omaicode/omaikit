export type EventType = 'agent-start' | 'agent-progress' | 'agent-complete' | 'agent-error' | 'pipeline-state-change';
export interface Event {
    type: EventType;
    payload: unknown;
    timestamp: number;
}
export type EventListener = (event: Event) => void;
export declare class EventBus {
    private listeners;
    on(type: EventType, listener: EventListener): void;
    off(type: EventType, listener: EventListener): void;
    emit(type: EventType, payload: unknown): void;
    removeAll(): void;
}
//# sourceMappingURL=event-bus.d.ts.map