export class FrameworkDetector {
  detect(language: string, projectContext?: any): string {
    const normalized = language.toLowerCase();
    const hint = projectContext?.testing?.framework || projectContext?.analysis?.testingFramework;
    if (typeof hint === 'string') {
      return hint;
    }

    switch (normalized) {
      case 'python':
        return 'pytest';
      case 'go':
        return 'go test';
      case 'rust':
        return 'cargo test';
      case 'csharp':
      case 'c#':
        return 'dotnet test';
      case 'javascript':
        return 'jest';
      case 'typescript':
      default:
        return 'vitest';
    }
  }
}
