## @omaikit/agents

Agent implementations for Omaikit. This package provides the core agent classes that power planning, code generation, and testing.

### Included Agents

- Manager (context initialization)
- Planner (plan generation)
- Coder (code generation)
- Tester (test generation)
- Reviewer (code review)

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
