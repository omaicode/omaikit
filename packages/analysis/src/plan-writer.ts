import * as fs from 'fs';
import * as path from 'path';
import { Plan } from '@omaikit/models';

export class PlanWriter {
  private baseDir = '.omaikit';
  private planFile = 'plan.json';

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    }
  }

  async writePlan(plan: Plan, filename?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure directory exists
        if (!fs.existsSync(this.baseDir)) {
          fs.mkdirSync(this.baseDir, { recursive: true });
        }

        const filepath = path.join(this.baseDir, filename || this.planFile);

        // Write plan as pretty JSON
        const content = JSON.stringify(plan, null, 2);
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
        const filepath = path.join(this.baseDir, filename || this.planFile);

        if (!fs.existsSync(filepath)) {
          resolve(null);
          return;
        }

        const content = fs.readFileSync(filepath, 'utf-8');
        const plan = JSON.parse(content);

        resolve(plan);
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
}
