import { AIProvider, AIProviderOptions } from './provider';

export class OpenAIProvider implements AIProvider {
  private apiKey?: string;
  private client: any;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY;
  }

  async init(config?: Record<string, unknown>): Promise<void> {
    if (config && (config as any).apiKey) this.apiKey = (config as any).apiKey as string;
    if (!this.apiKey) return;

    try {
      // Dynamic import of official OpenAI SDK
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const OpenAI = require('openai').default;
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
      const model = (options && (options as any).model) || 'gpt-4o-mini';
      const maxTokens = options?.maxTokens || 2048;
      const temperature = options?.temperature || 0.7;

      if (options?.stream && options?.onProgress) {
        // Use streaming with official SDK
        return await this.generateStream(prompt, model, maxTokens, temperature, options.onProgress);
      } else {
        // Non-streaming completion
        const message = await this.client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        });

        const text = message.choices[0]?.message?.content || '';
        if (options?.onProgress) options.onProgress(text);
        return text;
      }
    } catch (error) {
      const err = error as any;
      const message = err?.message || String(error);
      throw new Error(`OpenAI API error: ${message}`);
    }
  }

  private async generateStream(
    prompt: string,
    model: string,
    maxTokens: number,
    temperature: number,
    onProgress: (chunk: string) => void
  ): Promise<string> {
    let accumulated = '';

    const stream = await this.client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        accumulated += text;
        onProgress(text);
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
    // OpenAI client doesn't need explicit closing
  }
}