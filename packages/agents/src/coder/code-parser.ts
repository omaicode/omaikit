/**
 * Code Parser
 * Extracts generated code files from LLM responses
 */

import type { CodeFile } from '@omaikit/models';

export class CodeParser {
  /**
   * Parse LLM response to extract code files
   */
  async parse(
    response: string,
    options?: { taskTitle?: string; projectContext?: any; fallbackLanguage?: string },
  ): Promise<CodeFile[]> {
    const files: CodeFile[] = [];

    const fileMarkers = this.extractFileMarkers(response);

    const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let fileIndex = 0;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const blockLanguage = match[1]?.trim();
      let content = (match[2] || '').trim();
      if (!content) {
        continue;
      }

      const extracted = this.extractFilePath(content);
      const pathFromHeader = extracted?.path;
      const pathFromMarker = this.findNearestMarker(match.index, fileMarkers);
      content = extracted?.content ?? content;

      const detectedLanguage = this.detectLanguage({
        codeBlockLanguage: blockLanguage,
        filePath: pathFromHeader,
        content,
        projectContext: options?.projectContext,
        fallbackLanguage: options?.fallbackLanguage,
      });

      const filePath =
        pathFromHeader ||
        pathFromMarker ||
        this.buildDefaultPath(detectedLanguage, options?.taskTitle, fileIndex);
      files.push({
        path: filePath,
        language: detectedLanguage,
        content,
      });
      fileIndex += 1;
    }

    if (files.length === 0 && response.trim().length > 0) {
      const content = response.trim();
      const detectedLanguage = this.detectLanguage({
        content,
        projectContext: options?.projectContext,
        fallbackLanguage: options?.fallbackLanguage,
      });
      const fallbackPath = fileMarkers.length > 0 ? fileMarkers[0].path : undefined;
      files.push({
        path: fallbackPath || this.buildDefaultPath(detectedLanguage, options?.taskTitle, 0),
        language: detectedLanguage,
        content,
      });
    }

    return files;
  }

  private extractFilePath(content: string): { path: string; content: string } | null {
    const headerRegexes = [
      /^\s*(?:\/\/|#|\/\*)\s*File:\s*([^\r\n*]+).*$/im,
      /^\s*(?:#+\s*)?(?:File|Path)\s*:\s*`?([^`\r\n]+)`?.*$/im,
    ];

    for (const headerRegex of headerRegexes) {
      const match = headerRegex.exec(content);
      if (!match) continue;

      const path = match[1].trim();
      const cleaned = content.replace(match[0], '').trim();
      return { path, content: cleaned };
    }

    return null;
  }

  private extractFileMarkers(response: string): Array<{ path: string; index: number }> {
    const markers: Array<{ path: string; index: number }> = [];
    const regex = /(?:^|\n)\s*(?:#+\s*)?(?:File|Path)\s*:\s*`?([^`\r\n]+)`?\s*(?:\n|$)/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(response)) !== null) {
      markers.push({ path: match[1].trim(), index: match.index });
    }

    return markers;
  }

  private findNearestMarker(
    blockIndex: number,
    markers: Array<{ path: string; index: number }>,
  ): string | null {
    let nearest: { path: string; index: number } | null = null;
    for (const marker of markers) {
      if (marker.index < blockIndex && (!nearest || marker.index > nearest.index)) {
        nearest = marker;
      }
    }
    return nearest?.path ?? null;
  }

  private detectLanguage(input: {
    codeBlockLanguage?: string;
    filePath?: string;
    content?: string;
    projectContext?: any;
    fallbackLanguage?: string;
  }): string {
    const extensionMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      cs: 'csharp',
      php: 'php',
    };

    if (input.filePath) {
      const ext = input.filePath.split('.').pop()?.toLowerCase();
      if (ext && extensionMap[ext]) {
        return extensionMap[ext];
      }
    }

    if (input.codeBlockLanguage) {
      const normalized = input.codeBlockLanguage.toLowerCase();
      if (extensionMap[normalized]) {
        return extensionMap[normalized];
      }
      const aliasMap: Record<string, string> = {
        typescript: 'typescript',
        javascript: 'javascript',
        python: 'python',
        golang: 'go',
        rust: 'rust',
        csharp: 'csharp',
      };
      if (aliasMap[normalized]) {
        return aliasMap[normalized];
      }
    }

    if (input.content) {
      const content = input.content;
      if (content.includes('<?php') || content.includes('namespace ') || content.includes('$')) {
        return 'php';
      }
      if (content.includes('package ') && content.includes('func ')) {
        return 'go';
      }
      if (content.includes('def ') && content.includes(':')) {
        return 'python';
      }
      if (content.includes('fn ') && content.includes('use ')) {
        return 'rust';
      }
      if (content.includes('using ') && content.includes('namespace ')) {
        return 'csharp';
      }
      if (
        content.includes('interface ') ||
        content.includes('type ') ||
        content.includes('const ')
      ) {
        return 'typescript';
      }
    }

    const projectLanguages =
      input.projectContext?.analysis?.languages || input.projectContext?.metadata?.languages;
    if (Array.isArray(projectLanguages) && projectLanguages.length > 0) {
      return projectLanguages[0];
    }

    return input.fallbackLanguage || 'php';
  }

  private buildDefaultPath(language: string, taskTitle?: string, index: number = 0): string {
    const baseName = taskTitle ? this.toPascalCase(taskTitle) : `Generated${index + 1}`;
    const fileName = this.getDefaultFileName(language, baseName, index);
    return `src/${fileName}`;
  }

  private getDefaultFileName(language: string, baseName: string, index: number): string {
    const extMap: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      go: 'go',
      rust: 'rs',
      csharp: 'cs',
      php: 'php',
    };

    const ext = extMap[language] || 'txt';
    const safeBase = baseName || `Generated${index + 1}`;
    return `${safeBase}.${ext}`;
  }

  private toPascalCase(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
