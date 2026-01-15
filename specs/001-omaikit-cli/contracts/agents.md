# Agent Interface Contracts

**Date**: January 14, 2026  
**Purpose**: TypeScript interfaces for agent implementations and orchestration

## Base Agent Interface

All agents implement this interface:

```typescript
/**
 * Base interface for Omaikit agents
 * Each agent handles a specific stage of the development pipeline
 */
export interface Agent {
  /** Unique agent identifier */
  name: "manager" | "planner" | "coder" | "tester" | "reviewer";
  
  /** Version of agent implementation */
  version: string;
  
  /**
   * Execute the agent's primary function
   * @param input - Agent input containing project context and task specifics
   * @returns Promise containing execution result or error
   * @throws AgentError if execution fails
   */
  execute(input: AgentInput): Promise<AgentOutput>;
  
  /**
   * Validate agent output for completeness and correctness
   * @param output - Output to validate
   * @returns Validation result with any issues found
   */
  validate(output: AgentOutput): Promise<ValidationResult>;
  
  /**
   * Check if this agent can handle the given task
   * @param task - Task from plan
   * @returns boolean indicating capability
   */
  canHandle(task: Task): boolean;
}

/**
 * Input provided to agents
 */
export interface AgentInput {
  /** Analyzed project structure and patterns */
  projectContext: Project;
  
  /** Full plan for reference (may be null for first task) */
  plan: Plan | null;
  
  /** Current task to process (task-specific agents) */
  task: Task | null;
  
  /** User input to plan command (planning agent only) */
  userInput?: string;
  
  /** Previous agent outputs for context */
  history: AgentOutput[];
  
  /** Agent-specific configuration overrides */
  config?: Record<string, any>;
  
  /** Whether to use cached results if available */
  useCache?: boolean;
  
  /** Force fresh execution (no caching) */
  force?: boolean;
}

/**
 * Output from agent execution
 */
export interface AgentOutput {
  /** Which agent produced this output */
  agentName: string;
  
  /** Execution timestamp */
  timestamp: string; // ISO8601
  
  /** Overall status of execution */
  status: "success" | "partial" | "failed";
  
  /** Primary result from agent */
  result: ProjectContext | Plan | CodeGeneration | TestSuite | CodeReview;
  
  /** Metadata about execution */
  metadata: {
    /** How long execution took in milliseconds */
    durationMs: number;
    
    /** API tokens used (if applicable) */
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
    
    /** Any errors or warnings during execution */
    errors?: AgentError[];
    warnings?: string[];
    
    /** Cache hit information */
    cacheHit?: boolean;
    cacheKey?: string;
  };
}

/**
 * Validation result from agent output
 */
export interface ValidationResult {
  /** Whether output passed validation */
  isValid: boolean;
  
  /** Issues found during validation */
  issues: ValidationIssue[];
  
  /** Warnings that don't block validation */
  warnings: string[];
  
  /** Score 0-100 indicating output quality */
  qualityScore: number;
}

/**
 * A validation issue with agent output
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: "error" | "warning";
  
  /** Human-readable message */
  message: string;
  
  /** Field or section with the issue */
  field?: string;
  
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Error from agent execution
 */
export class AgentError extends Error {
  constructor(
    public message: string,
    public code: string,
    public agentName: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = "AgentError";
  }
}
```

---

## Agent-Specific Contracts

### Manager Agent

```typescript
/**
 * Manager agent generates project context snapshots
 */
export interface ManagerAgent extends Agent {
  name: "manager";

  /**
   * Input to manager: root path + optional description
   */
  execute(input: AgentInput & { rootPath?: string; description?: string }): Promise<ManagerOutput>;
}

/**
 * Manager-specific output
 */
export interface ManagerOutput extends AgentOutput {
  result: ProjectContext;
  metadata: AgentOutput["metadata"] & {
    contextPath?: string;
  };
}
```

### Planner Agent

```typescript
/**
 * Planner agent generates structured Agile plans from feature descriptions
 */
export interface PlannerAgent extends Agent {
  name: "planner";
  
  /**
   * Input to planner: project context + feature description
   */
  execute(input: AgentInput & { userInput: string }): Promise<PlanOutput>;
}

/**
 * Planner-specific output
 */
export interface PlanOutput extends AgentOutput {
  result: Plan;
  metadata: AgentOutput["metadata"] & {
    /** How many iterations/refinements of the plan */
    iterations?: number;
    
    /** Whether planner asked clarifying questions */
    askedClarifications?: boolean;
  };
}
```

### Coder Agent

```typescript
/**
 * Coder agent generates production-ready code from plan tasks
 */
export interface CoderAgent extends Agent {
  name: "coder";
  
  /**
   * Input to coder: project context + task to implement
   */
  execute(input: AgentInput & { task: Task }): Promise<CodeOutput>;
}

/**
 * Coder-specific output
 */
export interface CodeOutput extends AgentOutput {
  result: CodeGeneration;
  metadata: AgentOutput["metadata"] & {
    /** Number of files generated */
    filesGenerated?: number;
    
    /** Total lines of code */
    totalLOC?: number;
    
    /** Any syntax issues found post-generation */
    syntaxErrors?: number;
    
    /** Linting issues */
    lintingIssues?: number;
  };
}
```

