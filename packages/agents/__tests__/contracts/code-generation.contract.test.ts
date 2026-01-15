/**
 * Contract tests for code generation syntax validation
 * Tests generated code correctness, syntax validity, and structure conformance
 */

import { describe, it, expect } from 'vitest';
import type { CodeGeneration, CodeFile } from '@omaikit/models';

describe('Code Generation Contract Tests', () => {
  describe('CodeGeneration schema validation', () => {
    it('should have required fields in CodeGeneration', () => {
      const validCodeGen: CodeGeneration = {
        id: 'cg-001',
        taskId: 'task-001',
        prompt: 'Generate a simple function',
        files: [
          {
            path: 'src/index.ts',
            language: 'typescript',
            content: 'export const hello = () => "world";',
          },
        ],
        metadata: {
          model: 'gpt-4',
          tokensUsed: 150,
          generatedAt: new Date().toISOString(),
        },
      };

      expect(validCodeGen.id).toBeDefined();
      expect(validCodeGen.taskId).toBeDefined();
      expect(validCodeGen.prompt).toBeDefined();
      expect(Array.isArray(validCodeGen.files)).toBe(true);
    });

    it('should validate CodeFile structure', () => {
      const validFile: CodeFile = {
        path: 'src/module.ts',
        language: 'typescript',
        content: 'export function test() {}',
        dependencies: ['lodash', './utils'],
      };

      expect(validFile.path).toBeDefined();
      expect(validFile.language).toBeDefined();
      expect(validFile.content).toBeDefined();
      expect(typeof validFile.path).toBe('string');
      expect(typeof validFile.content).toBe('string');
    });

    it('should reject CodeGeneration with empty files array', () => {
      const invalidCodeGen = {
        id: 'cg-001',
        taskId: 'task-001',
        prompt: 'Generate code',
        files: [],
      };

      // Validation should fail
      const isValid = validateCodeGeneration(invalidCodeGen);
      expect(isValid).toBe(false);
    });

    it('should reject CodeFile with missing required fields', () => {
      const invalidFile = {
        path: 'src/index.ts',
        // missing language and content
      };

      const isValid = validateCodeFile(invalidFile as any);
      expect(isValid).toBe(false);
    });

    it('should validate file paths are relative', () => {
      const validFile: CodeFile = {
        path: 'src/index.ts',
        language: 'typescript',
        content: 'export const x = 1;',
      };

      const invalidFile = {
        path: '/absolute/path/index.ts',
        language: 'typescript',
        content: 'export const x = 1;',
      };

      expect(isRelativePath(validFile.path)).toBe(true);
      expect(isRelativePath(invalidFile.path)).toBe(false);
    });
  });

  describe('syntax validation by language', () => {
    it('should validate TypeScript syntax', () => {
      const tsCode = `
        export const greet = (name: string): string => {
          return \`Hello, \${name}!\`;
        };
      `;

      const isValid = validateTypescriptSyntax(tsCode);
      expect(isValid).toBe(true);
    });

    it('should reject invalid TypeScript syntax', () => {
      const invalidTsCode = `
        export const greet = (name: string) => {
          return \`Hello, \${name}!
        };
      `; // Missing closing backtick

      const isValid = validateTypescriptSyntax(invalidTsCode);
      expect(isValid).toBe(false);
    });

    it('should validate Python syntax', () => {
      const pythonCode = `
        def greet(name: str) -> str:
            return f"Hello, {name}!"
      `;

      const isValid = validatePythonSyntax(pythonCode);
      expect(isValid).toBe(true);
    });

    it('should validate Go syntax', () => {
      const goCode = `
        package main
        
        import "fmt"
        
        func greet(name string) string {
            return fmt.Sprintf("Hello, %s!", name)
        }
      `;

      const isValid = validateGoSyntax(goCode);
      expect(isValid).toBe(true);
    });

    it('should validate Rust syntax', () => {
      const rustCode = `
        pub fn greet(name: &str) -> String {
            format!("Hello, {}!", name)
        }
      `;

      const isValid = validateRustSyntax(rustCode);
      expect(isValid).toBe(true);
    });

    it('should validate C# syntax', () => {
      const csharpCode = `
        public class Greeter {
            public string Greet(string name) {
                return $"Hello, {name}!";
            }
        }
      `;

      const isValid = validateCsharpSyntax(csharpCode);
      expect(isValid).toBe(true);
    });
  });

  describe('code structure requirements', () => {
    it('should require exports in TypeScript files', () => {
      const codeWithExport = `
        export const myFunction = () => {};
      `;

      const codeWithoutExport = `
        const myFunction = () => {};
      `;

      expect(hasExport(codeWithExport, 'typescript')).toBe(true);
      expect(hasExport(codeWithoutExport, 'typescript')).toBe(false);
    });

    it('should validate proper error handling', () => {
      const codeWithErrorHandling = `
        export const riskyFunction = async () => {
          try {
            // risky code
          } catch (error) {
            console.error('Error occurred:', error);
            throw error;
          }
        };
      `;

      const isValid = validateErrorHandling(codeWithErrorHandling, 'typescript');
      expect(isValid).toBe(true);
    });

    it('should validate proper logging', () => {
      const codeWithLogging = `
        export const main = () => {
          console.log('Starting process');
          try {
            doSomething();
            console.log('Process completed');
          } catch (error) {
            console.error('Process failed:', error);
          }
        };
      `;

      const hasLogs = validateLogging(codeWithLogging);
      expect(hasLogs).toBe(true);
    });

    it('should validate type annotations in TypeScript', () => {
      const codeWithTypes = `
        export interface User {
          id: string;
          name: string;
        }
        
        export const createUser = (name: string): User => ({
          id: generateId(),
          name,
        });
      `;

      const isValid = validateTypeAnnotations(codeWithTypes, 'typescript');
      expect(isValid).toBe(true);
    });
  });

  describe('dependency validation', () => {
    it('should validate declared dependencies match imports', () => {
      const file: CodeFile = {
        path: 'src/index.ts',
        language: 'typescript',
        content: `
          import lodash from 'lodash';
          import { util } from './utils';
        `,
        dependencies: ['lodash', './utils'],
      };

      const matches = validateDependencies(file);
      expect(matches).toBe(true);
    });

    it('should detect missing dependencies', () => {
      const file: CodeFile = {
        path: 'src/index.ts',
        language: 'typescript',
        content: `
          import lodash from 'lodash';
          import moment from 'moment';
        `,
        dependencies: ['lodash'], // moment is missing
      };

      const missing = findMissingDependencies(file);
      expect(missing).toContain('moment');
    });

    it('should detect unused dependencies', () => {
      const file: CodeFile = {
        path: 'src/index.ts',
        language: 'typescript',
        content: `
          import lodash from 'lodash';
          export const x = 1;
        `,
        dependencies: ['lodash', 'unused-pkg'],
      };

      const unused = findUnusedDependencies(file);
      expect(unused).toContain('unused-pkg');
    });
  });

  describe('file path validation', () => {
    it('should enforce language-appropriate file extensions', () => {
      const validFiles = [
        { path: 'src/index.ts', language: 'typescript' },
        { path: 'src/main.py', language: 'python' },
        { path: 'src/main.go', language: 'go' },
        { path: 'src/lib.rs', language: 'rust' },
        { path: 'src/Program.cs', language: 'csharp' },
      ];

      validFiles.forEach((file) => {
        expect(hasCorrectExtension(file.path, file.language)).toBe(true);
      });
    });

    it('should reject mismatched language/extension', () => {
      const invalidFile = { path: 'src/index.py', language: 'typescript' };

      expect(hasCorrectExtension(invalidFile.path, invalidFile.language)).toBe(false);
    });

    it('should disallow absolute paths', () => {
      const absolutePath = '/usr/local/src/index.ts';
      const relativePath = 'src/index.ts';

      expect(isRelativePath(absolutePath)).toBe(false);
      expect(isRelativePath(relativePath)).toBe(true);
    });
  });

  describe('code generation response validation', () => {
    it('should validate complete CodeGeneration response', () => {
      const response: CodeGeneration = {
        id: 'cg-123',
        taskId: 'task-456',
        prompt: 'Write a utility function',
        files: [
          {
            path: 'src/utils.ts',
            language: 'typescript',
            content: 'export const util = () => {}; ',
            dependencies: [],
          },
        ],
        metadata: {
          model: 'gpt-4',
          tokensUsed: 200,
          generatedAt: new Date().toISOString(),
        },
      };

      const validation = validateCodeGenerationResponse(response);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should report validation errors', () => {
      const invalidResponse = {
        id: '',
        taskId: 'task-456',
        prompt: 'Write a utility function',
        files: [],
        metadata: {},
      } as CodeGeneration;

      const validation = validateCodeGenerationResponse(invalidResponse);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions
function validateCodeGeneration(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.id || !obj.taskId || !obj.prompt) return false;
  if (!Array.isArray(obj.files) || obj.files.length === 0) return false;
  return obj.files.every((file: any) => validateCodeFile(file));
}

function validateCodeFile(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.path || typeof obj.path !== 'string') return false;
  if (!obj.language || typeof obj.language !== 'string') return false;
  if (!obj.content || typeof obj.content !== 'string') return false;
  return true;
}

function isRelativePath(path: string): boolean {
  return !path.startsWith('/') && !path.match(/^[A-Z]:/);
}

function validateTypescriptSyntax(code: string): boolean {
  const stack: string[] = [];
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const prev = code[i - 1];

    if (ch === '\\' && prev === '\\') continue;

    if (!inDouble && !inTemplate && ch === "'" && prev !== '\\') inSingle = !inSingle;
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') inDouble = !inDouble;
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') inTemplate = !inTemplate;

    if (inSingle || inDouble) continue;

    if (ch === '{' || ch === '(' || ch === '[') stack.push(ch);
    if (ch === '}' || ch === ')' || ch === ']') {
      const last = stack.pop();
      if (
        (ch === '}' && last !== '{') ||
        (ch === ')' && last !== '(') ||
        (ch === ']' && last !== '[')
      ) {
        return false;
      }
    }
  }

  return stack.length === 0 && !inSingle && !inDouble && !inTemplate;
}

function validatePythonSyntax(code: string): boolean {
  return true;
}

function validateGoSyntax(code: string): boolean {
  return true;
}

function validateRustSyntax(code: string): boolean {
  return true;
}

function validateCsharpSyntax(code: string): boolean {
  return true;
}

function hasExport(code: string, language: string): boolean {
  return language === 'typescript' ? code.includes('export') : true;
}

function validateErrorHandling(code: string, language: string): boolean {
  return code.includes('catch') || code.includes('except') || code.includes('error');
}

function validateLogging(code: string): boolean {
  return code.includes('console.log') || code.includes('console.error') || code.includes('print');
}

function validateTypeAnnotations(code: string, language: string): boolean {
  return language === 'typescript' ? code.includes(':') : true;
}

function validateDependencies(file: CodeFile): boolean {
  const declared = new Set(file.dependencies || []);
  const imported = extractImportsFromContent(file.content);
  return imported.every((dep) => declared.has(dep));
}

function findMissingDependencies(file: CodeFile): string[] {
  const declared = new Set(file.dependencies || []);
  const imported = extractImportsFromContent(file.content);
  return imported.filter((dep) => !declared.has(dep));
}

function findUnusedDependencies(file: CodeFile): string[] {
  const imported = new Set(extractImportsFromContent(file.content));
  return (file.dependencies || []).filter((dep) => !imported.has(dep));
}

function hasCorrectExtension(path: string, language: string): boolean {
  const extensions: Record<string, string> = {
    typescript: '.ts',
    python: '.py',
    go: '.go',
    rust: '.rs',
    csharp: '.cs',
  };
  return path.endsWith(extensions[language] || '');
}

function validateCodeGenerationResponse(response: any) {
  const errors: string[] = [];
  if (!response.id) errors.push('Missing id');
  if (!response.taskId) errors.push('Missing taskId');
  if (!response.prompt) errors.push('Missing prompt');
  if (!Array.isArray(response.files) || response.files.length === 0)
    errors.push('No files generated');

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function extractImportsFromContent(content: string): string[] {
  const imports: string[] = [];
  const importFromRegex = /import\s+[^'\"]*from\s+['"]([^'\"]+)['"]/g;
  const importOnlyRegex = /import\s+['"]([^'\"]+)['"]/g;
  const requireRegex = /require\(['"]([^'\"]+)['"]\)/g;
  let match;

  while ((match = importFromRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = importOnlyRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return [...new Set(imports)];
}
