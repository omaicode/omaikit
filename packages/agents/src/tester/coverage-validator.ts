export interface CoverageValidationResult {
  isValid: boolean;
  target: number;
  actual: number;
  issues: string[];
}

export class CoverageValidator {
  validate(coverage: number, target: number = 80): CoverageValidationResult {
    if (coverage >= target) {
      return { isValid: true, target, actual: coverage, issues: [] };
    }

    return {
      isValid: false,
      target,
      actual: coverage,
      issues: [`Coverage ${coverage}% is below target ${target}%`],
    };
  }
}
