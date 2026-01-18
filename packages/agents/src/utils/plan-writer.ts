import * as fs from 'fs';
import * as path from 'path';
import { Plan } from '@omaikit/models';

export class PlanWriter {
  private baseDir = '.omaikit';
  private planFile = 'plan.json';
  private tasksDir = path.join('.omaikit', 'tasks');

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
      this.tasksDir = path.join(baseDir, 'tasks');
    }
  }

  async writePlan(plan: Plan, filename?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure directory exists
        if (!fs.existsSync(this.baseDir)) {
          fs.mkdirSync(this.baseDir, { recursive: true });
        }

        if (!fs.existsSync(this.tasksDir)) {
          fs.mkdirSync(this.tasksDir, { recursive: true });
        }

        const target = filename || this.planFile;
        const filepath = path.isAbsolute(target) ? target : path.join(this.baseDir, target);

        const dirPath = path.dirname(filepath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        // Persist tasks as separate files
        if (Array.isArray(plan.milestones)) {
          for (const milestone of plan.milestones) {
            if (!Array.isArray(milestone.tasks)) continue;
            for (const task of milestone.tasks) {
              const taskFilename = this.buildTaskFilename(plan.id, milestone.id, task.id);
              const taskPath = path.join(this.tasksDir, taskFilename);
              const payload = { planId: plan.id, milestoneId: milestone.id, ...task };
              fs.writeFileSync(taskPath, JSON.stringify(payload, null, 2), 'utf-8');
            }
          }
        }

        // Write plan as pretty JSON without embedded tasks
        const strippedPlan = {
          ...plan,
          milestones: Array.isArray(plan.milestones)
            ? plan.milestones.map((m) => {
                const { tasks, ...rest } = m as any;
                return rest;
              })
            : [],
        };

        const content = JSON.stringify(strippedPlan, null, 2);
        fs.writeFileSync(filepath, content, 'utf-8');

        resolve(filepath);
      } catch (error) {
        reject(error);
      }
    });
  }

  async readPlan(filename?: string): Promise<Plan | null> {
    return new Promise((resolve) => {
      try {
        const target = filename || this.planFile;
        const filepath = path.isAbsolute(target) ? target : path.join(this.baseDir, target);

        if (!fs.existsSync(filepath)) {
          resolve(null);
          return;
        }

        const content = fs.readFileSync(filepath, 'utf-8');
        const plan = JSON.parse(content) as Plan;
        const hydrated = this.hydrateTasks(plan);

        resolve(hydrated);
      } catch (error) {
        resolve(null);
      }
    });
  }

  async listPlans(): Promise<string[]> {
    return new Promise((resolve) => {
      try {
        if (!fs.existsSync(this.baseDir)) {
          resolve([]);
          return;
        }

        const files = fs
          .readdirSync(this.baseDir)
          .filter((f) => f.endsWith('.json') && f.includes('plan'));

        resolve(files);
      } catch (error) {
        resolve([]);
      }
    });
  }

  async deletePlan(filename?: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const filepath = path.join(this.baseDir, filename || this.planFile);

        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        resolve(false);
      }
    });
  }

  private hydrateTasks(plan: Plan): Plan {
    if (!plan || !plan.id || !Array.isArray(plan.milestones)) {
      return plan;
    }

    const tasks = this.readTasksForPlan(plan.id);
    const byMilestone = new Map<string, any[]>();
    for (const task of tasks) {
      const milestoneId = (task as any).milestoneId;
      if (!milestoneId) continue;
      if (!byMilestone.has(milestoneId)) byMilestone.set(milestoneId, []);
      const { milestoneId: _omit, planId: _omitPlan, ...taskData } = task as any;
      byMilestone.get(milestoneId)?.push(taskData);
    }

    return {
      ...plan,
      milestones: plan.milestones.map((milestone) => ({
        ...milestone,
        tasks: byMilestone.get(milestone.id) ?? [],
      })),
    };
  }

  private readTasksForPlan(planId: string): Array<Record<string, unknown>> {
    if (!fs.existsSync(this.tasksDir)) {
      return [];
    }

    const files = fs.readdirSync(this.tasksDir);
    const tasks: Array<Record<string, unknown>> = [];
    for (const file of files) {
      const parsed = this.parseTaskFilename(file);
      if (!parsed || parsed.planId !== planId) continue;
      const filePath = path.join(this.tasksDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        tasks.push(data as Record<string, unknown>);
      } catch {
        // skip
      }
    }

    return tasks;
  }

  private buildTaskFilename(planId: string, milestoneId: string, taskId: string): string {
    const safePlan = this.safeSegment(planId);
    const safeMilestone = this.safeSegment(milestoneId);
    const safeTask = this.safeSegment(taskId);
    return `T-${safePlan}-${safeMilestone}-${safeTask}.json`;
  }

  private parseTaskFilename(filename: string): { planId: string; milestoneId: string; taskId: string } | null {
    const match = /^T-(P\d+)-(M\d+)-(.+)\.json$/i.exec(filename);
    if (!match) return null;
    return { planId: match[1], milestoneId: match[2], taskId: match[3] };
  }

  private safeSegment(value: string): string {
    return value.replace(/[\\/]/g, '_');
  }
}
