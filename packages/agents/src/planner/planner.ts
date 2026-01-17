/* eslint-disable max-lines */
import { Agent } from '../agent';
import { Logger } from '../logger';
import { AgentInput, AgentOutput } from '../types';
import { createProvider } from '../ai-provider/factory';
import { PromptTemplates } from './prompt-templates';
import { PlanParser } from './plan-parser';
import { createDefaultToolRegistry } from '../tools/default-registry';
import { MemoryStore } from '../memory/memory-store';
import type { ToolContext } from '../tools/types';
import { loadConfig, OmaikitConfig } from '@omaikit/config';
import { AIProvider } from '../ai-provider/provider';
import { ContextWriter, PlanWriter } from '../utils';
import * as fs from 'fs';
import * as path from 'path';

export class Planner extends Agent {
  public name = 'Planner';
  
  private promptTemplates: PromptTemplates;
  private planParser: PlanParser;
  private planWriter: PlanWriter;
  private contextWriter: ContextWriter;
  private provider?: AIProvider;
  private progressCallbacks: Array<(event: any) => void> = [];
  private memoryStore: MemoryStore;
  private cfg: OmaikitConfig;

  constructor(logger: Logger) {
    super(logger);
    this.promptTemplates = new PromptTemplates();
    this.planParser = new PlanParser();
    this.planWriter = new PlanWriter();
    this.contextWriter = new ContextWriter();
    this.memoryStore = new MemoryStore();
    this.cfg = loadConfig();
  }

  async init(): Promise<void> {
    try {
      this.provider = await createProvider();
    } catch (error) {
      this.logger.warn('Could not initialize Planner, using mock mode');
    }
  }

  onProgress(callback: (event: any) => void): void {
    this.progressCallbacks.push(callback);
  }

  private emit(event: string, data: any): void {
    for (const callback of this.progressCallbacks) {
      callback({ event, ...data });
    }
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const planInput = input as any;
    try {
      await this.beforeExecute(input);

      // Always initialize provider (will use real API if key is available)
      await this.init();
      if (!this.provider) {
        throw new Error('AI provider not initialized');
      } 

      // Validate input
      if (!planInput.description || planInput.description.trim().length === 0) {
        throw new Error('Description is required');
      }

      // Generate prompts from input (step-by-step)
      const step1Prompt = this.promptTemplates.generatePlanMilestonesPrompt(
        planInput.description,
        planInput.projectDescription,
        planInput.techStack,
      );

      const recentMemory = await this.memoryStore.readRecent(this.name, 3);
      const memoryContext = this.memoryStore.formatRecent(recentMemory);
      const prompt = memoryContext
        ? `${step1Prompt}\n\n## Recent Agent Memory\n${memoryContext}`
        : step1Prompt;

      this.logger.info(`Generating plan for: ${planInput.description.substring(0, 50)}...`);
      this.emit('progress', { status: 'generating', message: 'Generating plan & milestones', percent: 10 });

      const toolRegistry = createDefaultToolRegistry();
      const toolContext = this.buildToolContext(planInput);
      const step1Response = await this.provider.generate(prompt, {
        model: this.cfg.plannerModel,
        tools: toolRegistry.getDefinitions(),
        toolRegistry,
        toolContext,
        toolChoice: 'auto',
        maxToolCalls: 8,
      });
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt,
        response: step1Response,
        metadata: { step: 'plan_milestones' },
      });

