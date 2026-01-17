import { Plan, Task } from '@omaikit/models';
import * as fs from 'fs';
import * as path from 'path';

export { PlanWriter } from './plan-writer';
export { TestWriter } from './test-writer';
export { ContextWriter } from './context-writer';
export { CacheManager } from './cache-manager';
export { parseJsonFromText } from './json';
export { readPrompt, readPromptList } from './prompt';

export function getTasks(plan: Plan, taskId?: string): Task[] {
  const tasksDir = path.join('.omaikit', 'tasks');
  const taskFiles = fs.existsSync(tasksDir)
    ? fs.readdirSync(tasksDir).filter((file) => file.endsWith('.json'))
    : [];

  const allTasks: Task[] = [];
  for (const file of taskFiles) {
    const filePath = path.join(tasksDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as Task & {
        plan_id?: string;
        milestone_id?: string;
      };

      if (!parsed || typeof parsed !== 'object') continue;
      if (!parsed.id || !parsed.plan_id || !parsed.milestone_id) continue;
      allTasks.push(parsed as Task);
    } catch {
      // skip invalid JSON
    }
  }

  const planId = plan.id;
  const tasks = plan.milestones
    .flatMap((milestone: { id: string | undefined }) =>
      allTasks.filter((task) => task.plan_id === planId && task.milestone_id === milestone.id),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  if (taskId) {
    const match = tasks.find(
      (t: { id: string; title: string }) => t.id === taskId || t.title === taskId,
    );
    return match ? [match] : [];
  }

  return tasks;
}
