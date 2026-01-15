/**
 * Code Quality Checker
 * Checks code quality standards (error handling, logging, type safety, etc.)
 */

import type { CodeFile } from '@omaikit/models';

export interface QualityCheck {
  aspect: string;
  pass: boolean;
  message: string;
  details?: string;
}

export class QualityChecker {
  /**
   * Check code quality standards
   */
  async check(files: CodeFile[]): Promise<QualityCheck[][]> {
    return files.map((file) => this.checkFile(file));
  }

  /**
   * Check quality of a single file
   */
  private checkFile(file: CodeFile): QualityCheck[] {
    const language = file.language || 'unknown';
    const checks: QualityCheck[] = [];

    // Universal checks
    checks.push(...this.checkErrorHandling(file, language));
    checks.push(...this.checkLogging(file, language));
    checks.push(...this.checkDocumentation(file, language));

    // Language-specific checks
    switch (language) {
      case 'typescript':
        checks.push(...this.checkTypeScript(file));
        break;
      case 'python':
        checks.push(...this.checkPython(file));
        break;
      case 'go':
        checks.push(...this.checkGo(file));
        break;
      case 'rust':
        checks.push(...this.checkRust(file));
        break;
      case 'csharp':
        checks.push(...this.checkCsharp(file));
        break;
      case 'php':
        checks.push(...this.checkPhp(file));
        break;
    }

    return checks;
  }

  private checkErrorHandling(file: CodeFile, language: string): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    let hasErrorHandling = false;
    let message = '';

    switch (language) {
      case 'typescript':
      case 'javascript':
        hasErrorHandling = content.includes('try') && content.includes('catch');
        message = 'Try-catch error handling';
        break;
      case 'python':
        hasErrorHandling = content.includes('try') && content.includes('except');
        message = 'Try-except error handling';
        break;
      case 'go':
        hasErrorHandling = content.includes('error');
        message = 'Error return value checking';
        break;
      case 'rust':
        hasErrorHandling = content.includes('Result') || content.includes('?');
        message = 'Result type error handling';
        break;
      case 'csharp':
        hasErrorHandling = content.includes('try') && content.includes('catch');
        message = 'Try-catch error handling';
        break;
    }

    checks.push({
      aspect: 'errorHandling',
      pass: hasErrorHandling,
      message: hasErrorHandling ? `✓ ${message}` : `✗ Missing ${message}`,
      details: hasErrorHandling
        ? 'Code includes proper error handling'
        : 'Code should include error handling for robustness',
    });

