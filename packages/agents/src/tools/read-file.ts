import { ToolDefinition, ToolHandler } from './types';
import { resolveSafePath, ensureFileExists, readFileLines } from './utils';

export const readFileToolDefinition: ToolDefinition = {
  name: 'read_file',
  description: 'Read a file from disk with optional line range.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file, relative to the project root.' },
      startLine: { type: 'integer', description: '1-based start line number (inclusive).' },
      endLine: { type: 'integer', description: '1-based end line number (inclusive).' },
      encoding: { type: 'string', description: 'File encoding (default: utf-8).' },
    },
    required: ['path'],
  },
};

export const readFileToolHandler: ToolHandler = (args, context) => {
  const pathArg = String(args.path || '');
  if (!pathArg) {
    return { ok: false, error: { message: 'path is required', code: 'INVALID_ARGS' } };
  }

  const { absolutePath, relativePath } = resolveSafePath(pathArg, context.rootPath || context.cwd);
  ensureFileExists(absolutePath);

  const encoding = (args.encoding as BufferEncoding) || 'utf-8';
  const lines = readFileLines(absolutePath, encoding);

  const startLine = typeof args.startLine === 'number' ? Math.max(args.startLine, 1) : 1;
  const endLine =
    typeof args.endLine === 'number' ? Math.min(args.endLine, lines.length) : lines.length;

  const slice = lines.slice(startLine - 1, endLine).join('\n');

  return {
    ok: true,
    data: {
      path: relativePath,
      startLine,
      endLine,
      totalLines: lines.length,
      content: slice,
    },
  };
};
