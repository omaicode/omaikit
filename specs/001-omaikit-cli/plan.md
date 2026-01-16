# Implementation Plan: Omaikit - Multi-Agent CLI Toolkit

**Branch**: `001-omaikit-cli` | **Date**: January 14, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-omaikit-cli/spec.md`

**Note**: This plan outlines the 3-phase implementation strategy for building Omaikit, a Node.js-based multi-agent CLI toolkit that orchestrates specialized AI agents to accelerate software development.

## Summary

Omaikit is a multi-agent CLI toolkit implemented entirely in Node.js 22 with TypeScript that orchestrates specialized AI agents (Manager, Planner, Coder, Tester, Reviewer) to accelerate software development. The system transforms high-level feature descriptions into executable Agile plans, generates production-ready code, creates comprehensive test suites, and provides detailed code reviews. Operational metadata is stored in `.omaikit/` while generated code is written to the project root by default.

**Primary Technical Approach**: Modular agent architecture with dependency injection, where each agent is independently testable and orchestrable via a pipeline runner. The Manager agent performs AI-driven project analysis using tools (list_files, search_text, read_file, edit_file, apply_patch) to generate `.omaikit/context.json`. Plans/tests/reviews are stored in JSON/markdown formats for compatibility across programming languages, while generated code is written to the project root by default. The system includes deep codebase analysis to prevent conflicts and support code reuse patterns.

## Technical Context

**Language/Version**: Node.js 22, TypeScript 5.3+  
**Primary Dependencies**:

- **CLI Framework**: Oclif or Commander.js (type-safe CLI framework)
- **AI Integration**: OpenAI API, Anthropic Claude API (abstracted via provider pattern)
- **Task Orchestration**: Node async/await with event bus and in-process orchestration (no external queue for MVP)
- **Code Analysis**: Abstract Syntax Tree (AST) parsing with Babel, TypeScript compiler API
- **File I/O**: Native fs/promises, YAML/JSON parsing for configuration
- **Testing**: Vitest or Jest (fast TypeScript testing)

**Storage**: File-based JSON/Markdown in `.omaikit/` directory (no database); project analysis cached in `.omaikit/.analysis-cache/`; project context stored in `.omaikit/context.json` (required before other commands); multiple plans stored in `.omaikit/plans/` as `P-{N}.json`; agent memory stored in `.omaikit/memory/` during execution and cleared on completion  
**Testing**: Vitest with @vitest/ui for test coverage reporting; integration tests via spawning actual CLI commands  
**Target Platform**: Linux, macOS, Windows (cross-platform Node.js CLI); works with all programming languages as input  
**Project Type**: Monorepo with packages: `@omaikit/cli` (entry point), `@omaikit/agents` (agent implementations), `@omaikit/analysis` (codebase analysis), `@omaikit/models` (data structures)  
**Performance Goals**:

- Plan generation: <30 seconds for typical projects
- Code generation: <60 seconds per task
- Test generation: <120 seconds with automatic coverage validation
- Full pipeline: <5 minutes end-to-end
- CLI response time: <2 seconds for all interactive commands

**Constraints**:

- Must work offline after initial AI provider connection
- All outputs must be deterministic and reproducible
- Generated code must never depend on Omaikit runtime (standalone)
- Generated code is written to the project root by default; metadata remains in `.omaikit/`
- Must handle projects 1-10,000+ LOC without performance degradation

**Scale/Scope**:

- Initial target: Single to 10-module projects
- Estimated codebase: 15,000-25,000 LOC for MVP
- CLI must support both greenfield (`omaikit init`) and existing project analysis (`omaikit analyze`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **Code Quality**: Feature is decomposable into independently reviewable modules:

- `@omaikit/cli` (CLI entry point)
- `@omaikit/agents` (modular agent implementations with consistent interfaces)
- `@omaikit/analysis` (codebase analyzer and project model)
- `@omaikit/models` (data structures for plans, code, tests, reviews)
- `@omaikit/config` (configuration and environment management)

Linting rules defined: TypeScript strict mode, ESLint with Prettier, max line length 100, no unused variables, comprehensive JSDoc for public APIs.

✅ **Testing Standards**: Feature includes testable acceptance criteria for each user story; TDD approach:

1. Write failing unit tests for agent interfaces
2. Implement agent core functionality
3. Write integration tests for agent interaction and CLI commands
4. Add contract tests for AI provider interactions
5. Complete end-to-end pipeline tests

Target: >80% coverage for core agent logic, >70% for CLI orchestration.

✅ **User Experience Consistency**: CLI commands follow consistent patterns:

- Standard format: `omaikit <command> [options] [args]`
- Colored output (green=success, yellow=warning, red=error)
- `--help` and `-h` flags for all commands
- JSON output for machine-readability, formatted text for humans
- Progress indicators for long-running operations
- Error messages with codes and recovery suggestions

✅ **Performance**: Quantified performance targets established (see Technical Context):

- Plan: <30s, Code: <60s/task, Test: <120s, Review: <90s, Pipeline: <5min
- Response latency: <2s for interactive commands
- Memory: <100MB startup, <500MB peak under load

## Project Structure

### Documentation (this feature)

```text
specs/001-omaikit-cli/
├── spec.md                # Feature specification (completed)
├── plan.md                # This file - implementation plan
├── research.md            # Phase 0 - research findings
├── data-model.md          # Phase 1 - entity and API contracts
├── quickstart.md          # Phase 1 - developer setup guide
├── contracts/             # Phase 1 - API schemas (OpenAPI)
│   ├── agents.yaml
│   ├── plan.schema.json
│   ├── code-generation.yaml
│   └── review.schema.json
└── checklists/
    └── requirements.md    # Quality validation checklist