      this.emit('progress', { status: 'generating', message: 'Generating tasks', percent: 30 });
      const step2Prompt = this.promptTemplates.generateTasksPrompt(step1Response);
      const step2Response = await this.provider.generate(step2Prompt, {
        model: this.cfg.plannerModel,
        tools: toolRegistry.getDefinitions(),
        toolRegistry,
        toolContext,
        toolChoice: 'auto',
        maxToolCalls: 8,
      });
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt: step2Prompt,
        response: step2Response,
        metadata: { step: 'tasks' },
      });

      this.emit('progress', { status: 'optimizing', message: 'Optimizing plan', percent: 60 });
      const step3Prompt = this.promptTemplates.generateOptimizePrompt(step2Response);
      const step3Response = await this.provider.generate(step3Prompt, {
        model: this.cfg.plannerModel,
        tools: toolRegistry.getDefinitions(),
        toolRegistry,
        toolContext,
        toolChoice: 'auto',
        maxToolCalls: 8
      });
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt: step3Prompt,
        response: step3Response,
        metadata: { step: 'optimize' },
      });

      this.emit('progress', {
        status: 'complete',
        message: 'Plan generation complete',
        percent: 100,
      });

      const planFile = this.getLatestPlanFile();
      if (!planFile) {
        throw new Error('Planner did not create a plan file');
      }

      const projectContext = await this.contextWriter.readContext();
      if (!projectContext) {
        throw new Error('Project context file not found or invalid');
      }

      const planFromFile = await this.planWriter.readPlan(planFile);
      if (!planFromFile) {
        throw new Error('Plan file not found or invalid');
      }

      const plan = this.planParser.parse(JSON.stringify(planFromFile));
      const result: AgentOutput = {
        data: {
          plan,
          projectContext,
        },
      };

      await this.afterExecute(result);
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt,
        response: step3Response,
        metadata: { step: 'final' },
      });
      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Planner error: ${err.message}`);
      await this.onError(err);
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt: '',
        response: err.message,
        metadata: { status: 'failed' },
      });

      return {
        error: {
          code: 'PLANNING_ERROR',
          message: err.message,
        },
      };
    }
  }

  private buildProjectContext(input: any) {
    const languages = this.inferLanguages(input.techStack);
    return {
      name: input.projectName || 'omaikit-project',
      root: input.rootPath || process.cwd(),
      modules: [],
      dependencyGraph: { modules: {}, edges: [] },
      metadata: {
        totalLOC: 0,
        fileCount: 0,
        languages,
        dependencies: this.inferDependencies(input.techStack),
      },
      codePatterns: {
        namingConventions: {
          variables: 'camelCase',
          functions: 'camelCase',
          classes: 'PascalCase',
          constants: 'UPPER_SNAKE_CASE',
          files: 'kebab-case',
        },
        errorHandling: { pattern: 'try-catch', examples: [] },
        structuralPattern: {
          modulesPerFeature: 2,
          averageModuleSize: 'medium',
          organizationStyle: 'by-feature',
        },
        comments: { docstringFormat: 'jsdoc', commentCoverage: 0 },
        testOrganization: { colocated: true, pattern: '__tests__' },
      },
    };
  }

  private buildToolContext(input: any): ToolContext {
    return {
      rootPath: input.rootPath || input.projectRoot || process.cwd(),
      cwd: process.cwd(),
      logger: this.logger,
    };
  }

  private inferLanguages(techStack?: string[]): string[] {
    if (!Array.isArray(techStack) || techStack.length === 0) {
      return ['typescript'];
    }

    const normalized = techStack.map((t) => t.toLowerCase());
    const languages = new Set<string>();
    if (normalized.some((t) => t.includes('typescript') || t === 'ts')) languages.add('typescript');
    if (normalized.some((t) => t.includes('javascript') || t === 'js' || t.includes('node')))
      languages.add('javascript');
    if (normalized.some((t) => t.includes('python') || t === 'py')) languages.add('python');
    if (normalized.some((t) => t.includes('go') || t.includes('golang'))) languages.add('go');
    if (normalized.some((t) => t.includes('rust'))) languages.add('rust');
    if (normalized.some((t) => t.includes('c#') || t.includes('csharp'))) languages.add('csharp');
    if (normalized.some((t) => t.includes('php'))) languages.add('php');

    return languages.size > 0 ? Array.from(languages) : ['typescript'];
  }

  private inferDependencies(techStack?: string[]): string[] {
    if (!Array.isArray(techStack)) {
      return [];
    }

    const deps = new Set<string>();
    techStack.forEach((entry) => {
      const normalized = entry.toLowerCase();
      if (normalized.includes('express')) deps.add('express');
      if (normalized.includes('react')) deps.add('react');
      if (normalized.includes('nestjs')) deps.add('@nestjs/core');
      if (normalized.includes('prisma')) deps.add('prisma');
    });

    return Array.from(deps);
  }

  private getLatestPlanFile(): string | undefined {
    const planDir = path.join('.omaikit', 'plans');
    if (!fs.existsSync(planDir)) {
      return undefined;
    }

    const indices = fs
      .readdirSync(planDir)
      .map((file) => /^P(\d+)\.json$/i.exec(file))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => Number.parseInt(match[1], 10))
      .filter((value) => !Number.isNaN(value));

    if (indices.length === 0) {
      return undefined;
    }

    const latest = Math.max(...indices);
    const planId = `P${String(latest).padStart(3, '0')}`;
    return path.join('plans', `${planId}.json`);
  }
}
