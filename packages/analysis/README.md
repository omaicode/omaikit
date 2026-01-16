## @omaikit/analysis

Filesystem-based analysis utilities used by Omaikit. This package reads and writes project context, plans, code, and tests.

### Key Modules

- `ContextWriter` for `.omaikit/context.json`
- `PlanWriter` for `.omaikit/plans/`
- `TestWriter` for `.omaikit/tests/`
- `CacheManager` for `.omaikit/.analysis-cache/`

### Example

```ts
import { ContextWriter, PlanWriter } from '@omaikit/analysis';

const context = await new ContextWriter().readContext();
const plan = await new PlanWriter().readPlan('plans/P-0.json');
```

### Notes

- All outputs are file-based; no database required.
- See offline-mode guidance in packages/analysis/docs/offline-mode.md.
