# Quickstart Guide: Getting Started with Omaikit

**Date**: January 14, 2026  
**Target Audience**: Developers using Omaikit for the first time  
**Duration**: 10 minutes to first generated code

## What is Omaikit?

Omaikit is a multi-agent CLI toolkit that accelerates software development by orchestrating specialized AI agents to:

- **Plan** feature work into structured Agile sprints
- **Generate** production-ready code that matches your project style
- **Test** generated code with comprehensive test suites
- **Review** code to identify issues and improvements

All outputs live in a `.omaikit/` directory that never touches your main codebase.

---

## Installation

### Prerequisites

- Node.js 22+
- npm 10+ or yarn 4+
- API key for OpenAI (GPT-4) or Anthropic (Claude 3 Opus)

### Install Omaikit

```bash
npm install -g @omaikit/cli
# or
npm install --save-dev @omaikit/cli  # For project-local installation
```

Verify installation:

```bash
omaikit --version
omaikit --help
```

### Configure API Key

Omaikit requires an AI provider API key. Configure it in `.omaikit/config.json`:

```bash
omaikit config --set api-provider openai
omaikit config --set api-key your-openai-key-here
```

Or set environment variables:

```bash
export OMAIKIT_API_PROVIDER=openai
export OMAIKIT_API_KEY=your-key-here
omaikit plan "describe your feature"
```

---

## Your First Omaikit Workflow

### Step 1: Choose Your Starting Point

**Option A: New Project (Greenfield)**

```bash
mkdir my-project && cd my-project
omaikit init
# Creates initial project structure
```

**Option B: Existing Project (Add Feature)**

```bash
cd /path/to/existing/project
omaikit analyze
# Scans and understands your existing codebase
# Output: .omaikit/analysis.json with project structure
```

### Step 2: Generate a Plan

Describe the feature you want to build:

```bash
omaikit plan "Add user authentication with JWT tokens"
```

Output:

```
✓ Plan generated: .omaikit/plan.json (2.3 KB)

Summary:
  Estimated Effort: 12 hours across 2 sprints
  Tasks: 6 implementation tasks
  Modules Affected: auth, models, api

Preview:
  Sprint 1: Core auth module + middleware (8 hours)
  Sprint 2: Integration + documentation (4 hours)

Options:
  omaikit code          # Generate code for all tasks
  omaikit code --task 1 # Generate specific task
  omaikit plan --edit   # Refine the plan
```

### Step 3: Generate Code

Generate production-ready code that implements the plan:

```bash
omaikit code
```

Output:

```
✓ Code generated: .omaikit/code/

Files Created:
  src/auth/auth-service.ts (145 LOC)
  src/auth/jwt-handler.ts (87 LOC)
  src/middleware/auth-middleware.ts (56 LOC)
  src/models/user.ts (34 LOC)

Code Quality:
  ✓ Syntax valid (TypeScript strict mode)
  ✓ No linting errors (ESLint)
  ✓ Error handling: ✓
  ✓ Logging: ✓
  ✓ Type coverage: 100%

Next: omaikit test
```

### Step 4: Generate Tests

Generate comprehensive test suites for the code:

```bash
omaikit test
```

Output:

```
✓ Tests generated: .omaikit/tests/

Test Summary:
  Total: 48 test cases
  Unit tests: 36
  Integration tests: 12
  Coverage: 87%

Coverage by Module:
  auth-service.ts: 92%
  jwt-handler.ts: 85%
  auth-middleware.ts: 78%

Options:
  omaikit test --run    # Execute tests locally
  omaikit review        # Get code review before implementing
```

### Step 5: Get Code Review

Receive a detailed code review identifying improvements:

```bash
omaikit review
```

Output:

```
✓ Review complete: .omaikit/review.md

Findings: 7 total
  Critical: 0
  Major: 1 (Missing error handling in token refresh)
  Minor: 4 (Code style suggestions)
  Suggestions: 2 (Performance optimizations)

Categories:
  Architecture: 2 findings
  Performance: 2 findings
  Security: 1 finding (improve password hashing config)
  Testing: 2 findings

Readiness: Needs revision
Estimated fix time: 1-2 hours

View full review: .omaikit/review.md
```

### Step 6: Full Pipeline (Optional)

Run all agents in optimized sequence:

```bash
omaikit run-pipeline
```

Output:

```
🚀 Starting pipeline...

1/5 Analyzing project... ✓ (2s)
2/5 Generating plan... ✓ (8s)
3/5 Generating code... ✓ (24s)
4/5 Generating tests... ✓ (15s) [parallel with review]
5/5 Code review... ✓ (12s)

📊 Pipeline Summary
  Total time: 1m 2s
  Tasks generated: 6
  Code: 322 LOC
  Tests: 1,247 LOC (87% coverage)
  Issues identified: 7

Output locations:
  Plan: .omaikit/plan.json
  Code: .omaikit/code/
  Tests: .omaikit/tests/
  Review: .omaikit/review.md

✓ Ready for implementation!
```

---

## Understanding the Output

### .omaikit/ Directory Structure

```
.omaikit/
├── config.json                  # Omaikit configuration
├── analysis.json               # Project analysis from analyze/init
├── plan.json                   # Generated Agile plan
├── code/                       # Generated source code
│   ├── auth-service.ts
│   ├── jwt-handler.ts
│   └── auth-middleware.ts
├── tests/                      # Generated test suites
│   ├── auth-service.test.ts
│   ├── jwt-handler.test.ts
│   └── auth-middleware.test.ts
├── review.md                   # Code review report
└── .analysis-cache/            # Cached analysis data (git-ignored)
```

