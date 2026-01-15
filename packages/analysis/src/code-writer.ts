import * as fs from 'fs';
import * as path from 'path';
import type { CodeFile, CodeGeneration } from '@omaikit/models';

export class CodeWriter {
  private baseDir = path.join('.omaikit', 'code');

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    }
  }

  async writeCodeGeneration(code: CodeGeneration, outputDir?: string): Promise<string[]> {
    return this.writeFiles(code.files || [], outputDir);
  }

  async writeFiles(files: CodeFile[], outputDir?: string): Promise<string[]> {
    const targetDir = outputDir || this.baseDir;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const writtenPaths: string[] = [];
    for (const file of files) {
      const safeRelative = this.sanitizeRelativePath(file.path);
      const fullPath = path.join(targetDir, safeRelative);
      const dirPath = path.dirname(fullPath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(fullPath, file.content, 'utf-8');
      writtenPaths.push(fullPath);
    }

    return writtenPaths;
  }

  private sanitizeRelativePath(filePath: string): string {
    const normalized = path.normalize(filePath).replace(/^[\\/]+/, '');
    if (path.isAbsolute(normalized)) {
      return normalized.replace(/^[A-Z]:/i, '').replace(/^[\\/]+/, '');
    }

    const segments = normalized
      .split(path.sep)
      .filter((segment) => segment !== '..' && segment !== '');
    return segments.join(path.sep);
  }
}
