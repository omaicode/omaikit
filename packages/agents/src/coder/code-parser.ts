/**
 * Code Parser
 * Extracts generated code files from LLM responses
 */

import type { CodeFile } from '@omaikit/models';

export class CodeParser {
  /**
   * Parse LLM response to extract code files
   */
  async parse(response: string, language: string): Promise<CodeFile[]> {
    const files: CodeFile[] = [];

    // Try to extract code blocks
    const codeBlockRegex = /```(?:[\w-]*\n)?([\s\S]*?)```/g;
    let match;
    let fileIndex = 0;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const content = match[1].trim();

      if (content.length > 0) {
        const file: CodeFile = {
          path: `generated-${fileIndex}.${this.getExtension(language)}`,
          language,
          content,
        };

        files.push(file);
        fileIndex++;
      }
    }

    // If no code blocks found, treat entire response as code
    if (files.length === 0 && response.trim().length > 0) {
      files.push({
        path: `generated-0.${this.getExtension(language)}`,
        language,
        content: response.trim(),
      });
    }

    return files;
  }

  private getExtension(language: string): string {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      go: 'go',
      rust: 'rs',
      csharp: 'cs',
    };

    return extensions[language] || 'txt';
  }
}
