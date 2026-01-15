import { AIProvider, AIProviderOptions } from './provider';
export declare class AnthropicProvider implements AIProvider {
    private apiKey?;
    private client;
    constructor(apiKey?: string);
    init(config?: Record<string, unknown>): Promise<void>;
    generate(prompt: string, options?: AIProviderOptions): Promise<string>;
    private generateStream;
    complete(prompt: string): Promise<string>;
    onProgress(callback: (chunk: string) => void): void;
    close(): Promise<void>;
}
//# sourceMappingURL=anthropic.d.ts.map