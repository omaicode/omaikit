export interface CodePattern {
    id: string;
    description: string;
    regex: string;
    severity?: 'info' | 'warn' | 'error';
}
export declare const DEFAULT_PATTERNS: CodePattern[];
//# sourceMappingURL=patterns.d.ts.map