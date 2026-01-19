<div align="center">
  <a href="https://omaicode.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://omaicode.com/storage/app/media/images/omaicode_icon.png">
      <img alt="Omaikit logo" src="https://omaicode.com/storage/app/media/images/omaicode_icon.png" height="64">
    </picture>
  </a>
  <h1>Omaikit</h1>

<a href="https://www.npmjs.com/package/@omaikit/config"><img alt="NPM version" src="https://img.shields.io/npm/v/@omaikit/config.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@omaikit/config.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/discussions"><img alt="Join the community on GitHub" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=GitHub&labelColor=000000&logoWidth=20"></a>
</div>

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
