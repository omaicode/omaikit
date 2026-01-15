export interface ContextSummary {
    project: {
        name: string;
        rootPath: string;
        description?: string;
    };
    analysis: {
        languages: string[];
        fileCount: number;
        totalLOC: number;
        dependencies: string[];
    };
    generatedAt: string;
}
export declare class ContextWriter {
    private baseDir;
    private contextFile;
    constructor(baseDir?: string);
    writeContext(rootPath?: string): Promise<string>;
    readContext(): Promise<ContextSummary | null>;
    private writeContextFile;
    private buildContext;
    private readDescription;
    private readDependencies;
    private scanProject;
    private countLines;
}
//# sourceMappingURL=context-writer.d.ts.map
