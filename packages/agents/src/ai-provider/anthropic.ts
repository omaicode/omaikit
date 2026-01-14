import { AIProvider, AIProviderOptions } from './provider';

export class AnthropicProvider implements AIProvider {
  private apiKey?: string;
  private client: any;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
  }

  async init(config?: Record<string, unknown>): Promise<void> {
    if (config && (config as any).apiKey) this.apiKey = (config as any).apiKey as string;

    if (!this.apiKey) return;

    try {
      // Dynamic import of official Anthropic SDK
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Anthropic = require('@anthropic-ai/sdk').default;
      this.client = new Anthropic({ apiKey: this.apiKey });
    } catch (e) {
      // Client may not be available in all environments
      this.client = null;
    }
  }

  async generate(prompt: string, options?: AIProviderOptions): Promise<string> {
    if (!this.client) {
      // Fallback echo mode when client not available
      if (!this.apiKey) return `ANTHROPIC_ECHO:\n${prompt}`;
      // Try to initialize if not done yet
      await this.init();
      if (!this.client) return `ANTHROPIC_ECHO:\n${prompt}`;
    }

    try {
      const model = (options && (options as any).model) || 'claude-3-5-sonnet-20241022';
      const maxTokens = options?.maxTokens || 1024;

      if (options?.stream && options?.onProgress) {
        // Use streaming with official SDK
        return await this.generateStream(prompt, model, maxTokens, options.onProgress);
      } else {
        // Non-streaming completion
        const message = await this.client.messages.create({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        });

        const text = (message.content[0] as any)?.text || '';
        if (options?.onProgress) options.onProgress(text);
        return text;
      }
    } catch (error) {
      const err = error as any;
      const message = err?.message || String(error);
      throw new Error(`Anthropic API error: ${message}`);
    }
  }

  private async generateStream(
    prompt: string,
    model: string,
    maxTokens: number,
    onProgress: (chunk: string) => void
  ): Promise<string> {
    let accumulated = '';

    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        const text = (chunk.delta as any).text;
        if (text) {
          accumulated += text;
          onProgress(text);
        }
      }
    }

    return accumulated;
  }

  async complete(prompt: string): Promise<string> {
    return this.generate(prompt);
  }

  onProgress(callback: (chunk: string) => void): void {
    // Progress callback handled in generate method
  }

  async close(): Promise<void> {
    // Anthropic client doesn't need explicit closing
  }}