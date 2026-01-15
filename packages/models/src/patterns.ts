export interface CodePattern {
  id: string;
  description: string;
  regex: string;
  severity?: 'info' | 'warn' | 'error';
}

export const DEFAULT_PATTERNS: CodePattern[] = [
  {
    id: 'TODO_COMMENT',
    description: 'Find TODO comments left in code',
    regex: "\\/\\/\\s*TODO",
    severity: 'info',
  },
];
