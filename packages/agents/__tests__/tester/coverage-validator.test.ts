import { describe, it, expect } from 'vitest';
import { CoverageValidator } from '../../src/tester/coverage-validator';

describe('CoverageValidator', () => {
  it('should pass when coverage meets target', () => {
    const validator = new CoverageValidator();
    const result = validator.validate(85, 80);
    expect(result.isValid).toBe(true);
  });

  it('should fail when coverage is below target', () => {
    const validator = new CoverageValidator();
    const result = validator.validate(60, 80);
    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
