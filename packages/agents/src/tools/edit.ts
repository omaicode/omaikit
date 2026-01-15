import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition, ToolHandler } from './types';
import { resolveSafePath, ensureFileExists, readFileLines, writeFileLines } from './utils';

export const editToolDefinition: ToolDefinition = {
  name: 'edit',
  description: 'Edit a text file by replacing, inserting, appending, or overwriting content.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file, relative to the project root.' },
      mode: {
        type: 'string',
        enum: ['overwrite', 'append', 'replace', 'insert'],
        description: 'Edit mode to apply.',
      },
      content: { type: 'string', description: 'Content to write or insert.' },
      startLine: { type: 'integer', description: '1-based start line for replace/insert.' },
      endLine: { type: 'integer', description: '1-based end line for replace.' },
      find: { type: 'string', description: 'String or regex pattern to replace.' },
      replace: { type: 'string', description: 'Replacement string.' },
      useRegex: { type: 'boolean', description: 'Treat find as regex (default: false).' },
    },
    required: ['path', 'mode'],
  },
};

export const editToolHandler: ToolHandler = (args, context) => {
  const pathArg = String(args.path || '');
  const mode = String(args.mode || '');
  if (!pathArg) {
    return { ok: false, error: { message: 'path is required', code: 'INVALID_ARGS' } };
  }
  if (!mode) {
    return { ok: false, error: { message: 'mode is required', code: 'INVALID_ARGS' } };
  }

  const { absolutePath, relativePath } = resolveSafePath(pathArg, context.rootPath || context.cwd);
  const encoding = 'utf-8';

  if (mode === 'overwrite') {
    const content = String(args.content ?? '');
    ensureDir(path.dirname(absolutePath));
    fs.writeFileSync(absolutePath, content, encoding);
    return { ok: true, data: { path: relativePath, mode, bytes: Buffer.byteLength(content) } };
  }

  ensureFileExists(absolutePath);

  if (mode === 'append') {
    const content = String(args.content ?? '');
    fs.appendFileSync(absolutePath, content, encoding);
    return { ok: true, data: { path: relativePath, mode, bytes: Buffer.byteLength(content) } };
  }

  const lines = readFileLines(absolutePath, encoding);

  if (mode === 'insert') {
    const content = String(args.content ?? '');
    const startLine =
      typeof args.startLine === 'number' ? Math.max(args.startLine, 1) : lines.length + 1;
    const insertLines = content.split(/\r?\n/);
    const updated = [
      ...lines.slice(0, startLine - 1),
      ...insertLines,
      ...lines.slice(startLine - 1),
    ];
    writeFileLines(absolutePath, updated, encoding);
    return { ok: true, data: { path: relativePath, mode, startLine } };
  }

  if (mode === 'replace') {
    const content = String(args.content ?? '');
    if (typeof args.startLine === 'number') {
      const startLine = Math.max(args.startLine, 1);
      const endLine =
        typeof args.endLine === 'number' ? Math.max(args.endLine, startLine) : startLine;
      const replacement = content.split(/\r?\n/);
      const updated = [...lines.slice(0, startLine - 1), ...replacement, ...lines.slice(endLine)];
      writeFileLines(absolutePath, updated, encoding);
      return { ok: true, data: { path: relativePath, mode, startLine, endLine } };
    }

    const find = String(args.find ?? '');
    if (!find) {
      return {
        ok: false,
        error: { message: 'find is required when startLine is not provided', code: 'INVALID_ARGS' },
      };
    }

    const useRegex = Boolean(args.useRegex);
    const regex = useRegex ? new RegExp(find, 'g') : new RegExp(escapeRegex(find), 'g');
    const updatedContent = lines.join('\n').replace(regex, String(args.replace ?? ''));
    fs.writeFileSync(absolutePath, updatedContent, encoding);
    return { ok: true, data: { path: relativePath, mode } };
  }

  return { ok: false, error: { message: `Unsupported mode: ${mode}`, code: 'INVALID_ARGS' } };
};

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
