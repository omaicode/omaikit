# Data Model: Omaikit Core Entities

**Date**: January 14, 2026  
**Phase**: 1 - Design  
**Status**: Schema definition for agents and CLI

## Core Entities

### 1. Project Analysis

**Purpose**: Represents analyzed codebase structure and patterns

```typescript
interface Project {
  name: string;
  rootPath: string;
  description?: string;
  analyzedAt: ISO8601DateTime;
  modules: Module[];
  dependencies: DependencyGraph;
  codePatterns: CodePatterns;
  metadata: {
    totalLOC: number;
    fileCount: number;
    languages: string[];
    conventions: NamingConventions;
  };
}

interface Module {
  name: string;
  path: string;
  type: 'core' | 'feature' | 'library' | 'test' | 'config';
  description?: string;
  exports: ExportedAPI[];
  dependencies: ModuleDependency[];
  estimatedLOC: number;
  riskLevel: 'low' | 'medium' | 'high'; // Impacts implementation order
}

interface ExportedAPI {
  name: string;
  type: 'function' | 'class' | 'interface' | 'constant' | 'type';
  signature?: string;
  description?: string;
}

interface DependencyGraph {
  nodes: Module[];
  edges: Array<{ from: string; to: string; type: 'import' | 'extends' | 'implements' }>;
  cycles: Array<string[]>; // Circular dependencies
}

interface CodePatterns {
  namingConventions: {
    variables: RegExp;
    functions: RegExp;
    classes: RegExp;
    constants: RegExp;
    files: RegExp;
  };
  errorHandling: {
    pattern: 'try-catch' | 'promise-rejection' | 'error-first-callback' | 'result-type';
    examples: string[];
  };
  structuralPattern: {
    modulesPerFeature: number; // Average
    averageModuleSize: 'small' | 'medium' | 'large';
    organizationStyle: 'by-feature' | 'by-layer' | 'by-type';
  };
  comments: {
    docstringFormat: 'jsdoc' | 'tsdoc' | 'docstring' | 'none';
    commentCoverage: number; // 0-100
  };
  testOrganization: {
    colocated: boolean; // Tests in same directory as code?
    pattern: '__tests__' | '*.test.ts' | '*.spec.ts' | 'test/' | 'tests/';
  };
}

interface NamingConventions {
  casing: 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case';
  variablePrefix?: string; // e.g., "_" for private
  constantSuffix?: string;
  booleanPrefix?: string; // e.g., "is", "has", "should"
}
```

**Validation Rules**:

- `name` must be non-empty
- `rootPath` must exist and be readable
- `modules` must be non-empty for analyzed projects
- No circular dependencies in final code (cycles detected but must be resolved)
- All modules referenced in dependencies must exist in modules array

---

### 2. Agile Plan

**Purpose**: Structured development plan with tasks, sprints, and dependency information

```typescript
interface Plan {
  id: string; // UUID
  projectId?: string; // Reference to analyzed Project
  featureDescription: string; // Original user input
  createdAt: ISO8601DateTime;

  // Planning outcome
  overview: {
    summary: string;
    estimatedTotalEffort: number; // hours
    riskLevel: 'low' | 'medium' | 'high';
    clarifyingQuestions?: string[];
    assumptions: string[];
  };

  milestones: Milestone[];
  sprints: Sprint[];
  tasks: Task[];

  // Optional: Advanced planning
  parallelizationOpportunities?: string[];
  reuseOpportunities?: string[];
  architecturalConsiderations?: string[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate?: ISODate; // For estimation
  targetTaskIds: string[];
  successCriteria: string[];
}

interface Sprint {
  id: string;
  number: number;
  duration: '1-week' | '2-week';
  taskIds: string[];
  estimatedVelocity: number; // hours
  focusArea: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'refactor' | 'bugfix' | 'test' | 'documentation' | 'infrastructure';

  // Effort estimation
  estimatedEffort: number; // hours
  effortBreakdown?: {
    analysis: number;
    implementation: number;
    testing: number;
    documentation: number;
  };

  // Requirements
  acceptanceCriteria: string[];
  inputDependencies: string[]; // Task IDs that must complete first
  outputDependencies: string[]; // Task IDs that depend on this

  // Targeting
  targetModule?: string; // Module path this task primarily affects
  affectedModules: string[]; // All modules impacted

  // Implementation guidance
  suggestedApproach?: string;
  technicalNotes?: string;
  riskFactors?: RiskFactor[];

  // Status (updated during execution)
  status: 'planned' | 'in-progress' | 'blocked' | 'completed' | 'deferred';
  blockers?: string[];
}

interface RiskFactor {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}
```

