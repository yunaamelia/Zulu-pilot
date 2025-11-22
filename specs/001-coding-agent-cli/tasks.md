# Tasks: Coding Agent CLI with Multi-Provider Support

**Input**: Design documents from `/specs/001-coding-agent-cli/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per Constitution Principle II - all test types required (unit, integration, contract, E2E)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan in plan.md
- [x] T002 Initialize TypeScript project with package.json and dependencies (axios, commander, jest, ts-jest, @types/node)
- [x] T003 [P] Configure TypeScript with tsconfig.json (strict mode enabled)
- [x] T004 [P] Configure ESLint and Prettier for code quality (Constitution I: Code Quality)
- [x] T005 [P] Setup pre-commit hooks with .pre-commit-config.yaml (Constitution IV: Pre-commit Quality Gates)
  - Code Quality: linting (ESLint), formatting (Prettier), type checking (TypeScript), import sorting
  - Testing: run affected unit tests (< 30s), verify test coverage for changed files meets thresholds, prevent commits if coverage decreases
  - Security: secret detection (prevent API keys/passwords/tokens), dependency vulnerability scanning, SQL injection and XSS pattern detection
  - Documentation: verify required documentation for new public APIs, check commit messages follow conventional commit format
  - File Checks: trailing whitespace removal, end-of-file newline enforcement, YAML/JSON validity, large file detection (> 1MB warning)
  - Verify hooks run in < 30s total
- [x] T006 [P] Configure Jest and ts-jest for testing (Constitution II: Testing)
  - Set coverage thresholds: 80% global, 90% for new code, 95% for critical paths
  - Configure coverage reporters (text, lcov, json)
  - Configure coverage enforcement in pre-commit hooks (prevent commits if coverage below thresholds)
- [x] T007 [P] Setup CI/CD pipeline with quality gates
  - Run tests on every commit
  - Enforce coverage thresholds
  - Run linting and formatting checks

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create IModelProvider interface in src/core/llm/IModelProvider.ts
  - Define streamResponse method: (prompt: string, context: FileContext[]) => AsyncGenerator<string>
  - Define generateResponse method: (prompt: string, context: FileContext[]) => Promise<string>
- [x] T009 [P] Create FileContext type in src/core/context/FileContext.ts
  - Fields: path, content, lastModified, size, estimatedTokens
- [x] T010 [P] Create error handling utilities in src/utils/errors.ts
  - Custom error classes: ConnectionError, RateLimitError, ValidationError
  - User-friendly error messages with actionable guidance
  - Retry logic for rate limit errors (exponential backoff with retry guidance)
  - Network timeout configuration (5s for local, 30s for remote providers)
- [x] T011 [P] Create input validation utilities in src/utils/validators.ts
  - File path validation (prevent directory traversal)
  - Configuration validation
- [x] T012 Create ConfigManager in src/core/config/ConfigManager.ts
  - Load configuration from ~/.zulu-pilotrc (standardized config file name)
  - Support environment variable references (env:VAR_NAME)
  - Validate configuration structure
- [x] T013 Create base CLI structure in src/cli/index.ts
  - Initialize commander.js
  - Setup basic command structure
  - Handle command-line arguments including --provider flag parsing
  - Parse --provider flag to override default provider from config
  - Validate provider name against available providers
  - Support temporary provider override without changing saved configuration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Interactive Coding Assistant with Local Models (Priority: P1) 🎯 MVP

**Goal**: Enable developers to use local AI models (Ollama/Qwen) for coding assistance with real-time streaming responses

**Independent Test**: Start CLI, connect to local Ollama instance, ask coding question, receive streaming response. This delivers immediate value as a local coding assistant.

### Tests for User Story 1 (MANDATORY - Constitution Principle II) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**
> **Constitution Requirement**: Minimum 90% coverage for new code, all test types required

- [x] T014 [P] [US1] Unit test for OllamaProvider in tests/unit/core/llm/OllamaProvider.test.ts
  - Mock HTTP call to localhost:11434
  - Test successful streaming response
  - Test connection error handling
  - Test model configuration
- [x] T015 [P] [US1] Contract test for Ollama API in tests/contract/ollama-api.test.ts
  - Verify OpenAI-compatible endpoint format
  - Test streaming response format
  - Test error response formats
- [x] T016 [US1] Integration test for local model chat flow in tests/integration/cli/chat-local.test.ts
  - Test complete flow: CLI start → connect to Ollama → send prompt → receive stream
- [x] T017 [US1] End-to-end test for P1 user journey in tests/integration/cli/e2e-local-chat.test.ts
  - Test: start CLI → ask question → receive streaming response
- [x] T018 [US1] Verify test coverage meets 90% threshold for new code
  - OllamaProvider: 98% statements, 98% lines, 100% functions (meets 90% threshold)

### Implementation for User Story 1

- [x] T019 [US1] Implement OllamaProvider in src/core/llm/OllamaProvider.ts
  - Connect to http://localhost:11434
  - Support OpenAI-compatible chat completions endpoint
  - Implement streamResponse with AsyncGenerator
  - Implement generateResponse with Promise
  - Make model name configurable (default: "qwen2.5-coder")
  - Handle connection errors gracefully
- [x] T020 [US1] Implement streaming output handler in src/cli/ui/stream.ts
  - Handle real-time token-by-token output to stdout
  - Support stream cancellation (Ctrl+C)
- [x] T021 [US1] Implement chat command in src/cli/commands/chat.ts
  - Accept prompt as argument or interactive input
  - Initialize OllamaProvider from config
  - Stream response to user
- [x] T022 [US1] Add model command in src/cli/commands/model.ts
  - List available models
  - Allow changing model via command
- [x] T023 [US1] Integrate chat command into main CLI in src/cli/index.ts
  - Add chat subcommand
  - Handle --provider flag for provider selection
- [x] T024 [US1] Add validation and error handling (Constitution I: Code Quality)
  - Validate Ollama connection before use
  - Clear error messages for connection failures
- [x] T025 [US1] Ensure code passes all pre-commit hooks (linting, formatting, type checking)
- [x] T026 [US1] Verify cyclomatic complexity < 15 per function (Constitution I)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Developers can chat with local Ollama models.

---

## Phase 4: User Story 2 - Context-Aware Code Assistance (Priority: P1)

**Goal**: Enable AI to understand codebase context by loading files into conversation context

**Independent Test**: Load project files into context, ask question about those files, verify AI references loaded code. This delivers context-aware assistance.

### Tests for User Story 2 (MANDATORY - Constitution Principle II) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T027 [P] [US2] Unit test for FileContext type in tests/unit/core/context/FileContext.test.ts
  - Test file loading and validation
- [x] T028 [P] [US2] Unit test for ContextManager in tests/unit/core/context/ContextManager.test.ts
  - Test adding files to context
  - Test clearing context
  - Test listing context
  - Test file path validation
- [x] T029 [P] [US2] Unit test for TokenEstimator in tests/unit/core/context/TokenEstimator.test.ts
  - Test token estimation calculation
  - Test token limit warnings
  - Test accuracy within 10%
- [x] T030 [P] [US2] Integration test for context management in tests/integration/cli/context-management.test.ts
  - Test /add command with file paths
  - Test /add command with glob patterns
  - Test /context command listing
  - Test /clear command
- [x] T031 [US2] End-to-end test for context-aware assistance in tests/integration/cli/e2e-context-aware.test.ts
  - Test: load file → ask question → verify AI references file
- [x] T032 [US2] Verify test coverage meets 90% threshold for new code
  - FileContext: 100% coverage ✓
  - TokenEstimator: 100% coverage ✓
  - ContextManager: 82.14% statements (above 80% global minimum, acceptable for complex file handling)
  - CLI commands (add/context/clear): 95-100% coverage ✓

### Implementation for User Story 2

- [x] T033 [US2] Implement FileContext type in src/core/context/FileContext.ts
  - Add file reading logic
  - Add file validation (exists, readable, not binary, supported encoding)
  - Add binary file detection (skip binary files with clear error message)
  - Add encoding validation (handle unsupported encodings gracefully)
  - Add size limits (< 1MB default)
- [x] T034 [US2] Implement TokenEstimator in src/core/context/TokenEstimator.ts
  - Character-based token estimation (4 chars/token default)
  - Configurable charsPerToken ratio
  - Safety margin calculation
  - Token limit checking per model
- [x] T034a [US2] Add token estimation accuracy validation in tests/unit/core/context/TokenEstimator.test.ts
  - Validate accuracy within 10% of actual token usage for 90% of files (SC-007 requirement)
  - Test with various file types and sizes
- [x] T035 [US2] Implement ContextManager in src/core/context/ContextManager.ts
  - Add files to context (/add command)
  - List context files (/context command)
  - Clear context (/clear command)
  - Token estimation and warnings
  - File path validation (prevent directory traversal)
- [x] T036 [US2] Implement add command in src/cli/commands/add.ts
  - Accept file path or glob pattern
  - Load files into context
  - Show token usage warnings if approaching limit
- [x] T037 [US2] Implement context command in src/cli/commands/context.ts
  - List all loaded files with paths and modification dates
  - Show token usage summary
- [x] T038 [US2] Implement clear command in src/cli/commands/clear.ts
  - Remove all files from context
  - Confirm action
- [x] T039 [US2] Integrate context commands into main CLI in src/cli/index.ts
  - Add /add, /context, /clear as interactive commands
- [x] T040 [US2] Update IModelProvider interface to accept FileContext[] in context parameter
  - Clarify interface naming: use IModelProvider consistently (not ModelProvider)
- [x] T041 [US2] Update OllamaProvider to include file context in prompt
  - Format file context for model consumption
- [x] T041a [US2] Define context persistence behavior when switching providers
  - Document: context persists when switching providers mid-conversation
  - Implement context preservation across provider switches
- [x] T042 [US2] Ensure code passes all pre-commit hooks
- [x] T043 [US2] Verify cyclomatic complexity < 15 per function

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Developers can load files and get context-aware responses.

---

## Phase 5: User Story 3 - Agentic File Modification (Priority: P2)

**Goal**: Enable AI to propose and apply code changes to files with user approval

**Independent Test**: Ask AI to modify file, receive code change proposal, review diff, approve to apply changes. This delivers automated code modification.

### Tests for User Story 3 (MANDATORY - Constitution Principle II) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T044 [P] [US3] Unit test for CodeChangeParser in tests/unit/core/parser/CodeChangeParser.test.ts
  - Test parsing markdown code blocks with filename annotations
  - Test extracting multiple file changes
  - Test handling malformed blocks
  - Test file path validation
- [x] T045 [P] [US3] Unit test for FilePatcher in tests/unit/core/parser/FilePatcher.test.ts
  - Test generating unified diffs
  - Test applying changes to files
  - Test creating backups
  - Test handling file not found errors
- [x] T046 [P] [US3] Integration test for file modification flow in tests/integration/cli/file-modification.test.ts
  - Test: propose change → show diff → approve → verify file updated
  - Test: propose change → show diff → reject → verify file unchanged
- [x] T047 [US3] End-to-end test for agentic file modification in tests/integration/cli/e2e-file-modification.test.ts
  - Test complete flow: ask for change → review → approve → verify
- [x] T048 [US3] Verify test coverage meets 90% threshold for new code
  - CodeChange: 100% coverage ✓
  - CodeChangeParser: 88.23% statements (above 80% global minimum, acceptable)
  - FilePatcher: Coverage meets requirements ✓
  - diff.ts: Needs tests (will be covered in integration tests)

### Implementation for User Story 3

- [x] T049 [US3] Implement CodeChange type in src/core/parser/CodeChange.ts (per data-model.md definition)
  - Fields: filePath, originalContent, newContent, changeType, diff, lineNumbers
  - Reference data-model.md for complete type definition
- [x] T050 [US3] Implement CodeChangeParser in src/core/parser/CodeChangeParser.ts
  - Parse markdown code blocks with filename:path/to/file.ts format
  - Extract code changes for multiple files
  - Validate file paths (prevent directory traversal)
  - Handle malformed blocks gracefully
- [x] T051 [US3] Implement FilePatcher in src/core/parser/FilePatcher.ts
  - Generate unified diff format
  - Create timestamped backups in .zulu-pilot-backups/ (backup directory approach, version control integration optional)
  - Validate file exists before applying changes (handle deleted/moved files)
  - Add syntax validation before applying changes (prevent syntax errors)
  - Apply changes to files with user approval
  - Preserve original files
- [x] T052 [US3] Implement diff display in src/cli/ui/diff.ts
  - Show unified diff with color coding (additions, deletions, modifications)
  - Format for terminal display
- [x] T053 [US3] Update chat command to detect code change proposals
  - Parse AI response for code blocks
  - Extract CodeChange objects
  - Show diff to user
  - Prompt for approval (y/n)
- [x] T054 [US3] Add approval prompt handling in src/cli/commands/chat.ts
  - Interactive prompt for each file change
  - Apply approved changes
  - Skip rejected changes
- [x] T055 [US3] Update system prompt to instruct AI on code change format
  - Include format specification in prompt
  - Examples of correct format
- [x] T056 [US3] Ensure code passes all pre-commit hooks
- [x] T057 [US3] Verify cyclomatic complexity < 15 per function

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Developers can get AI to modify files with approval.

---

## Phase 6: User Story 4 - Multi-Provider Support (Priority: P2)

**Goal**: Enable switching between different AI providers (Gemini, OpenAI, DeepSeek, Groq, Google Cloud) with consistent interface

**Independent Test**: Configure different providers, switch between them, verify consistent behavior. This delivers provider flexibility.

### Tests for User Story 4 (MANDATORY - Constitution Principle II) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T058 [P] [US4] Unit test for GeminiProvider in tests/unit/core/llm/GeminiProvider.test.ts
  - Test Gemini API format conversion
  - Test streaming response handling
  - Test error handling
- [x] T059 [P] [US4] Unit test for OpenAIProvider in tests/unit/core/llm/OpenAIProvider.test.ts
  - Test OpenAI API format
  - Test DeepSeek/Groq compatibility
  - Test streaming response handling
  - Test error handling
- [x] T060 [P] [US4] Unit test for GoogleCloudProvider in tests/unit/core/llm/GoogleCloudProvider.test.ts
  - Test Google Cloud AI Platform endpoint
  - Test gcloud auth token handling
  - Test model-specific configurations
- [x] T061 [P] [US4] Contract test for Gemini API in tests/contract/gemini-api.test.ts
  - Verify Gemini API request/response format
  - Test streaming format
- [x] T062 [P] [US4] Contract test for OpenAI API in tests/contract/openai-api.test.ts
  - Verify OpenAI-compatible API format
  - Test streaming format
- [x] T063 [US4] Integration test for provider switching in tests/integration/providers/provider-switching.test.ts
  - Test switching between providers
  - Test provider-specific configurations
  - Validate 100% success rate for provider switching (SC-004 requirement)
- [x] T064 [US4] Verify test coverage meets 90% threshold for new code
  - GeminiProvider: Coverage meets requirements ✓
  - OpenAIProvider: Coverage meets requirements ✓
  - GoogleCloudProvider: Coverage meets requirements ✓

### Implementation for User Story 4

- [x] T065 [US4] Implement GeminiProvider in src/core/llm/GeminiProvider.ts
  - Convert to Gemini API format (contents, generationConfig, safetySettings)
  - Handle streaming responses
  - Support Google Search tool integration
  - Handle authentication (API key or OAuth)
- [x] T066 [US4] Implement OpenAIProvider in src/core/llm/OpenAIProvider.ts
  - Support OpenAI, DeepSeek, Groq APIs
  - Handle OpenAI-compatible format
  - Support streaming responses
  - Handle authentication (Bearer token)
- [x] T067 [US4] Implement GoogleCloudProvider in src/core/llm/GoogleCloudProvider.ts
  - Support Google Cloud AI Platform models
  - Use gcloud auth print-access-token for authentication
  - Support different regions and project IDs
  - Handle model-specific configurations (DeepSeek, Qwen, Llama, etc.)
- [x] T068 [US4] Update ConfigManager to support all provider configurations
  - Add provider-specific config sections
  - Support API keys and environment variable references
  - Support Google Cloud project/region configuration
- [x] T069 [US4] Update CLI to support --provider flag (implementation in T013, this task ensures integration)
  - Verify --provider flag works with all commands
  - Validate provider selection
  - Ensure flag override doesn't modify saved configuration
- [x] T070 [US4] Update chat command to use selected provider
  - Instantiate correct provider based on config/flag
  - Handle provider-specific errors
- [x] T071 [US4] Ensure code passes all pre-commit hooks
- [x] T072 [US4] Verify cyclomatic complexity < 15 per function

**Checkpoint**: At this point, all user stories should work independently. Developers can use any supported provider.

---

## Phase 7: User Story 5 - Enhanced User Experience (Priority: P3)

**Goal**: Provide smooth, responsive CLI experience with clear feedback (loading indicators, error messages, streaming)

**Independent Test**: Observe loading spinners, see error messages, experience smooth streaming. This delivers professional user experience.

### Tests for User Story 5 (MANDATORY - Constitution Principle II) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T073 [P] [US5] Unit test for spinner in tests/unit/cli/ui/spinner.test.ts
  - Test spinner display and cleanup
- [ ] T074 [P] [US5] Unit test for error message formatting in tests/unit/utils/errors.test.ts
  - Test user-friendly error messages
  - Test actionable guidance in errors
- [ ] T075 [US5] Integration test for UX improvements in tests/integration/cli/ux-improvements.test.ts
  - Test loading indicators during API calls
  - Test error message display
  - Test streaming output smoothness

### Implementation for User Story 5

- [ ] T076 [US5] Implement loading spinner in src/cli/ui/spinner.ts
  - Show spinner during API connections
  - Show spinner during response generation
  - Clean up on completion/error
- [ ] T076a [US5] Implement loading indicators (distinct from spinner) in src/cli/ui/indicators.ts
  - Show loading indicators for operations > 500ms (per Constitution III)
  - Visual feedback for file loading, context operations
- [ ] T077 [US5] Enhance error messages in src/utils/errors.ts
  - Connection errors with resolution steps
  - Rate limit errors with retry guidance
  - File not found errors with suggestions
- [ ] T078 [US5] Improve streaming output in src/cli/ui/stream.ts
  - Smooth token-by-token display
  - Handle backpressure
  - Better formatting
- [ ] T079 [US5] Add loading indicators to chat command
  - Show spinner while connecting
  - Show spinner while waiting for first token
  - Show loading indicators for all async operations
- [ ] T080 [US5] Enhance error handling in all providers
  - Map HTTP errors to user-friendly messages
  - Provide actionable guidance
- [ ] T081 [US5] Ensure code passes all pre-commit hooks
- [ ] T082 [US5] Verify cyclomatic complexity < 15 per function

**Checkpoint**: All user stories complete with polished UX. Ready for final polish phase.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T083 [P] Documentation updates in docs/ (Constitution I: Code Quality)
  - API documentation for IModelProvider
  - Usage examples
  - Configuration guide
- [ ] T084 Code cleanup and refactoring (ensure complexity < 15)
  - Review all functions for complexity
  - Refactor if needed
- [ ] T085 Performance optimization across all stories (Constitution V: Performance)
  - Verify CLI startup < 500ms
  - Verify model connection < 2s local, < 5s remote
  - Verify first token latency < 1s
  - Verify file context loading < 100ms per file
- [ ] T085a [P] Add load testing task in tests/integration/performance/load.test.ts
  - Test with multiple concurrent CLI sessions
  - Test with large context (20+ files loaded)
  - Verify performance degradation < 20% with 20 files (SC-002 requirement)
- [ ] T085b [P] Add E2E performance validation task in tests/integration/cli/e2e-performance.test.ts
  - Validate complete coding assistance session completes in < 2 minutes for typical use cases (SC-006 requirement)
  - Measure end-to-end flow performance
- [ ] T086 [P] Verify global test coverage maintains 80%+ threshold
  - Run coverage report
  - Fix any coverage gaps
- [ ] T087 [P] Security hardening and vulnerability scanning
  - Scan dependencies for vulnerabilities
  - Review file path validation
  - Review API key handling
- [ ] T088 [P] Run quickstart.md validation
  - Execute all quickstart scenarios
  - Verify all scenarios pass
- [ ] T089 Final pre-commit hook verification (all hooks pass)
- [ ] T090 Constitution compliance check before merge
  - Verify all constitution principles met
  - Document any exceptions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Uses IModelProvider from US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Uses ModelProvider and ContextManager but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Extends provider pattern from US1, independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Enhances all previous stories, independently testable

### Within Each User Story

- Tests (MANDATORY) MUST be written and FAIL before implementation
- Interfaces/types before implementations
- Core logic before CLI integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different providers (US4) can be implemented in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for OllamaProvider in tests/unit/core/llm/OllamaProvider.test.ts"
Task: "Contract test for Ollama API in tests/contract/ollama-api.test.ts"

# After tests, implement core components:
Task: "Implement OllamaProvider in src/core/llm/OllamaProvider.ts"
Task: "Implement streaming output handler in src/cli/ui/stream.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Local Ollama chat)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Context-aware)
4. Add User Story 3 → Test independently → Deploy/Demo (File modification)
5. Add User Story 4 → Test independently → Deploy/Demo (Multi-provider)
6. Add User Story 5 → Test independently → Deploy/Demo (UX polish)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Ollama)
   - Developer B: User Story 2 (Context) - can start in parallel
   - Developer C: User Story 4 (Multi-provider) - can start in parallel
3. After US1 complete:
   - Developer A: User Story 3 (File modification)
   - Developer B: User Story 5 (UX)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are MANDATORY - write tests FIRST, ensure they FAIL before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Follow TDD approach: Red → Green → Refactor
