# Contributing to Omaikit

Welcome! This guide covers how to contribute to Omaikit, including our code style, development workflow, and quality standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style Guide](#code-style-guide)
- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Testing Requirements](#testing-requirements)
- [Git Workflow](#git-workflow)
- [Commit Message Guide](#commit-message-guide)

---

## Getting Started

### Prerequisites

- **Node.js**: v22.0.0 or higher
- **npm**: v10.0.0 or higher
- **Git**: Latest version

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/omaikit/omaikit.git
cd omaikit

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit regularly
git commit -m "type: description"

# Run pre-commit validation
npm run pre-commit

# Push and create a pull request
git push origin feature/your-feature-name
```

---

## Code Style Guide

### TypeScript Configuration

All code must follow the strict TypeScript configuration defined in `tsconfig.json`:

- **target**: ES2022
- **strict**: true (all strict type checks enabled)
- **noImplicitAny**: true (no implicit `any` types allowed)
- **noUnusedLocals**: false (development-friendly, but document unused vars)
- **noUnusedParameters**: false (development-friendly, but prefix unused with `_`)

### File Structure

```
packages/
├── models/           # Core data types and models
├── config/           # Configuration management
├── analysis/         # Code analysis utilities
├── agents/           # AI agent implementations
└── cli/              # CLI interface and orchestration
```

### Maximum File Size

- **Max lines per file**: 300 (strict, enforced by ESLint)
- **Max function length**: 50 lines (recommended)
- **Max cyclomatic complexity**: 10 (recommended)

**Rationale**: Smaller files are easier to test, maintain, and understand.

---

## Naming Conventions

### Variables and Functions

```typescript
// ✅ GOOD: camelCase for variables and functions
const agentName = 'planner';
function executeAgent() {}

// ❌ BAD: snake_case or PascalCase
const agent_name = 'planner';
function executeAgent_method() {}
```

### Classes and Interfaces

```typescript
// ✅ GOOD: PascalCase for classes and interfaces
class PlannerAgent {}
interface AgentInput {}

// ❌ BAD: camelCase or snake_case
class plannerAgent {}
interface agentInput {}
```

### Constants

```typescript
// ✅ GOOD: UPPER_SNAKE_CASE for constants
const DEFAULT_TIMEOUT = 5000;
const MAX_RETRIES = 3;

// ❌ BAD: camelCase
const defaultTimeout = 5000;
```

### File Names

```typescript
// ✅ GOOD: lowercase with hyphens
export class PlannerAgent {}
// File: planner-agent.ts

// ❌ BAD: PascalCase or snake_case
// File: PlannerAgent.ts or planner_agent.ts
```

### Unused Parameters

Prefix unused function parameters with underscore:

```typescript
// ✅ GOOD: Unused parameter prefixed with _
function onError(_error: Error): void {
  console.log('Handling error...');
}

// ❌ BAD: Unused parameter without prefix
function onError(error: Error): void {
  console.log('Handling error...');
}
```

---

## Error Handling

### Standard Error Structure

All errors must use typed custom error classes:

```typescript
// ✅ GOOD: Custom error class with code
export class AgentError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

// Usage
throw new AgentError(
  'AGENT_INIT_FAILED',
  'Failed to initialize Planner agent',
  500,
);
```

### Error Codes

All errors must use standardized codes from `packages/agents/src/errors.ts`:

```
AGENT_* - Agent initialization and execution errors
PROVIDER_* - AI provider errors (OpenAI, Anthropic)
PARSE_* - Parsing and validation errors
CACHE_* - Cache-related errors
CONFIG_* - Configuration errors
ORCHESTRATION_* - Pipeline orchestration errors
```

### Try-Catch Guidelines

```typescript
// ✅ GOOD: Catch specific errors
try {
  await agent.execute(input);
} catch (error) {
  if (error instanceof AgentError) {
    logger.error(`Agent error [${error.code}]: ${error.message}`);
  } else {
    logger.error('Unknown error:', error);
  }
  throw error;
}

// ❌ BAD: Silent failures or generic catches
try {
  await agent.execute(input);
} catch (error) {
  // Silent failure
}
```

---

## Logging

### Logging Levels

All logging must use one of these levels:

- **INFO** (default): General information about execution flow
- **WARN**: Non-fatal issues that should be investigated
- **ERROR**: Fatal errors that stop execution

### Logging Examples

```typescript
import { logger } from '@omaikit/agents';

// ✅ GOOD: Clear, contextual logging
logger.info('Starting Planner agent execution', {
  taskId: plan.id,
  taskCount: plan.tasks.length,
});

logger.warn('High token usage detected', {
  tokens: usedTokens,
  limit: tokenLimit,
  percentage: (usedTokens / tokenLimit) * 100,
});

logger.error('Failed to parse code generation response', {
  code: 'PARSE_CODE_GENERATION_FAILED',
  error: error.message,
  response: truncatedResponse,
});

// ❌ BAD: Vague or missing context
logger.info('Started');
logger.error('Failed');
logger.warn('Problem');
```

### Structured Logging

Always include relevant context:

```typescript
// ✅ GOOD: Structured data
logger.info('Task execution started', {
  taskId: task.id,
  type: task.type,
  priority: task.priority,
  estimatedDuration: task.estimatedDuration,
});

// ❌ BAD: String concatenation
logger.info(
  'Task execution started for task ' +
    task.id +
    ' of type ' +
    task.type,
);
```

---

## Testing Requirements

### Test Coverage

- **Minimum coverage**: 80% (enforced in CI)
- **Critical paths**: 100% coverage required
- **All agents**: Must have unit + integration tests

### Test File Naming

```
src/
├── agent.ts
└── __tests__/
    ├── agent.test.ts       # Unit tests
    ├── agent.spec.ts       # Specs
    └── fixtures/
        └── mocks.ts        # Test mocks and fixtures
```

### Test-First Development (TDD)

Per Constitution: Tests must be written BEFORE implementation:

1. Write failing test that specifies behavior
2. Write minimal implementation to pass test
3. Refactor for clarity and efficiency
4. Repeat

### Testing Best Practices

```typescript
// ✅ GOOD: Clear test descriptions
describe('PlannerAgent', () => {
  it('should generate a valid plan from a feature description', async () => {
    const input: AgentInput = {
      type: 'planning',
      data: { description: 'build a REST API' },
    };

    const result = await planner.execute(input);

    expect(result.status).toBe('success');
    expect(result.data.tasks).toHaveLength(5);
  });
});

// ❌ BAD: Vague test descriptions
describe('Planner', () => {
  it('works', async () => {
    const result = await planner.execute(mockInput);
    expect(result).toBeDefined();
  });
});
```

---

## Git Workflow

### Branch Naming

```
feature/          # New feature (feature/add-token-counter)
bugfix/           # Bug fix (bugfix/fix-parsing-error)
refactor/         # Code refactoring (refactor/simplify-orchestrator)
docs/             # Documentation (docs/update-readme)
test/             # Test additions (test/add-provider-tests)
```

### Pull Request Requirements

- ✅ All tests passing
- ✅ Code coverage maintained or improved
- ✅ Linting and formatting checks passing
- ✅ At least one code review approval
- ✅ Descriptive PR title and description

---

## Commit Message Guide

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (no functional impact)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `chore`: Build, dependencies, or tooling changes

### Scope

Include the affected package or component:

```
feat(agents): add token counter to AI provider
fix(cli): resolve output formatting issue
docs(models): update Plan interface documentation
```

### Subject Line

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Max 50 characters

### Examples

```
✅ GOOD
feat(agents): add streaming support to OpenAI adapter
fix(cli): resolve crash when config file missing
docs(models): document CodeGeneration request structure

❌ BAD
Added streaming support
FIX: cli crashes
update documentation
```

---

## Running Validation Scripts

### Pre-Commit Validation

```bash
npm run pre-commit
# Runs: build → lint → format:check
```

### Pre-Push Validation

```bash
npm run pre-push
# Runs: build → lint → format:check → test
```

### Full Quality Check

```bash
npm run build
npm run lint
npm run format:check
npm run coverage  # With coverage report
```

---

## Questions or Need Help?

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check [README.md](../README.md) and plan.md for detailed information

Thank you for contributing to Omaikit! 🚀
