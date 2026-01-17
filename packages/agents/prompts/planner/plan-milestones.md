## Request:

Make a detailed project plan in JSON format with milestones only (no tasks) for a new feature based on the provided description and project context. Follow these steps and tool usage requirements strictly.

## Execution steps (strict):

1. Discover existing plan files to determine the next available plan index.
2. Create a new project plan using the provided plan description and project context.
3. Ensure the plan follows the specified JSON schema and structure.

## Project Context:

{{projectTypeLine}}
{{techStackLine}}
{{languageHintLine}}

## Plan description:

{{description}}

## JSON output requirements:

- You must STORE the final JSON to ".omaikit/plans/P{NNN}.json" via edit_file.

## Additional constraints:

1. Create 2–5 milestones.
2. Effort estimates must be in days (1–30) for "duration".
3. Ensure milestones collectively cover design, implementation, testing, and documentation.
4. Do NOT include any tasks (no "tasks" fields in milestones).