**Validation Rules**:

- Plan ID must be UUID v4
- Feature description must be non-empty and > 10 characters
- Total effort across all tasks must equal sprint velocity × number of sprints ± 10%
- No circular dependencies in task DAG
- All referenced task IDs in dependencies must exist
- At least one milestone
- At least one sprint
- At least one task per sprint
- Acceptance criteria must be testable and SMART (Specific, Measurable, Achievable, Relevant, Time-bound)

---

### 3. Code Generation

**Purpose**: Represents code generation request and response between agents

```typescript
interface CodeGenerationRequest {
  taskId: string; // From plan
  language: string; // "typescript", "python", "rust", etc.
  targetModule: string; // Module path where code goes

  context: {
    project: Project; // Full project analysis
    plan: Plan; // Full plan for context
    task: Task; // Specific task being implemented
    existingCode?: Module[]; // Existing modules for reference
    styleguide?: string; // Code style guidelines extracted from project
    examples?: CodeExample[]; // Similar code patterns to follow
  };

  constraints: {
    maxLines?: number;
    mustFollowPattern?: string;
    forbiddenPatterns?: string[];
    performanceTarget?: string;
    externalDependencies?: DependencyConstraint[];
  };
}

interface CodeGenerationResponse {
  taskId: string;
  language: string;
  timestamp: ISO8601DateTime;

  generatedFiles: GeneratedFile[];
  summary: {
    totalLOC: number;
    filesCreated: number;
    filesModified: number;
    newDependencies: string[];
  };

  quality: {
    syntaxValid: boolean;
    estimatedCoverage: number; // % of code testable
    lintingIssues: LintIssue[];
    suggestedImprovements: string[];
  };

  metadata: {
    generationDurationMs: number;
    tokenUsed?: number;
    model?: string;
    temperature?: number;
    confidence: number; // 0-1: how confident is this output?
  };
}

interface GeneratedFile {
  path: string; // Relative to project root or module
  content: string;
  language: string;
  purpose: 'implementation' | 'export' | 'helper' | 'type-definition';
  dependencies: {
    internal: string[]; // Imports from this project
    external: string[]; // npm/pip/cargo packages
  };
}

interface CodeExample {
  name: string;
  language: string;
  code: string;
  description: string;
}

interface DependencyConstraint {
  name: string;
  allowedVersions?: string; // Semver range
  optional: boolean;
  reason: string;
}

interface LintIssue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  suggestion?: string;
}
```

**Validation Rules**:

- Language must be from supported list
- Task ID must exist in referenced plan
- Generated files must have non-empty content
- No absolute paths in file paths
- Dependencies must reference valid packages (or internal modules)
- Syntax validity must be true for submitted code
- Confidence must be 0.0-1.0

---

### 4. Test Suite

**Purpose**: Generated unit and integration tests with coverage information

