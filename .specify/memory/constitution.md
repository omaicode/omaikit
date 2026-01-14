# OmaiKit Constitution

## Core Principles

### I. Code Quality Discipline (NON-NEGOTIABLE)
Every line of code MUST meet quality standards before merge. Code MUST be:
- Readable and self-documenting with clear variable/function names (no single-letter variables except loop counters)
- Free of duplicate logic (DRY principle enforced)
- Properly typed (use static typing where language supports; type hints in Python required)
- Following established linting rules without exception
- Reviewed and approved by at least one other developer before merging

All violations require explicit architectural justification and code review sign-off.

### II. Test-First Development (NON-NEGOTIABLE)
Test-Driven Development (TDD) is mandatory for all features. The workflow is:
1. Write failing tests based on acceptance criteria
2. Get test approval from reviewer
3. Implement feature to make tests pass
4. Pass code review and all automated checks
5. Red-Green-Refactor cycle strictly enforced

Coverage requirements:
- Unit tests: MUST cover all public APIs and critical paths (target ≥80%)
- Integration tests: REQUIRED for inter-service communication and contract changes
- Edge cases: Each test MUST include at least one boundary condition or error scenario

### III. User Experience Consistency
User-facing interfaces MUST be consistent, predictable, and intuitive:
- All user interactions follow established patterns; deviations require justification
- Error messages MUST be user-friendly, actionable, and consistent in tone/format
- Text I/O ensures debuggability: human-readable + structured (JSON) output formats required
- API contracts MUST be explicitly documented before implementation
- All changes to user-facing behavior require explicit approval before development begins

Consistency applies across: CLI arguments, API responses, error handling, validation messages, and UI components.

### IV. Performance Requirements by Design
Performance is a non-functional requirement, not an afterthought:
- All features MUST establish performance targets before implementation (latency, throughput, memory, startup time)
- Target performance goals MUST be documented in the feature specification
- Benchmarks MUST be measurable and reproducible (e.g., "process 10k items in <2s")
- Load testing is required for features handling user requests or data processing
- Performance regressions MUST be caught by automated tests; monitoring alerts required for production

Optimization decisions MUST be justified when trading code simplicity for performance.

## Development Standards

### Code Review & Quality Gates

All code changes MUST pass:
- Automated linting and formatting checks (no manual override)
- Complete test suite with all tests passing
- At least one human reviewer approval (code quality focus)
- Constitution compliance verification (per principles above)

Pull requests violating these gates MUST NOT be merged.

### Testing Standards

Each test MUST be:
- **Isolated**: No dependencies on external state; clean setup/teardown required
- **Deterministic**: Same input always produces same result; no flaky tests allowed
- **Fast**: Unit tests <100ms each; integration tests grouped and run separately
- **Readable**: Test names describe what is being tested and expected outcome (Given-When-Then format)

Testing framework and conventions determined per technology stack in individual feature plans.

## Governance

### Constitution Authority
This Constitution supersedes all other practices and informal agreements. All architectural decisions, coding standards, and development workflows MUST comply with these principles.

### Amendment Process
Amendments require:
1. Documented justification explaining why current principle is insufficient
2. Proposed replacement principle or clarification
3. Review and explicit approval from project lead
4. Migration plan for existing code (if applicable)
5. Update to this document with new amendment date

### Compliance Verification
- All PRs must be verified against Constitution principles during review
- Any exceptions MUST be explicitly justified and recorded
- Feature plans (per `.specify/templates/plan-template.md`) MUST include a Constitution Check gate
- Task decomposition (per `.specify/templates/tasks-template.md`) MUST ensure test-first and quality disciplines

### Runtime Guidance
For day-to-day development workflows and implementation patterns, refer to project documentation and established team practices. This Constitution sets the non-negotiable gates; operational details are documented in feature-specific plans.

**Version**: 1.0.0 | **Ratified**: 2026-01-14 | **Last Amended**: 2026-01-14
