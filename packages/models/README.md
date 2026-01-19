<div align="center">
  <a href="https://omaicode.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://omaicode.com/storage/app/media/images/omaicode_icon.png">
      <img alt="Omaikit logo" src="https://omaicode.com/storage/app/media/images/omaicode_icon.png" height="64">
    </picture>
  </a>
  <h1>Omaikit</h1>

<a href="https://www.npmjs.com/package/@omaikit/models"><img alt="NPM version" src="https://img.shields.io/npm/v/@omaikit/models.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@omaikit/models.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/discussions"><img alt="Join the community on GitHub" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=GitHub&labelColor=000000&logoWidth=20"></a>
</div>


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
