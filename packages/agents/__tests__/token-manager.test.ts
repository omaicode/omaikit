import { describe, it, expect } from 'vitest';
import { TokenManager } from '../src/ai-provider/token-manager';

describe('TokenManager', () => {
  it('counts tokens with fallback whitespace', () => {
    const tm = new TokenManager();
    const text = 'this is a simple test string';
    const count = tm.countTokens(text);
    expect(count).toBeGreaterThanOrEqual(5);
  });

  it('can consume below limit and rejects when exceeded', () => {
    const tm = new TokenManager(10);
    const tokens = 5;
    expect(tm.canConsume(tokens)).toBe(true);
    tm.consume(tokens);
    expect(tm.canConsume(6)).toBe(false);
  });
});
