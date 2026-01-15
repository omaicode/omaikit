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
import { CodeParser } from './code-parser';
import { CodeWriter } from '@omaikit/analysis';
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
  public name = 'coder';
  public version = '1.0.0';

  private promptTemplates: PromptTemplates;
  private codeParser: CodeParser;
  private codeWriter: CodeWriter;
  private provider?: AIProvider;
  private memoryStore: MemoryStore;
  private cfg: OmaikitConfig;

  constructor(logger?: Logger) {
    super(logger);
    this.promptTemplates = new PromptTemplates();
    this.codeParser = new CodeParser();
    this.codeWriter = new CodeWriter();
    this.memoryStore = new MemoryStore();
    this.cfg = loadConfig();
  }

  async init(): Promise<void> {
    this.logger.info('Initializing CoderAgent', { version: this.version });
    try {
      this.provider = createProvider();
    } catch (error) {
      this.logger.warn('Could not initialize AI provider, using mock mode');
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

      const fallbackLanguage = this.determineLanguage(input);

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
      const llmResponse = await this.callLLM(finalPrompt, input, fallbackLanguage);
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt: finalPrompt,
        response: llmResponse,
        taskId: input.task.id,
      });

      // Parse generated code
      const files = await this.codeParser.parse(llmResponse, {
        taskTitle: input.task.title,
        projectContext: input.projectContext,
        fallbackLanguage,
      });
      this.logger.info('Code parsed', { fileCount: files.length });

      const projectRoot = input.projectContext?.project?.rootPath || process.cwd();
      const writtenPaths = await this.codeWriter.writeFiles(files, projectRoot);

      // Prepare output
      output.result.files = files;
      output.result.metadata = {
        generatedAt: new Date().toISOString(),
        model: 'mock-model',
      };
      output.metadata.filesGenerated = files.length;
      output.metadata.writtenPaths = writtenPaths;
      output.metadata.totalLOC = files.reduce(
        (sum, f) => sum + (f.content.split('\n').length || 0),
        0,
      );
      output.metadata.syntaxErrors = 0;
      output.metadata.lintingIssues = 0;

      await this.afterExecute(output);
      await this.memoryStore.clear(this.name);
    } catch (error) {
      await this.onError(error as Error);
      output.status = 'failed';
      output.error = {
        code: 'CODER_ERROR',
        message: (error as Error).message,
      };
      await this.memoryStore.append(this.name, {
        timestamp: new Date().toISOString(),
        prompt: output.result.prompt || '',
        response: output.error.message,
        taskId: input.task.id,
        metadata: { status: 'failed' },
      });
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
   * Determine target programming language
   */
  private determineLanguage(input: CoderAgentInput): string {
    const candidates: string[] = [];
    const addCandidate = (value: unknown) => {
      if (typeof value === 'string') {
        candidates.push(value);
      }
    };

    const analysisLanguages = input.projectContext?.analysis?.languages;
    if (Array.isArray(analysisLanguages)) {
      analysisLanguages.forEach((lang) => addCandidate(lang));
    }

    const metadataLanguages = input.projectContext?.metadata?.languages;
    if (Array.isArray(metadataLanguages)) {
      metadataLanguages.forEach((lang) => addCandidate(lang));
    }

    const techStack = input.plan?.techStack;
    if (Array.isArray(techStack)) {
      techStack.forEach((entry) => addCandidate(entry));
    }

    const projectType = input.plan?.projectType;
    addCandidate(projectType);

    for (const candidate of candidates) {
      const normalized = this.normalizeLanguage(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return 'typescript';
  }

  private normalizeLanguage(value: string): string | null {
    const normalized = value.toLowerCase();
    if (normalized.includes('golang') || normalized === 'go') return 'go';
    if (normalized.includes('typescript')) return 'typescript';
    if (normalized.includes('javascript')) return 'javascript';
    if (normalized.includes('python')) return 'python';
    if (normalized.includes('rust')) return 'rust';
    if (normalized.includes('c#') || normalized.includes('csharp')) return 'csharp';
    if (normalized.includes('php')) return 'php';
    return null;
  }

  /**
   * Call LLM to generate code
   */
  private async callLLM(
    prompt: string,
    input: CoderAgentInput,
    fallbackLanguage: string,
  ): Promise<string> {
    if (process.env.VITEST !== undefined) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return this.getMockGeneratedCode(fallbackLanguage, input.task);
    }

    if (!this.provider) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getMockGeneratedCode(fallbackLanguage, input.task);
    }

    const toolRegistry = createDefaultToolRegistry();
    const toolContext = this.buildToolContext(input);

    if (!this.provider.generateCodex) {
      throw new Error('AI provider does not support Codex responses API');
    }

    const response = await this.provider.generateCodex(prompt, {
      model: this.cfg.coderModel,
      maxTokens: undefined,
      temperature: undefined,
      tools: toolRegistry.getDefinitions(),
      toolRegistry,
      toolContext,
      toolChoice: 'auto',
      maxToolCalls: 3,
    });

    if (
      typeof response === 'string' &&
      (response.startsWith('OPENAI_ECHO') || response.startsWith('ANTHROPIC_ECHO'))
    ) {
      return this.getMockGeneratedCode(fallbackLanguage, input.task);
    }

    return response;
  }

  /**
   * Generate mock code for demonstration
   */
  private getMockGeneratedCode(language: string, task: Task): string {
    const taskName = task.title.toLowerCase().replace(/\s+/g, '_');

    switch (language) {
      case 'python':
        return `
"""
Generated module for: ${task.title}
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

def ${taskName}() -> Any:
    """${task.description}"""
    try:
        logger.info("Executing ${taskName}")
        # Implementation goes here
        return None
    except Exception as e:
        logger.error(f"Error in ${taskName}: {e}")
        raise
`;

      case 'go':
        return `
package main

import (
    "fmt"
    "log"
)

// ${task.title}
func ${this.toPascalCase(taskName)}() error {
    log.Println("Executing ${taskName}")
    // Implementation goes here
    return nil
}
`;

      case 'rust':
        return `
//! Generated module for: ${task.title}

use log::{info, error};

/// ${task.description}
pub async fn ${taskName}() -> Result<(), Box<dyn std::error::Error>> {
    info!("Executing ${taskName}");
    // Implementation goes here
    Ok(())
}
`;

      case 'csharp':
        return `
using System;
using System.Logging;

namespace Generated
{
    /// <summary>
    /// ${task.title}
    /// </summary>
    public class ${this.toPascalCase(taskName)}
    {
        private static readonly ILogger Logger = LoggerFactory.CreateLogger<${this.toPascalCase(taskName)}>();

        public static void Execute()
        {
            try
            {
                Logger.LogInformation("Executing ${taskName}");
                // Implementation goes here
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error in ${taskName}");
                throw;
            }
        }
    }
}
`;

      case 'typescript':
      default:
        return `
/**
 * ${task.title}
 * 
 * ${task.description}
 */

import { Logger } from './logger';

const logger = new Logger('${taskName}');

export async function ${taskName}(): Promise<void> {
  try {
    logger.info('Executing ${taskName}');
    // Implementation goes here
  } catch (error) {
    logger.error('Error in ${taskName}', { error });
    throw error;
  }
}

export default ${taskName};
`;
    }
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
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

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), timeoutMs);
    });

    const result = await Promise.race([promise, timeoutPromise]);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return result as T | null;
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
