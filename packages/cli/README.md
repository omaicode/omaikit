## @omaikit/cli

Command-line interface for Omaikit. This package orchestrates planning, code generation, and test generation workflows.

### Features

- `omaikit init` to generate `.omaikit/context.json`
- `omaikit plan` to create structured plans
- `omaikit code` to generate code into the project root
- `omaikit test` to generate tests into `.omaikit/tests`

### Usage

```bash
npm install -g @omaikit/cli
omaikit init "Add auth to my API"
omaikit plan "Add JWT auth"
omaikit code
omaikit test
```

### Output Locations

- Plans: `.omaikit/plans/`
- Tests: `.omaikit/tests/`
- Generated code: project root

### Development

```bash
npm run build --workspaces
npm run test
```
