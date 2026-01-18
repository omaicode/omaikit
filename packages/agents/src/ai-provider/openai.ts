import { AIProvider, AIProviderOptions, ToolCall } from './provider';
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
      await this.init();
      if (!this.client) {
        throw new Error('OpenAI API key not provided');
      };
    }

    const model = (options && (options as any).model) || 'gpt-5-mini';
    const maxTokens = options?.maxTokens || undefined;
    const temperature = options?.temperature || undefined;

    const tools = this.resolveTools(options);
    const maxToolCalls = options?.maxToolCalls ?? 3;

    let response: OpenAI.Responses.Response | undefined = undefined;
    let previousResponseId: string | undefined = options?.previousResponseId;
    let input: any = [{ role: 'user', content: prompt }];

    for(const toolOutput of options?.toolOutputs || []) {
      input.push(toolOutput);
    }

    for (let i = 0; i <= maxToolCalls; i++) {
      response = await this.client.responses.create({
        model,
        input,
        max_output_tokens: maxTokens,
        temperature,
        tools:
          tools.length > 0
            ? (this.formatToolsForResponses(tools, model) as unknown as Tool[])
            : undefined,
        tool_choice: normalizeToolChoice(options?.toolChoice),
        previous_response_id: previousResponseId || undefined,
        instructions: options?.instructions || undefined,
      });

      const output = response.output;

      if (options?.onTextResponse) {
        output
          .filter((item) => item.type === 'message')
          .forEach((item) => {
            const content = item?.content.find((x) => x.type == 'output_text')?.text || ' ';
            options.onTextResponse?.(content);
          });
      }

      const toolCalls = this.extractToolCalls(response);
      if (toolCalls.length > 0 && !options?.toolRegistry) {
        throw new Error('Tool calls requested but no tool registry provided');
      }

      if (toolCalls.length > 0) {
        const toolOutputs = await this.processToolCalls(toolCalls, options, previousResponseId !== undefined);
        input = toolOutputs;
      }

      previousResponseId = response.id;
    }

    if (response && options?.onResponse) {
      await options.onResponse(response);
    }

    return response ? response.output_text : '';
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
    toolCalls: Array<ToolCall>,
    options?: AIProviderOptions,
    _hasPreviousResponseId?: boolean,
  ): Promise<Array<any>> {
    if (!options?.toolRegistry) {
      throw new Error('Tool calls requested but no tool registry provided');
    }

    const arr: Array<any> = [];
    for (const toolCall of toolCalls) {
      if (options?.onToolCall) {
        options.onToolCall(toolCall);
      }           

      // if (_hasPreviousResponseId) arr.push(toolCall);
      let type = 'function_call_output';
      let args: any = parseToolArgs(toolCall.arguments);

      if (toolCall.type === 'apply_patch_call') {
        type = 'apply_patch_call_output';
        args = toolCall.operation;
      }

      const result = await options.toolRegistry.call(
        toolCall.name || toolCall.type,
        args,
        options.toolContext ?? {},
      );

      const output = {
        type,
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
        status: 'completed',
      };

      if (options?.onToolOutput) {
        options.onToolOutput(output);
      }      
      
      arr.push(output);      
    }
 

    return arr;
  }

  private extractToolCalls(response: OpenAI.Responses.Response): Array<ToolCall> {
    const toolCalls: Array<ToolCall> = [];
    const output = response.output;

    if (!output) {
      return toolCalls;
    }

    for (const item of output) {
      if (item?.type === 'function_call') {
        toolCalls.push(item as ToolCall);
      } else if ((item as any)?.type === 'apply_patch_call') {
        toolCalls.push(item as ToolCall);
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
