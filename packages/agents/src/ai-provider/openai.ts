import { AIProvider, AIProviderOptions } from './provider';
import { ToolDefinition } from '../tools/types';
import OpenAI from 'openai';
import { Tool } from 'openai/resources/responses/responses';

type ResponseTool = Tool | { type: 'web_search' } | { type: 'apply_patch' };

export class OpenAIProvider implements AIProvider {
  private apiKey?: string;
  private client: OpenAI | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY;
  }

  async init(config?: Record<string, unknown>): Promise<void> {
    if (config && (config as any).apiKey) this.apiKey = (config as any).apiKey as string;
    if (!this.apiKey) return;

    try {
      this.client = new OpenAI({ apiKey: this.apiKey });
    } catch (e) {
      // Client may not be available in all environments
      this.client = null;
    }
  }

  async generate(prompt: string, options?: AIProviderOptions): Promise<any> {
    if (!this.client) {
      if (!this.apiKey) return `OPENAI_ECHO:\n${prompt}`;
      await this.init();
      if (!this.client) return `OPENAI_ECHO:\n${prompt}`;
    }

    const model = (options && (options as any).model) || 'gpt-5-mini';
    const maxTokens = options?.maxTokens || undefined;
    const temperature = options?.temperature || undefined;

    const tools = this.resolveTools(options);
    const maxToolCalls = options?.maxToolCalls ?? 3;
    let previousResponseId: string | null = null;
    let input: any = [{ role: 'user', content: prompt }];
    let lastContent = '';

    for (let i = 0; i <= maxToolCalls; i += 1) {
      const response: OpenAI.Responses.Response = await this.client.responses.create({
        model,
        input,
        max_output_tokens: maxTokens,
        temperature,
        tools:
          tools.length > 0 ? (this.formatToolsForResponses(tools, model) as unknown as Tool[]) : undefined,
        tool_choice: normalizeToolChoice(options?.toolChoice),
        previous_response_id: previousResponseId || undefined,
      });

      previousResponseId = response.id;
      const outputText = (response as any).output_text as string | undefined;
      if (outputText && outputText.length > 0) {
        lastContent = outputText;
      } else {
        const output = (response as any).output as
          | Array<{ content?: Array<{ type?: string; text?: string }>; type?: string }>
          | undefined;
        const collected = (output || [])
          .flatMap((item) => item.content || [])
          .filter((item) => item.type === 'output_text' || item.type === 'text')
          .map((item) => item.text || '')
          .join('');
        if (collected) {
          lastContent = collected;
        }
      }
      
      if(lastContent && options?.onTextResponse) {
        options.onTextResponse(lastContent);
      }

      // console.log('Extracted tool calls:', toolCalls);
      const toolCalls = this.extractToolCalls(response);
      if (toolCalls.length === 0) {
        continue;
      }

      if (!options?.toolRegistry) {
        throw new Error('Tool calls requested but no tool registry provided');
      }
      const toolOutputs = await this.processToolCalls(toolCalls, options);
      input = [{ role: 'user', content: prompt }, ...toolOutputs];
    }

    return lastContent;
  }

  private formatToolsForResponses(tools: ToolDefinition[], model: string): Array<ResponseTool> {
    return tools
      .map((tool): ResponseTool | null => {
        if (tool.type && ['web_search', 'apply_patch'].includes(tool.type)) {
          // Check if model is contain `-mini` and then ignore tool, as mini models do not support some tools
          if (model.includes('-mini')) {
            return null;
          }
          const type = tool.type as 'web_search' | 'apply_patch';
          return { type };
        }

        return {
          type: 'function' as const,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          strict: false,
        };
      })
      .filter((t): t is ResponseTool => t !== null);
  }

  async complete(prompt: string): Promise<string> {
    return this.generate(prompt);
  }

  onProgress(_callback: (chunk: string) => void): void {
    // Progress callback handled in generate method
  }

  async close(): Promise<void> {
    // OpenAI client doesn't need explicit closing
  }

  private resolveTools(options?: AIProviderOptions): ToolDefinition[] {
    if (options?.tools && options.tools.length > 0) {
      return options.tools;
    }
    if (options?.toolRegistry) {
      return options.toolRegistry.getDefinitions();
    }
    return [];
  }

  private async processToolCalls(
    toolCalls: Array<{ id: string; name: string; arguments: string; call_id: string }>,
    options?: AIProviderOptions,
  ): Promise<
    Array<{
      type: string;
      output: string;
      call_id: string;
      status: 'completed' | 'failed' | 'incomplete' | 'in_progress';
    }>
  > {
    if (!options?.toolRegistry) {
      throw new Error('Tool calls requested but no tool registry provided');
    }

    const toolOutputs: Array<{
      type: string;
      output: string;
      call_id: string;
      status: 'completed' | 'failed' | 'incomplete' | 'in_progress';
    }> = [];
    console.log('Processing tool calls:', toolCalls);
    for (const toolCall of toolCalls) {
      let type = 'function_call_output';
      let status: 'completed' | 'failed' | 'incomplete' | 'in_progress' = 'completed';
      let args: any = parseToolArgs(toolCall.arguments);

      if (toolCall.name === 'apply_patch_call') {
        type = 'apply_patch_call_output';
        args = toolCall.arguments;
      }

      const result = await options.toolRegistry.call(
        toolCall.name,
        args,
        options.toolContext ?? {},
      );

      status = toolCall.name === 'apply_patch_call'
        ? result.ok
          ? 'completed'
          : 'incomplete'
        : result.ok
          ? 'completed'
          : 'failed';

      if (options?.onToolCall) {
        options.onToolCall({ name: toolCall.name, arguments: args, result });
      }

      toolOutputs.push({
        type,
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
        status,
      });
    }

    return toolOutputs;
  }

  private extractToolCalls(
    response: unknown,
  ): Array<{ id: string; name: string; arguments: string; call_id: string }> {
    const toolCalls: Array<{ id: string; name: string; arguments: string; call_id: string }> = [];
    const output = (response as any)?.output as Array<any> | undefined;
    if (!output) {
      return toolCalls;
    }

    for (const item of output) {
      switch (item?.type) {
        case 'function_call':
          toolCalls.push({
            id: item.id || `tool_${toolCalls.length + 1}`,
            name: item.name,
            arguments: item.arguments || '{}',
            call_id: item.call_id || `call_${toolCalls.length + 1}`,
          });
          break;
        case 'apply_patch_call':
          toolCalls.push({
            id: item.id || `tool_${toolCalls.length + 1}`,
            name: 'apply_patch_call',
            arguments: item.operation || {},
            call_id: item.call_id || `call_${toolCalls.length + 1}`,
          });
          break;
        default:
          break;
      }
    }

    return toolCalls;
  }
}

function parseToolArgs(rawArgs: unknown): Record<string, unknown> {
  try {
    const parsed = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function normalizeToolChoice(choice?: 'auto' | 'none' | { name: string }): any {
  if (!choice || choice === 'auto' || choice === 'none') {
    return choice ?? 'auto';
  }
  return { type: 'function', function: { name: choice.name } };
}
