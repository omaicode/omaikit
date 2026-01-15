/**
 * Dependency Resolver
 * Resolves and tracks dependencies in generated code
 */

import type { CodeFile } from '@omaikit/models';
import { LanguageHandlers } from './language-handlers';

export class DependencyResolver {
  private languageHandlers: LanguageHandlers;

  constructor() {
    this.languageHandlers = new LanguageHandlers();
  }

  async init(): Promise<void> {
    // Initialize dependency resolver
  }

  /**
   * Resolve dependencies for generated code files
   */
  async resolveDependencies(files: CodeFile[], projectContext: any): Promise<CodeFile[]> {
    const filesWithDeps = files.map((file) => {
      const handler = this.languageHandlers.getHandler(file.language);
      const dependencies = handler.dependencyExtractor(file.content);

      // Separate internal and external dependencies
      const internalDeps = dependencies.filter((dep) =>
        this.isInternalDependency(dep, projectContext),
      );
      const externalDeps = dependencies.filter(
        (dep) => !this.isInternalDependency(dep, projectContext),
      );

      return {
        ...file,
        dependencies: [...internalDeps, ...externalDeps],
      };
    });

    // Check for circular dependencies
    const circular = this.detectCircularDependencies(filesWithDeps);
    if (circular.length > 0) {
      console.warn('Circular dependencies detected:', circular);
    }

    return filesWithDeps;
  }

  /**
   * Detect circular dependencies in generated files
   */
  private detectCircularDependencies(files: CodeFile[]): string[][] {
    const graph = new Map<string, string[]>();

    // Build dependency graph
    files.forEach((file) => {
      graph.set(file.path, file.dependencies || []);
    });

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string, path: string[]): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor, [...path])) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), neighbor]);
          }
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check each node
    Array.from(graph.keys()).forEach((node) => {
      if (!visited.has(node)) {
        hasCycle(node, []);
      }
    });

    return cycles;
  }

  /**
   * Check if a dependency is internal (project-relative) or external (npm/package)
   */
  private isInternalDependency(dep: string, projectContext: any): boolean {
    // Internal: starts with . or /
    if (dep.startsWith('.') || dep.startsWith('/')) {
      return true;
    }

    // Check against known external packages
    if (projectContext?.metadata?.dependencies) {
      return !projectContext.metadata.dependencies.includes(dep);
    }

    // External packages don't start with . or / and don't have slashes early
    return false;
  }
}
