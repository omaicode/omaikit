import type { Task } from '@omaikit/models';
import { TestPatterns } from './test-patterns';

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

    return [
      `You are a test engineer generating ${framework} tests for ${projectName}.`,
      '',
      `Task: ${task.title}`,
      `Description: ${task.description || 'No description provided.'}`,
      '',
      'Requirements:',
      ...task.acceptanceCriteria.map((criteria) => `- ${criteria}`),
      '',
      'Generate comprehensive unit, integration, and edge case tests.',
      'Return tests as code blocks. Include a file header in each block like:',
      '  // File: tests/<name>.test.ts',
      '',
      'Patterns:',
      ...patterns.map(
        (pattern) => `- ${pattern.name}: ${pattern.description}\n  Example: ${pattern.example}`,
      ),
      '',
      `Target language: ${language}`,
      `Test framework: ${framework}`,
      '',
      'Ensure tests include error handling, clear assertions, and descriptive names.',
    ].join('\n');
  }
}
