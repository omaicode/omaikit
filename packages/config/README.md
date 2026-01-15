## @omaikit/config

Configuration utilities for Omaikit. Handles loading and saving config from global or local scope.

### Key Functions

- `loadConfig()`
- `saveConfig()`
- `getGlobalConfigPath()`
- `getLocalConfigPath()`

### Example

```ts
import { loadConfig } from '@omaikit/config';

const config = loadConfig();
```

### Notes

- Local config is stored under `.omaikit/config.json`.
- Global config is stored in the user profile directory.
