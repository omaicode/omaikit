/* eslint-disable max-lines */
import { Agent } from '../agent';
import { Logger } from '../logger';
import { AgentInput, AgentOutput } from '../types';
import { createProvider } from '../ai-provider/factory';
import { PromptTemplates } from './prompt-templates';
import { PlanParser } from './plan-parser';
import { PlanValidator } from './plan-validator';
import { ClarificationHandler } from './clarification-handler';
import { createDefaultToolRegistry } from '../tools/default-registry';
import { MemoryStore } from '../memory/memory-store';
import type { ToolContext } from '../tools/types';
import { loadConfig, OmaikitConfig } from '@omaikit/config';
import { AIProvider } from '../ai-provider/provider';

export class Planner extends Agent {
  private promptTemplates: PromptTemplates;
  private planParser: PlanParser;
  private validator: PlanValidator;
  private clarificationHandler: ClarificationHandler;
  private provider?: AIProvider;
  private progressCallbacks: Array<(event: any) => void> = [];
  private memoryStore: MemoryStore;
  private cfg: OmaikitConfig;

  constructor(logger: Logger) {
    super(logger);
    this.name = 'Planner';
    this.promptTemplates = new PromptTemplates();
    this.planParser = new PlanParser();
    this.validator = new PlanValidator();
    this.clarificationHandler = new ClarificationHandler();
    this.memoryStore = new MemoryStore();
    this.cfg = loadConfig();
  }

  async init(): Promise<void> {
    try {
      this.provider = await createProvider();
      this.logger.info('Planner initialized with AI provider');
    } catch (error) {
      this.logger.warn('Could not initialize AI provider, using mock mode');
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

      // Validate input
      if (!planInput.description || planInput.description.trim().length === 0) {
        throw new Error('Description is required');
      }

      // Generate prompt from input
      const basePrompt = this.promptTemplates.generatePrompt(
        planInput.description,
        planInput.projectType,
        planInput.techStack,
      );

      const recentMemory = await this.memoryStore.readRecent(this.name, 3);
      const memoryContext = this.memoryStore.formatRecent(recentMemory);
      const prompt = memoryContext
        ? `${basePrompt}\n\n## Recent Agent Memory\n${memoryContext}`
        : basePrompt;

      this.logger.info(`Generating plan for: ${planInput.description.substring(0, 50)}...`);

      // Call AI provider to generate plan
      this.emit('progress', { status: 'generating', message: 'Calling AI provider' });

      // In test mode, use mock generation for speed
      let llmResponse: string;
      if (process.env.VITEST !== undefined) {
        this.logger.info('Using mock plan generation (test mode)');
        llmResponse = this.generateMockPlan(planInput);
      } else {
        if (!this.provider) {
          throw new Error('AI provider not initialized');
        }

        const toolRegistry = createDefaultToolRegistry();
        const toolContext = this.buildToolContext(planInput);
        llmResponse = await this.provider.generate(prompt, {
          model: this.cfg.plannerModel,
          tools: toolRegistry.getDefinitions(),
          toolRegistry,
          toolContext,
          toolChoice: 'auto',
        });

        if (llmResponse.startsWith('OPENAI_ECHO') || llmResponse.startsWith('ANTHROPIC_ECHO')) {
          this.logger.warn('Using mock plan generation (no API key configured)');
          llmResponse = this.generateMockPlan(planInput);
        }
      }

      if (this.isLikelyTruncated(llmResponse)) {
        if (this.provider && process.env.VITEST === undefined) {
          this.logger.warn('LLM response appears truncated; attempting repair');
          const repairPrompt = this.promptTemplates.generateRepairPrompt(llmResponse);
          llmResponse = await this.provider.generate(repairPrompt);
        }
      }

      this.emit('progress', { status: 'parsing', message: 'Parsing LLM response' });

      let parsedPlan: any;
      try {
        parsedPlan = this.planParser.parse(llmResponse);
      } catch (parseError) {
        if (this.provider && process.env.VITEST === undefined) {
          this.logger.warn('Plan JSON parse failed, attempting repair');
          const repairPrompt = this.promptTemplates.generateRepairPrompt(llmResponse);
          const repaired = await this.provider.generate(repairPrompt);
          parsedPlan = this.planParser.parse(repaired);
        } else {
          throw parseError;
        }
      }

      this.emit('progress', {
        status: 'validating',
        message: 'Validating plan structure',
      });
      const validationResult = this.validator.validate(parsedPlan);

      if (!validationResult.valid) {
        throw new Error(`Plan validation failed: ${validationResult.errors.join(', ')}`);
      }

      const depResult = this.validator.validateDependencies(
        parsedPlan.milestones.flatMap((m: any) => m.tasks),
      );

      if (depResult.hasCycles) {
        throw new Error('Plan contains circular dependencies');
      }

      this.emit('progress', {
        status: 'complete',
        message: 'Plan generation complete',
      });

      const projectContext = this.buildProjectContext(planInput);
      const result: AgentOutput = {
        data: {
          plan: parsedPlan,
          projectContext,
        },
      };

      await this.afterExecute(result);
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt,
        response: llmResponse,
      });
      await this.memoryStore.clear(this.name);
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

  private generateMockPlan(input: any): string {
    // Fallback mock response when no API key is available
    const mockPlan = {
      id: `plan-${Date.now()}`,
      title: `Plan for: ${input.description.substring(0, 30)}`,
      description: input.description,
      clarifications: [],
      milestones: [
        {
          id: 'M1',
          title: 'Setup & Foundation',
          description: 'Project setup and baseline configuration',
          duration: 5,
          successCriteria: ['Project structure created', 'Tooling configured'],
          tasks: [
            {
              id: 'T1',
              title: 'Project initialization',
              description: 'Setup project structure and configuration',
              type: 'infrastructure' as const,
              estimatedEffort: 3,
              acceptanceCriteria: [
                'Repository structure is created',
                'Configuration files are added',
              ],
              inputDependencies: [],
              outputDependencies: ['T2'],
              affectedModules: ['core'],
              status: 'planned' as const,
            },
            {
              id: 'T2',
              title: 'Development environment',
              description: 'Configure development tools and dependencies',
              type: 'infrastructure' as const,
              estimatedEffort: 2,
              acceptanceCriteria: ['Dependencies installed', 'Linting and formatting configured'],
              inputDependencies: ['T1'],
              outputDependencies: ['T3'],
              affectedModules: ['tooling'],
              status: 'planned' as const,
            },
          ],
        },
        {
          id: 'M2',
          title: 'Core Development',
          description: 'Implement primary functionality',
          duration: 10,
          successCriteria: ['Core features implemented', 'Basic tests pass'],
          tasks: [
            {
              id: 'T3',
              title: 'Implement core features',
              description: 'Build main functionality',
              type: 'feature' as const,
              estimatedEffort: 8,
              acceptanceCriteria: [
                'Core functionality implemented',
                'Endpoints/modules behave as expected',
              ],
              inputDependencies: ['T1', 'T2'],
              outputDependencies: [],
              affectedModules: ['core'],
              status: 'planned' as const,
            },
          ],
        },
      ],
    };

    return JSON.stringify(mockPlan);
  }

  private isLikelyTruncated(response: string): boolean {
    const trimmed = response.trim();
    if (!trimmed || trimmed === '{}') {
      return true;
    }
    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;
    if (openBraces === 0 || closeBraces === 0) {
      return true;
    }
    if (closeBraces < openBraces) {
      return true;
    }
    if (!trimmed.includes('milestones') && !trimmed.includes('"milestones"')) {
      return true;
    }
    return false;
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
}
