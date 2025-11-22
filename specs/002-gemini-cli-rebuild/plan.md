# Implementation Plan: Zulu Pilot v2 - Multi-Provider AI Coding Assistant dengan Gemini CLI Foundation

**Branch**: `002-gemini-cli-rebuild` | **Date**: 2025-11-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-gemini-cli-rebuild/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Rebuild Zulu Pilot dengan Gemini CLI sebagai foundation, menggunakan **TypeScript monorepo dengan npm workspaces**, **adapter pattern** untuk custom model providers, dan **plugin architecture** untuk extensibility. Aplikasi akan menggunakan semua tools dari Gemini CLI (file operations, Google Search, MCP servers, code editing) sambil mendukung multiple AI providers (Ollama, OpenAI, Google Cloud, DeepSeek, Qwen, dll). Technical approach menggunakan adapter layer untuk bridge antara Gemini CLI core (yang expect specific model interface) dengan custom providers, memungkinkan developer menggunakan model pribadi mereka sambil tetap mendapat benefit dari semua tools dan features dari Gemini CLI.

## Research Summary

_MANDATORY: Every plan.md must include this section per Constitution - Research-Driven Planning_

**Full research document**: [research.md](./research.md)

- **Technology Choices**:
  - npm workspaces (native, no additional tooling)
  - TypeScript 5.7.2 with strict mode, ES2022 target
  - Adapter pattern for model provider abstraction
  - Jest 29.7.0 with ts-jest 29.2.5 for testing
  - ESLint 9.17.0 + Prettier 3.4.2 for code quality
  - Gemini CLI fork strategy (git subtree for upstream sync)

- **Alternatives Considered**:
  - pnpm workspaces (rejected: adds dependency, npm sufficient)
  - Turborepo (rejected: can add later if needed, npm workspaces sufficient for MVP)
  - Vitest (rejected: Jest more mature, better ecosystem)
  - Strategy/Bridge patterns (rejected: Adapter pattern better fits interface translation use case)

- **Key Research Sources**:
  - npm workspaces: https://docs.npmjs.com/cli/v11/using-npm/workspaces
  - Turborepo TypeScript guide: https://turborepo.org/docs/guides/tools/typescript
  - Gemini CLI: https://github.com/google-gemini/gemini-cli
  - Adapter pattern: https://refactoring.guru/design-patterns/typescript
  - Node.js Testing Best Practices: https://github.com/goldbergyoni/nodejs-testing-best-practices

- **Known Limitations**:
  - Must maintain compatibility with Gemini CLI upstream updates
  - Adapter layer adds slight overhead (minimal, acceptable)
  - Different providers have different request/response formats (handled by adapter)
  - Fork strategy needs careful version management

- **Integration Patterns**:
  - Monorepo: Root defines workspaces, packages use `workspace:*` protocol
  - Adapter: Gemini CLI Core → ModelManager → Adapter → Router → Provider
  - Testing: Shared config in root, package-specific overrides, coverage per package

- **Version Information**:
  - TypeScript 5.7.2 (stable, latest as of 2025-11-22)
  - Node.js 18+ (LTS, stable)
  - Jest 29.7.0 (stable, mature)
  - ESLint 9.17.0 (latest stable, flat config)
  - Gemini CLI: Latest stable (to be determined during implementation)

## Test & Coverage Strategy

_MANDATORY: Every plan.md must include this section per Constitution - Testing Standards_

- **Testing Framework**: Jest 29.7.0 dengan ts-jest 29.2.5 untuk TypeScript support
- **Coverage Tool**: Istanbul (via Jest built-in coverage) dengan coverageReporters: ['text', 'lcov', 'json', 'html']
- **Coverage Targets**:
  - Overall: 80% minimum, 90% target
  - Unit tests: 85% minimum (adapter layer: 95%+ critical path)
  - Integration tests: 75% minimum
  - Critical paths: 100% (adapter layer, provider routing, configuration management)
  - New code: 90% minimum (stricter than legacy)
