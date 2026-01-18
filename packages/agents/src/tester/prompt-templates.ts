import type { Task } from '@omaikit/models';
import { TestPatterns } from './test-patterns';
import { readPrompt } from '../utils/prompt';

export class TestPromptTemplates {
  private patterns = new TestPatterns();

  async generatePrompt(
    task: Task,
    projectContext: any,
    plan: any,
    language: string,
    framework: string,
  ): Promise<string> {
    const patterns = this.patterns.getPatterns(language, framework);
    const projectName = projectContext?.name || projectContext?.project?.name || 'the project';

    const acceptanceCriteria = task.acceptanceCriteria.map((criteria) => `- ${criteria}`).join('\n');
    const patternLines = patterns
      .map((pattern) => `- ${pattern.name}: ${pattern.description}\n  Example: ${pattern.example}`)
      .join('\n');

    return readPrompt('tester.prompt', {
      framework,
      projectName,
      taskTitle: task.title,
      taskDescription: task.description || 'No description provided.',
      acceptanceCriteria,
      patterns: patternLines,
      language,
    });
  }
}