    return checks;
  }

  private checkLogging(file: CodeFile, language: string): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    let hasLogging = false;

    switch (language) {
      case 'typescript':
      case 'javascript':
        hasLogging = content.includes('logger') || content.includes('console.');
        break;
      case 'python':
        hasLogging = content.includes('logging') || content.includes('logger');
        break;
      case 'go':
        hasLogging = content.includes('log.');
        break;
      case 'rust':
        hasLogging = content.includes('log::');
        break;
      case 'csharp':
        hasLogging = content.includes('Logger') || content.includes('ILogger');
        break;
    }

    checks.push({
      aspect: 'logging',
      pass: hasLogging,
      message: hasLogging ? '✓ Logging present' : '✗ Missing logging statements',
      details: hasLogging
        ? 'Code includes logging for debugging'
        : 'Code should include logging for observability',
    });

    return checks;
  }

  private checkDocumentation(file: CodeFile, language: string): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;
    const lines = content.split('\n');

    let hasDocumentation = false;

    switch (language) {
      case 'typescript':
        hasDocumentation = content.includes('/**') || content.includes('//');
        break;
      case 'python':
        hasDocumentation = content.includes('"""') || content.includes("'''");
        break;
      case 'go':
        hasDocumentation = content.includes('//');
        break;
      case 'rust':
        hasDocumentation = content.includes('///') || content.includes('//');
        break;
      case 'csharp':
        hasDocumentation = content.includes('///') || content.includes('//');
        break;
      case 'php':
        hasDocumentation = content.includes('/**') || content.includes('//');
        break;
    }

    checks.push({
      aspect: 'documentation',
      pass: hasDocumentation,
      message: hasDocumentation ? '✓ Documentation present' : '✗ Missing documentation',
      details: hasDocumentation ? 'Code includes comments/documentation' : 'Code should include documentation',
    });

    return checks;
  }

  private checkTypeScript(file: CodeFile): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    // Check for type annotations
    const hasTypeAnnotations = content.includes(':') || content.includes('interface') || content.includes('type ');
    checks.push({
      aspect: 'typeAnnotations',
      pass: hasTypeAnnotations,
      message: hasTypeAnnotations ? '✓ Type annotations present' : '✗ Missing type annotations',
      details: 'TypeScript should include type definitions',
    });

    // Check for async/await patterns
    const hasAsyncAwait =
      content.includes('async') || content.includes('await') || content.includes('Promise');
    checks.push({
      aspect: 'asyncPatterns',
      pass: hasAsyncAwait || !content.includes('async'),
      message: hasAsyncAwait ? '✓ Proper async/await usage' : '⚠ Mixed async patterns',
      details: 'Use async/await for cleaner asynchronous code',
    });

    return checks;
  }

  private checkPython(file: CodeFile): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    // Check for type hints
    const hasTypeHints = content.includes('->')|| content.includes(':') || content.includes('List[') || content.includes('Dict[');
    checks.push({
      aspect: 'typeHints',
      pass: hasTypeHints,
      message: hasTypeHints ? '✓ Type hints present' : '⚠ Limited type hints',
      details: 'Python 3.6+ should include type hints',
    });

    // Check for docstrings
    const hasDocstrings = content.includes('"""') || content.includes("'''");
    checks.push({
      aspect: 'docstrings',
      pass: hasDocstrings,
      message: hasDocstrings ? '✓ Docstrings present' : '✗ Missing docstrings',
      details: 'Functions should have docstrings',
    });

    return checks;
  }

  private checkGo(file: CodeFile): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    // Check for proper error handling pattern
    const hasErrorCheck = content.includes('if err != nil');
    checks.push({
      aspect: 'errorHandlingStyle',
      pass: hasErrorCheck,
      message: hasErrorCheck ? '✓ Go error pattern used' : '⚠ Inconsistent error handling',
      details: 'Go should check errors explicitly',
    });

    return checks;
  }

  private checkRust(file: CodeFile): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    // Check for ownership patterns
    const hasOwnershipPatterns = content.includes('&') || content.includes('move') || content.includes('ref');
    checks.push({
      aspect: 'ownership',
      pass: hasOwnershipPatterns || content.length < 200,
      message: '✓ Ownership patterns appropriate',
      details: 'Rust ownership is properly handled',
    });

    return checks;
  }

  private checkCsharp(file: CodeFile): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    // Check for XML documentation
    const hasXmlDocs = content.includes('///');
    checks.push({
      aspect: 'xmlDocumentation',
      pass: hasXmlDocs,
      message: hasXmlDocs ? '✓ XML documentation present' : '⚠ Missing XML documentation',
      details: 'Public members should have XML documentation',
    });

    // Check for using statements
    const hasUsingStatements = content.includes('using (') || content.includes('using ');
    checks.push({
      aspect: 'resourceManagement',
      pass: hasUsingStatements || !content.includes('Dispose'),
      message: hasUsingStatements ? '✓ Using statements for resource management' : '✓ No resource management needed',
      details: 'Resources should be properly disposed',
    });

    return checks;
  }

  private checkPhp(file: CodeFile): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const content = file.content;

    const hasNamespace = content.includes('namespace ');
    checks.push({
      aspect: 'namespace',
      pass: hasNamespace,
      message: hasNamespace ? '✓ Namespace declared' : '✗ Missing namespace declaration',
      details: 'PSR-4 requires namespaces that match the directory structure.',
    });

    const hasStrictTypes = content.includes('declare(strict_types=1)');
    checks.push({
      aspect: 'strictTypes',
      pass: hasStrictTypes,
      message: hasStrictTypes ? '✓ strict_types enabled' : '⚠ Missing strict_types declaration',
      details: 'Enable strict typing for safer code.',
    });

    return checks;
  }
}
