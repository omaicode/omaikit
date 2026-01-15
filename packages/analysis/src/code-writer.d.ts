import type { CodeFile, CodeGeneration } from '@omaikit/models';
export declare class CodeWriter {
    private baseDir;
    constructor(baseDir?: string);
    writeCodeGeneration(code: CodeGeneration, outputDir?: string): Promise<string[]>;
    writeFiles(files: CodeFile[], outputDir?: string): Promise<string[]>;
    private sanitizeRelativePath;
}
//# sourceMappingURL=code-writer.d.ts.map
