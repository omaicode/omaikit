export declare class ProgressBar {
    private current;
    private total;
    private width;
    constructor(total: number);
    update(current: number): void;
    increment(): void;
    private render;
    complete(): void;
}
export declare function spinner(message: string): NodeJS.Timeout;
export declare function clearSpinner(id: NodeJS.Timeout): void;
//# sourceMappingURL=progress.d.ts.map