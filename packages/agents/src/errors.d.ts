export declare class AgentError extends Error {
    code: string;
    statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
export declare const ERROR_CODES: {
    AGENT_INIT_FAILED: string;
    AGENT_EXECUTION_FAILED: string;
    PROVIDER_ERROR: string;
};
//# sourceMappingURL=errors.d.ts.map