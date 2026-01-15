import { describe, it, expect } from 'vitest';
import { AnthropicProvider } from '../src/ai-provider/anthropic';

const apiKey = process.env.ANTHROPIC_API_KEY;

describe('AnthropicProvider integration', () => {
  it('skips if no API key', () => {
    if (!apiKey) {
      expect(true).toBe(true);
      return;
    }
  });

  it('returns a response for a simple prompt', async () => {
    if (!apiKey) return;
    const p = new AnthropicProvider(apiKey);
    await p.init();
    const res = await p.generate('Hello world', { maxTokens: 5 });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });
});
