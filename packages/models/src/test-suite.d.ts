export interface TestCase {
    name: string;
    description?: string;
    type: 'unit' | 'integration' | 'e2e';
}
export interface TestFile {
    path: string;
    language: string;
    framework: string;
    testCases: TestCase[];
    content: string;
}
export interface TestSuite {
    id: string;
    taskId: string;
    files: TestFile[];
    coverage?: number;
    metadata?: {
        generatedAt?: string;
        model?: string;
    };
}
//# sourceMappingURL=test-suite.d.ts.map