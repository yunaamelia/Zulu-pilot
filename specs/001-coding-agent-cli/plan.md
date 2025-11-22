# Implementation Plan: Coding Agent CLI with Multi-Provider Support

**Branch**: `001-coding-agent-cli` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-coding-agent-cli/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a CLI coding assistant ("Zulu Pilot") that supports multiple AI model providers (local Ollama/Qwen and remote providers like Gemini, OpenAI, DeepSeek) with agentic file modification capabilities. The system uses an adapter pattern to decouple CLI logic from specific LLM providers, enabling developers to switch between models seamlessly. Core features include context management for codebase awareness, real-time streaming responses, and safe file modification with user approval.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**:

- HTTP client: `axios` (resolved - see research.md)
- CLI framework: `commander.js` (resolved - see research.md)
- Streaming: Node.js streams API with axios streaming support
- Testing: Jest with ts-jest, axios-mock-adapter for HTTP mocking
- Type checking: TypeScript strict mode

**Storage**: Configuration file (`~/.zulu-pilotrc`) for provider settings, API keys, model preferences  
**Testing**: Jest with ts-jest, coverage via `@jest/coverage`  
**Target Platform**: Node.js 18+ (cross-platform: Linux, macOS, Windows)  
**Project Type**: Single CLI application  
**Performance Goals**:

- CLI startup: < 500ms
- Model connection: < 2s local, < 5s remote
- First token latency: < 1s
- File context loading: < 100ms per file

**Constraints**:

- Must work offline with local Ollama
- Must handle streaming responses for real-time UX
- Must preserve file safety (backups/version control)
- Token estimation accuracy within 10%

**Scale/Scope**:

- Single-user CLI tool
- Support 20+ files in context
- Handle models with 32k-65k token context windows
- Support 4+ model providers (Ollama, Gemini, OpenAI/DeepSeek/Groq, Google Cloud AI Platform)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Code Quality (I)**:

- [x] Linting and formatting tools configured (ESLint + Prettier)
- [x] Type checking enabled (TypeScript strict mode)
- [x] Code review process defined

**Testing with Coverage (II)**:

- [x] Test framework selected and configured (Jest + ts-jest)
- [x] Coverage thresholds defined (minimum 80% global, 90% for new code, 95% for critical paths)
- [x] Test types planned (unit, integration, contract, E2E)

**User Experience Consistency (III)** (if applicable):

- N/A (CLI tool, not a UI application)

**Pre-commit Quality Gates (IV)**:

- [x] Pre-commit hooks configured (.pre-commit-config.yaml)
- [x] Hooks include: linting, formatting, type checking, test coverage, security scanning
- [x] Hooks verified to run in < 30s

**Performance Requirements (V)**:

- [x] Performance targets defined (startup, connection, streaming latency, file loading)
- [x] Performance testing strategy planned
- [x] Monitoring/alerting approach identified (CLI logging)

**Compliance Status**: ✅ All checks pass - ready for implementation

**Exceptions** (if any):

- None

## Project Structure

### Documentation (this feature)

```text
specs/001-coding-agent-cli/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── llm/
│   │   ├── IModelProvider.ts          # Model provider interface
│   │   ├── OllamaProvider.ts           # Ollama implementation
│   │   ├── GeminiProvider.ts           # Gemini implementation (refactored)
│   │   ├── OpenAIProvider.ts           # OpenAI/DeepSeek/Groq implementation
│   │   └── GoogleCloudProvider.ts      # Google Cloud AI Platform models
│   ├── context/
│   │   ├── FileContext.ts              # File context type
│   │   ├── ContextManager.ts           # Context management logic
│   │   └── TokenEstimator.ts           # Token estimation utility
│   ├── parser/
│   │   ├── CodeChangeParser.ts         # Parse AI responses for code changes
│   │   └── FilePatcher.ts              # Apply code changes with safety checks
│   └── config/
│       └── ConfigManager.ts            # Configuration file management
├── cli/
│   ├── index.ts                         # Main CLI entry point
│   ├── commands/
│   │   ├── chat.ts                      # Chat command
│   │   ├── add.ts                       # /add command
│   │   ├── clear.ts                     # /clear command
│   │   ├── context.ts                   # /context command
│   │   └── model.ts                     # /model command (list/change models)
│   └── ui/
│       ├── spinner.ts                    # Loading spinner
│       ├── stream.ts                    # Streaming output handler
│       └── diff.ts                      # Diff display
└── utils/
    ├── errors.ts                        # Error handling utilities
    └── validators.ts                    # Input validation

tests/
├── unit/
│   ├── core/llm/
│   │   ├── OllamaProvider.test.ts
│   │   ├── GeminiProvider.test.ts
│   │   └── OpenAIProvider.test.ts
│   ├── core/context/
│   │   ├── ContextManager.test.ts
│   │   └── TokenEstimator.test.ts
│   └── core/parser/
│       ├── CodeChangeParser.test.ts
│       └── FilePatcher.test.ts
├── integration/
│   ├── cli/
│   │   └── chat.test.ts                 # E2E chat flow
│   └── providers/
│       └── provider-switching.test.ts    # Provider switching
├── contract/
│   ├── ollama-api.test.ts                # Ollama API contract
│   ├── gemini-api.test.ts                # Gemini API contract
│   └── openai-api.test.ts                # OpenAI API contract
└── fixtures/
    └── sample-responses/                 # Sample AI responses for testing

```

**Structure Decision**: Single project structure with clear separation of concerns:

- `core/` - Business logic and abstractions (provider-agnostic)
- `cli/` - CLI-specific code (commands, UI)
- `utils/` - Shared utilities
- Tests mirror source structure for easy navigation

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                         | Why Needed                                                                                        | Simpler Alternative Rejected Because                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Multiple provider implementations | Support for local (Ollama) and multiple remote providers (Gemini, OpenAI, DeepSeek, Google Cloud) | Single provider insufficient - core requirement is multi-provider flexibility |
| Adapter pattern for providers     | Decouple CLI from specific LLM implementations                                                    | Direct provider coupling would make adding new providers require CLI changes  |