- **Test File Structure**:
  - Naming: `*.test.ts` untuk test files (co-located dengan source atau di `tests/` directory)
  - Organization: Mirror source structure, separate directories untuk unit/integration/contract/e2e
  - Structure: `tests/unit/`, `tests/integration/`, `tests/contract/`, `tests/e2e/`
- **Mocking Strategy**:
  - Jest mocks untuk provider interfaces
  - axios-mock-adapter untuk HTTP mocking
  - Manual mocks untuk Gemini CLI core interfaces
  - Test doubles untuk file system operations
- **CI Integration**:
  - Coverage reporting via Codecov atau Coveralls
  - Coverage badges di README
  - PR comments dengan coverage diff
  - Coverage trend tracking
- **Coverage Exemptions**:
  - Gemini CLI core packages (forked, maintain compatibility)
  - Auto-generated files (if any)
  - CLI entry points (tested via integration tests)

## Technical Context

**Language/Version**: TypeScript 5.7.2 dengan strict mode enabled, Node.js 18+ (ESM modules), ES2022 target

**Primary Dependencies**:

- @google/genai 1.30.0 - Gemini CLI's model SDK (untuk compatibility)
- axios 1.7.7 - HTTP client untuk API calls
- commander 12.1.0 - CLI framework
- google-auth-library 10.5.0 - Google Cloud authentication
- dotenv 17.2.3 - Environment variable management
- glob 13.0.0 - File pattern matching

**Storage**: File-based configuration (`~/.zulu-pilotrc` JSON format), File-based checkpoints (`~/.zulu-pilot/checkpoints/` directory), No database - semua state di file system

**Testing**: Jest 29.7.0 dengan ts-jest 29.2.5, Coverage: Istanbul (via Jest) dengan thresholds: 80% global, 90% new code, Test Types: Unit, Integration, Contract, E2E

**Target Platform**: Linux, macOS, Windows (Node.js cross-platform), CLI-only (no GUI, no web interface)

**Project Type**: Monorepo dengan npm workspaces - multiple packages (cli, core, adapter, providers)

**Performance Goals**:

- First token latency: < 2s (local), < 5s (cloud)
- Context loading (20 files): < 3s
- File operations: < 1s untuk files < 100KB
- Streaming: Real-time tanpa buffering delays

**Constraints**:

- Must maintain compatibility dengan Gemini CLI's tool system
- Must support all existing Gemini CLI features
- Must allow easy switching between providers
- Must handle errors gracefully dengan actionable messages

**Scale/Scope**:

- Support 10+ AI providers (Ollama, OpenAI, Google Cloud, Gemini, DeepSeek, Qwen, dll)
- Support 50+ models across providers
- Handle context dengan 100+ files
- Support conversation checkpoints dengan unlimited history

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Research Requirements** (from Constitution - Research-Driven Planning):

- [x] At least 3 alternatives evaluated with pros/cons analysis (see research.md)
- [x] Current stable versions verified (TypeScript 5.7.2, Jest 29.7.0, ESLint 9.17.0)
- [x] Real-world usage examples found (npm workspaces, Gemini CLI, adapter patterns)
- [x] Integration compatibility researched (monorepo patterns, adapter integration)
- [x] Community health assessed (all tools actively maintained)
- [x] Research documented with sources and version numbers (research.md)

**Test & Coverage Strategy** (from Constitution - Testing Standards):

- [x] Testing framework selected: Jest 29.7.0 with ts-jest 29.2.5
- [x] Coverage targets defined per component/layer:
  - Adapter layer: 95%+ (critical path)
  - Providers: 90%+ per provider
  - Integration: 85%+
  - Overall: 80% minimum, 90% target
- [x] Test file structure and naming convention determined: `*.test.ts`, co-located or in `tests/` directory
- [x] Mocking strategy defined: Jest mocks, axios-mock-adapter, manual mocks for Gemini CLI interfaces
- [x] CI integration plan for coverage reporting: Codecov/Coveralls, PR comments, badges

