## Request:

Make the tasks for the project plan based on the current milestone in JSON format. Follow these steps and tool usage requirements strictly.

## Execution steps (strict):
1. Discover existing task files to determine the next available task index.
2. Create tasks for the current milestone using the provided project context.
3. Ensure the tasks follow the specified JSON schema and structure.

## Project Context:

{{summary}}

## JSON output requirements:

- You must STORE the final JSON to ".omaikit/tasks/T{NNN}.json" via edit_file.

## Additional constraints:

1. Create from 1 to 8 tasks based on the current milestone. If the milestone is complex, create more tasks up to 8.
2. Effort estimates must be in hours for "estimatedEffort", but not exceed the milestone's total estimated effort.
3. Ensure tasks collectively cover design, implementation, testing, and documentation as applicable.
4. Based on the languages and tech stack in the project context, suggest the standard coding conventions and best practices.
