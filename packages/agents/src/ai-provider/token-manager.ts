export class TokenManager {
  private limitPerMinute: number;
  private usedInWindow: number;
  private windowStart: number;
  private tokenizer: any | null = null;

  constructor(limitPerMinute: number = 60000) {
    this.limitPerMinute = limitPerMinute;
    this.usedInWindow = 0;
    this.windowStart = Date.now();
    this.loadTokenizer();
  }

  private loadTokenizer() {
    try {
      // Try dynamic import of tiktoken or compatible tokenizer
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Tiktoken } = require('tiktoken');
      this.tokenizer = new Tiktoken();
    } catch (e) {
      try {
        // alternative package name
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const t = require('@dqbd/tiktoken');
        this.tokenizer = t;
      } catch (_e) {
        this.tokenizer = null;
      }
    }
  }

  countTokens(text: string, model?: string): number {
    if (this.tokenizer) {
      try {
        // tokenizers have different APIs; attempt common ones
        if (typeof this.tokenizer.encode === 'function') {
          return this.tokenizer.encode(text).length;
        }
        if (typeof this.tokenizer.count === 'function') {
          return this.tokenizer.count(text);
        }
      } catch (_e) {
        // fallback
      }
    }
    // fallback: naive whitespace-based token estimate
    return Math.max(1, text.trim().split(/\s+/).length);
  }

  canConsume(tokens: number): boolean {
    const now = Date.now();
    if (now - this.windowStart > 60_000) {
      this.windowStart = now;
      this.usedInWindow = 0;
    }
    return this.usedInWindow + tokens <= this.limitPerMinute;
  }

  consume(tokens: number): void {
    if (!this.canConsume(tokens)) throw new Error('Rate limit exceeded');
    this.usedInWindow += tokens;
  }
}