**Quality Gates** (from Constitution - Automated Quality Gates):

- [x] Pre-commit hooks configured: Husky 9.1.7 + lint-staged 15.2.11 (already in project)
- [x] Coverage thresholds meet minimums: 80% unit, 70% integration, 75% overall (exceeded with 90%+ targets)
- [x] Critical paths identified for 100% coverage requirement: Adapter layer, provider routing, configuration management
- [x] Security scanning tools selected: npm audit, git-secrets (to be added to pre-commit)

**Additional Gates**:

- [x] TypeScript strict mode enabled (required)
- [x] ESLint configured with zero errors policy (required)
- [x] Prettier for consistent formatting (required)
- [x] All dependencies version-pinned (required for reproducibility)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
zulu-pilot-v2/
├── package.json                    # Root workspace config
├── pnpm-workspace.yaml             # Workspace definition (or npm workspaces)
├── tsconfig.json                   # Root TypeScript config
├── .eslintrc.js                    # Root ESLint config
├── .prettierrc                     # Prettier config
│
├── packages/
│   ├── cli/                        # CLI Interface (Fork dari Gemini CLI)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts           # CLI entry point
│   │   │   ├── commands/           # CLI commands
│   │   │   └── ui/                # UI components
│   │   └── dist/                   # Compiled output
│   │
│   ├── core/                       # Core Engine (Fork dari Gemini CLI dengan mods)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── model/             # Model interface (modified)
│   │   │   ├── tools/             # Built-in tools (unchanged)
│   │   │   ├── mcp/               # MCP integration (unchanged)
│   │   │   └── conversation/      # Conversation management (unchanged)
│   │   └── dist/
│   │
│   ├── adapter/                    # Custom Model Adapter Layer (NEW)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── GeminiCLIModelAdapter.ts    # Main adapter
│   │   │   ├── MultiProviderRouter.ts      # Provider routing
│   │   │   ├── ProviderRegistry.ts         # Provider registration
│   │   │   └── interfaces/
│   │   │       └── IModelAdapter.ts         # Adapter interface
│   │   └── dist/
│   │
│   └── providers/                  # Custom Model Providers (NEW)
│       ├── package.json
│       ├── src/
│       │   ├── OllamaProvider.ts
│       │   ├── OpenAIProvider.ts
│       │   ├── GoogleCloudProvider.ts
│       │   ├── GeminiProvider.ts
│       │   ├── DeepSeekProvider.ts
│       │   ├── QwenProvider.ts
│       │   └── IModelProvider.ts   # Provider interface
│       └── dist/
│
├── tests/                          # Integration tests across packages
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── scripts/                         # Build & dev scripts
    ├── build.sh
    ├── test.sh
    └── dev.sh
```

**Structure Decision**: Monorepo dengan npm workspaces untuk manage multiple packages. Structure memungkinkan:

- Fork Gemini CLI packages (cli, core) dengan minimal modifications
- Custom adapter layer sebagai bridge antara Gemini CLI core dan custom providers
- Provider implementations sebagai separate package untuk easy extensibility
- Shared tests directory untuk integration tests across packages

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zulu Pilot v2 CLI                        │
│              (Fork dari Gemini CLI packages/cli)            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Gemini CLI Core (packages/core)                │
│  - File Operations Tool                                      │
│  - Google Search Tool                                       │
│  - MCP Server Integration                                   │
│  - Code Editing Capabilities                                │
│  - Conversation Management                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Uses Model Interface
                        │
┌───────────────────────▼─────────────────────────────────────┐
│         Custom Model Adapter Layer                          │
│         (@zulu-pilot/adapter)                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  GeminiCLIModelAdapter                             │     │
│  │  - Implements Gemini CLI's expected interface     │     │
│  │  - Routes requests to MultiProviderRouter         │     │
│  └───────────────────┬──────────────────────────────┘     │
│                       │                                      │
│  ┌───────────────────▼──────────────────────────────┐       │
│  │  MultiProviderRouter                             │       │
│  │  - Routes to appropriate provider based on config│       │
│  │  - Handles provider switching                    │       │
│  └───────────────────┬──────────────────────────────┘       │
└───────────────────────┼─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
│   Ollama     │ │   OpenAI   │ │  Google    │
│   Provider   │ │   Provider  │ │  Cloud     │
│              │ │             │ │  Provider  │
└──────────────┘ └─────────────┘ └────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
              ┌─────────▼─────────┐
              │  Custom Models     │
              │  (User's Models)     │
              └────────────────────┘
```

