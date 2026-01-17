import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition, ToolHandler } from './types';
import { resolveSafePath, walkFiles, globToRegex } from './utils';

export const listFilesToolDefinition: ToolDefinition = {
  name: 'list_files',
  description: 'List files under a directory within the project root.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path to list, relative to the project root (default: .).',
      },
      includePattern: {
        type: 'string',
        description: 'Optional glob pattern to filter file paths.',
      },
      maxResults: { type: 'integer', description: 'Maximum number of files to return.' },
    },
  },
};

export const listFilesToolHandler: ToolHandler = (args, context) => {
  const pathArg = typeof args.path === 'string' && args.path.length > 0 ? args.path : '.';
  const root = context.rootPath || context.cwd || process.cwd();
  const { absolutePath, relativePath } = resolveSafePath(pathArg, root);

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return { ok: true, data: { path: relativePath, files: [relativePath] } };
  }

  const includePattern =
    typeof args.includePattern === 'string' && args.includePattern.length > 0
      ? globToRegex(args.includePattern)
      : undefined;

  const files = walkFiles(absolutePath, includePattern);
  const maxResults = typeof args.maxResults === 'number' ? Math.max(args.maxResults, 1) : files.length;
  const baseRoot = path.resolve(root);
  const sliced = files.slice(0, maxResults).map((file) => {
    const relativeToRoot = path.relative(baseRoot, file);
    if (relativeToRoot && !relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot)) {
      return relativeToRoot;
    }
    return path.relative(absolutePath, file);
  });
  return { ok: true, data: { path: relativePath, files: sliced } };
};
