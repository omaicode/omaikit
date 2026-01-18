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
      // Intructions prompt
      const instructions = this.promptTemplates.getInstructions();

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
      this.emit('progress', { status: 'generating', message: 'Generating plan & milestones', percent: 20 });

      const toolRegistry = createDefaultToolRegistry();
      const toolContext = this.buildToolContext(planInput);
      const step1Response = await this.provider.generate(prompt, {
        model: this.cfg.plannerModel,
        tools: toolRegistry.getDefinitions(),
        toolRegistry,
        toolContext,
        toolChoice: 'auto',
        maxToolCalls: 3,
        instructions,
      });
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt,
        response: step1Response,
        metadata: { step: 'plan_milestones' },
      });

      const projectContext = await this.contextWriter.readContext();
      if (!projectContext) {
        throw new Error('Project context file not found or invalid');
      }      

      const planFile = this.getLatestPlanFile();
      if (!planFile) {
        throw new Error('Planner did not create a plan file');
      }     

      const planFromFile = await this.planWriter.readPlan(planFile);
      if (!planFromFile) {
        throw new Error('Plan file not found or invalid');
      }      

      for(const m of planFromFile.milestones) {
        const percent =
          20 +
          Math.floor(((planFromFile.milestones.indexOf(m) + 1) / planFromFile.milestones.length) * 80);
        this.emit('progress', {
          status: 'generating',
          message: `Generating tasks for Milestone: ${m.title}`,
          percent,
        });        
        const taskPrompt = this.promptTemplates.generateTasksPrompt(projectContext, planFromFile, m);
        const taskResp = await this.provider.generate(taskPrompt, {
          model: this.cfg.plannerModel,
          tools: toolRegistry.getDefinitions(),
          toolRegistry,
          toolContext,
          toolChoice: 'auto',
          maxToolCalls: 3,
          instructions,
        });        
        await this.memoryStore.append(this.name, {
          timestamp: new Date().toISOString(),
          prompt: taskPrompt,
          response: taskResp,
          metadata: { step: 'tasks' },
        });        
      }

      this.emit('progress', {
        status: 'complete',
        message: 'Plan generation complete',
        percent: 100,
      });

      const plan = this.planParser.parse(JSON.stringify(planFromFile));
      const result: AgentOutput = {
        data: {
          plan,
          projectContext,
        },
      };

      await this.afterExecute(result);
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

  private buildToolContext(input: any): ToolContext {
    return {
      rootPath: input.rootPath || input.projectRoot || process.cwd(),
      cwd: process.cwd(),
      logger: this.logger,
    };
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
