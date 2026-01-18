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