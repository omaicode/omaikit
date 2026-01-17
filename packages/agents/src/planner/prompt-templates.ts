import { readPrompt } from '../utils/prompt';

export class PromptTemplates {
  generatePlanMilestonesPrompt(
    description: string,
    projectType?: string,
    techStack?: string[],
  ): string {
    const techStackLine =
      techStack && techStack.length > 0 ? `Technology Stack: ${techStack.join(', ')}` : '';

    const projectTypeLine = projectType ? `Project Type: ${projectType}` : '';
    const languageHint = this.getLanguageHint(projectType, techStack);
    const languageHintLine = languageHint ? `Programming Language: ${languageHint}` : '';

    return readPrompt('planner.plan-milestones', {
      description,
      projectTypeLine,
      techStackLine,
      languageHintLine,
    });
  }

  generateTasksPrompt(planWithMilestones: string): string {
    return readPrompt('planner.tasks', { planWithMilestones });
  }

  generateOptimizePrompt(fullPlan: string): string {
    return readPrompt('planner.optimize', { fullPlan });
  }

  generateSummaryPrompt(): string {
    return readPrompt('planner.summary');
  }

  private getLanguageHint(projectType?: string, techStack?: string[]): string | undefined {
    const entries = [projectType, ...(techStack ?? [])].filter((value): value is string =>
      Boolean(value),
    );
    const haystack = entries.join(' ').toLowerCase();

    if (haystack.includes('golang') || haystack.includes(' go ')) return 'Go';
    if (haystack.includes('typescript') || haystack.includes('ts')) return 'TypeScript';
    if (haystack.includes('javascript') || haystack.includes('node') || haystack.includes('react'))
      return 'JavaScript';
    if (haystack.includes('python')) return 'Python';
    if (haystack.includes('rust')) return 'Rust';
    if (haystack.includes('c#') || haystack.includes('csharp') || haystack.includes('.net'))
      return 'C#';
    if (haystack.includes('php') || haystack.includes('laravel')) return 'PHP';

    return undefined;
  }

  generateClarificationPrompt(description: string, ambiguities: string[]): string {
    const ambiguitiesList = ambiguities.map((a) => `- ${a}`).join('\n');
    return readPrompt('planner.clarification', { description, ambiguitiesList });
  }

  getSystemPrompt(): string {
    return readPrompt('planner.system');
  }

  generateRepairPrompt(rawResponse: string): string {
    return readPrompt('planner.repair', { rawResponse });
  }
}
