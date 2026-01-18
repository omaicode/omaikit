/* eslint-disable max-lines */
/**
 * Coder Agent - Code Generation
 * Generates production-ready code from plan tasks
 */

import type { AgentInput, AgentOutput } from '../types';
import type { Task, CodeGeneration, CodeFile } from '@omaikit/models';
import { Agent } from '../agent';
import { Logger } from '../logger';
import { PromptTemplates } from './prompt-templates';
import { createProvider } from '../ai-provider/factory';
import { createDefaultToolRegistry } from '../tools/default-registry';
import type { ToolContext } from '../tools/types';
import { MemoryStore } from '../memory/memory-store';
import { AIProvider, ToolCall } from '../ai-provider/provider';
import { loadConfig, OmaikitConfig } from '@omaikit/config';

export interface CoderAgentInput extends AgentInput {
  task: Task;
  projectContext: any;
  plan: any;
  force?: boolean;
  previousResponseId?: string;
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
    previousResponseId?: string;
    toolOutputs?: Array<any>;
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
      if (!this.provider) {
        await this.init();
      }

      await this.beforeExecute(input);

      // Validate input
      this.validateInput(input);

      // Generate prompt
      const prompt = await this.promptTemplates.generatePrompt(input.task);
      const { previousResponseId, toolCalls, toolOutputs } = await this.callLLM(prompt, input);

      output.result.prompt = prompt;
      output.result.files = toolCalls.filter((call) => call.type === 'apply_patch_call').map((call) => {
        const args = call.operation as Record<string, unknown>;
        return {
          path: args.path || 'unknown',
          content: String(args.diff || ''), 
        };
      }) as CodeFile[];

      output.result.metadata = {
        generatedAt: new Date().toISOString(),
        model: this.cfg.coderModel,
      };

      output.metadata.previousResponseId = previousResponseId;
      output.metadata.toolOutputs = toolOutputs;

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
  ): Promise<{ previousResponseId?: string; response: string; toolCalls: Array<ToolCall>; toolOutputs: Array<any> }> {
    let previousResponseId = input.previousResponseId;
    const toolCalls: Array<ToolCall> = [];
    const toolOutputs: Array<any> = input.toolOutputs || [];
    const toolRegistry = createDefaultToolRegistry();
    const toolContext = this.buildToolContext(input);

    if (!this.provider) {
      throw new Error('AI provider does not support Codex responses API');
    }

    const instructions = this.promptTemplates.getInstructions(input.projectContext, input.plan);
    const response = await this.provider.generate(prompt, {
      previousResponseId,
      model: this.cfg.coderModel,
      maxTokens: undefined,
      temperature: undefined,
      tools: toolRegistry.getDefinitions(),
      toolRegistry,
      toolContext,
      toolChoice: 'auto',
      maxToolCalls: 1,
      instructions,
      toolOutputs,
      onToolCall: (event: ToolCall) => {
        toolCalls.push(event);
      },
      onToolOutput: (event: any) => {
        toolOutputs.push(event);
      },
      onTextResponse: (text) => {
        this.logger.info(text + '\n');
      },
      onResponse: async (resp) => {
        previousResponseId = resp.id;
      }
    });

    this.memoryStore.append(this.name, {
      timestamp: new Date().toISOString(),
      prompt,
      response,
      taskId: input.task.id,
      metadata: { type: 'llm_response' },
    });

    return { previousResponseId, response, toolCalls, toolOutputs };
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
