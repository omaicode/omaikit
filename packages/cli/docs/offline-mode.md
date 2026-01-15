# Offline Mode & Cache Fallback (CLI)

## Offline Definition

Offline mode means AI providers are unavailable or network access is disabled. CLI commands should behave predictably using cached outputs and local scanning when possible.

## Command Behavior

### `omaikit init`

- Prompts for an API key if none is configured.
- If an API provider cannot be initialized, init fails with a clear error.
- When running tests, init uses local scanning to create `.omaikit/context.json`.

### `omaikit plan`, `omaikit code`, `omaikit test`, `omaikit review`

- Require `.omaikit/context.json` to exist.
- If the AI provider responds in echo mode, fall back to mock generation for predictable output.
- If cached plan/code/test/review output exists, surface it to the user instead of failing.

## Cache Fallbacks

- Plans: `.omaikit/plans/P-{N}.json`
- Code: `.omaikit/code/`
- Tests: `.omaikit/tests/`
- Review: `.omaikit/review.md`

## User Messaging

- Always explain when cached output is used.
- Provide actionable next steps to re-run with a configured provider if desired.
