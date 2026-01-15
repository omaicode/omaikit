export declare class TokenManager {
    private limitPerMinute;
    private usedInWindow;
    private windowStart;
    private tokenizer;
    constructor(limitPerMinute?: number);
    private loadTokenizer;
    countTokens(text: string, model?: string): number;
    canConsume(tokens: number): boolean;
    consume(tokens: number): void;
}
//# sourceMappingURL=token-manager.d.ts.map