### Integration Flow

**Request Flow**:

1. User types prompt in CLI
2. CLI → Gemini CLI Core → ModelManager
3. ModelManager → GeminiCLIModelAdapter.generateContent()
4. Adapter converts Gemini CLI format → Provider format
5. Adapter → MultiProviderRouter.getProviderForModel()
6. Router → ProviderRegistry.getProvider()
7. Provider generates response
8. Adapter converts Provider format → Gemini CLI format
9. Gemini CLI Core receives response
10. Tools process response (if needed)
11. CLI displays response to user

**Streaming Flow**:

- Same as above, but using `streamGenerateContent()` which returns AsyncGenerator
- Tokens are converted and yielded one by one
- Real-time streaming to user

## Detailed Technical Requirements

### 1. Model Adapter Layer (`@zulu-pilot/adapter`)

**Purpose**: Bridge antara Gemini CLI core (yang expect specific model interface) dengan custom providers.

**Key Components**:

- `GeminiCLIModelAdapter`: Main adapter implementing Gemini CLI's interface
- `MultiProviderRouter`: Routes requests to appropriate provider
- `ProviderRegistry`: Manages provider instances and lifecycle
- Request/Response converters: Convert between Gemini CLI format and provider formats

**Implementation Details**: See [contracts/model-adapter.interface.ts](./contracts/model-adapter.interface.ts)

### 2. Multi-Provider Router (`@zulu-pilot/adapter`)

**Purpose**: Route requests ke appropriate provider berdasarkan configuration.

**Key Features**:

- Parse model ID format: "provider:model" or "model" (use default provider)
- Provider switching without losing context
- Provider health checking
- Fallback mechanisms

### 3. Provider Registry (`@zulu-pilot/adapter`)

**Purpose**: Manage provider instances dan lifecycle.

**Key Features**:

- Register/unregister providers
- Lazy initialization
- Provider instance caching
- Configuration validation

### 4. Custom Providers (`@zulu-pilot/providers`)

**Purpose**: Implementasi providers untuk berbagai AI services.

**Providers to Implement**:

- OllamaProvider (port from current Zulu Pilot)
- OpenAIProvider (port from current Zulu Pilot)
- GoogleCloudProvider (port from current Zulu Pilot with enhancements)
- GeminiProvider (port from current Zulu Pilot)
- DeepSeekProvider (NEW - via OpenAI-compatible API)
- QwenProvider (NEW - via Google Cloud Vertex AI)

**Interface**: All providers implement `IModelProvider` interface (see [contracts/model-provider.interface.ts](./contracts/model-provider.interface.ts))

### 5. Configuration System

**Purpose**: Unified configuration untuk semua providers dan settings.

**Storage**: `~/.zulu-pilotrc` (JSON format)

**Key Features**:

- Load from file or environment variables
- Validate configuration schema
- Atomic updates (write to temp, then rename)
- Provider-specific defaults

**Schema**: See [contracts/configuration.schema.json](./contracts/configuration.schema.json)

### 6. Integration dengan Gemini CLI Core

**Approach**: Fork Gemini CLI packages dan modify minimal untuk inject custom adapter.

**Modification Points**:

1. **Model Initialization** (`packages/core/src/model/ModelManager.ts`):
   - Replace `new GoogleGenAI(...)` with `new GeminiCLIModelAdapter(config)`
   - Delegate all model calls to adapter

