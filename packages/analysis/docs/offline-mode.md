# Offline Mode & Cache Fallback (Analysis)

## Offline Definition

Offline mode means no AI provider is available or network access is disabled. Analysis falls back to local filesystem inspection and cached results.

## Behavior

- If `.omaikit/analysis.json` exists and is within cache TTL, reuse it.
- If cache is missing or stale, run a filesystem scan to collect:
  - language list
  - file count
  - total LOC
  - dependency list from package manifests
- If full AST parsing is unavailable, fall back to lightweight scanning.

## Cache Strategy

- Cache location: `.omaikit/.analysis-cache/`
- Cache key: content hash of relevant files + tool version
- TTL: configurable (default 60 minutes)

## Failure Handling

- If filesystem scanning fails, return a minimal empty analysis object and surface a warning.
- Do not block plan generation when only cached analysis is available.
