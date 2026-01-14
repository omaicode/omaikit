export declare class ClarificationHandler {
    private clarificationPrompts;
    detectAmbiguities(description: string): string[];
    generateClarificationQuestions(ambiguities: string[]): string[];
    askForClarifications(description: string): Promise<{
        ambiguities: string[];
        questions: string[];
    }>;
    mergeClarifications(description: string, clarifications: Record<string, string>): string;
}
//# sourceMappingURL=clarification-handler.d.ts.map