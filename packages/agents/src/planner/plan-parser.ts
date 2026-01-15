import { Plan } from '@omaikit/models';

export class PlanParser {
  parse(response: string): Plan {
    try {
      // Try to extract JSON from the response
      const jsonStr = this.extractJson(response);
        
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
      clarifications: Array.isArray(raw.clarifications)
        ? raw.clarifications.filter((c: any) => typeof c === 'string')
        : Array.isArray(raw.clarifyingQuestions)
          ? raw.clarifyingQuestions.filter((c: any) => typeof c === 'string')
          : [],
      milestones: raw.milestones.map((m: any, idx: number) => ({
        id: m.id || `M${idx + 1}`,
        title: m.title || `Milestone ${idx + 1}`,
        description: m.description || '',
        duration: this.parseDuration(m.duration),
        successCriteria: Array.isArray(m.successCriteria)
          ? m.successCriteria.filter((c: any) => typeof c === 'string')
          : [],
        tasks: (m.tasks || []).map((t: any, tidx: number) => ({
          id: t.id || `T${idx + 1}-${tidx + 1}`,
          title: t.title || `Task ${tidx + 1}`,
          description: t.description || '',
          type: this.parseType(t.type, t.title),
          estimatedEffort: this.parseEffort(t.estimatedEffort ?? t.effort),
          acceptanceCriteria: Array.isArray(t.acceptanceCriteria)
            ? t.acceptanceCriteria.filter((c: any) => typeof c === 'string')
            : [],
          inputDependencies: Array.isArray(t.inputDependencies)
            ? t.inputDependencies.filter((d: any) => typeof d === 'string')
            : Array.isArray(t.dependencies)
              ? t.dependencies.filter((d: any) => typeof d === 'string')
              : [],
          outputDependencies: Array.isArray(t.outputDependencies)
            ? t.outputDependencies.filter((d: any) => typeof d === 'string')
            : [],
          targetModule: typeof t.targetModule === 'string' ? t.targetModule : undefined,
          affectedModules: Array.isArray(t.affectedModules)
            ? t.affectedModules.filter((m: any) => typeof m === 'string')
            : Array.isArray(t.tags)
              ? t.tags.filter((m: any) => typeof m === 'string')
              : [],
          suggestedApproach: typeof t.suggestedApproach === 'string' ? t.suggestedApproach : undefined,
          technicalNotes: typeof t.technicalNotes === 'string' ? t.technicalNotes : undefined,
          riskFactors: Array.isArray(t.riskFactors) ? t.riskFactors : undefined,
          status: this.parseStatus(t.status),
          blockers: Array.isArray(t.blockers)
            ? t.blockers.filter((b: any) => typeof b === 'string')
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
  ): 'planned' | 'in-progress' | 'completed' | 'blocked' | 'deferred' {
    const validStatuses = ['planned', 'in-progress', 'completed', 'blocked', 'deferred'];
    const s = String(status).toLowerCase().replace(/_/g, '-');

    if (validStatuses.includes(s)) {
      return s as 'planned' | 'in-progress' | 'completed' | 'blocked' | 'deferred';
    }

    return 'planned';
  }

  private parseType(type: any, title?: string): 'feature' | 'refactor' | 'bugfix' | 'test' | 'documentation' | 'infrastructure' {
    const validTypes = ['feature', 'refactor', 'bugfix', 'test', 'documentation', 'infrastructure'];
    const normalized = String(type || '').toLowerCase();
    if (validTypes.includes(normalized)) {
      return normalized as any;
    }

    const titleLower = String(title || '').toLowerCase();
    if (titleLower.includes('test')) return 'test';
    if (titleLower.includes('doc')) return 'documentation';
    if (titleLower.includes('refactor')) return 'refactor';
    if (titleLower.includes('bug') || titleLower.includes('fix')) return 'bugfix';
    if (titleLower.includes('setup') || titleLower.includes('configure')) return 'infrastructure';
    return 'feature';
  }

  private extractJson(response: string): string {
    let jsonStr = response.trim();

    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    }

    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    return jsonStr;
  }
}
