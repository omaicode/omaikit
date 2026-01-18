# Omaikit Project Overview

Omaikit is a multi-agent CLI toolkit that accelerates software development by orchestrating specialized AI agents (Manager, Planner, Coder, Tester, Reviewer). It analyzes a project, creates plans, generates code and tests, and (optionally) reviews changes. The repository is a TypeScript monorepo with multiple packages that collaborate through shared models and file-based artifacts under the `.omaikit/` directory.

## Goals and Core Flow

The core workflow is:

1. **Init** – analyze the project and write `.omaikit/context.json`.
2. **Plan** – generate a structured plan `.omaikit/plans/P001.json` (P### format, milestones only).
3. **Code** – generate code from plan tasks into the project root.
4. **Test** – generate test suites under `.omaikit/tests/`.
5. **Review** – (placeholder) review generated code.

Each stage is implemented as an agent with a consistent lifecycle: `init()` → `beforeExecute()` → `execute()` → `afterExecute()` with error handling via `onError()`.

## Repository Structure

```
packages/
  agents/   # Agent implementations, tools, and file-based writers
  cli/      # CLI commands and orchestration
  config/   # Config loader and persistence
  models/   # Shared types + Zod validators
docs/       # Project documentation
scripts/    # Repository scripts
```

## Packages in Detail

### @omaikit/agents

Provides core agent implementations and supporting infrastructure.

**Agents**

- **ManagerAgent**: Initializes project context. Uses tools to analyze the repo and writes `.omaikit/context.json`. Falls back to filesystem scanning in test mode.
- **Planner**: Builds a plan in three steps (milestones → tasks → optimization). Persists agent memory and uses tool-driven context.
- **CoderAgent**: Generates code for a task using project context and a plan. Supports tool calls and remembers prior outputs.
- **TesterAgent**: Generates tests based on tasks, estimates coverage, and can optionally execute tests.
- **ReviewerAgent**: Placeholder implementation for future review logic.

**AI Providers**

- `OpenAIProvider` (Responses API) and `AnthropicProvider` are supported via `createProvider()`.
- Providers accept tool definitions and run tool calls through a `ToolRegistry`.
- When API keys are missing, providers echo the prompt with a provider prefix.

**Tools Runtime**

Tools are modeled with JSON-schema parameter definitions and handlers. The default registry includes:

- `list_files`
- `search_text`
- `read_file`
- `edit_file`
- `apply_patch`

These are used inside prompts to read, search, and modify project files in a safe, root-scoped way.

**Prompts**

Agent prompts are stored as separate markdown files under:

- `packages/agents/prompts/manager/`
- `packages/agents/prompts/planner/`
- `packages/agents/prompts/coder/`
- `packages/agents/prompts/tester/`

Each prompt is loaded by name using the `readPrompt()` utility (e.g., `planner.plan-milestones`).

**Memory**

Agents write JSONL memory under `.omaikit/memory/`. The memory store can append, dedupe, and read recent entries to improve prompt quality.

**JSON Utilities**

`parseJsonFromText()` extracts and repairs JSON from LLM outputs by stripping fences, extracting balanced JSON, and removing trailing commas.

### @omaikit/cli

Implements CLI commands and a small orchestration framework.

**Commands**

- `init`: Ensures API keys, runs ManagerAgent, writes context.
- `plan`: Runs Planner, writes plan to `.omaikit/plans/P001.json`, prints summary.
- `code`: Reads plan, invokes CoderAgent for tasks, summarizes output.
- `test`: Reads plan, invokes TesterAgent, writes tests and summary.

**Orchestrator**

`PipelineOrchestrator` tracks state via a `StateMachine`, emits events via an `EventBus`, and supports cancellation via `CancellationHandler`.

### @omaikit/config

Loads configuration from environment variables or `.omaikit/config.json`.

Supported keys include:

- `openaiApiKey`, `anthropicApiKey`
- `provider`
- `managerModel`, `plannerModel`, `coderModel`, `testerModel`, `reviewerModel`

### @omaikit/models

Defines shared data structures and validation schemas.

- **Plan** / **Milestone** / **Task**
- **CodeGeneration** / **CodeFile**
- **TestSuite** / **TestFile**
- **CodeReview** / **ReviewFinding**
- Zod schemas in `validators/index.ts`

## Runtime Artifacts (.omaikit)

The CLI and agents create artifacts in `.omaikit/` at the project root:

- `.omaikit/context.json` – project analysis
- `.omaikit/plans/P001.json` – generated plans (P### format)
- `.omaikit/tasks/` – task files per milestone
- `.omaikit/tests/` – generated tests
- `.omaikit/memory/` – agent memory (JSONL)
- `.omaikit/cache/` – cache entries

## Key Design Notes

- **File-based workflow**: No database required; all outputs are JSON or text files.
- **Tool-driven LLMs**: Agents are prompted to use tools to observe and edit the workspace.
- **Model selection**: Defaults are set in config loader and can be overridden by env vars.
- **Safety**: Tool utilities ensure file access is limited to the project root.

## Quick Start (Developer)

```bash
npm install
npm run build
npm test
```

## Suggested Reading

- `README.md` (repo overview)
- `packages/agents/README.md` (agent usage)
- `docs/CONTRIBUTING.md` (workflow + standards)