2. **Tool Integration**: Tidak perlu modify - tools tetap bekerja karena mereka hanya call model interface

3. **MCP Server Integration**: Tidak perlu modify - MCP servers tetap bekerja karena mereka independent dari model provider

### 7. CLI Interface (`@zulu-pilot/cli`)

**Approach**: Fork Gemini CLI packages/cli dengan minimal modifications.

**New Commands**:

- `provider`: Manage AI providers (list, set, config)
- `model`: Manage AI models (list, set, show)
- Enhanced existing commands with provider/model options

**Command Interfaces**: See [contracts/cli-commands.interface.ts](./contracts/cli-commands.interface.ts)

## Implementation Phases

### Phase 0: Research & Setup (Week 1)

**Tasks**:

1. Clone Gemini CLI repository dan study architecture
2. Identify semua integration points
3. Create fork strategy (git subtree atau full fork)
4. Setup monorepo structure dengan npm workspaces
5. Research Gemini CLI's model interface secara detail

**Deliverables**:

- Architecture analysis document
- Integration points mapping
- Monorepo structure setup
- Research findings document (✅ Complete - see [research.md](./research.md))

### Phase 1: Foundation - Monorepo & Adapter Layer (Week 2-3)

**Tasks**:

1. Setup monorepo dengan npm workspaces
2. Fork Gemini CLI packages (cli, core) ke packages/
3. Create `@zulu-pilot/adapter` package
4. Implement `GeminiCLIModelAdapter` dengan basic routing
5. Implement `MultiProviderRouter` dengan single provider (Ollama) sebagai POC
6. Create `ProviderRegistry` untuk manage providers
7. Setup configuration system dengan `UnifiedConfigManager`
8. Write comprehensive tests untuk adapter layer (90%+ coverage)

**Deliverables**:

- Working monorepo structure
- Basic adapter layer dengan Ollama provider
- Configuration system
- Test suite dengan 90%+ coverage

### Phase 2: Provider Integration (Week 4-5)

**Tasks**:

1. Port semua providers dari current Zulu Pilot ke `@zulu-pilot/providers`
2. Implement provider factory pattern
3. Add OpenAI provider support
4. Add Google Cloud provider support
5. Add Gemini provider support
6. Implement request/response format conversion untuk each provider
7. Test semua providers dengan adapter layer
8. Write integration tests untuk each provider (90%+ coverage)

**Deliverables**:

- All providers ported dan working
- Request/response conversion working
- Integration tests passing

### Phase 3: Gemini CLI Core Integration (Week 6-7)

**Tasks**:

1. Modify Gemini CLI core untuk use custom adapter
2. Test semua tools dengan custom providers:
   - File operations tool
   - Google Search tool
   - Code editing capabilities
3. Test MCP server integration dengan custom providers
4. Ensure conversation management works dengan custom providers
5. Test checkpointing dengan custom providers
6. Write E2E tests untuk full workflow

**Deliverables**:

- Gemini CLI core modified dan working
- All tools tested dengan custom providers
- E2E tests passing

### Phase 4: CLI Enhancements (Week 8)

**Tasks**:

1. Add provider management commands
2. Add model management commands dengan multi-provider support
3. Add provider switching dalam interactive chat
4. Enhance error messages dengan provider-specific guidance
5. Add configuration wizard untuk first-time setup
6. Write CLI tests

**Deliverables**:

- Enhanced CLI dengan provider management
- User-friendly error messages
- Configuration wizard

### Phase 5: Advanced Features (Week 9-10)

**Tasks**:

1. Implement conversation checkpointing dengan custom providers
2. Implement custom context files (GEMINI.md style)
3. Add headless mode dengan JSON/stream-json output
4. Add provider-specific features (e.g., thinking config untuk DeepSeek R1)
5. Write tests untuk advanced features

**Deliverables**:

- Checkpointing working
- Custom context files working
- Headless mode working

### Phase 6: Polish & Documentation (Week 11-12)

