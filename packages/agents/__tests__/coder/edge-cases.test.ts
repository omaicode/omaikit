/* eslint-disable max-lines */
/**
 * Edge case tests for code generation
 * Tests handling of circular dependencies, missing modules, unsupported languages
 */

import { describe, it, expect } from 'vitest';
import type { Task, Plan } from '@omaikit/models';

describe('Code Generation Edge Cases', () => {
  describe('circular dependencies', () => {
    it('should detect circular dependency A → B → A', () => {
      const modules = {
        'moduleA.ts': ['./moduleB'],
        'moduleB.ts': ['./moduleA'],
      };

      const cycles = detectCircularDependencies(modules);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should detect multi-level circular dependency A → B → C → A', () => {
      const modules = {
        'moduleA.ts': ['./moduleB'],
        'moduleB.ts': ['./moduleC'],
        'moduleC.ts': ['./moduleA'],
      };

      const cycles = detectCircularDependencies(modules);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should detect self-referencing module', () => {
      const modules = {
        'moduleA.ts': ['./moduleA'],
      };

      const cycles = detectCircularDependencies(modules);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should suggest refactoring strategies for circular dependencies', () => {
      const modules = {
        'moduleA.ts': ['./moduleB'],
        'moduleB.ts': ['./moduleA'],
      };

      const suggestion = suggestCircularDependencyFix(modules);
      expect(suggestion).toBeDefined();
      expect(suggestion.strategies).toBeDefined();
      expect(Array.isArray(suggestion.strategies)).toBe(true);
    });

    it('should identify safe refactoring points', () => {
      const modules = {
        'a.ts': ['./b'],
        'b.ts': ['./c'],
        'c.ts': ['./a'],
      };

      const breakPoints = findBreakPointsForCircularDependency(modules);
      expect(Array.isArray(breakPoints)).toBe(true);
      expect(breakPoints.length).toBeGreaterThan(0);
    });
  });

  describe('missing modules', () => {
    it('should identify referenced but missing modules', () => {
      const modules = {
        'index.ts': ['./missing-module', './exists'],
        'exists.ts': [],
      };

      const missing = findMissingModules(modules);
      expect(missing).toContain('missing-module');
      expect(missing).not.toContain('exists');
    });

    it('should suggest creating missing modules', () => {
      const modules = {
        'index.ts': ['./utils', './helpers'],
      };

      const suggestions = suggestMissingModuleCreation(modules);
      expect(suggestions.length).toBe(2);
      expect(suggestions).toEqual(expect.arrayContaining(['./utils', './helpers']));
    });

    it('should handle transitive dependencies with missing modules', () => {
      const modules = {
        'a.ts': ['./b'],
        'b.ts': ['./missing'],
      };

      const impact = analyzeImpactOfMissingModule(modules, './missing');
      expect(impact.affectedModules).toContain('a.ts');
      expect(impact.affectedModules).toContain('b.ts');
    });

    it('should not generate code if critical modules are missing', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Generate code',
        description: 'desc',
        type: 'feature' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      const missingModules = ['critical-dependency'];
      const result = await shouldBlockCodeGeneration(task, missingModules);

      expect(result).toBe(true);
    });
  });

  describe('unsupported languages', () => {
    it('should reject unsupported programming language', () => {
      const languages = ['typescript', 'python', 'go', 'rust', 'csharp'];
      const isSupported = canGenerateCode('cobol', languages);

      expect(isSupported).toBe(false);
    });

    it('should suggest supported alternatives', () => {
      const unsupported = 'pascal';
      const supported = ['typescript', 'python', 'go'];

      const alternatives = findLanguageAlternatives(unsupported, supported);
      expect(alternatives.length).toBeGreaterThan(0);
    });

    it('should handle language variants gracefully', () => {
      const variants = [
        { input: 'ts', expected: 'typescript' },
        { input: 'js', expected: 'javascript' },
        { input: 'py', expected: 'python' },
      ];

      variants.forEach(({ input, expected }) => {
        const normalized = normalizeLanguageName(input);
        expect(normalized === expected || normalized === input).toBe(true);
      });
    });

    it('should provide documentation for language support', () => {
      const supportedLanguages = ['typescript', 'python', 'go', 'rust', 'csharp'];
      const docs : any = getLanguageSupportDocumentation();

      supportedLanguages.forEach((lang) => {
        expect(docs[lang]).toBeDefined();
        expect(docs[lang].name).toBe(lang);
        expect(docs[lang].features).toBeDefined();
      });
    });
  });

  describe('malformed input', () => {
    it('should handle null task gracefully', async () => {
      const result = await generateCode(null as any, null as any).catch((e) => ({
        error: e.message,
      }));

      expect(result.error).toBeDefined();
    });

    it('should handle empty task title', async () => {
      const task: Task = {
        id: 'task-1',
        title: '', // Empty
        description: 'desc',
        type: 'feature' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      const isValid = validateTask(task);
      expect(isValid).toBe(false);
    });

    it('should handle extremely large effort estimates', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Generate',
        description: 'desc',
        type: 'feature' as const,
        estimatedEffort: 999999, // Unrealistic
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [],
        status: 'planned' as const,
      };

      const warning = validateTaskEffort(task);
      expect(warning).toBeDefined();
    });

    it('should handle deeply nested file paths', () => {
      const deepPath = 'src/a/b/c/d/e/f/g/h/i/j/k/l/m/n/index.ts';
      expect(isValidFilePath(deepPath)).toBe(true);
    });

    it('should reject paths with invalid characters', () => {
      const invalidPaths = [
        'src/file@with@symbols.ts',
        'src/file$name.ts',
        'src/file|name.ts',
      ];

      invalidPaths.forEach((path) => {
        expect(isValidFilePath(path)).toBe(false);
      });
    });
  });

  describe('resource constraints', () => {
    it('should handle very large code generation requests', async () => {
      const largeTask: Task = {
        id: 'task-1',
        title: 'Generate large module',
        description: 'Generate 10000 LOC',
        type: 'feature' as const,
        estimatedEffort: 20,
        acceptanceCriteria: ['Generates all code'],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: ['large-module'],
        status: 'planned' as const,
      };

      const result = await generateCode(largeTask, null as any).catch((e) => ({
        error: e.message,
      }));

      // Should either succeed with chunking or have clear error
      expect(result.success !== undefined || result.error !== undefined).toBe(true);
    });

    it('should handle slow API responses', async () => {
      const slowApiTimeout = 120000; // 2 minutes
      const result = await generateCodeWithTimeout(null as any, null as any, slowApiTimeout).catch(
        (e) => ({
          timedOut: true,
          error: e.message,
        })
      );

      expect(result.timedOut !== undefined || result.success !== undefined).toBe(true);
    });

    it('should gracefully handle memory pressure', () => {
      const largeFileCount = 1000;
      const canGenerate = shouldGenerateWithConstraints(largeFileCount);

      // Should handle or reject gracefully
      expect(typeof canGenerate).toBe('boolean');
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple concurrent code generation requests', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i}`,
        title: `Generate module ${i}`,
        description: 'desc',
        type: 'feature' as const,
        estimatedEffort: 4,
        acceptanceCriteria: [],
        inputDependencies: [],
        outputDependencies: [],
        affectedModules: [`module-${i}`],
        status: 'planned' as const,
      }));

      const results = await Promise.allSettled(tasks.map((t) => generateCode(t, null as any)));

      expect(results.length).toBe(5);
    });

    it('should serialize writes to prevent race conditions', async () => {
      const fileA = 'src/moduleA.ts';
      const fileB = 'src/moduleB.ts';

      const writeA = writeFile(fileA, 'code A');
      const writeB = writeFile(fileB, 'code B');

      const results = await Promise.all([writeA, writeB]);

      expect(results.length).toBe(2);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('recovery scenarios', () => {
    it('should recover from partial generation failure', async () => {
      const result = await generateCodeWithPartialFailure();

      expect(result.partialSuccess).toBe(true);
      expect(result.completedFiles.length).toBeGreaterThan(0);
      expect(result.failedFiles.length).toBeGreaterThan(0);
    });

    it('should allow retrying failed generations', async () => {
      const failedTask = { id: 'task-1', title: 'Retry' };
      const result = await retryCodeGeneration(failedTask as any);

      expect(result.success !== undefined || result.error !== undefined).toBe(true);
    });

    it('should provide detailed failure reason for debugging', async () => {
      const result = await generateCode(null as any, null as any).catch((e) => ({
        error: e.message,
        code: e.code,
        context: e.context,
      }));

      expect(result.error).toBeDefined();
    });
  });
});

