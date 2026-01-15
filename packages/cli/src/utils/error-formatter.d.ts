export interface FormattedError {
    code: string;
    message: string;
    suggestion?: string;
    details?: string;
}
export declare function formatError(code: string, message: string, details?: string): FormattedError;
export declare function printError(err: FormattedError): void;
export declare function printSuccess(message: string): void;
export declare function printWarning(message: string): void;
//# sourceMappingURL=error-formatter.d.ts.map