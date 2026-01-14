# Research Phase: Omaikit Implementation

**Date**: January 14, 2026  
**Scope**: Pre-design research for technical decisions  
**Status**: In Progress → Will be completed during Phase 0

## Research Queries Identified

The following research tasks must be completed before Phase 1 design can proceed:

### 1. AI Provider Integration Patterns

**Query**: How to abstract AI provider interactions (OpenAI, Anthropic, local LLMs) for flexible model selection?

**Key Questions**:

- Should we support multiple providers simultaneously or make them swappable?
- How to handle token limits and cost optimization?
- What's the best pattern for streaming vs. completion responses?
- How to manage API key rotation and credential security?

**Research Method**: Compare existing Node.js AI abstraction libraries (Langchain, LlamaIndex, custom implementations)

**Deliverable**: Provider abstraction design with interface definitions

---

### 2. AST-Based Code Analysis for Multiple Languages

**Query**: Can we build a language-agnostic codebase analyzer using AST parsing?

**Key Questions**:

- Which languages should we support for AST parsing (TS/JS, Python, Go, Rust, C#)?
- Should we use language-specific parsers (Babel, python-ast) or a unified approach?
- How to detect patterns (naming conventions, error handling, module structure) across languages?
- What's the fallback strategy for languages without AST support?

**Research Method**: Prototype AST parsing for 3+ languages; measure accuracy and performance

**Deliverable**: Language support matrix and pattern detection strategy

---

### 3. TypeScript CLI Framework Comparison

**Query**: Which Node.js CLI framework best supports type-safe commands with extensibility?

**Candidates**:

- Oclif: Plugin-based, type-safe, well-maintained
- Commander.js: Minimal, flexible, large ecosystem
- Yargs: Feature-rich, autocomplete support
- Custom with Minimist: Maximum control, minimum dependencies

**Evaluation Criteria**: Type safety, ease of testing, help generation, plugin support, bundle size

**Deliverable**: Framework selection with rationale

---

### 4. Task Orchestration & Agent Communication

**Query**: How to orchestrate parallel agent execution with proper dependency management?

**Key Questions**:

- Native async/await vs. task queue libraries (Bull, RabbitMQ)?
- How should agents communicate? (Events, queues, direct calls, state file?)
- What's the optimal parallelization strategy? (Plan → Code → [Test + Review parallel])
- How to handle agent failures and retries?

**Research Method**: Design orchestration patterns; compare complexity vs. benefit

**Deliverable**: Orchestration architecture and agent communication protocol

---

### 5. Project Analysis Caching

**Query**: How to efficiently cache codebase analysis across multiple Omaikit runs?

**Key Questions**:

- Cache invalidation strategy? (File hashing, modification timestamps, content fingerprinting?)
- What should be cached? (Full AST, patterns, module graph, or just metadata?)
- Storage format and location? (`.omaikit/.analysis-cache/` with JSON?)
- Cache expiration? (TTL-based, manual invalidation, or dependency tracking?)

**Research Method**: Prototype caching system; measure performance improvement

**Deliverable**: Caching implementation strategy and validation approach

---

### 6. Prompt Engineering for AI Agents

**Query**: What prompting techniques maximize code quality and requirement fidelity?

**Key Questions**:

- Few-shot learning: How many examples needed for reliable code generation?
- Chain-of-thought prompting: Should agents reason through steps before generating?
- Constraint specification: How to enforce architecture consistency and code patterns?
- Temperature and sampling: What settings work best for deterministic, high-quality outputs?
- Prompt templates: How to make templates reusable across languages?

**Research Method**:

- Create prompt templates for each agent type
- Test on sample projects (simple, moderate, complex)
- Measure output quality (does it compile? passes tests? matches style?)
- Document learned patterns and anti-patterns

**Deliverable**: Prompt template library with best practices documentation

---

## Research Status by Task

| Task                                     | Status      | Owner | ETA            |
| ---------------------------------------- | ----------- | ----- | -------------- |
| AI Provider Integration Patterns         | Not Started | TBD   | Phase 0 Week 1 |
| AST-Based Code Analysis                  | Not Started | TBD   | Phase 0 Week 1 |
| TypeScript CLI Framework Comparison      | Not Started | TBD   | Phase 0 Week 1 |
| Task Orchestration & Agent Communication | Not Started | TBD   | Phase 0 Week 1 |
| Project Analysis Caching                 | Not Started | TBD   | Phase 0 Week 2 |
| Prompt Engineering for AI Agents         | Not Started | TBD   | Phase 0 Week 2 |

---

## Research Synthesis (To Be Completed)

_Once all research tasks are complete, findings will be synthesized here with:_

- **Decision**: What was chosen and why
- **Rationale**: Engineering justification
- **Alternatives Considered**: Other options evaluated and rejected
- **Risks & Mitigation**: Known issues and how they'll be addressed

### Expected Findings

**AI Provider Integration** (Expected)

- Decision: Multi-provider abstraction pattern with pluggable adapters
- Rationale: Avoid vendor lock-in; support cost optimization across models
- Candidates: OpenAI (GPT-4, fastest), Anthropic (Claude, better reasoning), local (Ollama for offline)

**Code Analysis** (Expected)

- Decision: Language-specific AST parsers with regex fallback
- Rationale: Accurate analysis for supported languages; graceful degradation for others
- Supported: JavaScript/TypeScript (Babel), Python (python-ast), Go (ast), others via patterns

**CLI Framework** (Expected)

- Decision: Oclif for plugin-based extensibility + type safety
- Rationale: Enterprise-grade, supports nested commands, excellent help generation
- Alternative: Commander.js if simplicity is prioritized; Oclif provides more structure

**Task Orchestration** (Expected)

- Decision: Native async/await with event bus; no external queue library
- Rationale: Sufficient for MVP; avoids operational complexity; can upgrade to Bull if needed
- Architecture: PipelineOrchestrator class with Agent interface; events for progress reporting

**Caching** (Expected)

- Decision: File-based JSON cache in `.omaikit/.analysis-cache/` with content hashing
- Rationale: No external dependencies; simple invalidation; filesystem-native
- Invalidation: Hash file contents; invalidate on mismatch or manual `--force`

**Prompt Engineering** (Expected)

- Decision: Specialized templates per agent; few-shot examples; chain-of-thought reasoning
- Rationale: Increases output quality and reliability
- Templates: Dedicated `prompts/` directory with versioning; examples embedded in templates

---

## Next Steps

1. Assign research owners
2. Schedule Phase 0 research execution (expected 2 weeks)
3. Document findings in decision matrix below
4. Proceed to Phase 1 design once all decisions are made

## Decision Matrix (To Be Completed)

| Decision           | Option 1    | Option 2     | Option 3            | Selected           | Rationale             |
| ------------------ | ----------- | ------------ | ------------------- | ------------------ | --------------------- |
| AI Provider        | OpenAI      | Anthropic    | Custom abstraction  | Custom abstraction | Max flexibility       |
| CLI Framework      | Oclif       | Commander    | Yargs               | Oclif              | Type-safety + plugins |
| Code Analysis      | AST + Regex | Regex only   | AST only            | AST + Regex        | Best of both          |
| Task Queue         | Bull        | Native async | RabbitMQ            | Native async       | MVP simplicity        |
| Cache Format       | JSON        | SQLite       | Binary              | JSON               | Filesystem-native     |
| Caching Validation | Hashing     | Timestamps   | Dependency tracking | Hashing            | Accurate + fast       |
