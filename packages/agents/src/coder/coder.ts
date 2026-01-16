/* eslint-disable max-lines */
/**
 * Coder Agent - Code Generation
 * Generates production-ready code from plan tasks
 */

import type { AgentInput, AgentOutput } from '../types';
import type { Task, CodeGeneration } from '@omaikit/models';
import { Agent } from '../agent';
import { Logger } from '../logger';
import { PromptTemplates } from './prompt-templates';
import { createProvider } from '../ai-provider/factory';
import { createDefaultToolRegistry } from '../tools/default-registry';
import type { ToolContext } from '../tools/types';
import { MemoryStore } from '../memory/memory-store';
import { AIProvider } from '../ai-provider/provider';
import { loadConfig, OmaikitConfig } from '@omaikit/config';

export interface CoderAgentInput extends AgentInput {
  task: Task;
  projectContext: any;
  plan: any;
  force?: boolean;
}

export interface CoderAgentOutput extends AgentOutput {
  result: CodeGeneration;
  metadata: {
    durationMs: number;
    filesGenerated?: number;
    totalLOC?: number;
    syntaxErrors?: number;
    lintingIssues?: number;
    writtenPaths?: string[];
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
  };
}

export class CoderAgent extends Agent {
  public name = 'Coder';
  
  private promptTemplates: PromptTemplates;
  private provider?: AIProvider;
  private memoryStore: MemoryStore;
  private cfg: OmaikitConfig;

  constructor(logger?: Logger) {
    super(logger);
    this.promptTemplates = new PromptTemplates();
    this.memoryStore = new MemoryStore();
    this.cfg = loadConfig();
  }

  async init(): Promise<void> {
    try {
      this.provider = createProvider();
    } catch (error) {
      this.logger.warn('Could not initialize Coder, using mock mode');
    }
  }