```typescript
interface TestSuite {
  taskId: string;
  language: string;
  testFramework: string; // "vitest", "jest", "pytest", etc.
  timestamp: ISO8601DateTime;

  testFiles: TestFile[];

  coverage: {
    overall: number; // 0-100
    byType: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
    byModule?: Record<string, number>; // Coverage per module
  };

  summary: {
    totalTests: number;
    passingTests: number;
    failingTests: number;
    skippedTests: number;
    estimatedDurationMs?: number;
  };

  metadata: {
    generationDurationMs: number;
    tokenUsed?: number;
    requiredSetup?: string[]; // Special test environment setup
    knownLimitations?: string[];
  };
}

interface TestFile {
  path: string;
  content: string;

  testCount: number;
  testNames: string[];

  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };

  categories: {
    unitTests: number;
    integrationTests: number;
    edgeCaseTests: number;
    errorPathTests: number;
  };
}
```

**Validation Rules**:

- Coverage percentages must be 0-100
- Total tests must equal sum of test types
- Passing tests + failing tests + skipped tests ≥ total tests
- All test files must have valid test framework syntax
- At least 80% coverage target for core functionality
- All error paths must be tested

---

### 5. Code Review

**Purpose**: Detailed code review findings across multiple dimensions

```typescript
interface CodeReview {
  taskId: string;
  timestamp: ISO8601DateTime;
  reviewer: string; // Agent name, e.g., "Reviewer-Agent-v1"

  findings: Finding[];
  summary: ReviewSummary;

  categories: {
    architecture: Finding[];
    performance: Finding[];
    security: Finding[];
    maintainability: Finding[];
    testing: Finding[];
    documentation: Finding[];
  };

  overallAssessment: {
    readiness: 'approved' | 'needs-revision' | 'requires-discussion';
    confidence: number; // 0-1
    estimatedFixTime?: number; // hours to address findings
  };

  metadata: {
    reviewDurationMs: number;
    tokenUsed?: number;
    model?: string;
    filesReviewed: number;
  };
}

interface Finding {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  category:
    | 'architecture'
    | 'performance'
    | 'security'
    | 'maintainability'
    | 'testing'
    | 'documentation';

  code: string; // Error code, e.g., "ARCH-001"
  title: string;
  description: string;

  location: {
    file: string;
    line?: number;
    column?: number;
    snippet?: string;
  };

  recommendation: string;
  exampleImprovement?: string;
  references?: string[]; // Links to docs, best practices

  // Impact assessment
  impact: {
    likelihood: 'low' | 'medium' | 'high'; // How likely is this to cause issues?
    scope: 'local' | 'module' | 'system'; // How much code does it affect?
  };
}

interface ReviewSummary {
  totalFindings: number;
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;
  suggestions: number;

  strengths: string[];
  concerns: string[];
  recommendations: string[];
}
```

**Validation Rules**:

- Finding IDs must be unique within review
- Severity and impact must be valid enum values
- At least one finding or explicit "no issues found" marker
- Recommendations must be actionable
- Critical/major findings must have clear examples or references

---

## Relationships & Constraints

### Data Flow

```
Project Analysis
    ↓
Plan (uses Project as context)
    ↓
Code Generation (uses Plan + Project; produces code)
    ↓
Test Suite (uses generated code; validates coverage)
    ↓
Code Review (uses code + tests; identifies improvements)
```

### Dependency Management

- **Plan** depends on **Project** (if analyzing existing codebase)
- **Code** depends on **Plan** (each task generates code)
- **Tests** depend on **Code** (generates tests for generated code)
- **Review** depends on **Code** + **Tests** (reviews both)

### Validation Gates

1. **After Analysis**: Project must have all modules with non-circular dependencies
2. **After Planning**: Plan must have complete task DAG with no cycles
3. **After Code Generation**: Generated code must have no syntax errors
4. **After Testing**: Tests must achieve ≥80% coverage and all pass
5. **After Review**: Review must identify actionable findings (or explicitly approve)

---

## Schema Versioning

All entities include an optional `schemaVersion` field for backward compatibility:

```typescript
interface Entity {
  schemaVersion: '1.0' | '1.1' | '2.0'; // Major.Minor
  // ... rest of fields
}
```

Current version: **1.0**
