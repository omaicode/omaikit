<div align="center">
  <a href="https://omaicode.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://omaicode.com/storage/app/media/images/omaicode_icon.png">
      <img alt="Omaikit logo" src="https://omaicode.com/storage/app/media/images/omaicode_icon.png" height="64">
    </picture>
  </a>
  <h1>Omaikit</h1>

<a href="https://www.npmjs.com/package/@omaikit/agents"><img alt="NPM version" src="https://img.shields.io/npm/v/@omaikit/agents.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@omaikit/agents.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/discussions"><img alt="Join the community on GitHub" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=GitHub&labelColor=000000&logoWidth=20"></a>
</div>

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
