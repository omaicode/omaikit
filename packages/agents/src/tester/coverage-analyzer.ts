import type { TestFile } from '@omaikit/models';

export interface CoverageResult {
  overall: number;
  byFile: Record<string, number>;
}

export class CoverageAnalyzer {
  analyze(files: TestFile[]): CoverageResult {
    if (files.length === 0) {
      return { overall: 0, byFile: {} };
    }

    const byFile: Record<string, number> = {};
    const scores = files.map((file) => {
      const testCount = file.testCases.length;
      const base = file.content.includes('describe') || file.content.includes('def test_') ? 70 : 60;
      const score = Math.min(95, base + testCount * 5);
      byFile[file.path] = score;
      return score;
    });

    const overall = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    return { overall, byFile };
  }
}