### Key Outputs Explained

**plan.json**: Structured Agile plan with:
- Milestones and sprints
- Tasks with acceptance criteria
- Effort estimates
- Task dependencies
- Risk factors

**Generated Code**: Production-ready files with:
- Full error handling
- Comprehensive logging
- JSDoc/TSDoc comments
- Type safety (if applicable)
- Code style matching your project

**Tests**: Comprehensive test coverage including:
- Unit tests for individual functions
- Integration tests for modules
- Edge case and error scenario testing
- Coverage metrics per file

**review.md**: Markdown report with:
- Categorized findings (architecture, performance, security, etc.)
- Severity levels (critical, major, minor, suggestion)
- Actionable recommendations
- Code examples and improvement suggestions

---

## Configuration

### .omaikit/config.json

```json
{
  "version": "1.0",
  "apiProvider": "openai",
  "targetLanguage": "typescript",
  "projectType": "nodejs",
  
  "agents": {
    "planner": {
      "enabled": true,
      "model": "gpt-4",
      "temperature": 0.7
    },
    "coder": {
      "enabled": true,
      "model": "gpt-4",
      "temperature": 0.5
    },
    "tester": {
      "enabled": true,
      "model": "gpt-4",
      "temperature": 0.4
    },
    "reviewer": {
      "enabled": true,
      "model": "gpt-4",
      "temperature": 0.6
    }
  },
  
  "codeGeneration": {
    "enforceErrorHandling": true,
    "enforceLogging": true,
    "enforceTypeChecking": true,
    "maxLineLength": 100
  },
  
  "testing": {
    "coverageTarget": 80,
    "framework": "vitest",
    "includeIntegrationTests": true
  },
  
  "cache": {
    "analysisCache": true,
    "cacheDir": ".omaikit/.analysis-cache",
    "ttlMinutes": 60
  }
}
```

### Common Configuration Options

```bash
# Set API provider
omaikit config --set apiProvider openai
omaikit config --set apiProvider anthropic

# Set target language (used for code generation)
omaikit config --set targetLanguage python
omaikit config --set targetLanguage rust

# Set model and temperature
omaikit config --set agents.coder.model gpt-4-turbo
omaikit config --set agents.coder.temperature 0.3

# Enable/disable agents
omaikit config --set agents.reviewer.enabled false

# Set code generation rules
omaikit config --set codeGeneration.enforceErrorHandling true
omaikit config --set codeGeneration.maxLineLength 100
```

---

## Next Steps

### After Generating Code

1. **Review the plan**: `cat .omaikit/plan.json`
2. **Inspect generated code**: Open `.omaikit/code/` in your editor
3. **Run tests locally**: `omaikit test --run`
4. **Read the review**: `cat .omaikit/review.md`
5. **Copy to your project**: Manually integrate generated code into `src/`
6. **Make adjustments**: Omaikit is a starting point; refine as needed
7. **Commit and test**: Run your full test suite, type checking, linting

### Advanced Workflows

**Regenerate with different settings:**
```bash
omaikit code --force          # Overwrite previous generation
omaikit code --task 3 --force # Regenerate specific task
```

**Refine the plan:**
```bash
omaikit plan --edit           # Open plan in editor
omaikit plan --add-task "..."  # Add new task to plan
```

**Compare versions:**
```bash
omaikit code --version old     # Load previous generation
omaikit diff old current       # Compare code versions
```

**Multi-module projects:**
```bash
omaikit run-pipeline --module auth      # Just the auth module
omaikit run-pipeline --modules auth,models  # Multiple modules
```

---

## Troubleshooting

### API Connection Issues

```bash
# Test connection
omaikit config --test

# Check API key
omaikit config --get apiKey

# View recent errors
omaikit logs --errors --lines 20
```

### Code Generation Quality

If generated code doesn't meet expectations:

1. Review the plan accuracy first (`cat .omaikit/plan.json`)
2. Check that project analysis is complete (`cat .omaikit/analysis.json`)
3. Regenerate with adjusted settings:
   ```bash
   omaikit code --temperature 0.3  # Lower temperature = more consistent
   ```
4. File an issue with the plan + generated code for improvement

### Test Failures

If generated tests fail:

1. Check for missing dependencies in analysis
2. Review generated code for syntax issues
3. Run tests with verbose output: `omaikit test --run --verbose`
4. Check that test framework matches your project setup

---

## Tips & Best Practices

1. **Start with analysis**: Always run `omaikit analyze` on existing projects first to ensure code generation respects your patterns

2. **Review the plan before code**: Take 5 minutes to review and adjust `.omaikit/plan.json` before generating code

3. **Test locally first**: Run `omaikit test --run` before integrating generated code

4. **Use review for learning**: Read `.omaikit/review.md` to understand best practices for your domain

5. **Iterative refinement**: Treat generated code as starting point; refine for your specific needs

6. **Cache analysis**: For large projects, analysis is cached; use `--force-analysis` to re-analyze

7. **Keep .omaikit in git**: Track outputs so team can see what was generated

---

## Need Help?

```bash
omaikit help                  # General help
omaikit <command> --help      # Help for specific command
omaikit docs open             # Open documentation
omaikit bug report            # Report an issue
```