```

### Source Code (monorepo structure)

```text
.
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── commands/          # CLI command handlers
│   │   │   │   ├── plan.ts
│   │   │   │   ├── code.ts
│   │   │   │   ├── test.ts
│   │   │   │   ├── review.ts
│   │   │   │   └── run-pipeline.ts
│   │   │   ├── index.ts           # Main CLI entry point
│   │   │   └── utils/             # CLI utilities (colors, formatting)
│   │   └── __tests__/
│   │       ├── commands/
│   │       └── integration/
│   │
│   ├── agents/
│   │   ├── src/
│   │   │   ├── base-agent.ts      # Abstract base class for all agents
│   │   │   ├── planner/           # Plan generation agent
│   │   │   │   ├── planner.ts
│   │   │   │   ├── prompt-templates.ts
│   │   │   │   └── plan-validator.ts
│   │   │   ├── coder/             # Code generation agent
│   │   │   │   ├── coder.ts
│   │   │   │   ├── language-handlers.ts
│   │   │   │   └── dependency-resolver.ts
│   │   │   ├── tester/            # Test generation agent
│   │   │   │   ├── tester.ts
│   │   │   │   ├── test-patterns.ts
│   │   │   │   └── coverage-validator.ts
│   │   │   ├── reviewer/          # Code review agent
│   │   │   │   ├── reviewer.ts
│   │   │   │   ├── review-categories.ts
│   │   │   │   └── finding-classifier.ts
│   │   │   └── ai-provider.ts     # AI API abstraction
│   │   └── __tests__/
│   │
│   ├── analysis/
│   │   ├── src/
│   │   │   ├── analyzer.ts        # Main analyzer orchestrator
│   │   │   ├── project-scanner.ts # File system scanning
│   │   │   ├── ast-parser.ts      # AST-based code analysis
│   │   │   ├── dependency-graph.ts # Module dependency analysis
│   │   │   └── pattern-detector.ts # Coding pattern detection
│   │   └── __tests__/
│   │
│   ├── models/
│   │   ├── src/
│   │   │   ├── plan.ts            # Plan data model
│   │   │   ├── code-generation.ts # Code generation request/response
│   │   │   ├── test-suite.ts      # Test suite model
│   │   │   ├── review.ts          # Review report model
│   │   │   └── project.ts         # Project analysis model
│   │   └── __tests__/
│   │
│   └── config/
│       ├── src/
│       │   ├── env-config.ts      # Environment variables
│       │   ├── omaikit-config.ts  # .omaikit/config.json schema
│       │   └── defaults.ts        # Default configurations
│       └── __tests__/
│
├── .omaikit/                      # Runtime output directory (not in repo)
│   ├── .analysis-cache/
│   ├── plans/
│   │   ├── P-0.json
│   │   ├── P-1.json
│   ├── context.json
│   ├── memory/
│   ├── tests/
│   └── review.md
│
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   └── publish.sh
│
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── README.md
```

**Structure Decision**: Monorepo with 5 packages allows independent agent development, testing, and potential future distribution. CLI package orchestrates others. Analysis and models packages have no dependencies on agents, enabling reusability in other contexts.

## Complexity Tracking

No Constitution Check violations. All code quality, testing, UX, and performance requirements are clearly defined and achievable with standard design patterns (modular agents with dependency injection, async task orchestration, event-driven architecture for progress reporting).

---

## Phase 0: Research & Clarification

**Objective**: Resolve all technical unknowns and establish best practices for implementation.

### Research Tasks

1. **AI Provider Integration Patterns** (2 hours)
   - Evaluate OpenAI, Anthropic, and open-source LLM options
   - Compare streaming vs. completion-based responses
   - Design provider abstraction layer for multi-model support
   - Determine token budgets and cost optimization strategies
   - **Outcome**: AI provider selection and abstraction design

2. **AST-Based Code Analysis** (2 hours)
   - Research Babel, TypeScript compiler API, and language-specific parsers
   - Determine feasibility of language-agnostic AST analysis
   - Design fallback to regex-based pattern detection for non-standard languages
   - **Outcome**: Code analysis technology selection

3. **TypeScript CLI Framework Selection** (1 hour)
   - Compare Oclif, Commander.js, and Yargs for type safety and extensibility
   - Evaluate plugin architecture needs
   - **Outcome**: CLI framework selection with rationale

4. **Task Orchestration Strategy** (2 hours)
   - Evaluate Bull/BullMQ vs. native async/await for task queuing
   - Design agent communication protocol (events, callbacks, streams)
   - Determine parallelization strategy for independent tasks
   - **Outcome**: Task orchestration architecture design

5. **Project Analysis Caching Strategy** (1 hour)
   - Design cache invalidation logic (file hashing, timestamp comparison)
   - Determine storage format (JSON with compression)
   - **Outcome**: Caching implementation strategy

6. **Prompt Engineering Best Practices** (3 hours)
   - Research few-shot learning, chain-of-thought prompting
   - Develop prompt templates for each agent type
   - Test prompt effectiveness with sample projects
   - **Outcome**: Prompt template library and testing results

**Phase 0 Output**: `research.md` with all decisions documented, including rationale and alternatives considered.

---

## Phase 1: Design & Contracts

**Objective**: Define data models, API contracts, and agent interfaces before implementation.

### 1.1 Data Models (data-model.md)

**Entities:**

- **Project**: Represents analyzed codebase
  - `name`: Project identifier
  - `rootPath`: Filesystem location
  - `analysis`: CodebaseAnalysis object
  - `modules`: Array of Module objects
  - `dependencies`: Dependency graph
  - `codePatterns`: Detected coding patterns (naming conventions, error handling, etc.)

- **Plan**: Agile project plan
  - `id`: Unique plan identifier (P-{N})
  - `title`: Plan title
  - `description`: Original user input
  - `milestones`: Array of Milestone objects with tasks
  - `clarifications`: Optional clarifying questions or assumptions
  - `projectContext`: Optional ProjectContext snapshot

- **Task**: Unit of work
  - `id`: Unique task identifier
  - `title`: Task description
  - `type`: "feature", "refactor", "bugfix", "test", "documentation", "infrastructure"
  - `estimatedEffort`: Hours (as number)
  - `acceptanceCriteria`: String array
  - `inputDependencies`: Task ID array (must complete first)
  - `outputDependencies`: Task ID array (depend on this)
  - `targetModule`: Module path or "core"

- **CodeGeneration**: Request and response for code generation
  - `taskId`: Reference to task being implemented
  - `language`: Target language
  - `context`: Project analysis + relevant existing code
  - `generatedCode`: Generated source code
  - `generatedFiles`: File paths and content
  - `dependencies`: Required imports and packages

- **TestSuite**: Generated tests
  - `taskId`: Associated task
  - `testFiles`: Array of generated test files
  - `coverage`: Coverage percentage
  - `testResults`: Pass/fail results
  - `skippedTests`: Tests requiring manual review

- **Review**: Code review findings
  - `taskId`: Associated task
  - `findings`: Array of Finding objects
  - `severity`: "critical", "major", "minor", "suggestion"
  - `categories`: "architecture", "performance", "security", "maintainability", "testing"

- **Module**: Project module or package
  - `name`: Module identifier
  - `path`: Filesystem path
  - `exports`: Public API
  - `dependencies`: Dependencies on other modules
  - `size`: LOC estimate

### 1.2 API Contracts (contracts/)

**Agent Interfaces (TypeScript types):**

```typescript
interface Agent {
  name: string;
  execute(input: AgentInput): Promise<AgentOutput>;
  validate(output: AgentOutput): ValidationResult;
}

