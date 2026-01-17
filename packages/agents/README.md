## @omaikit/agents

Agent implementations for Omaikit. This package provides the core agent classes that power planning, code generation, and testing.

### Included Agents

- Manager (context initialization)
- Planner (plan generation)
- Coder (code generation)
- Tester (test generation)
- Reviewer (code review)

### File-Based Writers

The agents package now also exposes file-based utilities previously shipped in the analysis package:

- `ContextWriter` for `.omaikit/context.json`
- `PlanWriter` for `.omaikit/plans/`
- `TestWriter` for `.omaikit/tests/`
- `CacheManager` for `.omaikit/cache/`

Plan tasks are stored separately in `.omaikit/tasks/` using the format
`T-{PLAN_ID}-{MILESTONE_ID}-{TASK_ID}.json`.

### Prompts

Prompt templates are stored as separate markdown files under `packages/agents/prompts/<agent>/`.
They are loaded by name via `readPrompt()` (for example, `planner.plan-milestones`).

### Basic Usage

```ts
import { CoderAgent } from '@omaikit/agents';

const coder = new CoderAgent();
await coder.init();
const output = await coder.execute({
  task: { /* task data */ } as any,
  plan: null,
  projectContext: { /* context */ } as any,
  history: [],
});
```

### Notes

- Agent memory is stored under `.omaikit/memory/` during execution.
- Type declarations are consolidated at the repo root in types.d.ts for local development.