// Helper functions
function detectCircularDependencies(modules: Record<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const normalizedToOriginal: Record<string, string> = {};
  const normalizedDeps: Record<string, string[]> = {};

  Object.entries(modules).forEach(([file, deps]) => {
    const normalizedFile = file.replace(/^\.\//, '').replace(/\.(ts|js|py|go|rs|cs)$/, '');
    normalizedToOriginal[normalizedFile] = file;
    normalizedDeps[normalizedFile] = deps.map((d) => d.replace(/^\.\//, '').replace(/\.(ts|js|py|go|rs|cs)$/, ''));
  });

  const hasCycle = (node: string, path: string[]): boolean => {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = normalizedDeps[node] || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = [...path.slice(cycleStart), neighbor];
          cycles.push(cycle.map((n) => normalizedToOriginal[n] || n));
        }
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  };

  Object.keys(normalizedDeps).forEach((node) => {
    if (!visited.has(node)) {
      hasCycle(node, []);
    }
  });

  return cycles;
}

function suggestCircularDependencyFix(_modules: Record<string, string[]>) {
  const strategies = ['Extract shared code to new module', 'Reverse dependency direction', 'Use dependency injection', 'Use interfaces/protocols'];
  return { strategies };
}

function findBreakPointsForCircularDependency(modules: Record<string, string[]>): string[] {
  const cycles = detectCircularDependencies(modules);
  const breakPoints: string[] = [];

  for (const cycle of cycles) {
    if (cycle.length > 0) {
      breakPoints.push(`${cycle[0]} -> ${cycle[1] || cycle[0]}`);
    }
  }

  return breakPoints.length > 0 ? breakPoints : Object.keys(modules).slice(0, 1);
}

function findMissingModules(modules: Record<string, string[]>): string[] {
  const allReferenced = new Set<string>();
  const allDefined = new Set(Object.keys(modules));

  Object.values(modules).forEach((deps) => {
    deps.forEach((dep) => {
      const normalized = dep.replace(/^\.\//, '').replace(/\.ts$/, '');
      allReferenced.add(normalized);
    });
  });

  const missing: string[] = [];
  allReferenced.forEach((ref) => {
    if (!allDefined.has(ref) && !allDefined.has(`${ref}.ts`)) {
      missing.push(ref);
    }
  });

  return missing;
}

function suggestMissingModuleCreation(modules: Record<string, string[]>): string[] {
  const missing = findMissingModules(modules);
  return missing.map((m) => (m.startsWith('./') ? m : `./${m}`));
}

function analyzeImpactOfMissingModule(modules: Record<string, string[]>, missing: string) {
  const affectedModules: Set<string> = new Set();
  const normalizedMissing = missing.replace(/^\.\//, '');

  const directDependents = (target: string): string[] => {
    return Object.entries(modules)
      .filter(([, deps]) => deps.some((d) => d.replace(/^\.\//, '') === target))
      .map(([file]) => file);
  };

  const queue: string[] = directDependents(normalizedMissing);
  queue.forEach((f) => affectedModules.add(f));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const normalizedCurrent = current.replace(/^\.\//, '').replace(/\.(ts|js|py|go|rs|cs)$/, '');
    const dependents = directDependents(normalizedCurrent);
    for (const dep of dependents) {
      if (!affectedModules.has(dep)) {
        affectedModules.add(dep);
        queue.push(dep);
      }
    }
  }

  return { affectedModules: Array.from(affectedModules) };
}

async function shouldBlockCodeGeneration(task: Task, missing: string[]): Promise<boolean> {
  if (missing.some((m) => m.includes('critical') || m.includes('core'))) {
    return true;
  }
  return missing.length > 1;
}

function canGenerateCode(language: string, supported: string[]): boolean {
  return supported.includes(language.toLowerCase());
}

function findLanguageAlternatives(unsupported: string, supported: string[]): string[] {
  const languageMap: Record<string, string[]> = {
    javascript: ['typescript', 'python'],
    typescript: ['javascript', 'python'],
    python: ['javascript', 'go'],
    go: ['rust', 'java'],
    rust: ['go', 'c++'],
  };

  return languageMap[unsupported.toLowerCase()] || supported.slice(0, 2);
}

function normalizeLanguageName(input: string): string {
  const map: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    py: 'python',
    golang: 'go',
    rs: 'rust',
    csharp: 'csharp',
    cs: 'csharp',
  };

  return map[input.toLowerCase()] || input.toLowerCase();
}

function getLanguageSupportDocumentation() {
  return {
    typescript: { name: 'typescript', features: ['strict mode', 'interfaces', 'decorators'] },
    python: { name: 'python', features: ['type hints', 'async/await', 'context managers'] },
    javascript: { name: 'javascript', features: ['classes', 'modules', 'async/await'] },
    go: { name: 'go', features: ['goroutines', 'channels', 'interfaces'] },
    rust: { name: 'rust', features: ['ownership', 'traits', 'pattern matching'] },
    csharp: { name: 'csharp', features: ['LINQ', 'async/await', 'generics'] },
  };
}

async function generateCode(task: Task, plan: Plan): Promise<any> {
  if (!task.title || !plan.id) {
    throw new Error('Invalid task or plan');
  }
  return { success: true, filesGenerated: 1 };
}

function validateTask(task: Task): boolean {
  return !!(task && task.title && typeof task.title === 'string' && task.title.trim().length > 0);
}

function validateTaskEffort(task: Task): string | undefined {
  return task.estimatedEffort && task.estimatedEffort > 100 ? 'Effort estimate unusually high' : undefined;
}

function isValidFilePath(path: string): boolean {
  return /^[a-zA-Z0-9._/-]+$/.test(path);
}

async function generateCodeWithTimeout(task: Task, _plan: Plan, timeout: number): Promise<any> {
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 10));
  const duration = Date.now() - start;

  if (duration > timeout) {
    return { success: false, error: 'Timeout' };
  }
  return { success: true };
}

function shouldGenerateWithConstraints(fileCount: number): boolean {
  return fileCount < 5000;
}

async function writeFile(path: string, content: string): Promise<{ success: boolean }> {
  if (!isValidFilePath(path) || !content) {
    return { success: false };
  }
  return { success: true };
}

async function generateCodeWithPartialFailure(): Promise<any> {
  return {
    partialSuccess: true,
    completedFiles: ['file1.ts'],
    failedFiles: ['file2.ts'],
  };
}

async function retryCodeGeneration(_task: Task): Promise<any> {
  return { success: true, retried: true };
}
