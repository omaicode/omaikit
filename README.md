<div align="center">
  <a href="https://omaicode.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://omaicode.com/storage/app/media/images/omaicode_icon.png">
      <img alt="Omaikit logo" src="https://omaicode.com/storage/app/media/images/omaicode_icon.png" height="64">
    </picture>
  </a>
  <h1>Omaikit</h1>

<a href="https://www.npmjs.com/package/@omaikit/cli"><img alt="NPM version" src="https://img.shields.io/npm/v/@omaikit/cli.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@omaikit/cli.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/omaicode/omaikit/discussions"><img alt="Join the community on GitHub" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=GitHub&labelColor=000000&logoWidth=20"></a>
</div>

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
  agents/   # Agent implementations and file-based writers
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

## Planner Output

Plans are stored in `.omaikit/plans/P001.json` (P### format) without embedded tasks. Tasks are stored as
individual files in `.omaikit/tasks/` using the format `T-{PLAN_ID}-{MILESTONE_ID}-{TASK_ID}.json`.

## Prompts

Agent prompts live under `packages/agents/prompts/<agent>/` as individual markdown files.
The agents load prompts by name via `readPrompt()`.


## License

MIT
