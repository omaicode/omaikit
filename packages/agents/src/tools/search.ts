import * as path from 'path';
import { ToolDefinition, ToolHandler } from './types';
import { resolveSafePath, walkFiles, globToRegex, readFileLines } from './utils';

export const searchToolDefinition: ToolDefinition = {
  name: 'search',
  description: 'Search for text in files under the project root.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query string or regex pattern.' },
      isRegex: { type: 'boolean', description: 'Treat query as regex (default: false).' },
      includePattern: {
        type: 'string',
        description: 'Optional glob pattern to filter file paths.',
      },
      maxResults: { type: 'integer', description: 'Maximum number of matches to return.' },
    },
    required: ['query'],
  },
};

export const searchToolHandler: ToolHandler = (args, context) => {
  const rawQuery = typeof args.query === 'string' ? args.query : '';
  const query = rawQuery.length === 0 ? '.*' : rawQuery;
  if (rawQuery.length === 0) {
    args.isRegex = true;
  }

  const root = context.rootPath || context.cwd || process.cwd();
  const { absolutePath: rootPath } = resolveSafePath('.', root);

  const includePattern =
    typeof args.includePattern === 'string' && args.includePattern.length > 0
      ? globToRegex(args.includePattern)
      : undefined;

  const files = walkFiles(rootPath, includePattern);
  const maxResults = typeof args.maxResults === 'number' ? Math.max(args.maxResults, 1) : 50;

  const regex = args.isRegex ? new RegExp(query, 'i') : new RegExp(escapeRegex(query), 'i');

  const matches: Array<{ path: string; line: number; text: string }> = [];

  for (const file of files) {
    if (matches.length >= maxResults) break;
    const relative = path.relative(rootPath, file);
    const lines = readFileLines(file);
    for (let i = 0; i < lines.length; i += 1) {
      if (regex.test(lines[i])) {
        matches.push({ path: relative, line: i + 1, text: lines[i] });
        if (matches.length >= maxResults) break;
      }
    }
  }

  return { ok: true, data: { matches } };
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
