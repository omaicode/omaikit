/**
 * Code Generation Prompt Templates
 */

import type { Task } from '@omaikit/models';
import { readPrompt } from '../utils/prompt';

export class PromptTemplates {
  /**
   * Generate a prompt for code generation
   */
  async generatePrompt(task: Task, projectContext: any, plan: any): Promise<string> {
    const contextSummary = this.formatContextSummary(projectContext, plan);
    const acceptanceCriteria = task.acceptanceCriteria.map((c) => `- ${c}`).join('\n');

    return readPrompt('coder.task', {
      taskTitle: task.title,
      taskDescription: task.description,
      taskType: task.type,
      taskEffort: String(task.estimatedEffort),
      acceptanceCriteria,
      contextSummary,
    });
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
