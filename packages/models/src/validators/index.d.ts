import { z } from 'zod';
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    effort: z.ZodNumber;
    status: z.ZodEnum<["pending", "in_progress", "completed", "blocked"]>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    effort: number;
    status: "pending" | "in_progress" | "completed" | "blocked";
    dependencies?: string[] | undefined;
    tags?: string[] | undefined;
}, {
    id: string;
    title: string;
    description: string;
    effort: number;
    status: "pending" | "in_progress" | "completed" | "blocked";
    dependencies?: string[] | undefined;
    tags?: string[] | undefined;
}>;
export declare const MilestoneSchema: z.ZodObject<{
    title: z.ZodString;
    duration: z.ZodNumber;
    tasks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        effort: z.ZodNumber;
        status: z.ZodEnum<["pending", "in_progress", "completed", "blocked"]>;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        description: string;
        effort: number;
        status: "pending" | "in_progress" | "completed" | "blocked";
        dependencies?: string[] | undefined;
        tags?: string[] | undefined;
    }, {
        id: string;
        title: string;
        description: string;
        effort: number;
        status: "pending" | "in_progress" | "completed" | "blocked";
        dependencies?: string[] | undefined;
        tags?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    duration: number;
    tasks: {
        id: string;
        title: string;
        description: string;
        effort: number;
        status: "pending" | "in_progress" | "completed" | "blocked";
        dependencies?: string[] | undefined;
        tags?: string[] | undefined;
    }[];
}, {
    title: string;
    duration: number;
    tasks: {
        id: string;
        title: string;
        description: string;
        effort: number;
        status: "pending" | "in_progress" | "completed" | "blocked";
        dependencies?: string[] | undefined;
        tags?: string[] | undefined;
    }[];
}>;
export declare const PlanSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    milestones: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        duration: z.ZodNumber;
        tasks: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            effort: z.ZodNumber;
            status: z.ZodEnum<["pending", "in_progress", "completed", "blocked"]>;
            dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            title: string;
            description: string;
            effort: number;
            status: "pending" | "in_progress" | "completed" | "blocked";
            dependencies?: string[] | undefined;
            tags?: string[] | undefined;
        }, {
            id: string;
            title: string;
            description: string;
            effort: number;
            status: "pending" | "in_progress" | "completed" | "blocked";
            dependencies?: string[] | undefined;
            tags?: string[] | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        title: string;
        duration: number;
        tasks: {
            id: string;
            title: string;
            description: string;
            effort: number;
            status: "pending" | "in_progress" | "completed" | "blocked";
            dependencies?: string[] | undefined;
            tags?: string[] | undefined;
        }[];
    }, {
        title: string;
        duration: number;
        tasks: {
            id: string;
            title: string;
            description: string;
            effort: number;
            status: "pending" | "in_progress" | "completed" | "blocked";
            dependencies?: string[] | undefined;
            tags?: string[] | undefined;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    milestones: {
        title: string;
        duration: number;
        tasks: {
            id: string;
            title: string;
            description: string;
            effort: number;
            status: "pending" | "in_progress" | "completed" | "blocked";
            dependencies?: string[] | undefined;
            tags?: string[] | undefined;
        }[];
    }[];
}, {
    title: string;
    description: string;
    milestones: {
        title: string;
        duration: number;
        tasks: {
            id: string;
            title: string;
            description: string;
            effort: number;
            status: "pending" | "in_progress" | "completed" | "blocked";
            dependencies?: string[] | undefined;
            tags?: string[] | undefined;
        }[];
    }[];
}>;
export declare const PlanInputSchema: z.ZodObject<{
    description: z.ZodString;
    projectType: z.ZodOptional<z.ZodEnum<["backend", "frontend", "fullstack", "mobile", "monorepo", "tool", "web"]>>;
    techStack: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    projectType?: "backend" | "frontend" | "fullstack" | "mobile" | "monorepo" | "tool" | "web" | undefined;
    techStack?: string[] | undefined;
}, {
    description: string;
    projectType?: "backend" | "frontend" | "fullstack" | "mobile" | "monorepo" | "tool" | "web" | undefined;
    techStack?: string[] | undefined;
}>;
export declare const CodeFileSchema: z.ZodObject<{
    path: z.ZodString;
    language: z.ZodString;
    content: z.ZodString;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    path: string;
    language: string;
    content: string;
    dependencies?: string[] | undefined;
}, {
    path: string;
    language: string;
    content: string;
    dependencies?: string[] | undefined;
}>;
export declare const CodeGenerationSchema: z.ZodObject<{
    id: z.ZodString;
    taskId: z.ZodString;
    prompt: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        language: z.ZodString;
        content: z.ZodString;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        language: string;
        content: string;
        dependencies?: string[] | undefined;
    }, {
        path: string;
        language: string;
        content: string;
        dependencies?: string[] | undefined;
    }>, "many">;
    metadata: z.ZodOptional<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        tokensUsed: z.ZodOptional<z.ZodNumber>;
        generatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        tokensUsed?: number | undefined;
        generatedAt?: string | undefined;
    }, {
        model?: string | undefined;
        tokensUsed?: number | undefined;
        generatedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    taskId: string;
    prompt: string;
    files: {
        path: string;
        language: string;
        content: string;
        dependencies?: string[] | undefined;
    }[];
    metadata?: {
        model?: string | undefined;
        tokensUsed?: number | undefined;
        generatedAt?: string | undefined;
    } | undefined;
}, {
    id: string;
    taskId: string;
    prompt: string;
    files: {
        path: string;
        language: string;
        content: string;
        dependencies?: string[] | undefined;
    }[];
    metadata?: {
        model?: string | undefined;
        tokensUsed?: number | undefined;
        generatedAt?: string | undefined;
    } | undefined;
}>;
export declare const TestCaseSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["unit", "integration", "e2e"]>;
}, "strip", z.ZodTypeAny, {
    type: "unit" | "integration" | "e2e";
    name: string;
    description?: string | undefined;
}, {
    type: "unit" | "integration" | "e2e";
    name: string;
    description?: string | undefined;
}>;
export declare const TestFileSchema: z.ZodObject<{
    path: z.ZodString;
    language: z.ZodString;
    framework: z.ZodString;
    testCases: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["unit", "integration", "e2e"]>;
    }, "strip", z.ZodTypeAny, {
        type: "unit" | "integration" | "e2e";
        name: string;
        description?: string | undefined;
    }, {
        type: "unit" | "integration" | "e2e";
        name: string;
        description?: string | undefined;
    }>, "many">;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    language: string;
    content: string;
    framework: string;
    testCases: {
        type: "unit" | "integration" | "e2e";
        name: string;
        description?: string | undefined;
    }[];
}, {
    path: string;
    language: string;
    content: string;
    framework: string;
    testCases: {
        type: "unit" | "integration" | "e2e";
        name: string;
        description?: string | undefined;
    }[];
}>;
export declare const TestSuiteSchema: z.ZodObject<{
    id: z.ZodString;
    taskId: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        language: z.ZodString;
        framework: z.ZodString;
        testCases: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodEnum<["unit", "integration", "e2e"]>;
        }, "strip", z.ZodTypeAny, {
            type: "unit" | "integration" | "e2e";
            name: string;
            description?: string | undefined;
        }, {
            type: "unit" | "integration" | "e2e";
            name: string;
            description?: string | undefined;
        }>, "many">;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        language: string;
        content: string;
        framework: string;
        testCases: {
            type: "unit" | "integration" | "e2e";
            name: string;
            description?: string | undefined;
        }[];
    }, {
        path: string;
        language: string;
        content: string;
        framework: string;
        testCases: {
            type: "unit" | "integration" | "e2e";
            name: string;
            description?: string | undefined;
        }[];
    }>, "many">;
    coverage: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodObject<{
        generatedAt: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        generatedAt?: string | undefined;
    }, {
        model?: string | undefined;
        generatedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    taskId: string;
    files: {
        path: string;
        language: string;
        content: string;
        framework: string;
        testCases: {
            type: "unit" | "integration" | "e2e";
            name: string;
            description?: string | undefined;
        }[];
    }[];
    metadata?: {
        model?: string | undefined;
        generatedAt?: string | undefined;
    } | undefined;
    coverage?: number | undefined;
}, {
    id: string;
    taskId: string;
    files: {
        path: string;
        language: string;
        content: string;
        framework: string;
        testCases: {
            type: "unit" | "integration" | "e2e";
            name: string;
            description?: string | undefined;
        }[];
    }[];
    metadata?: {
        model?: string | undefined;
        generatedAt?: string | undefined;
    } | undefined;
    coverage?: number | undefined;
}>;
export declare const ReviewFindingSchema: z.ZodObject<{
    id: z.ZodString;
    severity: z.ZodEnum<["info", "warn", "error"]>;
    code: z.ZodString;
    message: z.ZodString;
    line: z.ZodOptional<z.ZodNumber>;
    suggestion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    code: string;
    message: string;
    severity: "info" | "warn" | "error";
    line?: number | undefined;
    suggestion?: string | undefined;
}, {
    id: string;
    code: string;
    message: string;
    severity: "info" | "warn" | "error";
    line?: number | undefined;
    suggestion?: string | undefined;
}>;
export declare const CodeReviewSchema: z.ZodObject<{
    id: z.ZodString;
    taskId: z.ZodString;
    codeId: z.ZodString;
    findings: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        severity: z.ZodEnum<["info", "warn", "error"]>;
        code: z.ZodString;
        message: z.ZodString;
        line: z.ZodOptional<z.ZodNumber>;
        suggestion: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        code: string;
        message: string;
        severity: "info" | "warn" | "error";
        line?: number | undefined;
        suggestion?: string | undefined;
    }, {
        id: string;
        code: string;
        message: string;
        severity: "info" | "warn" | "error";
        line?: number | undefined;
        suggestion?: string | undefined;
    }>, "many">;
    score: z.ZodNumber;
    approved: z.ZodBoolean;
    metadata: z.ZodOptional<z.ZodObject<{
        reviewedAt: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        reviewedAt?: string | undefined;
    }, {
        model?: string | undefined;
        reviewedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    taskId: string;
    codeId: string;
    findings: {
        id: string;
        code: string;
        message: string;
        severity: "info" | "warn" | "error";
        line?: number | undefined;
        suggestion?: string | undefined;
    }[];
    score: number;
    approved: boolean;
    metadata?: {
        model?: string | undefined;
        reviewedAt?: string | undefined;
    } | undefined;
}, {
    id: string;
    taskId: string;
    codeId: string;
    findings: {
        id: string;
        code: string;
        message: string;
        severity: "info" | "warn" | "error";
        line?: number | undefined;
        suggestion?: string | undefined;
    }[];
    score: number;
    approved: boolean;
    metadata?: {
        model?: string | undefined;
        reviewedAt?: string | undefined;
    } | undefined;
}>;
//# sourceMappingURL=index.d.ts.map