**Tasks**:

1. Write comprehensive documentation
2. Create migration guide dari Zulu Pilot v1
3. Create setup guide untuk new users
4. Performance optimization
5. Final testing dan bug fixes
6. Prepare for release

**Deliverables**:

- Complete documentation
- Migration guide
- Performance optimized
- Ready for release

## Dependencies & Package Structure

### Root `package.json`

```json
{
  "name": "zulu-pilot-v2",
  "version": "2.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "dev": "npm run dev --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.1",
    "eslint": "^9.17.0",
    "prettier": "^3.4.2"
  }
}
```

### Package Dependencies

**@zulu-pilot/adapter**:

- Depends on: `@zulu-pilot/core`, `@zulu-pilot/providers`
- Purpose: Bridge layer between Gemini CLI and custom providers

**@zulu-pilot/providers**:

- Depends on: `axios`, `google-auth-library`, `@google/genai`
- Purpose: Provider implementations

**@zulu-pilot/cli**:

- Depends on: `@zulu-pilot/core`, `commander`
- Purpose: CLI interface

**@zulu-pilot/core**:

- Depends on: Gemini CLI core dependencies
- Purpose: Core engine (forked from Gemini CLI)

## Integration Strategy dengan Gemini CLI

### Fork Strategy

**Option 1: Git Subtree** (Recommended)

- Maintain connection ke upstream Gemini CLI
- Easy to pull updates
- Custom modifications di separate commits

**Option 2: Full Fork**

- Complete independence
- Harder to sync upstream updates
- More control

**Recommendation**: Git Subtree untuk `packages/cli` dan `packages/core`, dengan custom layer di `packages/adapter` dan `packages/providers`.

### Update Strategy

1. **Regular Sync**: Pull updates dari Gemini CLI upstream secara berkala
2. **Conflict Resolution**: Handle conflicts di integration points
3. **Testing**: Comprehensive test suite untuk ensure compatibility setelah updates

## Testing Strategy

### Test Structure

```
tests/
├── unit/
│   ├── adapter/              # Adapter layer tests
│   ├── providers/            # Provider tests
│   └── config/               # Config manager tests
├── integration/
│   ├── adapter-providers/    # Adapter + Provider integration
│   ├── cli-commands/         # CLI command tests
│   └── tools-integration/    # Tools dengan custom providers
├── contract/
│   └── model-interface/      # Contract tests untuk model interface
└── e2e/
    ├── full-workflows/        # Complete user journeys
    └── provider-switching/   # Provider switching scenarios
```

### Coverage Requirements

- **Adapter Layer**: 95%+ (critical path)
- **Providers**: 90%+ per provider
- **Integration**: 85%+ untuk integration tests
- **E2E**: All user stories covered

## Risk Mitigation

### Risks & Mitigation

| Risk                        | Impact | Mitigation                                                 |
| --------------------------- | ------ | ---------------------------------------------------------- |
| Gemini CLI breaking changes | High   | Regular sync, comprehensive tests, adapter abstraction     |
| Provider API changes        | Medium | Version pinning, provider abstraction, fallback mechanisms |
| Performance degradation     | Medium | Performance benchmarks, profiling, optimization            |
| Compatibility issues        | High   | Comprehensive integration tests, contract tests            |

## Success Metrics

### Technical Metrics

- ✅ All tests passing dengan 90%+ coverage
- ✅ All providers working dengan all tools
- ✅ Performance targets met
- ✅ Zero critical bugs

### User Experience Metrics

- ✅ Provider switching < 1 second
- ✅ Clear error messages untuk all scenarios
- ✅ Smooth streaming untuk all providers
- ✅ Easy configuration setup

## Complexity Tracking

> **No violations - all complexity is justified**

The monorepo structure and adapter pattern are necessary to:

- Maintain compatibility with Gemini CLI while adding custom providers
- Enable easy extensibility for new providers
- Separate concerns (adapter, providers, CLI, core)
- Support independent testing and development of each package
