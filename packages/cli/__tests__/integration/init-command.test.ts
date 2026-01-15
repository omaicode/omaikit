import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import initCommand from '../../src/commands/init';

describe('Init Command Integration Test', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omaikit-init-'));
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'init-test', description: 'test project' }, null, 2),
      'utf-8'
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create context.json in .omaikit', async () => {
    await initCommand({ rootPath: tempDir });

    const contextPath = path.join(tempDir, '.omaikit', 'context.json');
    expect(fs.existsSync(contextPath)).toBe(true);

    const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
    expect(context.project.name).toBe(path.basename(tempDir));
    expect(context.project.rootPath).toBe(tempDir);
    expect(context.analysis.languages).toBeDefined();
  });

  it('should allow re-running init without errors', async () => {
    await initCommand({ rootPath: tempDir });
    await expect(initCommand({ rootPath: tempDir })).resolves.toBeUndefined();

    const contextPath = path.join(tempDir, '.omaikit', 'context.json');
    expect(fs.existsSync(contextPath)).toBe(true);
  });
});
