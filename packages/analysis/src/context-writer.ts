import * as fs from 'fs';
import * as path from 'path';

interface ContextSummary {
  project: {
    name: string;
    rootPath: string;
    description?: string;
  };
  analysis: {
    languages: string[];
    fileCount: number;
    totalLOC: number;
    dependencies: string[];
  };
  generatedAt: string;
}

const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.omaikit',
  'dist',
  'build',
  'coverage',
  '.analysis-cache',
]);

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.cs': 'csharp',
  '.java': 'java',
};

export class ContextWriter {
  private baseDir = '.omaikit';
  private contextFile = 'context.json';

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    }
  }

  async writeContext(rootPath?: string, descriptionOverride?: string): Promise<string> {
    const context = this.buildContext(rootPath || process.cwd(), descriptionOverride);
    return this.writeContextFile(context);
  }

  async readContext(): Promise<ContextSummary | null> {
    const filepath = path.join(this.baseDir, this.contextFile);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(content) as ContextSummary;
    } catch {
      return null;
    }
  }

  private writeContextFile(context: ContextSummary): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(this.baseDir)) {
          fs.mkdirSync(this.baseDir, { recursive: true });
        }

        const filepath = path.join(this.baseDir, this.contextFile);
        fs.writeFileSync(filepath, JSON.stringify(context, null, 2), 'utf-8');
        resolve(filepath);
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildContext(rootPath: string, descriptionOverride?: string): ContextSummary {
    const stats = this.scanProject(rootPath);
    const description = descriptionOverride?.trim()
      ? descriptionOverride.trim()
      : this.readDescription(rootPath);
    return {
      project: {
        name: path.basename(rootPath),
        rootPath,
        description,
      },
      analysis: {
        languages: stats.languages,
        fileCount: stats.fileCount,
        totalLOC: stats.totalLOC,
        dependencies: this.readDependencies(rootPath),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private readDescription(rootPath: string): string | undefined {
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      return typeof pkg.description === 'string' ? pkg.description : undefined;
    } catch {
      return undefined;
    }
  }

  private readDependencies(rootPath: string): string[] {
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      return Array.from(new Set([...deps, ...devDeps]));
    } catch {
      return [];
    }
  }

  private scanProject(rootPath: string) {
    const languages = new Set<string>();
    let fileCount = 0;
    let totalLOC = 0;

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (DEFAULT_IGNORE_DIRS.has(entry.name)) {
            continue;
          }
          walk(path.join(dir, entry.name));
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          const language = LANGUAGE_MAP[ext];
          if (language) {
            languages.add(language);
            fileCount += 1;
            const filePath = path.join(dir, entry.name);
            totalLOC += this.countLines(filePath);
          }
        }
      }
    };

    walk(rootPath);

    return {
      languages: Array.from(languages),
      fileCount,
      totalLOC,
    };
  }

  private countLines(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.split(/\r?\n/).length;
    } catch {
      return 0;
    }
  }
}
