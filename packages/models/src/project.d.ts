export interface Module {
    name: string;
    path: string;
    language?: string;
    dependencies?: string[];
}
export interface DependencyGraph {
    modules: Record<string, Module>;
    edges: Array<{
        from: string;
        to: string;
    }>;
}
export interface Project {
    name: string;
    root: string;
    modules: Module[];
    dependencyGraph?: DependencyGraph;
}
//# sourceMappingURL=project.d.ts.map