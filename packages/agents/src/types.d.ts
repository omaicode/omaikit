export interface AgentInput {
    type?: string;
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    [key: string]: any;
}
export interface AgentOutput {
    status?: 'success' | 'failed' | 'partial';
    data?: any;
    error?: {
        code: string;
        message: string;
    };
    [key: string]: any;
}
//# sourceMappingURL=types.d.ts.map