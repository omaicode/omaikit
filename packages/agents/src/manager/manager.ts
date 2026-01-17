import { Agent } from '../agent';
import type { AgentInput, AgentOutput } from '../types';
import { Logger } from '../logger';
import { createDefaultToolRegistry } from '../tools/default-registry';
import type { ToolContext } from '../tools/types';
import { ToolRegistry } from '../tools/registry';
import { createProvider } from '../ai-provider/factory';
import { ContextWriter } from '../utils/context-writer';
import { MemoryStore } from '../memory/memory-store';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, OmaikitConfig } from '@omaikit/config';
import { AIProvider } from '../ai-provider/provider';
import { parseJsonFromText } from '../utils/json';
import { readPrompt } from '../utils/prompt';

export interface ManagerAgentInput extends AgentInput {
  rootPath?: string;
  description?: string;
  action?: 'init-context' | 'analyze';
}

export class ManagerAgent extends Agent {
  public name = 'Manager';

  private toolRegistry: ToolRegistry;
  private provider?: AIProvider;
  private memoryStore: MemoryStore;
  private cfg: OmaikitConfig;

  constructor(logger?: Logger) {
    super(logger);
    this.toolRegistry = createDefaultToolRegistry();
    this.memoryStore = new MemoryStore();
    this.cfg = loadConfig();
  }

  async init(): Promise<void> {
    try {
      this.provider = await createProvider();
    } catch (error) {
      this.logger.warn('Could not initialize AI provider, manager is offline');
    }
  }

  getTools(): ToolRegistry {
    return this.toolRegistry;
  }

  getToolContext(rootPath?: string): ToolContext {
    return {
      rootPath: rootPath || process.cwd(),
      cwd: process.cwd(),
      logger: this.logger,
    };
  }

  async execute(input: ManagerAgentInput): Promise<AgentOutput> {
    const action = input.action || 'analyze';

    if (action === 'init-context') {
      const rootPath = input.rootPath || process.cwd();
      
      if (this.isTestEnv()) {
        const fallbackPath = await this.writeContextWithScanner(rootPath, input.description);
        return {
          status: 'success',
          data: { contextPath: fallbackPath },
        };
      }

      await this.init();
      if (!this.provider) {
        return {
          status: 'failed',
          error: { code: 'MANAGER_NO_PROVIDER', message: 'AI provider not initialized' },
        };
      }

      const context = await this.generateContext(rootPath, input.description);
      const filePath = await this.writeContextFile(rootPath, context);
      return {
        status: 'success',
        data: { contextPath: filePath, context },
      };
    }

    return {
      status: 'success',
      data: { message: 'No-op manager action' },
    };
  }

  async writeContext(rootPath: string, description?: string): Promise<string> {
    if (this.isTestEnv()) {
      return this.writeContextWithScanner(rootPath, description);
    }
    await this.init();
    if (!this.provider) {
      throw new Error('AI provider not initialized');
    }
    const context = await this.generateContext(rootPath, description);
    const filePath = await this.writeContextFile(rootPath, context);
    return filePath;
  }

  private async writeContextWithScanner(rootPath: string, description?: string): Promise<string> {
    const baseDir = path.join(rootPath, '.omaikit');
    const writer = new ContextWriter(baseDir);
    return writer.writeContext(rootPath, description);
  }

  private async generateContext(
    rootPath: string,
    description?: string,
  ): Promise<Record<string, unknown>> {
    if(!this.provider) {
      throw new Error('Manager not initialized');
    }

    const toolContext = this.getToolContext(rootPath);
    const prompt = this.buildContextPrompt(rootPath, description);
    const instructions = readPrompt('manager.instructions');

    const response = await this.provider.generate(prompt, {
      model: this.cfg.managerModel,
      tools: this.toolRegistry.getDefinitions(),
      toolRegistry: this.toolRegistry,
      toolContext,
      toolChoice: 'auto',
      maxToolCalls: 3,
      instructions,
    });

    return this.parseContextJson(response);
  }

  private buildContextPrompt(rootPath: string, description?: string): string {
    const descriptionLine = description ? `Client request: ${description}` : 'Client request: (none)';
    return readPrompt('manager.context', { descriptionLine, rootPath });
  }

  private parseContextJson(response: string): Record<string, unknown> {
    return parseJsonFromText<Record<string, unknown>>(response);
  }

  private async writeContextFile(
    rootPath: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    const baseDir = path.join(rootPath, '.omaikit');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    const filePath = path.join(baseDir, 'context.json');
    fs.writeFileSync(filePath, JSON.stringify(context, null, 2), 'utf-8');
    return filePath;
  }

  private isTestEnv(): boolean {
    return process.env.VITEST !== undefined || process.env.NODE_ENV === 'test';
  }
}
