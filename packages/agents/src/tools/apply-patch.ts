import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition, ToolHandler } from './types';
import { resolveSafePath, ensureFileExists, readFileLines, writeFileLines } from './utils';

type PatchAction = 'update' | 'add' | 'delete';

type PatchToken = {
  type: 'context' | 'remove' | 'add';
  text: string;
};

type PatchHunk = {
  tokens: PatchToken[];
};

type PatchOp = {
  action: PatchAction;
  path: string;
  hunks?: PatchHunk[];
  content?: string[];
};

export const applyPatchToolDefinition: ToolDefinition = {
  name: 'apply_patch',
  description: 'Apply a patch to one or more files within the project root.',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Patch content in apply-patch format.' },
    },
    required: ['input'],
  },
};

export const applyPatchToolHandler: ToolHandler = (args, context) => {
  const input = String(args.input ?? '');
  if (!input.trim()) {
    return { ok: false, error: { message: 'input is required', code: 'INVALID_ARGS' } };
  }

  const ops = parsePatch(input);
  const applied: Array<{ action: PatchAction; path: string }> = [];

  for (const op of ops) {
    const { absolutePath, relativePath } = resolveSafePath(op.path, context.rootPath || context.cwd);

    if (op.action === 'delete') {
      ensureFileExists(absolutePath);
      fs.unlinkSync(absolutePath);
      applied.push({ action: op.action, path: relativePath });
      continue;
    }

    if (op.action === 'add') {
      if (fs.existsSync(absolutePath)) {
        return {
          ok: false,
          error: { message: `File already exists: ${relativePath}`, code: 'FILE_EXISTS' },
        };
      }
      ensureDir(path.dirname(absolutePath));
      const content = (op.content || []).join('\n');
      fs.writeFileSync(absolutePath, content, 'utf-8');
      applied.push({ action: op.action, path: relativePath });
      continue;
    }

    if (op.action === 'update') {
      ensureFileExists(absolutePath);
      const lines = readFileLines(absolutePath, 'utf-8');
      const updated = applyHunks(lines, op.hunks || []);
      writeFileLines(absolutePath, updated, 'utf-8');
      applied.push({ action: op.action, path: relativePath });
      continue;
    }
  }

  return { ok: true, data: { applied } };
};

function parsePatch(input: string): PatchOp[] {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const ops: PatchOp[] = [];
  let i = 0;

  const isHeader = (line: string): boolean => line.startsWith('*** ');

  while (i < lines.length) {
    const line = lines[i];
    if (!isHeader(line)) {
      i += 1;
      continue;
    }

    if (line.startsWith('*** Begin Patch')) {
      i += 1;
      continue;
    }

    if (line.startsWith('*** End Patch')) {
      break;
    }

    const headerMatch = /^\*\*\*\s+(Update|Add|Delete)\s+File:\s*(.+)$/i.exec(line);
    if (!headerMatch) {
      i += 1;
      continue;
    }

    const action = headerMatch[1].toLowerCase() as PatchAction;
    const rawPath = headerMatch[2].split('->')[0]?.trim() || '';
    if (!rawPath) {
      throw new Error('Invalid patch header: missing file path');
    }

    i += 1;

    if (action === 'delete') {
      ops.push({ action, path: rawPath });
      continue;
    }

    const body: string[] = [];
    while (i < lines.length && !isHeader(lines[i])) {
      body.push(lines[i]);
      i += 1;
    }

    if (action === 'add') {
      const content = body.map((line) => (line.startsWith('+') ? line.slice(1) : line));
      ops.push({ action, path: rawPath, content });
      continue;
    }

    const hunks = parseHunks(body);
    ops.push({ action, path: rawPath, hunks });
  }

  return ops;
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
    const oldBlock = hunk.tokens
      .filter((token) => token.type !== 'add')
      .map((token) => token.text);
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
