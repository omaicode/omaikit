export class PromptTemplates {
  generatePrompt(
    description: string,
    projectType?: string,
    techStack?: string[]
  ): string {
    const techStackStr =
      techStack && techStack.length > 0
        ? `Technology Stack: ${techStack.join(', ')}`
        : '';

    const projectTypeStr = projectType ? `Project Type: ${projectType}` : '';

    return `You are an expert project planner. Generate a detailed Agile project plan for the following feature request.

Feature Description: ${description}

${projectTypeStr}
${techStackStr}

Generate a comprehensive plan with the following JSON structure:
{
  "title": "Brief project title",
  "description": "Full description",
  "milestones": [
    {
      "title": "Milestone name",
      "duration": 5,
      "tasks": [
        {
          "id": "T1",
          "title": "Task name",
          "description": "Task description",
          "effort": 3,
          "status": "pending",
          "dependencies": ["T0"],
          "tags": ["backend"]
        }
      ]
    }
  ]
}

Requirements:
1. Create 2-5 milestones
2. Each milestone should have 3-8 tasks
3. Effort estimates should be in hours (1-40)
4. Include realistic dependencies between tasks
5. Tasks should cover all aspects: design, implementation, testing, documentation
6. Use clear, actionable task titles
7. Mark critical path tasks
8. Ensure dependency DAG is acyclic

Return ONLY valid JSON, no markdown or extra text.`;
  }

  generateClarificationPrompt(
    description: string,
    ambiguities: string[]
  ): string {
    return `Given this feature description: "${description}"

I need clarification on these points:
${ambiguities.map((a) => `- ${a}`).join('\n')}

Please provide brief, specific clarifications for each point. Format as JSON:
{
  "clarifications": {
    "point1": "answer",
    "point2": "answer"
  }
}`;
  }

  getSystemPrompt(): string {
    return `You are an expert Agile project planner with 10+ years of experience planning software projects.
You excel at breaking down complex features into manageable tasks, identifying dependencies, and creating realistic effort estimates.
You always think about the critical path and bottlenecks.
You prefer generating plans in valid JSON format without any markdown formatting.`;
  }
}
