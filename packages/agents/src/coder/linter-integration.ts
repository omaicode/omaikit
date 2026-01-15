/**
 * Linter Integration
 * Integrates language-specific linters for code quality checking
 */

import type { CodeFile } from '@omaikit/models';
import { LanguageHandlers } from './language-handlers';

export interface LintIssue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
  score: number; // 0-100
}

export class LinterIntegration {
  private languageHandlers: LanguageHandlers;

  constructor() {
    this.languageHandlers = new LanguageHandlers();
  }

  async init(): Promise<void> {
    // Initialize linters
  }

  /**
   * Lint generated code files
   */
  async lint(files: CodeFile[], language: string): Promise<LintResult[]> {
    return files.map((file) => this.lintFile(file, language));
  }

  /**
   * Lint a single file
   */
  private lintFile(file: CodeFile, language: string): LintResult {
    const issues: LintIssue[] = [];

    // Perform language-specific linting
    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.lintTypeScript(file);

      case 'python':
        return this.lintPython(file);

      case 'go':
        return this.lintGo(file);

      case 'rust':
        return this.lintRust(file);

      case 'csharp':
        return this.lintCsharp(file);

      default:
        return {
          file: file.path,
          issues: [],
          score: 100,
        };
    }
  }

  private lintTypeScript(file: CodeFile): LintResult {
    const issues: LintIssue[] = [];
    const lines = file.content.split('\n');
    let score = 100;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Check for console statements (should use logger)
      if (line.includes('console.log') || line.includes('console.error')) {
        issues.push({
          rule: 'no-console',
          severity: 'warning',
          message: 'Use logger instead of console',
          line: lineNum,
          suggestion: 'Replace with logger.info() or logger.error()',
        });
        score -= 2;
      }

      // Check for var usage (should use const/let)
      if (line.match(/\bvar\b/)) {
        issues.push({
          rule: 'no-var',
          severity: 'error',
          message: 'Use const or let instead of var',
          line: lineNum,
          suggestion: 'Replace var with const',
        });
        score -= 5;
      }

      // Check line length
      if (line.length > 100) {
        issues.push({
          rule: 'max-len',
          severity: 'info',
          message: 'Line exceeds 100 characters',
          line: lineNum,
          suggestion: 'Break line into multiple lines',
        });
        score -= 1;
      }

      // Check for trailing whitespace
      if (line.endsWith(' ') || line.endsWith('\t')) {
        issues.push({
          rule: 'no-trailing-spaces',
          severity: 'info',
          message: 'Trailing whitespace',
          line: lineNum,
        });
        score -= 1;
      }
    });

    return {
      file: file.path,
      issues,
      score: Math.max(0, score),
    };
  }

  private lintPython(file: CodeFile): LintResult {
    const issues: LintIssue[] = [];
    let score = 100;
    const lines = file.content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Check for print statements (should use logging)
      if (line.includes('print(')) {
        issues.push({
          rule: 'no-print',
          severity: 'warning',
          message: 'Use logging instead of print',
          line: lineNum,
          suggestion: 'Use logger.info() or logger.error()',
        });
        score -= 2;
      }

      // Check line length
      if (line.length > 100) {
        issues.push({
          rule: 'line-too-long',
          severity: 'info',
          message: 'Line exceeds 100 characters',
          line: lineNum,
        });
        score -= 1;
      }
    });

    return {
      file: file.path,
      issues,
      score: Math.max(0, score),
    };
  }

  private lintGo(file: CodeFile): LintResult {
    const issues: LintIssue[] = [];
    let score = 100;

    // Check for error handling
    if (!file.content.includes('error')) {
      issues.push({
        rule: 'unhandled-error',
        severity: 'warning',
        message: 'No error handling found',
        suggestion: 'Add error checking for function calls',
      });
      score -= 5;
    }

    return {
      file: file.path,
      issues,
      score: Math.max(0, score),
    };
  }

  private lintRust(file: CodeFile): LintResult {
    const issues: LintIssue[] = [];
    let score = 100;

    // Rust compiler is strict, mostly check for style
    if (!file.content.includes('// ') && file.content.length > 100) {
      issues.push({
        rule: 'missing-comments',
        severity: 'info',
        message: 'Code could benefit from more comments',
      });
      score -= 2;
    }

    return {
      file: file.path,
      issues,
      score: Math.max(0, score),
    };
  }

  private lintCsharp(file: CodeFile): LintResult {
    const issues: LintIssue[] = [];
    let score = 100;
    const lines = file.content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Check for missing XML documentation
      if (line.match(/^\s*(public|protected)\s+(class|interface|struct|enum|async\s)?/)) {
        if (!lines[idx - 1]?.includes('///')) {
          issues.push({
            rule: 'missing-xml-doc',
            severity: 'info',
            message: 'Public member missing XML documentation',
            line: lineNum,
          });
          score -= 2;
        }
      }
    });

    return {
      file: file.path,
      issues,
      score: Math.max(0, score),
    };
  }
}
