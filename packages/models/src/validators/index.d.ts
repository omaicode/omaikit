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
    /**
     * Consolidated in repo-level types.d.ts
     */
    export {};