/**
 * Language Handler Registry
 * Provides language-specific code generation and validation support
 */

export interface LanguageHandler {
  name: string;
  extensions: string[];
  syntaxValidator: (code: string) => boolean;
  dependencyExtractor: (code: string) => string[];
  linterConfig: Record<string, any>;
  formatter: (code: string) => string;
  errorHandlingPattern: string;
  loggingPattern: string;
}

export class LanguageHandlers {
  private handlers: Map<string, LanguageHandler>;

  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    // TypeScript/JavaScript
    this.register({
      name: 'typescript',
      extensions: ['.ts', '.tsx'],
      syntaxValidator: this.validateTypeScript,
      dependencyExtractor: this.extractTypeScriptDependencies,
      linterConfig: {
        extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
        rules: {
          'no-console': 'warn',
          'no-unused-vars': 'error',
          'consistent-return': 'error',
        },
      },
      formatter: (code) => code, // Prettier would handle this
      errorHandlingPattern: 'try-catch',
      loggingPattern: 'logger.log/error/warn',
    });

    this.register({
      name: 'javascript',
      extensions: ['.js', '.jsx'],
      syntaxValidator: this.validateJavaScript,
      dependencyExtractor: this.extractJavaScriptDependencies,
      linterConfig: {
        extends: 'eslint:recommended',
        rules: {
          'no-unused-vars': 'error',
          'consistent-return': 'error',
        },
      },
      formatter: (code) => code,
      errorHandlingPattern: 'try-catch',
      loggingPattern: 'console.log/error',
    });

    // Python
    this.register({
      name: 'python',
      extensions: ['.py'],
      syntaxValidator: this.validatePython,
      dependencyExtractor: this.extractPythonDependencies,
      linterConfig: {
        extend: 'pylint:all',
        disable: ['missing-docstring'],
        max_line_length: 100,
      },
      formatter: (code) => code, // Black would handle this
      errorHandlingPattern: 'try-except',
      loggingPattern: 'logging.log/error/warning',
    });

    // Go
    this.register({
      name: 'go',
      extensions: ['.go'],
      syntaxValidator: this.validateGo,
      dependencyExtractor: this.extractGoDependencies,
      linterConfig: {
        golangci_lint: {
          linters: ['vet', 'golint', 'ineffassign'],
        },
      },
      formatter: (code) => code, // gofmt would handle this
      errorHandlingPattern: 'error-return',
      loggingPattern: 'log.Printf/Println',
    });

    // Rust
    this.register({
      name: 'rust',
      extensions: ['.rs'],
      syntaxValidator: this.validateRust,
      dependencyExtractor: this.extractRustDependencies,
      linterConfig: {
        lint: ['clippy'],
      },
      formatter: (code) => code, // rustfmt would handle this
      errorHandlingPattern: 'result-type',
      loggingPattern: 'log::info/error/warn',
    });

    // C#
    this.register({
      name: 'csharp',
      extensions: ['.cs'],
      syntaxValidator: this.validateCsharp,
      dependencyExtractor: this.extractCsharpDependencies,
      linterConfig: {
        roslyn_analyzers: ['enabled'],
      },
      formatter: (code) => code,
      errorHandlingPattern: 'try-catch',
      loggingPattern: 'ILogger.Log/Error',
    });
  }

  register(handler: LanguageHandler): void {
    this.handlers.set(handler.name, handler);
    this.handlers.set(handler.extensions[0].slice(1), handler); // Register by extension too
  }

  getHandler(language: string): LanguageHandler {
    const handler = this.handlers.get(language);
    if (!handler) {
      throw new Error(`Unsupported language: ${language}`);
    }
    return handler;
  }

  supportedLanguages(): string[] {
    return Array.from(new Set(Array.from(this.handlers.values()).map((h) => h.name)));
  }

  getHandlerByExtension(extension: string): LanguageHandler | undefined {
    return this.handlers.get(extension);
  }

  // Validation methods
  private validateTypeScript(code: string): boolean {
    // Basic validation - check for balanced braces and parens
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;

    return openBraces === closeBraces && openParens === closeParens;
  }

  private validateJavaScript(code: string): boolean {
    return this.validateTypeScript(code);
  }

  private validatePython(code: string): boolean {
    // Python: check indentation and basic syntax
    const lines = code.split('\n');
    let lastIndent = 0;

    for (const line of lines) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      const indent = line.length - line.trimStart().length;
      // Allow increase of up to 4 spaces
      if (indent > lastIndent && indent - lastIndent > 4) {
        return false;
      }
      lastIndent = indent;
    }

    return true;
  }

  private validateGo(code: string): boolean {
    // Basic Go validation
    return code.includes('package ') && this.validateTypeScript(code);
  }

  private validateRust(code: string): boolean {
    // Basic Rust validation
    return this.validateTypeScript(code);
  }

  private validateCsharp(code: string): boolean {
    // Basic C# validation
    return this.validateTypeScript(code);
  }

  // Dependency extraction methods
  private extractTypeScriptDependencies(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return [...new Set(imports)];
  }

  private extractJavaScriptDependencies(code: string): string[] {
    return this.extractTypeScriptDependencies(code).concat(
      ...((code.match(/require\(['"]([^'"]+)['"]\)/g) || []).map((m) => m.match(/require\(['"]([^'"]+)['"]\)/)?.[1] || ''))
    );
  }

  private extractPythonDependencies(code: string): string[] {
    const imports: string[] = [];

    const fromImportRegex = /from\s+([^\s]+)\s+import/g;
    const importRegex = /import\s+([^\s]+)/g;

    let match;
    while ((match = fromImportRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return [...new Set(imports)];
  }

  private extractGoDependencies(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:\(([^)]+)\)|"([^"]+)")/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      const group = match[1] || match[2];
      if (group) {
        group.split('\n').forEach((line) => {
          const pkg = line.match(/"([^"]+)"/)?.[1];
          if (pkg) imports.push(pkg);
        });
      }
    }

    return [...new Set(imports)];
  }

  private extractRustDependencies(code: string): string[] {
    const imports: string[] = [];
    const useRegex = /use\s+([^;]+);/g;
    let match;

    while ((match = useRegex.exec(code)) !== null) {
      imports.push(match[1].trim());
    }

    return [...new Set(imports)];
  }

  private extractCsharpDependencies(code: string): string[] {
    const imports: string[] = [];
    const usingRegex = /using\s+([^\s;]+);/g;
    let match;

    while ((match = usingRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return [...new Set(imports)];
  }
}
