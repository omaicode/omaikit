import { ToolDefinition, ToolContext } from '../tools/types';
import { ToolRegistry } from '../tools/registry';
import OpenAI from 'openai';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown> | string;
  call_id: string;
}

export interface AIProviderOptions {
  model?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  onProgress?: (chunk: string) => void;
  onToolCall?: (event: ToolCall) => void;
  onTextResponse?: (text: string) => void;
  onResponse?: (response: OpenAI.Responses.Response) => Promise<void>;
  tools?: ToolDefinition[];
  toolRegistry?: ToolRegistry;
  toolContext?: ToolContext;
  toolChoice?: 'auto' | 'none' | { name: string };
  maxToolCalls?: number;
  instructions?: string;
  previousResponseId?: string;
}

export interface AIProvider {
  init?(config?: Record<string, unknown>): Promise<void> | void;
  generate(prompt: string, options?: AIProviderOptions): Promise<string>;
  close?(): Promise<void> | void;
  complete?(prompt: string): Promise<string>;
  onProgress?(callback: (chunk: string) => void): void;
}
