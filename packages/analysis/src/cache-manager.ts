import * as fs from 'fs';
import * as path from 'path';

export class CacheManager {
  private cacheDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.cacheDir = path.join(baseDir, '.omaikit', 'cache');
    if (!fs.existsSync(this.cacheDir)) fs.mkdirSync(this.cacheDir, { recursive: true });
  }

  getCachePath(key: string): string {
    return path.join(this.cacheDir, encodeURIComponent(key) + '.json');
  }

  has(key: string): boolean {
    return fs.existsSync(this.getCachePath(key));
  }

  read<T = unknown>(key: string): T | null {
    const p = this.getCachePath(key);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf-8');
    try {
      return JSON.parse(raw) as T;
    } catch (_e) {
      return null;
    }
  }

  write(key: string, value: unknown): void {
    const p = this.getCachePath(key);
    fs.writeFileSync(p, JSON.stringify(value, null, 2), 'utf-8');
  }
}
