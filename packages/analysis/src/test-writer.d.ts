import type { TestFile, TestSuite } from '@omaikit/models';
export declare class TestWriter {
    private baseDir;
    constructor(baseDir?: string);
    writeTestSuite(testSuite: TestSuite, outputDir?: string): Promise<string[]>;
    writeFiles(files: TestFile[], outputDir?: string): Promise<string[]>;
    private sanitizeRelativePath;
}
//# sourceMappingURL=test-writer.d.ts.map
