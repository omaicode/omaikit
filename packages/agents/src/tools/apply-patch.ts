import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition, ToolHandler } from './types';
import { resolveSafePath, ensureFileExists, readFileLines, writeFileLines } from './utils';

type PatchAction = 'update_file' | 'create_file' | 'delete_file';

type PatchToken = {
  type: 'context' | 'remove' | 'add';
  text: string;
};

type PatchHunk = {
  tokens: PatchToken[];
};

type PatchOperation = {
  type: PatchAction;
  path: string;
  diff?: string;
};

export const applyPatchToolDefinition: ToolDefinition = {
  type: 'apply_patch',
  name: 'apply_patch_call',
  description: 'Apply a patch to one or more files within the project root.',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'object',
        description: 'Patch operation with type, path, and diff (for create/update).',
        properties: {
          type: { type: 'string', enum: ['create_file', 'update_file', 'delete_file'] },
          path: { type: 'string', description: 'File path relative to the project root.' },
          diff: { type: 'string', description: 'Unified diff content for create/update.' },
        },
        required: ['type', 'path'],
      },
      type: { type: 'string', enum: ['create_file', 'update_file', 'delete_file'] },
      path: { type: 'string', description: 'File path relative to the project root.' },
      diff: { type: 'string', description: 'Unified diff content for create/update.' },
    },
    required: ['operation'],
  },
};

export const applyPatchToolHandler: ToolHandler = (args, context) => {
  const op = ((args as any).operation ?? args) as PatchOperation;
  if (!op || !op.type || !op.path) {
    return { ok: false, error: { message: 'operation.type and operation.path are required' } };
  }
  const applied: Array<{ action: PatchAction; path: string }> = [];

  const { absolutePath, relativePath } = resolveSafePath(
    op.path,
    context.rootPath || context.cwd,
  );

  if (op.type === 'delete_file') {
    ensureFileExists(absolutePath);
    fs.unlinkSync(absolutePath);
    applied.push({ action: op.type, path: relativePath });
    return { ok: true, data: { applied } };
  }

  if (op.type === 'create_file') {
    if (fs.existsSync(absolutePath)) {
      return {
        ok: false,
        error: { message: `File already exists: ${relativePath}`, code: 'FILE_EXISTS' },
      };
    }
    ensureDir(path.dirname(absolutePath));
    const content = normalizeCreateContent(String(op.diff ?? ''));
    fs.writeFileSync(absolutePath, content, 'utf-8');
    applied.push({ action: op.type, path: relativePath });
    return { ok: true, data: { applied } };
  }

  if (op.type === 'update_file') {
    if (typeof op.diff !== 'string') {
      return { ok: false, error: { message: 'operation.diff is required for update_file' } };
    }
    ensureFileExists(absolutePath);
    const lines = readFileLines(absolutePath, 'utf-8');
    const hunks = parseDiffHunks(op.diff);
    const updated = applyHunks(lines, hunks);
    writeFileLines(absolutePath, updated, 'utf-8');
    applied.push({ action: op.type, path: relativePath });
    return { ok: true, data: { applied } };
  }

  return { ok: false, error: { message: `Unsupported operation type: ${op.type}` } };
};

function parseDiffHunks(diff: string): PatchHunk[] {
  const rawLines = diff.replace(/\r\n/g, '\n').split('\n');
  const lines = rawLines.filter((line) => !isDiffHeader(line));
  return parseHunks(lines);
}

function isDiffHeader(line: string): boolean {
  return (
    line.startsWith('diff ') ||
    line.startsWith('index ') ||
    line.startsWith('---') ||
    line.startsWith('+++') ||
    line.startsWith('*** ') ||
    line.startsWith('@@@')
  );
}

function normalizeCreateContent(diff: string): string {
  const lines = diff.replace(/\r\n/g, '\n').split('\n');
  const filtered = lines.filter((line) => !isDiffHeader(line));
  const nonEmpty = filtered.filter((line) => line.trim().length > 0);
  const allPlus = nonEmpty.length > 0 && nonEmpty.every((line) => line.startsWith('+'));
  const normalized = filtered.map((line) => {
    if (line.startsWith('+')) {
      return line.slice(1);
    }
    return allPlus ? line : line;
  });
  return normalized.join('\n');
}

function parseHunks(lines: string[]): PatchHunk[] {
  const hunks: PatchHunk[] = [];
  let current: PatchHunk | null = null;

  const ensureHunk = (): PatchHunk => {
    if (!current) {
      current = { tokens: [] };
      hunks.push(current);
    }
    return current;
  };

  for (const line of lines) {
    if (line.startsWith('@@')) {
      current = null;
      ensureHunk();
      continue;
    }
    const hunk = ensureHunk();
    if (line.startsWith('+')) {
      hunk.tokens.push({ type: 'add', text: line.slice(1) });
    } else if (line.startsWith('-')) {
      hunk.tokens.push({ type: 'remove', text: line.slice(1) });
    } else if (line.startsWith('\\')) {
      continue;
    } else {
      hunk.tokens.push({ type: 'context', text: line });
    }
  }

  return hunks;
}

function applyHunks(lines: string[], hunks: PatchHunk[]): string[] {
  let output = [...lines];
  for (const hunk of hunks) {
    const oldBlock = hunk.tokens.filter((token) => token.type !== 'add').map((token) => token.text);
    const newBlock = hunk.tokens
      .filter((token) => token.type !== 'remove')
      .map((token) => token.text);

    if (oldBlock.length === 0) {
      throw new Error('Invalid patch hunk: missing context');
    }

    const index = findBlock(output, oldBlock);
    if (index === -1) {
      throw new Error('Patch hunk could not be applied');
    }

    output = [...output.slice(0, index), ...newBlock, ...output.slice(index + oldBlock.length)];
  }

  return output;
}

function findBlock(lines: string[], block: string[]): number {
  if (block.length === 0) return -1;
  for (let i = 0; i <= lines.length - block.length; i += 1) {
    let match = true;
    for (let j = 0; j < block.length; j += 1) {
      if (lines[i + j] !== block[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
