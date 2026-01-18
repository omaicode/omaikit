import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.omaikit',
  'dist',
  'build',
  'coverage',
  '.analysis-cache',
]);

export function resolveSafePath(
  targetPath: string,
  rootPath?: string,
): { absolutePath: string; relativePath: string } {
  const base = rootPath ? path.resolve(rootPath) : process.cwd();
  const absolute = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(base, targetPath);

  const baseNormalized = normalizePath(base);
  const absoluteNormalized = normalizePath(absolute);

  if (!isSubPath(baseNormalized, absoluteNormalized)) {
    throw new Error('Path escapes root directory');
  }

  return { absolutePath: absolute, relativePath: path.relative(base, absolute) };
}

export function ensureFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

export function readFileLines(filePath: string, encoding: BufferEncoding = 'utf-8'): string[] {
  const content = fs.readFileSync(filePath, encoding);
  return content.split(/\r?\n/);
}

export function writeFileLines(
  filePath: string,
  lines: string[],
  encoding: BufferEncoding = 'utf-8',
): void {
  fs.writeFileSync(filePath, lines.join('\n'), encoding);
}

export function walkFiles(rootPath: string, includePattern?: RegExp): string[] {
  const results: string[] = [];
  const stack = [rootPath];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (DEFAULT_IGNORE_DIRS.has(entry.name)) continue;
        stack.push(path.join(current, entry.name));
      } else if (entry.isFile()) {
        const filePath = path.join(current, entry.name);
        const relative = path.relative(rootPath, filePath);
        const normalizedRelative = relative.replace(/\\/g, '/');
        if (!includePattern || includePattern.test(normalizedRelative)) {
          results.push(filePath);
        }
      }
    }
  }

  return results;
}

export function globToRegex(glob: string): RegExp {
  const normalizedGlob = glob.replace(/\\/g, '/');
  let regex = '';
  let i = 0;

  while (i < normalizedGlob.length) {
    const char = normalizedGlob[i];

    if (char === '/') {
      regex += '/';
      i += 1;
      continue;
    }

    if (char === '*') {
      const isDouble = glob[i + 1] === '*';
      if (isDouble) {
        regex += '.*';
        i += 2;
        continue;
      }
      regex += '[^/\\\\]*';
      i += 1;
      continue;
    }

    if (char === '?') {
      regex += '[^/\\\\]';
      i += 1;
      continue;
    }

    regex += escapeRegexChar(char);
    i += 1;
  }

  return new RegExp(`^${regex}$`, 'i');
}

function escapeRegexChar(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function normalizePath(input: string): string {
  const normalized = path.resolve(input);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function isSubPath(root: string, target: string): boolean {
  if (root === target) return true;
  const relative = path.relative(root, target);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}
