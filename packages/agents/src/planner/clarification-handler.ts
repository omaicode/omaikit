export class ClarificationHandler {
  private clarificationPrompts = [
    'What is the primary use case or business goal?',
    'Who are the target users?',
    'What are the key success criteria?',
    'Are there any existing systems to integrate with?',
    'What is the expected timeline?',
    'What is the budget or resource constraints?',
    'Are there specific technology requirements?',
    'What about performance or scale requirements?',
    'Is this a greenfield project or enhancement?',
    'What are the security and compliance requirements?',
  ];

  detectAmbiguities(description: string): string[] {
    const ambiguities: string[] = [];

    // Check for vague terms
    const vagueTerms = ['something', 'stuff', 'things', 'app', 'tool', 'system', 'it'];
    const lowerDesc = description.toLowerCase();

    if (description.length < 20) {
      ambiguities.push('Description is very brief - could you provide more details?');
    }

    if (
      !lowerDesc.includes('api') &&
      !lowerDesc.includes('ui') &&
      !lowerDesc.includes('frontend') &&
      !lowerDesc.includes('backend')
    ) {
      ambiguities.push('What is the primary interface/architecture style?');
    }

    if (!lowerDesc.includes('database') && !lowerDesc.includes('storage')) {
      ambiguities.push('What are the data persistence requirements?');
    }

    if (!lowerDesc.match(/\b(days?|weeks?|months?|years?|hours?|quarters?)\b/i)) {
      ambiguities.push('What is the target timeline/deadline?');
    }

    return ambiguities.slice(0, 3); // Return top 3 ambiguities
  }

  generateClarificationQuestions(ambiguities: string[]): string[] {
    if (ambiguities.length === 0) {
      return [];
    }

    return ambiguities.map(
      (_, idx) => this.clarificationPrompts[idx % this.clarificationPrompts.length],
    );
  }

  async askForClarifications(
    description: string,
  ): Promise<{ ambiguities: string[]; questions: string[] }> {
    const ambiguities = this.detectAmbiguities(description);
    const questions = this.generateClarificationQuestions(ambiguities);

    return {
      ambiguities,
      questions,
    };
  }

  mergeClarifications(description: string, clarifications: Record<string, string>): string {
    let enhanced = description;

    for (const [key, value] of Object.entries(clarifications)) {
      if (value && value.trim().length > 0) {
        enhanced += `\n${key}: ${value}`;
      }
    }

    return enhanced;
  }
}
