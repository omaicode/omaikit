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
    const languageHint = this.getLanguageHint(projectType, techStack);
    const structureHint = this.getStructureHint(languageHint, projectType);

    return `You are an expert project planner. Generate a detailed Agile project plan for the following feature request.

Feature Description: ${description}

${projectTypeStr}
${techStackStr}
${languageHint ? `Programming Language: ${languageHint}` : ''}

Project Structure Guidance:
${structureHint}

Generate a comprehensive plan with the following JSON structure:
{
  "id": "P-0",
  "title": "Brief project title",
  "description": "Full description",
  "clarifications": [],
  "milestones": [
    {
      "id": "M1",
      "title": "Milestone name",
      "description": "Milestone description",
      "duration": 5,
      "successCriteria": ["Milestone success criteria"],
      "tasks": [
        {
          "id": "T1",
          "title": "Task name",
          "description": "Task description",
          "type": "feature",
          "estimatedEffort": 3,
          "acceptanceCriteria": ["Acceptance criteria"],
          "inputDependencies": ["T0"],
          "outputDependencies": ["T2"],
          "targetModule": "module-path",
          "affectedModules": ["module-path"],
          "suggestedApproach": "Brief implementation guidance",
          "technicalNotes": "Optional technical notes",
          "riskFactors": [
            {
              "description": "Risk description",
              "likelihood": "low",
              "impact": "medium",
              "mitigation": "Mitigation steps"
            }
          ],
          "status": "planned",
          "blockers": []
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
7. Ensure each task includes all required fields in the schema
8. Ensure dependency DAG is acyclic
9. Each task must reference the intended files/folders via targetModule and affectedModules using the project structure guidance

Return ONLY valid JSON, no markdown or extra text.`;
  }

  private getLanguageHint(projectType?: string, techStack?: string[]): string | undefined {
    const entries = [projectType, ...(techStack ?? [])].filter((value): value is string => Boolean(value));
    const haystack = entries.join(' ').toLowerCase();

    if (haystack.includes('golang') || haystack.includes(' go ')) return 'Go';
    if (haystack.includes('typescript') || haystack.includes('ts')) return 'TypeScript';
    if (haystack.includes('javascript') || haystack.includes('node') || haystack.includes('react')) return 'JavaScript';
    if (haystack.includes('python')) return 'Python';
    if (haystack.includes('rust')) return 'Rust';
    if (haystack.includes('c#') || haystack.includes('csharp') || haystack.includes('.net')) return 'C#';
    if (haystack.includes('php') || haystack.includes('laravel')) return 'PHP';

    return undefined;
  }

  private getStructureHint(languageHint?: string, projectType?: string): string {
    const type = (projectType || '').toLowerCase();

    if (languageHint === 'Go') {
      return `Use standard Go layout:
- cmd/<app>/ (entrypoints)
- internal/ (private packages)
- pkg/ (public packages)
- api/ (OpenAPI/protos)
- configs/ (config files)
- scripts/ (tooling)`;
    }

    if (languageHint === 'PHP') {
      return `Use PSR-4 layout:
- src/ (application code)
- tests/ (tests)
- public/ (entrypoint)
- config/ (configuration)
- routes/ (routing)`;
    }

    if (type.includes('api') || type.includes('backend')) {
      return `Use a service-style layout:
- src/
  - api/ (routes/controllers)
  - services/
  - repositories/
  - models/
  - middleware/
- tests/
- config/`;
    }

    if (type.includes('frontend') || type.includes('web')) {
      return `Use a web-app layout:
- src/
  - components/
  - pages/ (or routes/)
  - hooks/ or utils/
  - styles/
- public/
- tests/`;
    }

    return `Use a standard modular layout:
- src/ (core code)
- tests/ (unit/integration tests)
- config/ (configuration)
- scripts/ (tooling)`;
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

  generateRepairPrompt(rawResponse: string): string {
    return `You are a JSON repair assistant. Fix the following malformed JSON and return ONLY valid JSON with the same schema as the planner output.

Malformed JSON:
${rawResponse}

Return ONLY valid JSON, no markdown or extra text.`;
  }
}
