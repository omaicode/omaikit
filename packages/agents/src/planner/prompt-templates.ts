export class PromptTemplates {
  generatePlanMilestonesPrompt(
    description: string,
    projectType?: string,
    techStack?: string[],
  ): string {
    const techStackStr =
      techStack && techStack.length > 0 ? `Technology Stack: ${techStack.join(', ')}` : '';

    const projectTypeStr = projectType ? `Project Type: ${projectType}` : '';
    const languageHint = this.getLanguageHint(projectType, techStack);

    return `You are an expert project planner. Your job has TWO clear phases:

PHASE 1 – Discover and initialize:
1. Use list_files to inspect the filesystem (start from the project root in context).
2. Use list_files specifically on ".omaikit/plans" to determine existing plan files.
3. Determine N:
   - If no plan files exist in ".omaikit/plans", then N = 0.
   - Otherwise, N = max(existing plan indices) + 1.
4. Construct the initial JSON object in memory with:
   - "id": "P-{N}"
   - A brief "title"
   - A full "description"
   - "clarifications": []
   - "milestones": an array of 2–5 milestones, each with empty "tasks" arrays.
5. Use edit_file to CREATE the file ".omaikit/plans/P-{N}.json" with this initial JSON content.

PHASE 2 – Verify and update:
1. Use read_file on ".omaikit/plans/P-{N}.json" to confirm its current structure and content.
2. If needed, use search_text ONLY to understand related project context from other files (but do NOT modify them).
3. Based on:
   - Feature Description
   - Project type
   - Tech stack
   - Project Structure Guidance
   refine and UPDATE ONLY ".omaikit/plans/P-{N}.json" via edit_file:
   - Keep the same "id" ("P-{N}").
   - Ensure milestones fully cover design, implementation, testing, and documentation.
   - Ensure all "tasks" arrays remain empty in this step.

Tool usage requirements (strict):
- Use list_files to list files or find files by glob pattern (starting from the project root from context).
- Use search_text to search content within files when context is needed.
- Use read_file to inspect exact file contents and confirm existing structure before editing.
- Use edit_file ONLY to add or update ".omaikit/plans/P-{N}.json". Do NOT edit any other files.
- Do NOT propose or finalize the plan without first using the tools as described in PHASE 1 and PHASE 2.
- All writes must go through edit_file and target ONLY ".omaikit/plans/P-{N}.json".

Feature Description:
${description}

${projectTypeStr}
${techStackStr}
${languageHint ? `Programming Language: ${languageHint}` : ''}

JSON output requirements:
- You must STORE the final JSON to ".omaikit/plans/P-{N}.json" via edit_file.
- The JSON must follow this structure exactly (only "id" changes to "P-{N}"):

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
      "tasks": []
    }
  ]
}

Additional constraints:
1. Create 2–5 milestones.
2. Effort estimates must be in days (1–30) for "duration".
3. Ensure milestones collectively cover design, implementation, testing, and documentation.
4. Do NOT include any tasks (all "tasks" arrays must be empty).

Final response format:
- Return ONLY the final JSON object (the same content stored in ".omaikit/plans/P-{N}.json").
- No markdown, no surrounding text, no comments.
`;
  }

  generateTasksPrompt(planWithMilestones: string): string {
    return `You are an expert project planner. Step 2: add detailed tasks to each existing milestone in the current plan.

Execution phases (strict):

PHASE 1 – Discover and load the current plan:
1. Use list_files to inspect the filesystem (starting from the project root in context).
2. Use list_files on ".omaikit/plans" to identify existing plan files and determine N (same N used in Step 1 when the milestones-only plan was created).
3. Use read_file on ".omaikit/plans/P-{N}.json" to:
   - Confirm the current JSON structure.
   - Load the existing milestones (which currently have empty tasks arrays).
4. Optionally use search_text ONLY to gather additional technical or structural context from other project files, but do NOT modify those files.

PHASE 2 – Update tasks for each milestone:
1. Design tasks so that:
   - Each milestone receives 3–8 tasks.
   - Tasks collectively cover design, implementation, testing, and documentation for that milestone.
   - Estimated effort is in hours (1–40).
   - Dependencies form an acyclic DAG (no circular references).
   - targetModule and affectedModules always reference real or plausible project paths (files/folders) based on the project structure.
2. Add tasks under each milestone in the in-memory JSON object, following the exact task schema specified below.
3. Use edit_file ONLY to update ".omaikit/plans/P-{N}.json" with the enriched JSON (same plan, now with tasks filled in).
4. Do NOT create or edit any other files.

Tool usage requirements (mandatory):
- Use list_files to list files or find files by glob pattern (start from the project root from context).
- Use search_text to search content within files when you need project/domain context.
- Use read_file to inspect exact file contents and confirm the current structure of ".omaikit/plans/P-{N}.json" BEFORE editing.
- Use edit_file ONLY to add/update ".omaikit/plans/P-{N}.json". Do NOT edit any other files.
- Do NOT propose or finalize tasks without first using the tools as described in PHASE 1 and PHASE 2.
- All writes must go through edit_file and target ONLY ".omaikit/plans/P-{N}.json".


Here is the current plan (milestones only, before adding tasks):
${planWithMilestones}

Update the plan by adding tasks under each milestone using this schema:
{
  "milestones": [
    {
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
1. Each milestone must have 3–8 tasks.
2. Effort estimates must be in hours (1–40) for "estimatedEffort".
3. Include realistic dependencies between tasks:
   - Use inputDependencies and outputDependencies to model a Directed Acyclic Graph (no cycles).
   - Earlier design and specification tasks should feed implementation tasks, which then feed testing and documentation tasks.
4. Across all tasks, ensure coverage of:
   - Design
   - Implementation
   - Testing
   - Documentation
5. Each task must reference intended files/folders via:
   - targetModule: primary file/folder path this task focuses on.
   - affectedModules: list of other impacted files/folders.
6. Ensure the overall dependency graph is acyclic (no task directly or indirectly depends on itself).


Final response format:
- Return ONLY the full updated JSON of ".omaikit/plans/P-{N}.json" (original content plus tasks).
- No markdown, no surrounding text, no comments.`;
  }

  generateOptimizePrompt(fullPlan: string): string {
    return `You are an expert project planner. Step 3: re-analyze and optimize the entire plan.

Execution phases (strict):

PHASE 1 – Discover and load the current plan:
1. Use list_files to inspect the filesystem (starting from the project root in context).
2. Use list_files on ".omaikit/plans" to identify existing plan files and determine N (the same N used in previous steps).
3. Use read_file on ".omaikit/plans/P-{N}.json" to:
   - Confirm the exact current JSON structure.
   - Load all milestones and tasks for analysis.
4. Optionally use search_text ONLY to gather additional technical or structural context from other project files, but do NOT modify those files.

PHASE 2 – Analyze and optimize:
1. Analyze the loaded plan to identify:
   - Redundant or overlapping tasks.
   - Overly complex or unnecessary dependencies.
   - Vague or ambiguous titles and descriptions.
   - Inconsistent or incorrect targetModule / affectedModules paths.
   - Imbalanced milestones (too heavy or too light vs. others).
2. Optimize the plan by updating the in-memory JSON object:
   - Remove or merge redundant tasks where appropriate.
   - Simplify and correct dependencies so they are:
     - Minimal (no unnecessary links).
     - Correct (match the logical execution order).
     - Acyclic (no circular dependencies).
   - Improve task titles and descriptions for clarity and actionability.
   - Adjust targetModule and affectedModules so they align with the actual or intended project structure.
   - Re-balance milestones so that scope and effort are realistic and consistent across the plan.

PHASE 3 – Persist the optimized plan:
1. After optimization, use edit_file ONLY to update ".omaikit/plans/P-{N}.json" with the optimized JSON.
2. Do NOT create, delete, or modify any other files.

Tool usage requirements (mandatory):
- Use list_files to list files or find files by glob pattern (start from the project root from context).
- Use search_text to search content within files when project context is needed.
- Use read_file to inspect exact file contents and confirm the current structure of ".omaikit/plans/P-{N}.json" BEFORE optimizing.
- Use edit_file ONLY to add/update ".omaikit/plans/P-{N}.json". Do NOT edit any other files.
- Do NOT optimize or rewrite the plan without first using the tools as described in PHASE 1–3.
- All writes must go through edit_file and target ONLY ".omaikit/plans/P-{N}.json".


Here is the current plan (before optimization):
${fullPlan}


Optimize the plan by:
1. Removing redundant or overlapping tasks while preserving required coverage and dependencies.
2. Ensuring dependencies are minimal, correct, and form a Directed Acyclic Graph (no cycles).
3. Improving task titles and descriptions for clarity, using concise, action-oriented language.
4. Verifying that targetModule and affectedModules align with the project’s actual or intended file/folder structure.
5. Balancing milestones so their scope, effort, and risk are realistic and coherent across the entire project.


Final response format:
- Return ONLY the full optimized JSON of ".omaikit/plans/P-{N}.json".
- No markdown, no surrounding text, no comments.`;
  }

  generateSummaryPrompt(): string {
    return `You are an expert project planner. Step 4: read the latest plan file and summarize it.

Tool usage requirements (mandatory):
- Use list_files on .omaikit/plans to find the latest P-{N}.json.
- Use read_file to read that plan file.
- Use edit_file ONLY if you must fix formatting in .omaikit/plans/P-{N}.json before summarizing.
- If no plan file exists, state that clearly and stop.

Return JSON:
{
  "planFile": "plans/P-<N>.json",
  "summary": [
    "Short overview of plan scope",
    "Number of milestones and tasks",
    "Key dependencies or critical path",
    "Notable risks"
  ]
}

Return ONLY valid JSON, no markdown or extra text.`;
  }

  private getLanguageHint(projectType?: string, techStack?: string[]): string | undefined {
    const entries = [projectType, ...(techStack ?? [])].filter((value): value is string =>
      Boolean(value),
    );
    const haystack = entries.join(' ').toLowerCase();

    if (haystack.includes('golang') || haystack.includes(' go ')) return 'Go';
    if (haystack.includes('typescript') || haystack.includes('ts')) return 'TypeScript';
    if (haystack.includes('javascript') || haystack.includes('node') || haystack.includes('react'))
      return 'JavaScript';
    if (haystack.includes('python')) return 'Python';
    if (haystack.includes('rust')) return 'Rust';
    if (haystack.includes('c#') || haystack.includes('csharp') || haystack.includes('.net'))
      return 'C#';
    if (haystack.includes('php') || haystack.includes('laravel')) return 'PHP';

    return undefined;
  }

  generateClarificationPrompt(description: string, ambiguities: string[]): string {
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
