import { describe, it, expect } from 'vitest';
import { TestParser } from '../../src/tester/test-parser';

describe('Tester edge cases', () => {
  it('should create fallback file when response is empty', () => {
    const parser = new TestParser();
    const files = parser.parse('', 'typescript', 'vitest');
    expect(files.length).toBe(1);
    expect(files[0].content.length).toBeGreaterThan(0);
  });

  it('should parse code blocks with file headers', () => {
    const parser = new TestParser();
    const response = '```ts\n// File: tests/sample.test.ts\n\ndescribe("sample", () => {});\n```';
    const files = parser.parse(response, 'typescript', 'vitest');
    expect(files[0].path).toContain('tests/sample.test.ts');
  });
});
