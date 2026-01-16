/**
 * Code Generation Prompt Templates
 */

import type { Task } from '@omaikit/models';

export class PromptTemplates {
  /**
   * Generate a prompt for code generation
   */
  async generatePrompt(task: Task, projectContext: any, plan: any): Promise<string> {
    const basePrompt = this.getBasePrompt();
    const contextSummary = this.formatContextSummary(projectContext, plan);

    return `
${basePrompt}

## Task Details
Title: ${task.title}
Description: ${task.description}
Type: ${task.type}
Estimated Effort: ${task.estimatedEffort} hours

## Acceptance Criteria
${task.acceptanceCriteria.map((c) => `- ${c}`).join('\n')}

## Project Context (from .omaikit/context.json)
${contextSummary}

## Standards
- PSR-12
- PSR-4
- SOLID
- KISS
- DRY
- Clean Code principles

## Requirements
1. Write production-ready code with proper error handling
2. Include logging statements for debugging
3. Add clear documentation where needed
4. Keep functions small and focused
5. Keep the code testable and maintainable

## Output Format
Provide the generated code as a single response with file paths and content.
`;
  }

  private getBasePrompt(): string {
    return `You are a senior software engineer generating production-ready code that:
- Follows PSR-12 and PSR-4
- Applies SOLID, KISS, DRY, and Clean Code principles
- Matches the existing project conventions from context
- Uses structured logging (or the project's logger)

Tool usage requirements (mandatory):
- You MUST use tools to inspect and modify files before responding.
- Use list_files to list files or find files by glob pattern (start with the project root from context).
- Use search_text to search content within files.
- Use read to inspect exact file contents and confirm existing structure.
- Use apply_patch for precise, minimal edits to existing files.
- Use edit only when apply_patch is not suitable (e.g., full overwrite or append).
- Do NOT propose code changes without first using tools.
- If the project is empty or the target file does not exist, create new files using apply_patch with create_file.
- If list_files returns empty, retry with the explicit root path from context before concluding no access.
- Never claim you cannot access files without trying list_files and read on the root path.
- After creating files successfully, do NOT include file contents in the response; only return the list of created file paths.
- Output should reflect tool-based edits only.`;
  }

  private formatContextSummary(projectContext: any, plan: any): string {
    const project = projectContext?.project ?? projectContext;
    const analysis = projectContext?.analysis ?? {};
    const name = project?.name || 'Unknown project';
    const rootPath = project?.rootPath || 'Unknown root';
    const description = project?.description
      ? `Description: ${project.description}`
      : 'Description: (none)';
    const languages = Array.isArray(analysis.languages) ? analysis.languages.join(', ') : 'unknown';
    const fileCount = typeof analysis.fileCount === 'number' ? analysis.fileCount : 'unknown';
    const totalLOC = typeof analysis.totalLOC === 'number' ? analysis.totalLOC : 'unknown';
    const dependencies = Array.isArray(analysis.dependencies)
      ? analysis.dependencies.slice(0, 12).join(', ')
      : 'unknown';
    const planTitle = plan?.title ? `Plan: ${plan.title}` : 'Plan: (none)';

    return [
      `Project: ${name}`,
      `Root: ${rootPath}`,
      description,
      planTitle,
      `Languages: ${languages}`,
      `Files: ${fileCount}, LOC: ${totalLOC}`,
      `Dependencies (sample): ${dependencies}`,
    ].join('\n');
  }
}
