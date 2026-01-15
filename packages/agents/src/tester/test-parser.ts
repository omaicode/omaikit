import type { TestFile, TestCase } from '@omaikit/models';

const FILE_HEADER_REGEX = /(?:^|\n)\s*(?:\/\/|#)\s*File:\s*(.+)\s*(?:\n|$)/i;
const CODE_BLOCK_REGEX = /```([\w-]*)\n([\s\S]*?)```/g;

export class TestParser {
  parse(response: string, language: string, framework: string): TestFile[] {
    const files: TestFile[] = [];
    const codeBlocks = this.extractCodeBlocks(response);

    if (codeBlocks.length === 0) {
      return [this.buildFallbackFile(language, framework, response)];
    }

    codeBlocks.forEach((block, index) => {
      const pathMatch = FILE_HEADER_REGEX.exec(block.content);
      const path = pathMatch?.[1]?.trim() || this.defaultFilePath(language, index);
      const content = pathMatch
        ? block.content.replace(pathMatch[0], '').trim()
        : block.content.trim();

      files.push({
        path,
        language: block.language || language,
        framework,
        testCases: this.extractTestCases(content, framework),
        content,
      });
    });

    return files;
  }

  private extractCodeBlocks(response: string): Array<{ language: string; content: string }> {
    const blocks: Array<{ language: string; content: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = CODE_BLOCK_REGEX.exec(response)) !== null) {
      blocks.push({
        language: match[1] || '',
        content: match[2] || '',
      });
    }

    return blocks;
  }

  private extractTestCases(content: string, framework: string): TestCase[] {
    const cases: TestCase[] = [];
    const lower = framework.toLowerCase();

    if (lower.includes('vitest') || lower.includes('jest')) {
      const regex = /(?:it|test)\(\s*['"`]([^'"`]+)['"`]/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        cases.push({ name: match[1], type: 'unit' });
      }
    } else if (lower.includes('pytest')) {
      const regex = /def\s+(test_[a-zA-Z0-9_]+)/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        cases.push({ name: match[1], type: 'unit' });
      }
    }

    if (cases.length === 0 && content.trim()) {
      cases.push({ name: 'generated-test', type: 'unit' });
    }

    return cases;
  }

  private buildFallbackFile(language: string, framework: string, response: string): TestFile {
    const content = response.trim() ? response : this.defaultTemplate(language, framework);

    return {
      path: this.defaultFilePath(language, 0),
      language,
      framework,
      testCases: this.extractTestCases(content, framework),
      content,
    };
  }

  private defaultTemplate(language: string, framework: string): string {
    if (language.toLowerCase() === 'python') {
      return 'def test_placeholder():\n    assert True';
    }

    if (framework.toLowerCase().includes('vitest') || framework.toLowerCase().includes('jest')) {
      return 'describe("placeholder", () => {\n  it("works", () => {\n    expect(true).toBe(true);\n  });\n});';
    }

    return '/* Generated tests */';
  }

  private defaultFilePath(language: string, index: number): string {
    const ext = language.toLowerCase() === 'python' ? 'py' : 'ts';
    return `tests/generated-${index + 1}.test.${ext}`;
  }
}
