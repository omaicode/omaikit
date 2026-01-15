export type EventType =
  | 'agent-start'
  | 'agent-progress'
  | 'agent-complete'
  | 'agent-error'
  | 'pipeline-state-change';

export interface Event {
  type: EventType;
  payload: unknown;
  timestamp: number;
}

export type EventListener = (event: Event) => void;

export class EventBus {
  private listeners: Map<EventType, Set<EventListener>> = new Map();

  on(type: EventType, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(listener);
  }

  off(type: EventType, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: EventType, payload: unknown): void {
    const event: Event = { type, payload, timestamp: Date.now() };
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
