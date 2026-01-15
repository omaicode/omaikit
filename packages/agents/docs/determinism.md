# Deterministic Output Strategy

## Goals

- Reduce variability between runs for the same inputs.
- Ensure outputs are traceable to the prompt/template version and model settings.
- Enable reproducible tests via mock generation paths.

## Defaults

- **Temperature**: 0.4 for code generation to reduce randomness while preserving creativity.
- **Max Tokens**: 1200 default for code generation to keep responses bounded and fast.
- **Tool Calls**: Limit to 3 tool calls per request to reduce variance and latency.

## Prompt Versioning

- Each prompt template should include a version identifier.
- Store the prompt version in output metadata whenever possible.
- Avoid changing prompt text without incrementing the version.

## Output Metadata

Include these fields in agent outputs when supported:

- `model`: Provider model name
- `temperature`: Sampling temperature
- `maxTokens`: Token limit used
- `promptVersion`: Template version identifier
- `generatedAt`: ISO-8601 timestamp

## Reproducibility

- Prefer cached inputs and analysis outputs when available.
- Avoid data-dependent nondeterminism (time-based logic, randomized sorting).
- Use mock generation for test environments to ensure stable snapshots.

## Constraints

- External LLMs are inherently nondeterministic; exact output parity is not guaranteed.
- Determinism is achieved through consistent prompts, settings, and stable inputs.
