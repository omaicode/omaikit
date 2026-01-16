import { AIProvider, AIProviderOptions } from './provider';
import { ToolDefinition } from '../tools/types';
import OpenAI from 'openai';
import { Tool } from 'openai/resources/responses/responses';

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

  async generate(prompt: string, options?: AIProviderOptions): Promise<string> {
    if (!this.client) {
      // Fallback echo mode when client not available
      if (!this.apiKey) return `OPENAI_ECHO:\n${prompt}`;
      // Try to initialize if not done yet
      await this.init();
      if (!this.client) return `OPENAI_ECHO:\n${prompt}`;
    }

    try {
      const model = (options && (options as any).model) || 'gpt-5-mini';
      const maxTokens = options?.maxTokens || undefined;
      const temperature = options?.temperature || undefined;

      const tools = this.resolveTools(options);
      if (tools.length > 0) {
        if (!options?.toolRegistry) {
          throw new Error('Tool calls requested but no tool registry provided');
        }

        const messages: any[] = [{ role: 'user', content: prompt }];
        const maxToolCalls = options.maxToolCalls ?? 3;
        let lastContent = '';

        for (let i = 0; i <= maxToolCalls; i += 1) {
          const response = await this.client.chat.completions.create({
            model,
            max_completion_tokens: maxTokens,
            temperature,
            messages,
            tools: tools.map((tool) => ({
              type: 'function',
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
            tool_choice: normalizeToolChoice(options.toolChoice),
          });

          const message = response.choices[0]?.message;
          if (!message) {
            return lastContent;
          }

          if (message.content) {
            lastContent = message.content;
          }

          if (!message.tool_calls || message.tool_calls.length === 0) {
            return message.content || lastContent;
          }

          messages.push(message);

          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function?.name;
            const rawArgs = toolCall.function?.arguments || '{}';
            if (!toolName) {
              continue;
            }
            const args = parseToolArgs(rawArgs);
            const result = await options.toolRegistry.call(
              toolName,
              args,
              options.toolContext ?? {},
            );
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          }
        }

        return lastContent;
      }

      const message = await this.client.chat.completions.create({
        model,
        max_completion_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.choices[0]?.message?.content || '';
      if (options?.onProgress) options.onProgress(text);
      return text;
    } catch (error) {
      const err = error as any;
      const message = err?.message || String(error);
      throw new Error(`OpenAI API error: ${message}`);
    }
  }

  async generateCode(prompt: string, options?: AIProviderOptions): Promise<string> {
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
    let input: any = prompt;
    let lastContent = '';

    for (let i = 0; i <= maxToolCalls; i += 1) {
      const response: OpenAI.Responses.Response = await this.client.responses.create({
        model,
        input,
        max_output_tokens: maxTokens,
        temperature,
        tools: tools.length > 0 ? this.formatToolsForResponses(tools) : undefined,
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

      const toolCalls = this.extractToolCalls(response);
      if (toolCalls.length === 0) {
        return lastContent;
      }

      if (!options?.toolRegistry) {
        throw new Error('Tool calls requested but no tool registry provided');
      }

      const toolOutputs = [] as Array<{ type: string; output: string; call_id: string }>;
      for (const toolCall of toolCalls) {
        let type = 'function_call_output';
        if (toolCall.name === 'apply_patch') {
          type = 'apply_patch_output';
        }

        const result = await options.toolRegistry.call(
          toolCall.name,
          parseToolArgs(toolCall.arguments),
          options.toolContext ?? {},
        );

        toolOutputs.push({
          type,
          call_id: toolCall.call_id,
          output: JSON.stringify(result),
        });
      }

      input = [{ role: 'user', content: prompt }, ...toolOutputs];
    }

    return lastContent;
  }

  private formatToolsForResponses(tools: ToolDefinition[]): Array<Tool> {
    return tools.map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      strict: false,
    }));
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

  private extractToolCalls(
    response: unknown,
  ): Array<{ id: string; name: string; arguments: string; call_id: string }> {
    const toolCalls: Array<{ id: string; name: string; arguments: string; call_id: string }> = [];
    const output = (response as any)?.output as Array<any> | undefined;
    if (!output) {
      return toolCalls;
    }

    for (const item of output) {
      if (item?.tool_calls && Array.isArray(item.tool_calls)) {
        for (const toolCall of item.tool_calls) {
          if (toolCall?.name) {
            toolCalls.push({
              id: toolCall.id || toolCall.tool_call_id || `tool_${toolCalls.length + 1}`,
              name: toolCall.name,
              arguments: toolCall.arguments || '{}',
              call_id: toolCall.call_id || toolCall.id || `tool_${toolCalls.length + 1}`,
            });
          }
        }
      }

      if (item?.type === 'tool_call' && item?.name) {
        toolCalls.push({
          id: item.id || item.tool_call_id || `tool_${toolCalls.length + 1}`,
          name: item.name,
          arguments: item.arguments || '{}',
          call_id: item.call_id || item.id || `tool_${toolCalls.length + 1}`,
        });
      }

      if (item?.type === 'function_call' && item?.name) {
        toolCalls.push({
          id: item.id || `tool_${toolCalls.length + 1}`,
          name: item.name,
          arguments: item.arguments || '{}',
          call_id: item.call_id || `call_${toolCalls.length + 1}`,
        });
      }
    }

    return toolCalls;
  }
}

function parseToolArgs(rawArgs: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawArgs);
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
