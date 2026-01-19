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

## @omaikit/cli

Command-line interface for Omaikit. This package orchestrates planning, code generation, and test generation workflows.

### Features

- `omaikit init` to generate `.omaikit/context.json`
- `omaikit plan` to create structured plans into `.omaikit/plans/` and `.omaikit/tasks/`
- `omaikit code` to generate code into the project root
- `omaikit test` to generate tests into `.omaikit/tests`

### Usage

```bash
npm install -g @omaikit/cli
cd my-project
omaikit init "Build a REST API with Express and MongoDB"
omaikit plan "Create a user authentication system"
omaikit code
omaikit test
```

### Output Locations

- Plans: `.omaikit/plans/`
- Tests: `.omaikit/tests/`
- Generated code: project root

### Configuration

The CLI uses OPENAI_API_KEY from environment variables for API access. Ensure you have it set before running commands.

It'll ask for the OPENAI_API_KEY configuration during `omaikit init`.