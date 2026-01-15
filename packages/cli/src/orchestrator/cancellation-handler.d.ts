export declare class CancellationToken {
    private cancelled;
    private listeners;
    isCancelled(): boolean;
    cancel(): void;
    onCancel(listener: () => void): void;
}
export declare class CancellationHandler {
    private token;
    constructor();
    getToken(): CancellationToken;
    cancel(): void;
}
//# sourceMappingURL=cancellation-handler.d.ts.map