interface AgentInput {
  projectContext: Project;
  taskContext: Task | null;
  history: AgentOutput[];
  userInput?: string;
}

interface AgentOutput {
  agentName: string;
  timestamp: ISO8601;
  status: 'success' | 'partial' | 'failed';
  result: object;
  metadata: { duration: number; tokenUsage?: number; errors?: string[] };
}
```

**CLI Command Contracts (OpenAPI):**

- `POST /plan` - Accept feature description, return JSON plan
- `POST /code` - Accept plan task, return generated code
- `POST /test` - Accept code, return test suite
- `POST /review` - Accept code + tests, return review report
- `POST /run-pipeline` - Orchestrate all agents, return summary

### 1.3 Quickstart Guide (quickstart.md)

- Installation: `npm install -g @omaikit/cli`
- First run: `omaikit init` or `omaikit analyze`
- Example workflow: Plan → Code → Test → Review
- Configuration options and `.omaikit/config.json`
- Output interpretation and next steps

### 1.4 Agent Context Update

Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` to integrate this plan into AI agent context for subsequent work.

### 1.5 Constitution Re-Check (Post-Design)

✅ **Code Quality**: Data models are decomposable; agent interface is minimal and testable. Module structure supports independent review.

✅ **Testing**: Agent contracts enable unit testing with mocks; integration tests can verify orchestration.

