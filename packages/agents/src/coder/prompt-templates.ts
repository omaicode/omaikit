/**
 * Code Generation Prompt Templates
 */

import type { Task } from '@omaikit/models';
import { readPrompt } from '../utils/prompt';

export class PromptTemplates {
  /**
   * Generate a prompt for code generation
   */
  async generatePrompt(task: Task): Promise<string> {
    const acceptanceCriteria = task.acceptanceCriteria.map((c) => `- ${c}`).join('\n');
    const otherDetails = [
      `- Target Module: ${task.targetModule || 'unknown'}`,
      `- Affected Modules: ${Array.isArray(task.inputDependencies) ? task.inputDependencies.join(', ') : 'unknown'}`,
      `- Suggested Approach: ${task.suggestedApproach || 'none'}`,
      `- Technical Notes: ${task.technicalNotes || 'none'}`,
      `- Risk Factors: ${this.formatRiskFactors(task.riskFactors)}`,
    ].join('\n');
    return readPrompt('coder.task', {
      taskTitle: task.title,
      taskDescription: task.description,
      taskType: task.type,
      taskEffort: String(task.estimatedEffort),
      acceptanceCriteria,
      otherDetails,
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
      `Dependencies (sample): ${dependencies}`
    ].join('\n');
  }

  private formatRiskFactors(
    riskFactors:
      | { description: string; likelihood: string; impact: string; mitigation: string }[]
      | undefined,
  ): string {
    if (!riskFactors || riskFactors.length === 0) {
      return 'None';
    }
    return riskFactors
      .map((rf, idx) => {
        return `\n${idx + 1}. Description: ${rf.description}\n   Likelihood: ${rf.likelihood}\n   Impact: ${rf.impact}\n   Mitigation: ${rf.mitigation}`;
      })
      .join('\n');
  }

  getInstructions(projectContext: any, plan: any): string {
    const contextSummary = this.formatContextSummary(projectContext, plan);
    return readPrompt('coder.instructions', { contextSummary });
  }
}
