/**
 * Coder Agent - Code Generation
 * Generates production-ready code from plan tasks
 */

import type { AgentInput, AgentOutput } from '../types';
import type { Task, CodeGeneration } from '@omaikit/models';
import { Agent } from '../agent';
import { Logger } from '../logger';
import { LanguageHandlers } from './language-handlers';
import { PromptTemplates } from './prompt-templates';
import { CodeParser } from './code-parser';
import { SyntaxValidator } from './syntax-validator';
import { DependencyResolver } from './dependency-resolver';
import { LinterIntegration } from './linter-integration';
import { QualityChecker } from './quality-checker';

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

  private languageHandlers: LanguageHandlers;
  private promptTemplates: PromptTemplates;
  private codeParser: CodeParser;
  private syntaxValidator: SyntaxValidator;
  private dependencyResolver: DependencyResolver;
  private linterIntegration: LinterIntegration;
  private qualityChecker: QualityChecker;

  constructor(logger?: Logger) {
    super(logger);
    this.languageHandlers = new LanguageHandlers();
    this.promptTemplates = new PromptTemplates();
    this.codeParser = new CodeParser();
    this.syntaxValidator = new SyntaxValidator();
    this.dependencyResolver = new DependencyResolver();
    this.linterIntegration = new LinterIntegration();
    this.qualityChecker = new QualityChecker();
  }

  async init(): Promise<void> {
    this.logger.info('Initializing CoderAgent', { version: this.version });
    // Initialize sub-components
    await this.syntaxValidator.init();
    await this.dependencyResolver.init();
    await this.linterIntegration.init();
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

      // Determine target language
      const language = this.determineLanguage(input);
      this.logger.info('Code generation started', { taskId: input.task.id, language });

      // Generate prompt
      const prompt = await this.promptTemplates.generatePrompt(
        input.task,
        input.projectContext,
        input.plan,
        language
      );
      output.result.prompt = prompt;

      // Call LLM via AIProvider (would be injected)
      // For now, return mock response
      const llmResponse = await this.callLLM(prompt, language, input);

      // Parse generated code
      const files = await this.codeParser.parse(llmResponse, language);
      this.logger.info('Code parsed', { fileCount: files.length });

      // Validate syntax for each file
      let syntaxErrors = 0;
      for (const file of files) {
        const validation = await this.syntaxValidator.validate(file.content, language);
        if (!validation.isValid) {
          syntaxErrors++;
          this.logger.warn('Syntax error in generated file', { path: file.path });
        }
      }

      // Resolve dependencies
      const filesWithDeps = await this.dependencyResolver.resolveDependencies(files, input.projectContext);

      // Run linter
      const lintResults = await this.linterIntegration.lint(filesWithDeps, language);
      const totalLintIssues = lintResults.reduce((sum, r) => sum + (r.issues?.length || 0), 0);

      // Quality check
      const qualityChecks = await this.qualityChecker.check(filesWithDeps, language);

      // Prepare output
      output.result.files = filesWithDeps;
      output.result.metadata = {
        generatedAt: new Date().toISOString(),
        model: 'mock-model',
      };
      output.metadata.filesGenerated = files.length;
      output.metadata.totalLOC = files.reduce((sum, f) => sum + (f.content.split('\n').length || 0), 0);
      output.metadata.syntaxErrors = syntaxErrors;
      output.metadata.lintingIssues = totalLintIssues;

      // Set status
      if (syntaxErrors > 0) {
        output.status = 'partial';
      }

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
   * Determine target programming language
   */
  private determineLanguage(input: CoderAgentInput): string {
    // Try to detect from project context
    const projectLanguages = input.projectContext?.metadata?.languages || [];
    if (projectLanguages.length > 0) {
      return projectLanguages[0];
    }

    // Default to TypeScript
    return 'typescript';
  }

  /**
   * Call LLM to generate code
   */
  private async callLLM(prompt: string, language: string, input: CoderAgentInput): Promise<string> {
    // This would normally call the AI provider
    // For now, return a mock response
    this.logger.info('Calling LLM for code generation', { language });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return mock generated code
    return this.getMockGeneratedCode(language, input.task);
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
}
