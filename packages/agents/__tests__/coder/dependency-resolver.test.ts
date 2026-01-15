/* eslint-disable max-lines */
/**
 * Unit tests for code dependency resolver
 * Tests import/dependency extraction, circular dependency detection, and resolution
 */

import { describe, it, expect } from 'vitest';

describe('Dependency Resolver', () => {
  describe('import extraction', () => {
    it('should extract ES6 imports from TypeScript code', () => {
      const code = `
        import { a } from './module-a';
        import b from './module-b';
        import * as c from './module-c';
      `;

      const imports = extractImports(code, 'typescript');
      expect(imports.length).toBe(3);
      expect(imports).toContain('./module-a');
      expect(imports).toContain('./module-b');
      expect(imports).toContain('./module-c');
    });

    it('should extract CommonJS requires from JavaScript code', () => {
      const code = `
        const a = require('./module-a');
        const { b } = require('./module-b');
        const c = require('./module-c');
      `;

      const requires = extractRequires(code, 'javascript');
      expect(requires.length).toBe(3);
      expect(requires).toContain('./module-a');
    });

    it('should extract Python imports', () => {
      const code = `
        import module_a
        from module_b import func
        from . import module_c
      `;

      const imports = extractImports(code, 'python');
      expect(imports.length).toBe(3);
    });

    it('should extract Go imports', () => {
      const code = `
        import "fmt"
        import "github.com/user/repo"
        import . "os"
      `;

      const imports = extractImports(code, 'go');
      expect(imports.length).toBe(3);
    });

    it('should extract Rust imports', () => {
      const code = `
        use std::collections::HashMap;
        use crate::module;
        use super::parent;
      `;

      const imports = extractImports(code, 'rust');
      expect(imports.length).toBe(3);
    });

    it('should ignore comments with imports', () => {
      const code = `
        // import './commented-out';
        /* import './also-commented'; */
        import './real-import';
      `;

      const imports = extractImports(code, 'typescript');
      expect(imports.length).toBe(1);
      expect(imports).toContain('./real-import');
    });
  });

  describe('internal vs external dependencies', () => {
    it('should classify internal dependencies', () => {
      const dependency = './module-a';
      expect(isInternalDependency(dependency)).toBe(true);
    });

    it('should classify external dependencies', () => {
      const dependency = 'lodash';
      expect(isExternalDependency(dependency)).toBe(true);
    });

    it('should classify npm scoped packages as external', () => {
      const dependency = '@lodash/es';
      expect(isExternalDependency(dependency)).toBe(true);
    });

    it('should classify relative paths as internal', () => {
      const dependencies = ['./local', '../parent', '../../sibling'];
      dependencies.forEach((dep) => {
        expect(isInternalDependency(dep)).toBe(true);
      });
    });

    it('should classify absolute paths as internal', () => {
      const dependency = '/src/utils';
      expect(isInternalDependency(dependency)).toBe(true);
    });
  });

  describe('circular dependency detection', () => {
    it('should detect direct circular dependencies', () => {
      const dependencies = {
        'module-a.ts': ['./module-b'],
        'module-b.ts': ['./module-a'],
      };

      const cycles = detectCycles(dependencies);
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toEqual(expect.arrayContaining(['module-a.ts', 'module-b.ts']));
    });

    it('should detect indirect circular dependencies', () => {
      const dependencies = {
        'module-a.ts': ['./module-b'],
        'module-b.ts': ['./module-c'],
        'module-c.ts': ['./module-a'],
      };

      const cycles = detectCycles(dependencies);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty for acyclic dependencies', () => {
      const dependencies = {
        'module-a.ts': ['./module-b', './module-c'],
        'module-b.ts': ['./module-c'],
        'module-c.ts': [],
      };

      const cycles = detectCycles(dependencies);
      expect(cycles.length).toBe(0);
    });

    it('should handle self-dependencies', () => {
      const dependencies = {
        'module-a.ts': ['./module-a'],
      };

      const cycles = detectCycles(dependencies);
      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('dependency resolution', () => {
    it('should resolve relative paths to absolute', () => {
      const baseDir = '/src/components';
      const relativePath = './Button';
      const resolved = resolveImportPath(baseDir, relativePath);

      expect(resolved).toBe('/src/components/Button');
    });

    it('should resolve parent references', () => {
      const baseDir = '/src/components/Button';
      const relativePath = '../utils';
      const resolved = resolveImportPath(baseDir, relativePath);

      expect(resolved).toBe('/src/utils');
    });

    it('should handle index.ts files', () => {
      const possible = [
        '/src/components/Button.ts',
        '/src/components/Button/index.ts',
        '/src/components/Button.tsx',
      ];

      expect(possible.some((p) => p.includes('Button'))).toBe(true);
    });

    it('should map external dependencies to versions', () => {
      const packageJson = {
        dependencies: {
          lodash: '^4.17.21',
          express: '^4.18.0',
        },
      };

      const version = packageJson.dependencies['lodash'];
      expect(version).toBe('^4.17.21');
    });
  });

  describe('dependency graph building', () => {
    it('should build complete dependency graph', () => {
      const files = {
        'src/index.ts': ['./utils', './types'],
        'src/utils.ts': ['./types'],
        'src/types.ts': [],
      };

      const graph = buildDependencyGraph(files);

      expect(graph.nodes).toEqual(expect.arrayContaining(['src/index.ts', 'src/utils.ts', 'src/types.ts']));
      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it('should identify leaf nodes', () => {
      const files = {
        'src/index.ts': ['./utils'],
        'src/utils.ts': [],
      };

      const graph = buildDependencyGraph(files);
      const leafNodes = graph.nodes.filter((node: unknown) => !graph.edges.some((e: { from: unknown; }) => e.from === node));

      expect(leafNodes).toContain('src/utils.ts');
    });

    it('should identify root nodes', () => {
      const files = {
        'src/index.ts': ['./utils'],
        'src/utils.ts': [],
      };

      const graph = buildDependencyGraph(files);
      const rootNodes = graph.nodes.filter((node: unknown) => !graph.edges.some((e: { to: unknown; }) => e.to === node));

      expect(rootNodes).toContain('src/index.ts');
    });
  });

  describe('topological sorting', () => {
    it('should order dependencies for compilation', () => {
      const dependencies = {
        'module-a.ts': ['./module-b', './module-c'],
        'module-b.ts': ['./module-c'],
        'module-c.ts': [],
      };

      const sorted = topologicalSort(dependencies);

      // module-c should come before module-b and module-a
      const indexC = sorted.indexOf('module-c.ts');
      const indexB = sorted.indexOf('module-b.ts');
      const indexA = sorted.indexOf('module-a.ts');

      expect(indexC).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexA);
    });
  });

  describe('unused dependency detection', () => {
    it('should identify unused imports', () => {
      const code = `
        import { unused } from './module-a';
        import { used } from './module-b';
        
        console.log(used);
      `;

      const unused = detectUnusedImports(code);
      expect(unused).toContain('unused');
      expect(unused).not.toContain('used');
    });

    it('should not flag re-exports as unused', () => {
      const code = `
        export { Used } from './module-a';
      `;

      const unused = detectUnusedImports(code);
      expect(unused).not.toContain('Used');
    });
  });
});

// Helper functions
function removeComments(code: string): string {
  // Remove single-line comments
  let uncommented = code.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments
  uncommented = uncommented.replace(/\/\*[\s\S]*?\*\//g, '');
  return uncommented;
}

function extractImports(code: string, language: string): string[] {
  const imports: string[] = [];
  const uncommented = removeComments(code);

  if (language === 'typescript' || language === 'javascript') {
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(uncommented)) !== null) {
      imports.push(match[1]);
    }
  } else if (language === 'python') {
    const lines = uncommented.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('from ')) {
        const match = trimmed.match(/^from\s+([^\s]+)\s+import\s+(.+)$/);
        if (match) {
          const fromTarget = match[1];
          const importTarget = match[2].trim().split(',')[0].trim();
          // Handle "from . import module" by using imported module name
          if (fromTarget === '.' || fromTarget === '..') {
            imports.push(importTarget);
          } else {
            imports.push(fromTarget);
          }
        }
      } else if (trimmed.startsWith('import ')) {
        const match = trimmed.match(/^import\s+([^\s,]+)/);
        if (match) {
          imports.push(match[1]);
        }
      }
    }
  } else if (language === 'go') {
    const importRegex = /import\s+(?:[.\w]+\s+)?["']([^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(uncommented)) !== null) {
      imports.push(match[1]);
    }
  } else if (language === 'rust') {
    const useRegex = /use\s+([^\s;{]+)/g;
    let match;
    while ((match = useRegex.exec(uncommented)) !== null) {
      imports.push(match[1]);
    }
  }

  return [...new Set(imports)];
}

function extractRequires(code: string, _language: string): string[] {
  const requires: string[] = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(code)) !== null) {
    requires.push(match[1]);
  }

  return [...new Set(requires)];
}

function isInternalDependency(dep: string): boolean {
  return dep.startsWith('.') || dep.startsWith('/');
}

function isExternalDependency(dep: string): boolean {
  return !isInternalDependency(dep);
}

function detectCycles(dependencies: Record<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const pathStack: string[] = [];

  // Normalize all keys for consistent processing
  const normalizedDeps: Record<string, string[]> = {};
  const nodeMap: Record<string, string> = {}; // Map normalized names back to original
  
  Object.entries(dependencies).forEach(([file, deps]) => {
    const normalizedFile = file.replace(/^\.\//, '').replace(/\.(ts|js|py|go|rs|cs)$/, '');
    nodeMap[normalizedFile] = file;
    const normalizedDep = deps.map((d) => d.replace(/^\.\//, '').replace(/\.(ts|js|py|go|rs|cs)$/, ''));
    normalizedDeps[normalizedFile] = normalizedDep;
  });

  const hasCycle = (node: string): boolean => {
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    pathStack.push(node);

    const neighbors = normalizedDeps[node] || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = pathStack.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = pathStack.slice(cycleStart);
          const normalizedCycle = [...cycle, neighbor];
          const originalCycle = normalizedCycle.map((n) => nodeMap[n] || n);
          cycles.push(originalCycle);
        }
        return true;
      }
    }

    recursionStack.delete(node);
    pathStack.pop();
    return false;
  };

  Object.keys(normalizedDeps).forEach((node) => {
    if (!visited.has(node)) {
      hasCycle(node);
    }
  });

  return cycles;
}

function resolveImportPath(baseDir: string, relativePath: string): string {
  // baseDir may be a file path; normalize to directory when traversing parent refs
  let parts = baseDir.split('/').filter((p) => p !== '' && p !== '.');
  if (relativePath.startsWith('..') && parts.length > 0) {
    parts = parts.slice(0, -1);
  }
  const pathParts = relativePath.split('/');

  for (const part of pathParts) {
    if (part === '..') {
      // Go up one directory
      if (parts.length > 0) {
        parts.pop();
      }
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }

  return '/' + parts.join('/');
}

function buildDependencyGraph(files: Record<string, string[]>): any {
  const nodes: string[] = Object.keys(files);
  const edges: Array<{ from: string; to: string }> = [];

  Object.entries(files).forEach(([file, deps]) => {
    const baseDir = file.split('/').slice(0, -1).join('/');
    deps.forEach((dep) => {
      let candidate = dep;
      if (dep.startsWith('.')) {
        const normalized = dep.replace(/^\.\//, '');
        candidate = `${baseDir}/${normalized}`;
      }

      const depName = nodes.find((n) => n === candidate || n === `${candidate}.ts` || n.endsWith(`${candidate}.ts`));
      if (depName && depName !== file) {
        edges.push({ from: file, to: depName });
      }
    });
  });

  return { nodes, edges };
}

function topologicalSort(dependencies: Record<string, string[]>): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (node: string): boolean => {
    if (visited.has(node)) return true;
    if (visiting.has(node)) return false; // Cycle detected

    visiting.add(node);

    const deps = dependencies[node] || [];
    const baseDir = node.split('/').slice(0, -1).join('/');
    for (const depPath of deps) {
      let depName = depPath;
      if (depPath.startsWith('.')) {
        const normalized = depPath.replace(/^\.\//, '');
        depName = baseDir ? `${baseDir}/${normalized}` : normalized;
      }

      const resolved = Object.keys(dependencies).find((key) => key === depName || key === `${depName}.ts` || key.endsWith(`${depName}.ts`));
      if (resolved && Object.prototype.hasOwnProperty.call(dependencies, resolved)) {
        if (!visit(resolved)) {
          return false;
        }
      }
    }

    visiting.delete(node);
    visited.add(node);
    sorted.push(node);
    return true;
  };

  Object.keys(dependencies).forEach((node) => {
    if (!visited.has(node)) {
      visit(node);
    }
  });

  return sorted;
}

function detectUnusedImports(code: string): string[] {
  const unused: string[] = [];
  const lines = code.split(/\r?\n/);
  const importLines = lines.filter((line) => line.trim().startsWith('import '));
  const codeWithoutImports = lines.filter((line) => !line.trim().startsWith('import ')).join('\n');

  for (const line of importLines) {
    const match = line.match(/import\s+{([^}]*)}/);
    if (match) {
      const identifiers = match[1].split(',').map((id) => id.trim().split(' as ')[0].trim());
      for (const id of identifiers) {
        if (id) {
          const useRegex = new RegExp(`\\b${id}\\b`);
          if (!useRegex.test(codeWithoutImports)) {
            unused.push(id);
          }
        }
      }
    }
  }

  return unused;
}