### Tester Agent

```typescript
/**
 * Tester agent generates comprehensive test suites
 */
export interface TesterAgent extends Agent {
  name: "tester";
  
  /**
   * Input to tester: generated code to test
   */
  execute(input: AgentInput & { task: Task }): Promise<TestOutput>;
}

/**
 * Tester-specific output
 */
export interface TestOutput extends AgentOutput {
  result: TestSuite;
  metadata: AgentOutput["metadata"] & {
    /** Whether tests were executed */
    testsExecuted?: boolean;
    
    /** Test execution results */
    executionResults?: {
      passed: number;
      failed: number;
      skipped: number;
    };
    
    /** Final coverage percentage */
    coverageAchieved?: number;
  };
}
```

### Reviewer Agent

```typescript
/**
 * Reviewer agent performs comprehensive code review
 */
export interface ReviewerAgent extends Agent {
  name: "reviewer";
  
  /**
   * Input to reviewer: generated code and tests
   */
  execute(input: AgentInput & { task: Task }): Promise<ReviewOutput>;
}

/**
 * Reviewer-specific output
 */
export interface ReviewOutput extends AgentOutput {
  result: CodeReview;
  metadata: AgentOutput["metadata"] & {
    /** Total findings */
    findingsCount?: number;
    
    /** Breakdown by severity */
    bySeverity?: {
      critical: number;
      major: number;
      minor: number;
      suggestion: number;
    };
    
    /** Overall readiness assessment */
    readiness?: "approved" | "needs-revision" | "requires-discussion";
  };
}
```

---

## Orchestration Contracts

### Pipeline Orchestrator

```typescript
/**
 * Orchestrates agents in sequence and parallel
 */
export interface PipelineOrchestrator {
  /**
   * Execute full pipeline: Plan → Code → Test → Review
   */
  run(
    projectPath: string,
    featureDescription: string,
    options?: PipelineOptions
  ): Promise<PipelineResult>;
  
  /**
   * Execute subset of pipeline
   */
  runPartial(
    agents: Agent[],
    input: AgentInput,
    options?: PipelineOptions
  ): Promise<PipelineResult>;
}

/**
 * Options for pipeline execution
 */
export interface PipelineOptions {
  /** Agents to execute (order matters) */
  agents?: ("planner" | "coder" | "tester" | "reviewer")[];
  
  /** Force fresh execution (no caching) */
  force?: boolean;
  
  /** Output directory for results */
  outputDir?: string;
  
  /** Whether to parallelize independent agents */
  parallel?: boolean;
  
  /** Stop pipeline if any agent fails */
  failFast?: boolean;
  
  /** Custom agent configurations */
  agentConfigs?: Record<string, AgentConfig>;
}

/**
 * Configuration per agent
 */
export interface AgentConfig {
  enabled?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
  retries?: number;
}

/**
 * Overall pipeline result
 */
export interface PipelineResult {
  /** Whether pipeline succeeded */
  success: boolean;
  
  /** When pipeline started and ended */
  startedAt: string; // ISO8601
  endedAt: string;
  durationMs: number;
  
  /** Results from each agent in order */
  results: AgentOutput[];
  
  /** Final summary */
  summary: {
    planGenerated: boolean;
    codeGenerated: boolean;
    testsGenerated: boolean;
    reviewCompleted: boolean;
    totalLOC?: number;
    totalTestLOC?: number;
    findingsCount?: number;
  };
  
  /** Any errors encountered */
  errors: AgentError[];
  
  /** Output file paths */
  outputs: {
    plan?: string;
    code?: string;
    tests?: string;
    review?: string;
  };
}
```

---

## Error Handling

### Standard Error Codes

```typescript
const AgentErrorCodes = {
  // Planning errors
  PLAN_PARSE_ERROR: "PLAN_001",
  PLAN_INVALID_DEPENDENCIES: "PLAN_002",
  PLAN_INSUFFICIENT_CONTEXT: "PLAN_003",
  
  // Code generation errors
  CODE_SYNTAX_ERROR: "CODE_001",
  CODE_INVALID_LANGUAGE: "CODE_002",
  CODE_MODULE_NOT_FOUND: "CODE_003",
  CODE_CIRCULAR_DEPENDENCY: "CODE_004",
  
  // Testing errors
  TEST_GENERATION_FAILED: "TEST_001",
  TEST_EXECUTION_FAILED: "TEST_002",
  TEST_COVERAGE_INSUFFICIENT: "TEST_003",
  
  // Review errors
  REVIEW_ANALYSIS_FAILED: "REVIEW_001",
  
  // API errors
  API_TIMEOUT: "API_001",
  API_RATE_LIMIT: "API_002",
  API_AUTHENTICATION_FAILED: "API_003",
  
  // General errors
  INVALID_INPUT: "ERR_001",
  OUTPUT_VALIDATION_FAILED: "ERR_002",
  CACHE_ERROR: "ERR_003",
} as const;
```

