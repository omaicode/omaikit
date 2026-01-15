import { describe, it, expect } from 'vitest';
import { TestPatterns } from '../../src/tester/test-patterns';

describe('TestPatterns', () => {
  it('should provide patterns for TypeScript', () => {
    const patterns = new TestPatterns().getPatterns('typescript', 'vitest');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]).toHaveProperty('name');
    expect(patterns[0]).toHaveProperty('example');
  });

  it('should provide patterns for Python', () => {
    const patterns = new TestPatterns().getPatterns('python', 'pytest');
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((pattern) => pattern.name === 'unit-test')).toBe(true);
  });
});
