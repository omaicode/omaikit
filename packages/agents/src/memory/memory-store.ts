import * as fs from 'fs';
import * as path from 'path';

export interface MemoryEntry {
  timestamp: string;
  prompt: string;
  response: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}

export class MemoryStore {
  private baseDir: string;

  constructor(baseDir: string = path.join('.omaikit', 'memory')) {
    this.baseDir = baseDir;
  }

  async append(agentName: string, entry: MemoryEntry): Promise<void> {
    this.ensureDir();
    const filepath = this.getFilePath(agentName);
    const serialized = JSON.stringify(entry);
    fs.appendFileSync(filepath, `${serialized}\n`, 'utf-8');
  }

  async readRecent(agentName: string, limit: number = 5): Promise<MemoryEntry[]> {
    const filepath = this.getFilePath(agentName);
    if (!fs.existsSync(filepath)) {
      return [];
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const recent = lines.slice(-limit).map((line) => this.safeParse(line)).filter(Boolean) as MemoryEntry[];
    return recent;
  }

  formatRecent(entries: MemoryEntry[], maxLength: number = 800): string {
    if (entries.length === 0) {
      return '';
    }

    return entries
      .map((entry) => {
        const prompt = this.truncate(entry.prompt, maxLength);
        const response = this.truncate(entry.response, maxLength);
        return `- ${entry.timestamp}\n  Prompt: ${prompt}\n  Response: ${response}`;
      })
      .join('\n');
  }

  async clear(agentName: string): Promise<void> {
    const filepath = this.getFilePath(agentName);
    if (fs.existsSync(filepath)) {
      fs.rmSync(filepath, { force: true });
    }
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(agentName: string): string {
    return path.join(this.baseDir, `${agentName}.jsonl`);
  }

  private safeParse(line: string): MemoryEntry | null {
    try {
      return JSON.parse(line) as MemoryEntry;
    } catch {
      return null;
    }
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength)}…`;
  }
}
