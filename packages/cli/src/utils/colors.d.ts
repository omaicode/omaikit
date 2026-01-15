declare const colors: {
    reset: string;
    bright: string;
    green: string;
    yellow: string;
    red: string;
    blue: string;
    cyan: string;
};
export declare function colorize(text: string, color: keyof typeof colors): string;
export declare function success(text: string): string;
export declare function warn(text: string): string;
export declare function error(text: string): string;
export declare function info(text: string): string;
export declare function bold(text: string): string;
export declare function green(text: string): string;
export declare function yellow(text: string): string;
export declare function red(text: string): string;
export declare function cyan(text: string): string;
export {};
//# sourceMappingURL=colors.d.ts.map