# Tasks: Omaikit - Multi-Agent CLI Toolkit

**Input**: Design documents from `/specs/001-omaikit-cli/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅  
**Branch**: `001-omaikit-cli`  
**Date**: January 14, 2026

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Each user story represents a complete, independently deliverable increment.

---

## Format Reference

- **[ID]**: T001-T050+ sequential task identifier
- **[P]**: Parallelizable - can run simultaneously (different files, no dependencies)
- **[Story]**: User story label (US1-US7 mapping to spec priorities)
- **[Type]**: [CQ]=Code Quality, [TEST]=Test-First, [UX]=User Experience, [PERF]=Performance
- **Paths**: Monorepo structure per plan.md (packages/cli, packages/agents, packages/analysis, packages/models, packages/config)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure enabling all agents  
**Duration**: 3-4 days | **MVP-Critical**: Yes

- [ ] T001 [CQ] Create monorepo structure with npm workspaces in `package.json` and root configuration
- [ ] T002 [P] [CQ] Initialize `packages/models/` package with TypeScript configuration and base entity types
- [ ] T003 [P] [CQ] Initialize `packages/config/` package with environment and configuration management
- [ ] T004 [P] [CQ] Initialize `packages/analysis/` package with project scanner foundation
- [ ] T005 [P] [CQ] Initialize `packages/agents/` package with base agent infrastructure
- [ ] T006 [P] [CQ] Initialize `packages/cli/` package with Oclif/Commander.js CLI framework setup
- [ ] T007 [CQ] Configure TypeScript, ESLint, Prettier, and vitest across all packages in `tsconfig.json`, `.eslintrc.json`, `.prettierrc`
- [ ] T008 [CQ] Setup pre-commit hooks and CI/CD pipeline configuration (GitHub Actions) in `.github/workflows/`
- [ ] T009 [CQ] Create shared build and test scripts in `scripts/` directory and `package.json`
- [ ] T010 [P] [CQ] Define code style guide document covering naming conventions, error handling, logging per constitution in `docs/CONTRIBUTING.md`

**Checkpoint**: Monorepo structure initialized, all packages compilable, basic build/test scripts working

---

## Phase 2: Foundational Infrastructure (Blocking Prerequisites)

**Purpose**: Core systems that ALL user stories depend on  
**Duration**: 4-5 days | **MVP-Critical**: Yes | **Blocker**: Blocks all user stories

### Base Agent Framework

- [ ] T011 [CQ] Implement base `Agent` interface in `packages/agents/src/base-agent.ts` with execute(), validate(), canHandle() methods per contracts/agents.ts
- [ ] T012 [P] [CQ] Implement `AgentInput` and `AgentOutput` types in `packages/agents/src/types.ts` with metadata structure
- [ ] T013 [P] [CQ] Implement agent lifecycle hooks (init, beforeExecute, afterExecute, onError) in `packages/agents/src/base-agent.ts`
- [ ] T014 [CQ] Setup logging infrastructure with Winston or Pino in `packages/agents/src/logger.ts` (INFO, WARN, ERROR levels)
- [ ] T015 [CQ] Implement error handling and standard error codes in `packages/agents/src/errors.ts` per contracts/agents.ts

### AI Provider Abstraction

- [ ] T016 [CQ] Implement `AIProvider` interface in `packages/agents/src/ai-provider/provider.ts` (abstract pattern)
- [ ] T017 [P] [CQ] Implement OpenAI adapter in `packages/agents/src/ai-provider/openai.ts` with streaming support
- [ ] T018 [P] [CQ] Implement Anthropic adapter in `packages/agents/src/ai-provider/anthropic.ts` with streaming support
- [ ] T019 [CQ] Implement provider factory in `packages/agents/src/ai-provider/factory.ts` for selecting provider via config
- [ ] T020 [P] [CQ] Implement token counter and rate limiter in `packages/agents/src/ai-provider/token-manager.ts`

### Project Analysis Infrastructure

- [ ] T021 [CQ] Implement `Project` model interface in `packages/models/src/project.ts` per data-model.md
- [ ] T022 [P] [CQ] Implement `Module` and `DependencyGraph` models in `packages/models/src/project.ts`
- [ ] T023 [P] [CQ] Implement `CodePatterns` interface for pattern detection in `packages/models/src/patterns.ts`
- [ ] T024 [CQ] Setup file system caching layer in `packages/analysis/src/cache-manager.ts` for analysis results

### Data Models & Validation

- [ ] T025 [P] [CQ] Implement `Plan` and `Task` models in `packages/models/src/plan.ts` per data-model.md with validation
- [ ] T026 [P] [CQ] Implement `CodeGeneration` request/response models in `packages/models/src/code-generation.ts`
- [ ] T027 [P] [CQ] Implement `TestSuite` and `TestFile` models in `packages/models/src/test-suite.ts`
- [ ] T028 [P] [CQ] Implement `CodeReview` and `Finding` models in `packages/models/src/review.ts`
- [ ] T029 [CQ] Create JSON schema validators for all models in `packages/models/src/validators/` using Zod or Ajv

### Pipeline Orchestration Foundation

- [ ] T030 [CQ] Implement `PipelineOrchestrator` interface in `packages/cli/src/orchestrator/orchestrator.ts` per contracts/agents.ts
- [ ] T031 [CQ] Implement pipeline state machine in `packages/cli/src/orchestrator/state-machine.ts` (planned, running, completed, failed, cancelled)
- [ ] T032 [P] [CQ] Implement event bus for agent communication in `packages/cli/src/orchestrator/event-bus.ts`
- [ ] T033 [CQ] Implement cancellation signal handling in `packages/cli/src/orchestrator/cancellation-handler.ts`

### CLI Infrastructure

- [ ] T034 [CQ] Setup Oclif or Commander.js CLI framework in `packages/cli/src/index.ts` with help and version commands
- [ ] T035 [CQ] Implement colored output utilities in `packages/cli/src/utils/colors.ts` (green, yellow, red per UX spec)
- [ ] T036 [P] [CQ] Implement progress bar/spinner utilities in `packages/cli/src/utils/progress.ts`
- [ ] T037 [CQ] Implement standard error formatter in `packages/cli/src/utils/error-formatter.ts` with error codes and recovery suggestions
- [ ] T038 [P] [CQ] Implement configuration file loader in `packages/config/src/config-loader.ts` for `.omaikit/config.json`

**Checkpoint**: All agents can be instantiated and orchestrated; CLI framework is responsive; models are validated; pipeline can be started

---

## Phase 3: User Story 1 - Plan Generation (Priority: P1) 🎯 MVP Core

**Goal**: Developers can generate structured Agile plans from feature descriptions  
**Independent Test**: `omaikit plan "build a simple NestJS project"` produces valid JSON plan with milestones, sprints, tasks, dependencies

### Tests for User Story 1 (Test-First per Constitution)

- [ ] T039 [P] [US1] [TEST] Unit test for Planner agent interface and initialization in `packages/agents/__tests__/planner/planner.test.ts`
- [ ] T040 [P] [US1] [TEST] Unit test for plan validator (milestones, tasks, dependencies) in `packages/agents/__tests__/planner/plan-validator.test.ts`
- [ ] T041 [P] [US1] [TEST] Contract test for plan JSON schema and structure in `packages/agents/__tests__/contracts/plan.contract.test.ts`
- [ ] T042 [US1] [TEST] Integration test for full planning workflow (description → plan) in `packages/cli/__tests__/integration/plan-command.test.ts`
- [ ] T043 [US1] [TEST] Edge case tests: ambiguous descriptions, multi-module projects, clarification questions in `packages/agents/__tests__/planner/edge-cases.test.ts`

### Implementation for User Story 1

- [ ] T044 [P] [US1] [CQ] Create planner agent structure in `packages/agents/src/planner/planner.ts` implementing Agent interface
- [ ] T045 [P] [US1] [CQ] Implement prompt template system in `packages/agents/src/planner/prompt-templates.ts` with few-shot examples
- [ ] T046 [US1] [CQ] Implement plan parser in `packages/agents/src/planner/plan-parser.ts` to extract structured plan from LLM response
- [ ] T047 [US1] [CQ] Implement plan validator in `packages/agents/src/planner/plan-validator.ts` validating DAG, effort estimates, dependencies
- [ ] T048 [P] [US1] [CQ] Implement clarification question handler in `packages/agents/src/planner/clarification-handler.ts` for ambiguous inputs
- [ ] T049 [US1] [CQ] Implement plan persistence in `packages/analysis/src/plan-writer.ts` to save `.omaikit/plan.json`
- [ ] T050 [US1] [UX] Implement `omaikit plan` command in `packages/cli/src/commands/plan.ts` with progress indication and error handling
- [ ] T051 [US1] [UX] Add user-friendly output formatting in `packages/cli/src/commands/plan.ts` showing plan summary and next steps
- [ ] T052 [US1] [PERF] Optimize planner agent prompt for sub-30-second execution in `packages/agents/src/planner/prompt-templates.ts`

**Checkpoint**: User Story 1 complete - developers can generate plans independently from feature descriptions

---

## Phase 4: User Story 2 - Code Generation (Priority: P1) 🎯 MVP Core

**Goal**: Developers can generate production-ready code from plans  
**Independent Test**: `omaikit code` produces compilable TypeScript/Python/etc code with error handling, logging, and type safety

### Tests for User Story 2 (Test-First per Constitution)

- [ ] T053 [P] [US2] [TEST] Unit test for Coder agent interface in `packages/agents/__tests__/coder/coder.test.ts`
- [ ] T054 [P] [US2] [TEST] Unit test for language handler detection in `packages/agents/__tests__/coder/language-handlers.test.ts`
- [ ] T055 [P] [US2] [TEST] Unit test for dependency resolver in `packages/agents/__tests__/coder/dependency-resolver.test.ts`
- [ ] T056 [US2] [TEST] Contract test for generated code syntax validation in `packages/agents/__tests__/contracts/code-generation.contract.test.ts`
- [ ] T057 [US2] [TEST] Integration test for full code generation workflow in `packages/cli/__tests__/integration/code-command.test.ts`
- [ ] T058 [US2] [TEST] Edge case tests: circular dependencies, missing modules, unsupported languages in `packages/agents/__tests__/coder/edge-cases.test.ts`

### Implementation for User Story 2

- [ ] T059 [P] [US2] [CQ] Create coder agent structure in `packages/agents/src/coder/coder.ts` implementing Agent interface
- [ ] T060 [P] [US2] [CQ] Implement language handler registry in `packages/agents/src/coder/language-handlers.ts` for TypeScript, Python, Go, Rust, C#
- [ ] T061 [US2] [CQ] Implement prompt templates for code generation in `packages/agents/src/coder/prompt-templates.ts` per language
- [ ] T062 [P] [US2] [CQ] Implement code parser in `packages/agents/src/coder/code-parser.ts` extracting generated files from LLM response
- [ ] T063 [P] [US2] [CQ] Implement syntax validator in `packages/agents/src/coder/syntax-validator.ts` for generated code correctness
- [ ] T064 [US2] [CQ] Implement dependency resolver in `packages/agents/src/coder/dependency-resolver.ts` tracking imports and module relationships
- [ ] T065 [US2] [CQ] Implement linting integration in `packages/agents/src/coder/linter-integration.ts` (ESLint, Pylint, Clippy, etc.)
- [ ] T066 [US2] [CQ] Implement code quality checker in `packages/agents/src/coder/quality-checker.ts` enforcing error handling and logging
- [ ] T067 [US2] [CQ] Implement code file writer in `packages/analysis/src/code-writer.ts` to save generated code to `.omaikit/code/`
- [ ] T068 [US2] [UX] Implement `omaikit code` command in `packages/cli/src/commands/code.ts` with file-by-file progress
- [ ] T069 [US2] [UX] Add summary output showing LOC, files created, dependencies in `packages/cli/src/commands/code.ts`
- [ ] T070 [US2] [PERF] Optimize coder agent to generate code within 60 seconds per task

**Checkpoint**: User Story 2 complete - developers can generate code that matches their project style and standards

---

## Phase 5: User Story 3 - Test Generation (Priority: P1) 🎯 MVP Core

**Goal**: Developers can generate comprehensive test suites with >80% coverage  
**Independent Test**: `omaikit test` produces passing tests with >80% coverage and explicit edge case testing

### Tests for User Story 3 (Test-First per Constitution)

- [ ] T071 [P] [US3] [TEST] Unit test for Tester agent interface in `packages/agents/__tests__/tester/tester.test.ts`
- [ ] T072 [P] [US3] [TEST] Unit test for test pattern generator in `packages/agents/__tests__/tester/test-patterns.test.ts`
- [ ] T073 [P] [US3] [TEST] Unit test for coverage validator in `packages/agents/__tests__/tester/coverage-validator.test.ts`
- [ ] T074 [US3] [TEST] Contract test for test suite JSON schema in `packages/agents/__tests__/contracts/test-suite.contract.test.ts`
- [ ] T075 [US3] [TEST] Integration test for full test generation workflow in `packages/cli/__tests__/integration/test-command.test.ts`
- [ ] T076 [US3] [TEST] Edge case tests: edge inputs, error paths, boundary conditions in `packages/agents/__tests__/tester/edge-cases.test.ts`

### Implementation for User Story 3

- [ ] T077 [P] [US3] [CQ] Create tester agent structure in `packages/agents/src/tester/tester.ts` implementing Agent interface
- [ ] T078 [P] [US3] [CQ] Implement test pattern library in `packages/agents/src/tester/test-patterns.ts` (unit, integration, edge case patterns)
- [ ] T079 [US3] [CQ] Implement test prompt templates in `packages/agents/src/tester/prompt-templates.ts` per language and test framework
- [ ] T080 [US3] [CQ] Implement test parser in `packages/agents/src/tester/test-parser.ts` extracting tests from LLM response
- [ ] T081 [P] [US3] [CQ] Implement coverage analyzer in `packages/agents/src/tester/coverage-analyzer.ts` calculating coverage metrics per file
- [ ] T082 [US3] [CQ] Implement test framework detector in `packages/agents/src/tester/framework-detector.ts` (vitest, jest, pytest, etc.)
- [ ] T083 [US3] [CQ] Implement test executor in `packages/agents/src/tester/test-executor.ts` running generated tests and capturing results
- [ ] T084 [US3] [CQ] Implement coverage validator in `packages/agents/src/tester/coverage-validator.ts` enforcing >80% target
- [ ] T085 [US3] [CQ] Implement test file writer in `packages/analysis/src/test-writer.ts` to save tests to `.omaikit/tests/`
- [ ] T086 [US3] [UX] Implement `omaikit test` command in `packages/cli/src/commands/test.ts` with test execution output
- [ ] T087 [US3] [UX] Add coverage summary and failure reporting in `packages/cli/src/commands/test.ts`
- [ ] T088 [US3] [PERF] Optimize test generation to complete within 120 seconds including execution

**Checkpoint**: User Story 3 complete - developers have comprehensive, executable test suites with verified >80% coverage

---

## Phase 6: User Story 4 - Code Review (Priority: P2)

**Goal**: Developers receive detailed code reviews identifying improvements  
**Independent Test**: `omaikit review` produces markdown report with >5 actionable findings per 100 LOC

### Tests for User Story 4 (Test-First per Constitution)

- [ ] T089 [P] [US4] [TEST] Unit test for Reviewer agent interface in `packages/agents/__tests__/reviewer/reviewer.test.ts`
- [ ] T090 [P] [US4] [TEST] Unit test for finding classifier in `packages/agents/__tests__/reviewer/finding-classifier.test.ts`
- [ ] T091 [US4] [TEST] Contract test for review report schema in `packages/agents/__tests__/contracts/review.contract.test.ts`
- [ ] T092 [US4] [TEST] Integration test for full review workflow in `packages/cli/__tests__/integration/review-command.test.ts`
- [ ] T093 [US4] [TEST] Edge case tests: minimal code, complex modules, cross-module concerns in `packages/agents/__tests__/reviewer/edge-cases.test.ts`

### Implementation for User Story 4

- [ ] T094 [P] [US4] [CQ] Create reviewer agent structure in `packages/agents/src/reviewer/reviewer.ts` implementing Agent interface
- [ ] T095 [P] [US4] [CQ] Implement review prompt templates in `packages/agents/src/reviewer/prompt-templates.ts` covering all categories
- [ ] T096 [US4] [CQ] Implement finding parser in `packages/agents/src/reviewer/finding-parser.ts` extracting findings from LLM response
- [ ] T097 [P] [US4] [CQ] Implement finding classifier in `packages/agents/src/reviewer/finding-classifier.ts` (architecture, performance, security, maintainability, testing)
- [ ] T098 [US4] [CQ] Implement severity calculator in `packages/agents/src/reviewer/severity-calculator.ts` (critical, major, minor, suggestion)
- [ ] T099 [US4] [CQ] Implement review report generator in `packages/agents/src/reviewer/report-generator.ts` formatting as markdown
- [ ] T100 [US4] [CQ] Implement cross-module analyzer in `packages/agents/src/reviewer/cross-module-analyzer.ts` detecting circular dependencies
- [ ] T101 [US4] [CQ] Implement review file writer in `packages/analysis/src/review-writer.ts` to save `.omaikit/review.md`
- [ ] T102 [US4] [UX] Implement `omaikit review` command in `packages/cli/src/commands/review.ts` with finding summary
- [ ] T103 [US4] [UX] Add readiness assessment (approved/needs-revision/requires-discussion) in output
- [ ] T104 [US4] [PERF] Optimize review generation to complete within 90 seconds

**Checkpoint**: User Story 4 complete - developers have actionable code review feedback

---

## Phase 7: User Story 6 - Codebase Analysis (Priority: P2)

**Goal**: Omaikit analyzes existing codebases before planning  
**Independent Test**: `omaikit analyze` produces complete project analysis with structure, patterns, reuse opportunities

### Tests for User Story 6 (Test-First per Constitution)

- [ ] T105 [P] [US6] [TEST] Unit test for project scanner in `packages/analysis/__tests__/project-scanner.test.ts`
- [ ] T106 [P] [US6] [TEST] Unit test for AST parser in `packages/analysis/__tests__/ast-parser.test.ts`
- [ ] T107 [P] [US6] [TEST] Unit test for dependency graph builder in `packages/analysis/__tests__/dependency-graph.test.ts`
- [ ] T108 [US6] [TEST] Unit test for pattern detector in `packages/analysis/__tests__/pattern-detector.test.ts`
- [ ] T109 [US6] [TEST] Integration test for full analysis workflow in `packages/cli/__tests__/integration/analyze-command.test.ts`
- [ ] T110 [US6] [TEST] Edge case tests: monorepos, unconventional structures, mixed languages in `packages/analysis/__tests__/edge-cases.test.ts`

### Implementation for User Story 6

- [ ] T111 [P] [US6] [CQ] Implement project scanner in `packages/analysis/src/project-scanner.ts` walking file system and identifying modules
- [ ] T112 [P] [US6] [CQ] Implement AST parser in `packages/analysis/src/ast-parser.ts` using Babel (JS/TS), python-ast (Python), tree-sitter for others
- [ ] T113 [P] [US6] [CQ] Implement dependency graph builder in `packages/analysis/src/dependency-graph.ts` tracking imports and relationships
- [ ] T114 [US6] [CQ] Implement circular dependency detector in `packages/analysis/src/dependency-graph.ts` flagging problematic structures
- [ ] T115 [P] [US6] [CQ] Implement pattern detector in `packages/analysis/src/pattern-detector.ts` (naming conventions, error handling, structure)
- [ ] T116 [P] [US6] [CQ] Implement reuse suggester in `packages/analysis/src/reuse-suggester.ts` identifying modules for code reuse
- [ ] T117 [US6] [CQ] Implement analysis writer in `packages/analysis/src/analysis-writer.ts` saving `.omaikit/analysis.json`
- [ ] T118 [US6] [UX] Implement `omaikit analyze` command in `packages/cli/src/commands/analyze.ts` with progress reporting
- [ ] T119 [US6] [UX] Add analysis summary showing modules, dependencies, patterns discovered
- [ ] T120 [US6] [PERF] Optimize analysis to complete within 30 seconds for typical projects

**Checkpoint**: User Story 6 complete - Planner can use analysis context to generate better plans and avoid duplication

---

## Phase 8: User Story 5 - Pipeline Orchestration (Priority: P2)

**Goal**: Developers can run full pipeline with Plan → Code → Test → Review  
**Independent Test**: `omaikit run-pipeline` executes all agents and produces aggregated summary

### Tests for User Story 5 (Test-First per Constitution)

- [ ] T121 [P] [US5] [TEST] Unit test for orchestrator state machine in `packages/cli/__tests__/orchestrator/state-machine.test.ts`
- [ ] T122 [P] [US5] [TEST] Unit test for event bus in `packages/cli/__tests__/orchestrator/event-bus.test.ts`
- [ ] T123 [US5] [TEST] Integration test for full pipeline execution in `packages/cli/__tests__/integration/pipeline.test.ts`
- [ ] T124 [US5] [TEST] Integration test for pipeline parallelization (test + review parallel) in `packages/cli/__tests__/integration/pipeline-parallel.test.ts`
- [ ] T125 [US5] [TEST] Edge case tests: agent failures, cancellation, partial completion in `packages/cli/__tests__/integration/pipeline-edge-cases.test.ts`

### Implementation for User Story 5

- [ ] T126 [US5] [CQ] Implement pipeline executor in `packages/cli/src/orchestrator/pipeline-executor.ts` managing agent sequence
- [ ] T127 [US5] [CQ] Implement parallelization logic in `packages/cli/src/orchestrator/parallelizer.ts` running independent agents (test + review)
- [ ] T128 [US5] [CQ] Implement output aggregator in `packages/cli/src/orchestrator/output-aggregator.ts` combining results from all agents
- [ ] T129 [US5] [CQ] Implement summary report generator in `packages/cli/src/orchestrator/summary-generator.ts` creating consolidated output
- [ ] T130 [US5] [UX] Implement `omaikit run-pipeline` command in `packages/cli/src/commands/run-pipeline.ts` with full progress reporting
- [ ] T131 [US5] [UX] Add visual timeline showing agent execution order and parallelization in command output
- [ ] T132 [US5] [PERF] Optimize pipeline to complete within 5 minutes total (plan 30s + code 60s + test 120s || review 90s)

**Checkpoint**: User Story 5 complete - developers can orchestrate full workflow in single command

---

## Phase 9: User Story 7 - Multi-Module Support (Priority: P3)

**Goal**: Omaikit handles multi-module projects with parallel pipelines  
**Independent Test**: Multi-module project generates separate plans and code per module with dependency ordering

### Tests for User Story 7 (Test-First per Constitution)

- [ ] T133 [P] [US7] [TEST] Unit test for module dependency sorter in `packages/analysis/__tests__/module-sorter.test.ts`
- [ ] T134 [US7] [TEST] Unit test for parallel pipeline controller in `packages/cli/__tests__/orchestrator/multi-module-controller.test.ts`
- [ ] T135 [US7] [TEST] Integration test for multi-module pipeline in `packages/cli/__tests__/integration/multi-module-pipeline.test.ts`
- [ ] T136 [US7] [TEST] Edge case tests: circular module dependencies, complex monorepos in `packages/cli/__tests__/integration/multi-module-edge-cases.test.ts`

### Implementation for User Story 7

- [ ] T137 [US7] [CQ] Implement module dependency sorter in `packages/analysis/src/module-sorter.ts` topological ordering
- [ ] T138 [US7] [CQ] Implement multi-module pipeline controller in `packages/cli/src/orchestrator/multi-module-controller.ts` orchestrating per-module pipelines
- [ ] T139 [US7] [CQ] Implement module-aware plan generator in `packages/agents/src/planner/multi-module-planner.ts` separate plans per module
- [ ] T140 [US7] [CQ] Implement module isolation in coder, tester, reviewer agents to work per module
- [ ] T141 [US7] [CQ] Implement cross-module validation in `packages/cli/src/orchestrator/cross-module-validator.ts`
- [ ] T142 [US7] [UX] Implement `omaikit run-pipeline --module <name>` for single module execution
- [ ] T143 [US7] [UX] Implement `omaikit run-pipeline --modules <list>` for subset execution
- [ ] T144 [US7] [PERF] Ensure parallel per-module pipelines complete within 5 minutes for typical multi-module projects

**Checkpoint**: User Story 7 complete - enterprise monorepo support with full parallel execution

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final refinement, documentation, performance optimization  
**Duration**: 2-3 days

### Documentation & User Guides

- [ ] T145 [CQ] Create API documentation in `docs/api.md` covering all agents and CLI commands
- [ ] T146 [CQ] Create developer guide in `docs/DEVELOPER.md` for extending agents
- [ ] T147 [CQ] Create troubleshooting guide in `docs/TROUBLESHOOTING.md` with common issues
- [ ] T148 [CQ] Create example projects in `examples/` directory (simple, multi-module, complex)

### Performance Optimization

- [ ] T149 [P] [PERF] Profile and optimize planner agent for <30 second execution
- [ ] T150 [P] [PERF] Profile and optimize coder agent for <60 second per-task execution
- [ ] T151 [P] [PERF] Profile and optimize tester agent for <120 second execution
- [ ] T152 [P] [PERF] Profile and optimize reviewer agent for <90 second execution
- [ ] T153 [PERF] Profile and optimize analysis for <30 second execution on typical projects
- [ ] T154 [PERF] Implement caching for analysis results to avoid re-scanning unchanged code
- [ ] T155 [PERF] Benchmark full pipeline on sample projects and document results

### Error Handling & Resilience

- [ ] T156 [CQ] Implement comprehensive error recovery in all agents
- [ ] T157 [P] [CQ] Add retry logic for AI provider failures with exponential backoff
- [ ] T158 [CQ] Implement graceful degradation when optional features unavailable
- [ ] T159 [CQ] Add comprehensive logging for debugging and monitoring

### Testing & Quality

- [ ] T160 [TEST] Add end-to-end integration tests with sample projects in `packages/cli/__tests__/e2e/`
- [ ] T161 [TEST] Achieve >80% code coverage for all packages (verify with coverage reports)
- [ ] T162 [TEST] Add performance benchmarking tests in `packages/__tests__/benchmarks/`
- [ ] T163 [TEST] Add security scanning for dependencies (npm audit, Snyk)

### Deployment & Distribution

- [ ] T164 [CQ] Configure npm package publishing for all packages
- [ ] T165 [CQ] Create GitHub release workflow in `.github/workflows/release.yml`
- [ ] T166 [CQ] Setup automated changelog generation with conventional commits
- [ ] T167 [CQ] Create installation guide and publish to npm as `@omaikit/cli`

**Checkpoint**: All phases complete - production-ready Omaikit release

---

## Dependency Graph & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) [MUST COMPLETE FIRST]
    ↓
Phase 2 (Infrastructure) [BLOCKING GATE]
    ↓
┌─ Phase 3 (US1: Planning) [Can run parallel with others below]
├─ Phase 4 (US2: Code Generation) [Can run parallel]
├─ Phase 5 (US3: Testing) [Can run parallel]
├─ Phase 6 (US4: Review) [Can run parallel]
├─ Phase 7 (US6: Analysis) [Can run parallel]
└─ Phase 8 (US5: Pipeline) [Depends on US1-US4 completion]
    ↓
Phase 9 (US7: Multi-Module) [Depends on all user stories]
    ↓
Phase 10 (Polish) [Final optimization & release]
```

