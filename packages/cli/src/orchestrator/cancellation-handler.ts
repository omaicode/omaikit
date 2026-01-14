export class CancellationToken {
  private cancelled = false;
  private listeners: Set<() => void> = new Set();

  isCancelled(): boolean {
    return this.cancelled;
  }

  cancel(): void {
    this.cancelled = true;
    this.listeners.forEach((l) => l());
  }

  onCancel(listener: () => void): void {
    this.listeners.add(listener);
  }
}

export class CancellationHandler {
  private token: CancellationToken;

  constructor() {
    this.token = new CancellationToken();
  }

  getToken(): CancellationToken {
    return this.token;
  }

  cancel(): void {
    this.token.cancel();
  }
}
