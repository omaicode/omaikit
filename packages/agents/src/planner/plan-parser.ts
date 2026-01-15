import { Plan } from '@omaikit/models';

export class PlanParser {
  parse(response: string): Plan {
    try {
      // Try to extract JSON from the response
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      }

      // Parse JSON
      const parsed = JSON.parse(jsonStr);

      // Normalize the structure
      return this.normalize(parsed);
    } catch (error) {
      throw new Error(`Failed to parse plan response: ${(error as Error).message}`);
    }
  }

  private normalize(raw: any): Plan {
    if (!raw.title) {
      throw new Error('Plan missing required field: title');
    }

    if (!raw.description) {
      throw new Error('Plan missing required field: description');
    }

    if (!Array.isArray(raw.milestones) || raw.milestones.length === 0) {
      throw new Error('Plan must have at least one milestone');
    }

    return {
      id: raw.id || 'P-' + Date.now(),
      title: String(raw.title).trim(),
      description: String(raw.description).trim(),
      milestones: raw.milestones.map((m: any, idx: number) => ({
        title: m.title || `Milestone ${idx + 1}`,
        duration: this.parseDuration(m.duration),
        tasks: (m.tasks || []).map((t: any, tidx: number) => ({
          id: t.id || `T${idx}${tidx}`,
          title: t.title || `Task ${tidx + 1}`,
          description: t.description || '',
          effort: this.parseEffort(t.effort),
          status: this.parseStatus(t.status),
          dependencies: Array.isArray(t.dependencies)
            ? t.dependencies.filter((d: any) => typeof d === 'string')
            : undefined,
          tags: Array.isArray(t.tags)
            ? t.tags.filter((tag: any) => typeof tag === 'string')
            : undefined,
        })),
      })),
    };
  }

  private parseEffort(effort: any): number {
    const num = Number(effort);
    if (isNaN(num) || num <= 0) {
      return 4; // Default to 4 hours
    }
    if (num > 40) {
      return 40; // Cap at 40 hours
    }
    return Math.round(num);
  }

  private parseDuration(duration: any): number {
    const num = Number(duration);
    if (isNaN(num) || num <= 0) {
      return 5; // Default to 5 days
    }
    if (num > 90) {
      return 90; // Cap at 90 days
    }
    return Math.round(num);
  }

  private parseStatus(
    status: any
  ): 'pending' | 'in_progress' | 'completed' | 'blocked' {
    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
    const s = String(status).toLowerCase().replace(/ /g, '_');

    if (validStatuses.includes(s)) {
      return s as 'pending' | 'in_progress' | 'completed' | 'blocked';
    }

    return 'pending';
  }
}
