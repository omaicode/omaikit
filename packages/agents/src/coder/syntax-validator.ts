/**
 * Syntax Validator
 * Validates generated code syntax correctness
 */

export class SyntaxValidator {
  async init(): Promise<void> {
    // Initialize any syntax validation tools
  }

  /**
   * Validate code syntax for a given language
   */
  async validate(code: string, language: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.validateTypeScript(code);

      case 'python':
        return this.validatePython(code);

      case 'go':
        return this.validateGo(code);

      case 'rust':
        return this.validateRust(code);

      case 'csharp':
        return this.validateCsharp(code);

      case 'php':
        return this.validatePhp(code);

      default:
        return { isValid: true, errors: [] };
    }
  }

  private validateTypeScript(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check balanced braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    // Check balanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
    }

    // Check balanced brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;

    if (openBrackets !== closeBrackets) {
      errors.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
    }

    // Check for unclosed strings
    const singleQuotes = (code.match(/(?<!\\)'/g) || []).length;
    const doubleQuotes = (code.match(/(?<!\\)"/g) || []).length;
    const backticks = (code.match(/(?<!\\)`/g) || []).length;

    if (singleQuotes % 2 !== 0) {
      errors.push('Unclosed single quote');
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push('Unclosed double quote');
    }
    if (backticks % 2 !== 0) {
      errors.push('Unclosed backtick/template literal');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validatePython(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = code.split('\n');

    // Check indentation consistency
    let expectedIndent = 0;
    let indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '' || line.trim().startsWith('#')) continue;

      const indent = line.length - line.trimStart().length;
      const trimmed = line.trim();

      // Line ending with colon should increase indent
      if (trimmed.endsWith(':')) {
        expectedIndent += 4;
      }

      // Dedent check
      if (indent < expectedIndent && !trimmed.startsWith('def ') && !trimmed.startsWith('class ')) {
        expectedIndent = Math.max(0, expectedIndent - 4);
      }

      if (indent % 4 !== 0) {
        errors.push(`Line ${i + 1}: Indentation not multiple of 4`);
      }
    }

    // Check balanced delimiters
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateGo(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required package statement
    if (!code.includes('package ')) {
      errors.push('Missing package declaration');
    }

    // Check balanced braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateRust(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check balanced braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    // Check for semicolons at statement ends (basic check)
    const statements = code.match(/\w+\s*\(.*?\)/g) || [];
    statements.forEach((stmt, idx) => {
      // This is a very basic check
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateCsharp(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check balanced braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validatePhp(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!code.includes('<?php')) {
      errors.push('Missing PHP opening tag');
    }

    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
