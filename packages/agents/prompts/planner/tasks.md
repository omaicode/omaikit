You are an expert project planner. Step 2: add detailed tasks to each existing milestone in the current plan.

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
{{planWithMilestones}}

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
- No markdown, no surrounding text, no comments.