✅ **UX Consistency**: CLI contracts define consistent input/output formats across commands.

✅ **Performance**: Task orchestration design supports parallelization of independent agents.

---

## Phase 2: Task Decomposition

**Objective**: Break Phase 1 design into independently deliverable, testable tasks.

**Note**: Phase 2 output (`tasks.md`) is generated by `/speckit.tasks` command, not `/speckit.plan`. This plan identifies task categories:

### Task Categories (15-25 high-level tasks expected)

**Core Infrastructure** (4-5 tasks)

- Project setup (package.json, TypeScript, dependencies)
- CLI framework setup and command routing
- Configuration management system
- Logging and error handling framework
- Test framework setup and utilities

**Project Analysis** (4-5 tasks)

- File system scanner for project structure detection
- AST-based code analyzer
- Dependency graph builder
- Pattern detector (naming conventions, error handling)
- Cache manager for analysis results

**Base Agent Architecture** (2-3 tasks)

- Abstract agent base class with lifecycle hooks
- AI provider abstraction layer (OpenAI/Anthropic/OSS)
- Agent communication protocol (event bus)
- Async orchestration framework

**Individual Agents** (4 major tasks + subtasks)

- Planner Agent: Feature parsing → JSON plan generation
- Coder Agent: Task → language-specific code generation
- Tester Agent: Code → test suite generation with coverage validation
- Reviewer Agent: Code+tests → markdown review report

**Pipeline Orchestration** (2-3 tasks)

- Sequential execution engine
- Parallelization detection (test + review can run simultaneously)
- Output aggregation and summary generation
- Cancellation and error recovery

**CLI Interface** (2-3 tasks)

- Command handlers for plan, code, test, review
- run-pipeline orchestrator command
- Help documentation and argument parsing
- Progress indicators and colored output

**Testing & Validation** (2-3 tasks)

- Unit tests for all agents
- Integration tests for CLI commands
- End-to-end pipeline tests
- Performance benchmarking

---

## Success Criteria for This Plan

- ✅ All 14 functional requirements mapped to specific agents/components
- ✅ Data model covers all entity types from spec
- ✅ Performance targets are achievable with async architecture
- ✅ Monorepo structure enables parallel development
- ✅ Phase 0-1 identify no blocking unknowns
- ✅ Task decomposition is granular enough for parallel development (4-8 developers)
- ✅ Constitution compliance verified at each phase
