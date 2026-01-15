import { ToolDefinition, ToolContext } from '../tools/types';
import { ToolRegistry } from '../tools/registry';
export interface AIProviderOptions {
    model?: string;
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
    onProgress?: (chunk: string) => void;
    tools?: ToolDefinition[];
    toolRegistry?: ToolRegistry;
    toolContext?: ToolContext;
    toolChoice?: 'auto' | 'none' | {
        name: string;
    };
    maxToolCalls?: number;
}
export interface AIProvider {
    init?(config?: Record<string, unknown>): Promise<void> | void;
    generate(prompt: string, options?: AIProviderOptions): Promise<string>;
    generateCodex?(prompt: string, options?: AIProviderOptions): Promise<string>;
    close?(): Promise<void> | void;
    complete?(prompt: string): Promise<string>;
    onProgress?(callback: (chunk: string) => void): void;
}
//# sourceMappingURL=provider.d.ts.map