### Parallelization Opportunities

- **Phase 3, 4, 5, 6, 7 can run in parallel** (independent agents, different modules)
- Within each phase, [P] marked tasks can run simultaneously
- Phase 8 (Pipeline) must wait for US1, US2, US3, US4 core functionality
- Phase 9 (Multi-Module) builds on all completed phases

---

## MVP Definition

**Minimum Viable Product** (Phases 1-6):
- ✅ Users can generate plans from descriptions
- ✅ Users can generate code that compiles
- ✅ Users can generate tests with >80% coverage
- ✅ Users can analyze existing codebases
- ✅ MVP feature complete, production-ready

**Extended MVP** (Phases 1-8):
- ✅ Full pipeline orchestration working
- ✅ Code review agent provides actionable feedback
- ✅ All 5 core agents (P1, P2) implemented

**Enterprise** (Phases 1-10):
- ✅ Multi-module support
- ✅ Full performance optimization
- ✅ Comprehensive documentation
- ✅ Production deployment

---

## Success Metrics

Upon completion:

| Metric | Target | Verification |
|--------|--------|--------------|
| Code Coverage | ≥80% for agents, ≥70% for CLI | `npm run coverage` |
| Performance | Plan <30s, Code <60s, Test <120s, Review <90s, Pipeline <5min | `npm run benchmark` |
| User Satisfaction | 4.0+/5.0 | User testing feedback |
| Development Velocity | 5-10x improvement | Real project trials |
| Specification Adherence | 100% of requirements met | Traceability matrix |
| Test Execution | All tests passing | `npm test` |

---

**Total Task Count**: 167 tasks across 10 phases  
**MVP Task Count** (Phases 1-5): 88 tasks  
**Estimated Duration**: 8-12 weeks for full implementation  
**Team Size**: 3-4 developers recommended for parallel execution

