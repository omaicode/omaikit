import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const PROMPT_CACHE = new Map<string, string>();

export function readPrompt(name: string, variables?: Record<string, string>): string {
  const template = getPromptTemplate(name);
  return renderTemplate(template, variables).trimEnd();
}

export function readPromptList(name: string): string[] {
  const content = readPrompt(name);
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const bullets = lines
    .filter((line) => line.startsWith('- ') || line.startsWith('* '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);

  if (bullets.length > 0) {
    return bullets;
  }

  return lines.filter(Boolean);
}

function getPromptTemplate(name: string): string {
  if (PROMPT_CACHE.has(name)) {
    return PROMPT_CACHE.get(name) as string;
  }

  const { folder, key } = parsePromptName(name);
  const promptsPath = resolvePromptPath(folder, key);
  const template = fs.readFileSync(promptsPath, 'utf-8');

  PROMPT_CACHE.set(name, template);
  return template;
}

function resolvePromptPath(folder: string, key: string): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(currentDir, '..', '..');
  return path.join(rootDir, 'prompts', folder, `${key}.md`);
}

function parsePromptName(name: string): { folder: string; key: string } {
  const index = name.indexOf('.');
  if (index <= 0 || index === name.length - 1) {
    throw new Error(`Invalid prompt name: ${name}`);
  }
  const folder = name.slice(0, index).trim();
  const key = name.slice(index + 1).trim();
  if (!folder || !key) {
    throw new Error(`Invalid prompt name: ${name}`);
  }
  return { folder, key };
}

function renderTemplate(template: string, variables?: Record<string, string>): string {
  if (!variables) return template;
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key) => {
    return variables[key] ?? '';
  });
}