  /**
   * Execute code generation for a task
   */
  async execute(input: CoderAgentInput): Promise<CoderAgentOutput> {
    const startTime = Date.now();
    const output: CoderAgentOutput = {
      agentName: this.name,
      status: 'success',
      timestamp: new Date().toISOString(),
      result: {
        id: `cg-${Date.now()}`,
        taskId: input.task.id,
        prompt: '',
        files: [],
      },
      metadata: {
        durationMs: 0,
        filesGenerated: 0,
        totalLOC: 0,
        syntaxErrors: 0,
        lintingIssues: 0,
      },
    };

    try {
      await this.beforeExecute(input);

      // Validate input
      this.validateInput(input);

      // Generate prompt
      const prompt = await this.promptTemplates.generatePrompt(
        input.task,
        input.projectContext,
        input.plan,
      );

      const recentMemory = await this.memoryStore.readRecent(this.name, 3);
      const memoryContext = this.memoryStore.formatRecent(recentMemory);

      const reuseSection = this.buildReuseSection(input);
      const finalPrompt = [
        prompt,
        memoryContext ? `## Recent Agent Memory\n${memoryContext}` : '',
        reuseSection ? `## Reuse Opportunities\n${reuseSection}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      output.result.prompt = finalPrompt;

      // Call LLM via AIProvider (would be injected)
      // For now, return mock response
      const { response: llmResponse, toolCalls } = await this.callLLM(
        finalPrompt,
        input
      );
      const timestamp = new Date().toISOString();
      const memoryEntries = [] as Array<{
        timestamp: string;
        prompt: string;
        response: string;
        taskId?: string;
        metadata?: Record<string, unknown>;
      }>;

      for (const toolCall of toolCalls) {
        memoryEntries.push({
          timestamp,
          prompt: finalPrompt,
          response: JSON.stringify(toolCall),
          taskId: input.task.id,
          metadata: { type: 'tool_call', tool: toolCall.name },
        });
      }

      if (llmResponse && llmResponse.trim().length > 0) {
        memoryEntries.push({
          timestamp,
          prompt: finalPrompt,
          response: llmResponse,
          taskId: input.task.id,
          metadata: { type: 'text_response' },
        });
      }

      await this.memoryStore.appendManyUnique(this.name, memoryEntries);

      // Prepare output
      output.result.metadata = {
        generatedAt: new Date().toISOString(),
        model: this.cfg.coderModel,
      };

      await this.afterExecute(output);
    } catch (error) {
      await this.onError(error as Error);
      output.status = 'failed';
      output.error = {
        code: 'CODER_ERROR',
        message: (error as Error).message,
      };
    }

    output.metadata.durationMs = Date.now() - startTime;
    return output;
  }

  /**
   * Validate output structure and correctness
   */
  async validate(output: AgentOutput): Promise<any> {
    const issues: any[] = [];
    let qualityScore = 100;

    const result = (output.result as CodeGeneration) || {};

    // Check required fields
    if (!result.id) {
      issues.push({
        severity: 'error',
        message: 'Missing result.id',
        field: 'result.id',
      });
      qualityScore -= 25;
    }

    if (!result.taskId) {
      issues.push({
        severity: 'error',
        message: 'Missing result.taskId',
        field: 'result.taskId',
      });
      qualityScore -= 25;
    }

    if (!Array.isArray(result.files) || result.files.length === 0) {
      issues.push({
        severity: 'error',
        message: 'No files generated',
        field: 'result.files',
      });
      qualityScore -= 25;
    }

    // Check file structure
    if (Array.isArray(result.files)) {
      result.files.forEach((file, idx) => {
        if (!file.path) {
          issues.push({
            severity: 'error',
            message: `File ${idx} missing path`,
            field: `result.files[${idx}].path`,
          });
          qualityScore -= 5;
        }
        if (!file.language) {
          issues.push({
            severity: 'error',
            message: `File ${idx} missing language`,
            field: `result.files[${idx}].language`,
          });
          qualityScore -= 5;
        }
        if (!file.content) {
          issues.push({
            severity: 'error',
            message: `File ${idx} missing content`,
            field: `result.files[${idx}].content`,
          });
          qualityScore -= 5;
        }
      });
    }

    return {
      isValid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      warnings: [],
      qualityScore: Math.max(0, qualityScore),
    };
  }

  /**
   * Check if agent can handle a task
   */
  canHandle(task: Task): boolean {
    // Coder handles feature, refactor, and bugfix tasks
    return ['feature', 'refactor', 'bugfix'].includes(task.type);
  }

  /**
   * Validate input structure
   */
  private validateInput(input: CoderAgentInput): void {
    if (!input.task) {
      throw new Error('Task is required');
    }
    if (!input.projectContext) {
      throw new Error('Project context is required');
    }
    if (!input.task.id || !input.task.title) {
      throw new Error('Task must have id and title');
    }
  }
  
  /**
   * Call LLM to generate code
   */
  private async callLLM(
    prompt: string,
    input: CoderAgentInput,
  ): Promise<{ response: string; toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }> }> {
    const toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }> = [];
    const toolRegistry = createDefaultToolRegistry();
    const toolContext = this.buildToolContext(input);
    if(!this.provider) {
      this.init();
    }

    if (!this.provider || !this.provider.generateCode) {
      throw new Error('AI provider does not support Codex responses API');
    }

    const response = await this.provider.generateCode(prompt, {
      model: this.cfg.coderModel,
      maxTokens: undefined,
      temperature: undefined,
      tools: toolRegistry.getDefinitions(),
      toolRegistry,
      toolContext,
      toolChoice: 'auto',
      maxToolCalls: 3,
      onToolCall: (event) => toolCalls.push(event),
      onTextResponse: (text) => {
        this.logger.info('[Coder] Answered: \n' + text);
      }
    });

    if (typeof response !== 'string') {
      return { response: JSON.stringify(response ?? ''), toolCalls };
    }

    return { response, toolCalls };
  }

  private buildReuseSection(input: CoderAgentInput): string | null {
    const rawSources = [
      input.plan?.reuseOpportunities,
      input.projectContext?.reuseOpportunities,
      input.projectContext?.analysis?.reuseOpportunities,
      input.projectContext?.analysis?.reuseSuggestions,
    ];

    const items = rawSources.flatMap((value) => (Array.isArray(value) ? value : []));
    const normalized = items
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const description = (item as any).description || (item as any).summary;
          const moduleName = (item as any).module || (item as any).moduleName;
          if (description) return String(description).trim();
          if (moduleName) return `Consider reusing module: ${String(moduleName).trim()}`;
        }
        return '';
      })
      .filter((item) => item.length > 0);

    if (normalized.length === 0) {
      return null;
    }

    return normalized.map((item) => `- ${item}`).join('\n');
  }

  private buildToolContext(input: CoderAgentInput): ToolContext {
    const rootPath =
      input.projectContext?.root ||
      input.projectContext?.rootPath ||
      input.projectContext?.project?.rootPath ||
      process.cwd();

    return {
      rootPath,
      cwd: process.cwd(),
      logger: this.logger,
    };
  }
}
