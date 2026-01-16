# Omaikit

Omaikit is a multi-agent CLI toolkit that accelerates software development by orchestrating specialized AI agents (Manager, Planner, Coder, Tester, Reviewer). It turns high-level goals into actionable plans, generates production-ready code, creates tests, and provides reviews.

## Features

- Multi-agent pipeline: plan → code → test → review
- Project context analysis with `.omaikit/context.json`
- Tooling for reading, searching, listing, and patching files
- Works across platforms (Windows, macOS, Linux)

## Requirements

- Node.js 22+
- npm

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## CLI Usage

```bash
# Initialize project context
omaikit init "Your project description"

# Generate a plan
omaikit plan "Build a REST API"

# Generate code
omaikit code

# Generate tests
omaikit test

# Review code
omaikit review
```

## Monorepo Structure

```
packages/
  agents/   # Agent implementations
  analysis/ # Codebase analysis
  cli/      # CLI entry point
  config/   # Configuration and env handling
  models/   # Shared data models
specs/      # Product and implementation specs
scripts/    # Project scripts
```

## Tooling (Agents)

The agents use tool calls to inspect and modify files:

- `list_files`: list files or search by glob
- `search_text`: search file contents
- `read_file`: read file content by line range
- `edit_file`: overwrite/append/replace/insert file content
- `apply_patch`: apply unified diffs and create/update/delete files


## License

MIT
