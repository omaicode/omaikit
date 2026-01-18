## @omaikit/models

Shared data models and validators for Omaikit. These types define plans, tasks, code generation outputs, tests, and reviews.

### Exports

- `Plan`, `Task`, `Milestone`
- `CodeGeneration`, `CodeFile`
- `TestSuite`, `TestFile`
- `CodeReview`, `ReviewFinding`
- Zod validators in `src/validators`

### Example

```ts
import type { Plan } from '@omaikit/models';

const plan: Plan = {
  id: 'P001',
  title: 'Example',
  description: 'Demo plan',
  milestones: [],
};
```

### Notes

- Validation schemas live in packages/models/src/validators.
- Type declarations are consolidated at the repo root in types.d.ts for local development.
