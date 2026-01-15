import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import testCommand from '../../src/commands/test';

describe('Test Command Integration Test', () => {
  const omaikitDir = path.resolve(process.cwd(), '.omaikit');
  const contextPath = path.join(omaikitDir, 'context.json');
  const planDir = path.join(omaikitDir, 'plans');
  const planPath = path.join(planDir, 'P-0.json');

  beforeAll(() => {
    if (!fs.existsSync(omaikitDir)) {
      fs.mkdirSync(omaikitDir, { recursive: true });
    }
    if (!fs.existsSync(planDir)) {
      fs.mkdirSync(planDir, { recursive: true });
    }
    if (!fs.existsSync(contextPath)) {
      fs.writeFileSync(
        contextPath,
        JSON.stringify(
          {
            project: { name: 'test-project', rootPath: process.cwd() },
            analysis: { languages: ['typescript'], fileCount: 0, totalLOC: 0, dependencies: [] },
            generatedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        'utf-8'
      );
    }

    if (!fs.existsSync(planPath)) {
      fs.writeFileSync(
        planPath,
        JSON.stringify(
          {
            id: 'P-0',
            title: 'Test plan',
            description: 'Test plan description',
            milestones: [
              {
                id: 'M1',
                title: 'Testing',
                description: 'Generate tests',
                duration: 1,
                successCriteria: ['Tests generated'],
                tasks: [
                  {
                    id: 'T-TEST-1',
                    title: 'Generate tests',
                    description: 'Create tests',
                    type: 'test',
                    estimatedEffort: 1,
                    acceptanceCriteria: ['Tests created'],
                    inputDependencies: [],
                    outputDependencies: [],
                    affectedModules: ['core'],
                    status: 'planned',
                  },
                ],
              },
            ],
          },
          null,
          2
        ),
        'utf-8'
      );
    }
  });

  afterAll(() => {
    if (fs.existsSync(planPath)) {
      fs.rmSync(planPath, { force: true });
    }
    if (fs.existsSync(contextPath)) {
      fs.rmSync(contextPath, { force: true });
    }
    if (fs.existsSync(path.join(omaikitDir, 'tests'))) {
      fs.rmSync(path.join(omaikitDir, 'tests'), { recursive: true, force: true });
    }
  });

  it('should generate tests from plan tasks', async () => {
    const originalLog = console.log;
    let output = '';
    console.log = (message: string) => {
      output += message + '\n';
    };

    try {
      await testCommand({ planFile: 'plans/P-0.json' });
      expect(output.toLowerCase()).toContain('tests');
    } finally {
      console.log = originalLog;
    }
  });

  it('should handle missing plan gracefully', async () => {
    const originalLog = console.log;
    const originalExit = process.exit;
    console.log = () => {};
    let exitCalled = false;
    const exitMock = ((code?: number) => {
      exitCalled = true;
      throw new Error(`Process exit called with code ${code}`);
    }) as typeof process.exit;
    process.exit = exitMock;

    try {
      await expect(testCommand({ planFile: 'plans/missing.json' })).rejects.toThrow();
      expect(exitCalled).toBe(true);
    } finally {
      console.log = originalLog;
      process.exit = originalExit;
    }
  });
});
