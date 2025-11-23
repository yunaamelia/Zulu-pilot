---
description: 'Task list for Zulu Pilot v2 - Multi-Provider AI Coding Assistant dengan Gemini CLI Foundation'
---

# Tasks: Zulu Pilot v2 - Multi-Provider AI Coding Assistant dengan Gemini CLI Foundation

**Input**: Design documents from `/specs/002-gemini-cli-rebuild/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED per Constitution - Test-Coverage-Mandatory. All tasks include test requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `packages/cli/`, `packages/core/`, `packages/adapter/`, `packages/providers/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/contract/`, `tests/e2e/`
- **Root config**: `package.json`, `tsconfig.json`, `.eslintrc.js`, `.prettierrc`

## Dependencies & Story Completion Order

**Critical Path**:

1. Phase 1 (Setup) → Phase 2 (Foundational) → MUST complete before any user stories
2. US1 (Interactive Chat) → Blocks US2, US3 (needs basic chat working)
3. US4 (Multi-Provider) → Enables all other stories to use multiple providers
4. US12 (Error Handling) → Should be implemented alongside other stories

**Independent Stories** (can be implemented in parallel after Phase 2):

- US2 (File Operations) - depends on US1
- US3 (Context Management) - depends on US1
- US5 (Google Search) - depends on US1, US4
- US6 (MCP Servers) - depends on US1, US4
- US7 (Code Changes) - depends on US1, US2
- US8 (Checkpoints) - depends on US1, US3
- US9 (Custom Context Files) - depends on US1, US3
- US10 (Model Config) - depends on US4
- US11 (Headless Mode) - depends on US1

## Implementation Strategy

**MVP Scope**: Phase 1 + Phase 2 + US1 (Interactive Chat) + US4 (Multi-Provider) + US12 (Error Handling)

**Incremental Delivery**:

- Week 1-2: Setup + Foundation
- Week 3-4: MVP (US1, US4, US12)
- Week 5-6: Core features (US2, US3)
- Week 7-8: Advanced tools (US5, US6, US7)
- Week 9-10: Advanced features (US8, US9, US10, US11)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic monorepo structure

- [x] T001 Create root package.json with workspaces configuration in package.json
- [x] T002 Create root tsconfig.json with base TypeScript configuration in tsconfig.json
- [x] T003 [P] Create root .eslintrc.js with ESLint 9 flat config in .eslintrc.js
- [x] T004 [P] Create root .prettierrc with Prettier configuration in .prettierrc
- [x] T005 [P] Create root jest.config.js with Jest configuration in jest.config.js
- [x] T006 [P] Create .husky directory and pre-commit hook in .husky/pre-commit
- [x] T007 [P] Create .husky/pre-push hook in .husky/pre-push
- [x] T008 [P] Create .husky/commit-msg hook in .husky/commit-msg
- [x] T009 [P] Create .lintstagedrc.json with lint-staged configuration in .lintstagedrc.json
- [x] T010 [P] Configure git-secrets in pre-commit hook for secret detection in .husky/pre-commit
- [x] T011 [P] Configure npm audit in pre-commit hook for dependency vulnerability scanning in .husky/pre-commit
- [x] T012 Create packages/ directory structure (cli, core, adapter, providers) in packages/
- [x] T013 Create tests/ directory structure (unit, integration, contract, e2e) in tests/
- [x] T014 Create scripts/ directory for build scripts in scripts/
- [x] T015 Clone Gemini CLI repository and study architecture (document findings)
- [x] T016 Identify Gemini CLI integration points (create integration-points.md)

**Checkpoint**: Monorepo structure ready, dependencies configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Configuration System

- [x] T017 [P] Create UnifiedConfiguration interface in packages/core/src/config/UnifiedConfiguration.ts
- [x] T018 [P] Create ProviderConfiguration interface in packages/core/src/config/ProviderConfiguration.ts
- [x] T019 [P] Create UnifiedConfigManager class in packages/core/src/config/UnifiedConfigManager.ts
- [x] T020 [P] Implement config loading from ~/.zulu-pilotrc in packages/core/src/config/UnifiedConfigManager.ts
- [x] T021 [P] Implement config validation using JSON schema in packages/core/src/config/UnifiedConfigManager.ts
- [x] T022 [P] Implement config saving with atomic writes in packages/core/src/config/UnifiedConfigManager.ts
- [x] T023 [P] [P] Write unit tests for UnifiedConfigManager in tests/unit/config/UnifiedConfigManager.test.ts (90%+ coverage)

### Provider Interface & Registry

- [x] T024 [P] Create IModelProvider interface in packages/providers/src/IModelProvider.ts
- [x] T025 [P] Create ProviderRegistry class in packages/adapter/src/ProviderRegistry.ts
- [x] T026 [P] Implement provider registration in packages/adapter/src/ProviderRegistry.ts
- [x] T027 [P] Implement provider retrieval with lazy initialization in packages/adapter/src/ProviderRegistry.ts
- [x] T028 [P] [P] Write unit tests for ProviderRegistry in tests/unit/adapter/ProviderRegistry.test.ts (90%+ coverage)

### Multi-Provider Router

- [x] T029 [P] Create MultiProviderRouter class in packages/adapter/src/MultiProviderRouter.ts
- [x] T030 [P] Implement model ID parsing (provider:model format) in packages/adapter/src/MultiProviderRouter.ts
- [x] T031 [P] Implement provider routing logic in packages/adapter/src/MultiProviderRouter.ts
- [x] T032 [P] Implement provider switching in packages/adapter/src/MultiProviderRouter.ts
- [x] T033 [P] [P] Write unit tests for MultiProviderRouter in tests/unit/adapter/MultiProviderRouter.test.ts (95%+ coverage)

### Model Adapter Layer

- [x] T034 [P] Create IModelAdapter interface in packages/adapter/src/interfaces/IModelAdapter.ts
- [x] T035 [P] Create GeminiCLIModelAdapter class in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T036 [P] Implement request format conversion (Gemini CLI → Provider) in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T037 [P] Implement response format conversion (Provider → Gemini CLI) in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T038 [P] Implement generateContent method in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T039 [P] Implement streamGenerateContent method in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T040 [P] [P] Write unit tests for GeminiCLIModelAdapter in tests/unit/adapter/GeminiCLIModelAdapter.test.ts (95%+ coverage)

### Fork Gemini CLI Packages

- [x] T041 Fork Gemini CLI packages/cli to packages/cli using git subtree
- [x] T042 Fork Gemini CLI packages/core to packages/core using git subtree
- [x] T043 Modify createContentGenerator in packages/core/src/core/contentGenerator.ts to use GeminiCLIModelAdapter
- [x] T044 [P] Write integration tests for Gemini CLI core integration in tests/integration/core/ModelManager.test.ts

### Basic Provider Implementation (Ollama POC)

- [x] T045 [P] Port OllamaProvider from current Zulu Pilot to packages/providers/src/OllamaProvider.ts
- [x] T046 [P] Implement IModelProvider interface in packages/providers/src/OllamaProvider.ts
- [x] T047 [P] Implement streamResponse method in packages/providers/src/OllamaProvider.ts
- [x] T048 [P] Implement generateResponse method in packages/providers/src/OllamaProvider.ts
- [x] T049 [P] [P] Write unit tests for OllamaProvider in tests/unit/providers/OllamaProvider.test.ts (90%+ coverage)
- [x] T050 [P] Write integration tests for adapter + OllamaProvider in tests/integration/adapter-providers/OllamaAdapter.test.ts

**Checkpoint**: Foundation ready - adapter layer working with Ollama provider, user story implementation can now begin

---

## Phase 3: User Story 1 - Interactive Chat dengan Custom Model (Priority: P1) 🎯 MVP

**Goal**: Developer bisa memulai interactive chat session dengan model pribadi mereka dan mendapatkan semua fitur interactive chat dari Gemini CLI

**Independent Test**: Developer bisa menjalankan `zulu-pilot` di terminal, memilih model mereka, dan melakukan interactive chat. Semua fitur interactive chat dari Gemini CLI harus bekerja (history, context, streaming, dll).

### Tests for User Story 1

- [x] T051 [P] [US1] Write contract test for model interface in tests/contract/model-interface.test.ts
- [x] T052 [P] [US1] Write integration test for interactive chat flow in tests/integration/cli/interactive-chat.test.ts
- [x] T053 [P] [US1] Write E2E test for complete chat session in tests/e2e/full-workflows/interactive-chat.test.ts

### Implementation for User Story 1

- [x] T054 [P] [US1] Create ChatCommand class in packages/cli/src/commands/chat.ts
- [x] T055 [US1] Implement interactive chat loop in packages/cli/src/commands/chat.ts
- [x] T056 [US1] Integrate adapter with Gemini CLI core for chat in packages/cli/src/commands/chat.ts
- [x] T057 [US1] Implement conversation history management in packages/core/src/conversation/ConversationManager.ts
- [x] T058 [US1] Implement real-time streaming output in packages/cli/src/ui/StreamOutput.ts (token interval < 100ms, no buffering delays > 500ms per FR-018)
- [x] T059 [US1] Implement loading indicators during API calls in packages/cli/src/ui/Spinner.ts
- [x] T060 [US1] Implement thinking process display for models with reasoning capabilities in packages/cli/src/ui/ThinkingDisplay.ts (display with `[thinking]` prefix or dimmed text, toggle visibility per FR-019)
- [x] T061 [US1] Implement graceful degradation for unsupported features in packages/cli/src/ui/FeatureDegradation.ts (display clear message: "Feature X not available with provider Y" per FR-020)
- [x] T062 [US1] Add provider selection in chat command in packages/cli/src/commands/chat.ts
- [x] T063 [US1] Add model selection in chat command in packages/cli/src/commands/chat.ts
- [x] T064 [US1] Write unit tests for ChatCommand in tests/unit/cli/commands/chat.test.ts (90%+ coverage)

**Checkpoint**: User Story 1 complete - interactive chat working with custom models

---

## Phase 4: User Story 2 - File Operations dengan Custom Models (Priority: P1)

**Goal**: Developer bisa menggunakan semua file operations dari Gemini CLI (read, write, edit, search files) dengan model pribadi mereka

**Independent Test**: Developer bisa meminta AI untuk read file, edit file, create new file, atau search across files, dan semua operasi ini bekerja dengan model pribadi mereka.

### Tests for User Story 2

- [x] T065 [P] [US2] Write integration test for file read operation in tests/integration/tools/file-read.test.ts
- [x] T066 [P] [US2] Write integration test for file write operation in tests/integration/tools/file-write.test.ts
- [x] T067 [P] [US2] Write integration test for file search operation in tests/integration/tools/file-search.test.ts
- [x] T068 [P] [US2] Write E2E test for file operations workflow in tests/e2e/full-workflows/file-operations.test.ts

### Implementation for User Story 2

- [x] T069 [US2] Verify Gemini CLI file operations tools work with custom adapter in packages/core/src/tools/FileOperationsTool.ts
- [x] T070 [US2] Test ReadFileTool with custom providers in tests/integration/tools/ReadFileTool.test.ts
- [x] T071 [US2] Test WriteFileTool with custom providers in tests/integration/tools/WriteFileTool.test.ts
- [x] T072 [US2] Test GlobTool (file search) with custom providers in tests/integration/tools/GlobTool.test.ts
- [x] T073 [US2] Ensure all file operations tools route through adapter correctly in tests/integration/tools/FileOperationsRouting.test.ts

**Checkpoint**: User Story 2 complete - all file operations work with custom models

---

## Phase 5: User Story 3 - Context Management dengan Multiple Files (Priority: P1)

**Goal**: Developer bisa menambahkan multiple files ke context, manage context (list, clear, add more), dan AI akan menggunakan context ini untuk memberikan answers yang lebih accurate

**Independent Test**: Developer bisa add files ke context, list context, clear context, dan AI menggunakan context tersebut dalam responses.

### Tests for User Story 3

- [x] T074 [P] [US3] Write unit tests for FileContext entity in tests/unit/core/context/FileContext.test.ts
- [x] T075 [P] [US3] Write unit tests for ContextManager in tests/unit/core/context/ContextManager.test.ts
- [x] T076 [P] [US3] Write integration test for add command in tests/integration/cli/add-command.test.ts
- [x] T077 [P] [US3] Write integration test for context command in tests/integration/cli/context-command.test.ts
- [x] T078 [P] [US3] Write integration test for clear command in tests/integration/cli/clear-command.test.ts
- [x] T079 [P] [US3] Write E2E test for context management workflow in tests/e2e/full-workflows/context-management.test.ts

### Implementation for User Story 3

- [x] T080 [P] [US3] Port FileContext interface from current Zulu Pilot to packages/core/src/context/FileContext.ts
- [x] T081 [P] [US3] Port ContextManager from current Zulu Pilot to packages/core/src/context/ContextManager.ts
- [x] T082 [P] [US3] Port TokenEstimator from current Zulu Pilot to packages/core/src/context/TokenEstimator.ts
- [x] T083 [US3] Create AddCommand class in packages/cli/src/commands/add.ts
- [x] T084 [US3] Implement file path validation with directory traversal prevention in packages/cli/src/commands/add.ts (reject paths with `../`, absolute paths outside base directory, validate against allowed directories per FR-016)
- [x] T085 [US3] Implement glob pattern support in packages/cli/src/commands/add.ts
- [x] T086 [US3] Implement token estimation and warnings in packages/cli/src/commands/add.ts
- [x] T087 [US3] Create ContextCommand class in packages/cli/src/commands/context.ts
- [x] T088 [US3] Implement context listing with metadata in packages/cli/src/commands/context.ts
- [x] T089 [US3] Create ClearCommand class in packages/cli/src/commands/clear.ts
- [x] T090 [US3] Implement context clearing with confirmation in packages/cli/src/commands/clear.ts
- [x] T091 [US3] Integrate context with adapter for prompt generation in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T092 [US3] Write unit tests for AddCommand in tests/unit/cli/commands/add.test.ts (90%+ coverage)
- [x] T093 [US3] Write unit tests for ContextCommand in tests/unit/cli/commands/context.test.ts (90%+ coverage)
- [x] T094 [US3] Write unit tests for ClearCommand in tests/unit/cli/commands/clear.test.ts (90%+ coverage)

**Checkpoint**: User Story 3 complete - context management working with custom models

---

## Phase 6: User Story 4 - Multi-Provider Support dengan Easy Switching (Priority: P1)

**Goal**: Developer bisa configure multiple AI providers dan switch antar providers dengan mudah tanpa kehilangan context atau features

**Independent Test**: Developer bisa configure multiple providers, switch provider dengan command atau config, dan semua tools tetap bekerja dengan provider yang dipilih.

### Tests for User Story 4

- [x] T095 [P] [US4] Write unit tests for provider configuration in tests/unit/config/ProviderConfiguration.test.ts
- [x] T096 [P] [US4] Write integration test for provider switching in tests/integration/cli/provider-switching.test.ts
- [x] T097 [P] [US4] Write E2E test for multi-provider workflow in tests/e2e/provider-switching/multi-provider.test.ts

### Implementation for User Story 4

- [x] T098 [P] [US4] Port OpenAIProvider from current Zulu Pilot to packages/providers/src/OpenAIProvider.ts
- [x] T099 [P] [US4] Port GoogleCloudProvider from current Zulu Pilot to packages/providers/src/GoogleCloudProvider.ts
- [x] T100 [P] [US4] Port GeminiProvider from current Zulu Pilot to packages/providers/src/GeminiProvider.ts
- [x] T101 [P] [US4] Implement request/response conversion for OpenAI in packages/adapter/src/converters/OpenAIConverter.ts
- [x] T102 [P] [US4] Implement request/response conversion for Google Cloud in packages/adapter/src/converters/GoogleCloudConverter.ts
- [x] T103 [P] [US4] Implement request/response conversion for Gemini in packages/adapter/src/converters/GeminiConverter.ts
- [x] T104 [US4] Create ProviderCommand class in packages/cli/src/commands/provider.ts
- [x] T105 [US4] Implement provider list functionality in packages/cli/src/commands/provider.ts
- [x] T106 [US4] Implement provider set functionality in packages/cli/src/commands/provider.ts
- [x] T107 [US4] Implement provider config functionality in packages/cli/src/commands/provider.ts
- [x] T108 [US4] Implement provider switching in interactive chat in packages/cli/src/commands/chat.ts
- [x] T109 [US4] Ensure context persists across provider switches in packages/core/src/conversation/ConversationManager.ts
- [x] T110 [US4] Write unit tests for ProviderCommand in tests/unit/cli/commands/provider.test.ts (90%+ coverage)
- [x] T111 [US4] Write integration tests for all providers in tests/integration/providers/all-providers.test.ts

**Checkpoint**: User Story 4 complete - multi-provider support working with easy switching

---

## Phase 7: User Story 12 - Error Handling & User-Friendly Messages (Priority: P1)

**Goal**: Aplikasi harus handle errors gracefully dan provide user-friendly, actionable error messages

**Independent Test**: Developer bisa encounter various error scenarios (invalid API key, model not found, network error, dll) dan mendapatkan clear, actionable error messages.

### Tests for User Story 12

- [x] T112 [P] [US12] Write unit tests for error types in tests/unit/utils/errors.test.ts
- [x] T113 [P] [US12] Write integration test for invalid API key error in tests/integration/errors/invalid-api-key.test.ts
- [x] T114 [P] [US12] Write integration test for connection error in tests/integration/errors/connection-error.test.ts
- [x] T115 [P] [US12] Write integration test for model not found error in tests/integration/errors/model-not-found.test.ts
- [x] T116 [P] [US12] Write integration test for rate limit error in tests/integration/errors/rate-limit.test.ts

### Implementation for User Story 12

- [x] T117 [P] [US12] Port error types from current Zulu Pilot to packages/core/src/utils/errors.ts
- [x] T118 [P] [US12] Implement ConnectionError with user-friendly messages in packages/core/src/utils/errors.ts
- [x] T119 [P] [US12] Implement RateLimitError with retry guidance in packages/core/src/utils/errors.ts
- [x] T120 [P] [US12] Implement ValidationError with actionable guidance in packages/core/src/utils/errors.ts
- [x] T121 [US12] Implement error handling in adapter layer in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T122 [US12] Implement error handling in all providers in packages/providers/src/\*_/_.ts
- [x] T123 [US12] Implement error display in CLI with actionable guidance in packages/cli/src/ui/ErrorDisplay.ts
- [x] T124 [US12] Add provider-specific error messages in packages/adapter/src/errorHandlers/ProviderErrorHandler.ts
- [x] T125 [US12] Write unit tests for error handling in tests/unit/utils/errors.test.ts (90%+ coverage)

**Checkpoint**: User Story 12 complete - comprehensive error handling with user-friendly messages

---

## Phase 8: User Story 10 - Provider-Specific Model Configuration (Priority: P2)

**Goal**: Developer bisa configure specific models untuk each provider, set default models, dan switch models dengan mudah

**Independent Test**: Developer bisa configure models untuk each provider, set defaults, list available models, dan switch models.

### Tests for User Story 10

- [x] T126 [P] [US10] Write unit tests for model configuration in tests/unit/config/ModelConfiguration.test.ts
- [x] T127 [P] [US10] Write integration test for model listing in tests/integration/cli/model-list.test.ts
- [x] T128 [P] [US10] Write integration test for model switching in tests/integration/cli/model-switch.test.ts

### Implementation for User Story 10

- [x] T129 [P] [US10] Enhance ModelCommand class in packages/cli/src/commands/model.ts
- [x] T130 [US10] Implement model list functionality per provider in packages/cli/src/commands/model.ts
- [x] T131 [US10] Implement model set functionality per provider in packages/cli/src/commands/model.ts
- [x] T132 [US10] Implement model discovery for Ollama in packages/providers/src/OllamaProvider.ts
- [x] T133 [US10] Implement model discovery for OpenAI in packages/providers/src/OpenAIProvider.ts
- [x] T134 [US10] Implement model discovery for Google Cloud in packages/providers/src/GoogleCloudProvider.ts
- [x] T135 [US10] Add setModel method to IModelProvider interface in packages/providers/src/IModelProvider.ts
- [x] T136 [US10] Add getModel method to IModelProvider interface in packages/providers/src/IModelProvider.ts
- [x] T137 [US10] Implement model switching in adapter in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T138 [US10] Write unit tests for ModelCommand in tests/unit/cli/commands/model.test.ts (90%+ coverage)

**Checkpoint**: User Story 10 complete - model configuration working per provider

---

## Phase 9: User Story 5 - Google Search Integration dengan Custom Models (Priority: P2)

**Goal**: Developer bisa menggunakan Google Search tool dari Gemini CLI dengan model pribadi mereka

**Independent Test**: Developer bisa enable Google Search, bertanya tentang current events atau latest information, dan AI menggunakan Google Search untuk mendapatkan informasi terkini.

### Tests for User Story 5

- [x] T139 [P] [US5] Write integration test for Google Search tool in tests/integration/tools/google-search.test.ts
- [x] T140 [P] [US5] Write E2E test for Google Search workflow in tests/e2e/full-workflows/google-search.test.ts

### Implementation for User Story 5

- [x] T141 [US5] Verify Google Search tool works with custom adapter in packages/core/src/tools/GoogleSearchTool.ts
- [x] T142 [US5] Test Google Search tool with all providers in tests/integration/tools/GoogleSearchTool.test.ts
- [x] T143 [US5] Implement graceful degradation for providers without Google Search in packages/adapter/src/GeminiCLIModelAdapter.ts
- [x] T144 [US5] Add Google Search configuration in UnifiedConfiguration in packages/core/src/config/UnifiedConfiguration.ts

**Checkpoint**: User Story 5 complete - Google Search working with custom models

---

## Phase 10: User Story 6 - MCP Server Integration dengan Custom Models (Priority: P2)

**Goal**: Developer bisa menggunakan MCP servers dari Gemini CLI dengan model pribadi mereka

**Independent Test**: Developer bisa configure MCP servers, menggunakan tools dari MCP servers, dan AI menggunakan tools tersebut dengan model pribadi mereka.

### Tests for User Story 6

- [x] T145 [P] [US6] Write integration test for MCP server connection in tests/integration/mcp/server-connection.test.ts
- [x] T146 [P] [US6] Write integration test for MCP tool execution in tests/integration/mcp/tool-execution.test.ts
- [x] T147 [P] [US6] Write E2E test for MCP workflow in tests/e2e/full-workflows/mcp-integration.test.ts

### Implementation for User Story 6

- [x] T148 [US6] Verify MCP server integration works with custom adapter in packages/core/src/mcp/MCPServerManager.ts
- [x] T149 [US6] Test MCP servers with custom providers in tests/integration/mcp/MCPServerManager.test.ts
- [x] T150 [US6] Implement MCP server configuration in UnifiedConfiguration in packages/core/src/config/UnifiedConfiguration.ts
- [x] T151 [US6] Add MCP server management commands in packages/cli/src/commands/mcp.ts

**Checkpoint**: User Story 6 complete - MCP servers working with custom models

---

## Phase 11: User Story 7 - Code Change Proposal & Approval Workflow (Priority: P2)

**Goal**: Developer bisa meminta AI untuk propose code changes, review changes dengan unified diff, approve atau reject changes, dan AI akan apply changes setelah approval

**Independent Test**: Developer bisa meminta code changes, melihat diff, approve/reject, dan changes di-apply sesuai dengan decision mereka.

### Tests for User Story 7

- [x] T152 [P] [US7] Write unit tests for CodeChangeProposal entity in tests/unit/core/parser/CodeChangeProposal.test.ts
- [x] T153 [P] [US7] Write unit tests for FilePatcher in tests/unit/core/parser/FilePatcher.test.ts
- [x] T154 [P] [US7] Write integration test for code change workflow in tests/integration/cli/code-change.test.ts
- [x] T155 [P] [US7] Write E2E test for code change approval workflow in tests/e2e/full-workflows/code-change.test.ts

### Implementation for User Story 7

- [x] T156 [P] [US7] Port CodeChangeProposal interface from current Zulu Pilot to packages/core/src/parser/CodeChangeProposal.ts
- [x] T157 [P] [US7] Port CodeChangeParser from current Zulu Pilot to packages/core/src/parser/CodeChangeParser.ts
- [x] T158 [P] [US7] Port FilePatcher from current Zulu Pilot to packages/core/src/parser/FilePatcher.ts
- [x] T159 [US7] Verify Gemini CLI code editing tools work with custom adapter in packages/core/src/tools/CodeEditTool.ts
- [x] T160 [US7] Implement diff display in CLI in packages/cli/src/ui/DiffDisplay.ts
- [x] T161 [US7] Implement approval/rejection workflow in packages/cli/src/commands/chat.ts
- [x] T162 [US7] Implement backup creation before file modification in packages/core/src/parser/FilePatcher.ts
- [x] T163 [US7] Implement syntax validation before applying changes in packages/core/src/parser/FilePatcher.ts
- [x] T164 [US7] Write unit tests for CodeChangeParser in tests/unit/core/parser/CodeChangeParser.test.ts (90%+ coverage)
- [x] T165 [US7] Write unit tests for FilePatcher in tests/unit/core/parser/FilePatcher.test.ts (90%+ coverage)

**Checkpoint**: User Story 7 complete - code change proposal and approval workflow working

---

## Phase 12: User Story 8 - Conversation Checkpointing & Resume (Priority: P3)

**Goal**: Developer bisa save conversation checkpoints, resume conversations dari checkpoint, dan maintain conversation history across sessions

**Independent Test**: Developer bisa save checkpoint, exit application, dan resume dari checkpoint dengan semua context dan history intact.

### Tests for User Story 8

- [ ] T166 [P] [US8] Write unit tests for ConversationCheckpoint entity in tests/unit/core/checkpoint/ConversationCheckpoint.test.ts
- [ ] T167 [P] [US8] Write unit tests for CheckpointManager in tests/unit/core/checkpoint/CheckpointManager.test.ts
- [ ] T168 [P] [US8] Write integration test for checkpoint save in tests/integration/cli/checkpoint-save.test.ts
- [ ] T169 [P] [US8] Write integration test for checkpoint resume in tests/integration/cli/checkpoint-resume.test.ts
- [ ] T170 [P] [US8] Write E2E test for checkpoint workflow in tests/e2e/full-workflows/checkpoint.test.ts

### Implementation for User Story 8

- [ ] T171 [P] [US8] Create ConversationCheckpoint interface in packages/core/src/checkpoint/ConversationCheckpoint.ts
- [ ] T172 [P] [US8] Create CheckpointManager class in packages/core/src/checkpoint/CheckpointManager.ts
- [ ] T173 [US8] Implement checkpoint saving to ~/.zulu-pilot/checkpoints/ in packages/core/src/checkpoint/CheckpointManager.ts
- [ ] T174 [US8] Implement checkpoint loading from files in packages/core/src/checkpoint/CheckpointManager.ts
- [ ] T175 [US8] Implement checkpoint listing in packages/core/src/checkpoint/CheckpointManager.ts
- [ ] T176 [US8] Create CheckpointCommand class in packages/cli/src/commands/checkpoint.ts
- [ ] T177 [US8] Implement checkpoint save command in packages/cli/src/commands/checkpoint.ts
- [ ] T178 [US8] Implement checkpoint list command in packages/cli/src/commands/checkpoint.ts
- [ ] T179 [US8] Implement checkpoint resume in chat command in packages/cli/src/commands/chat.ts
- [ ] T180 [US8] Implement checkpoint deletion in packages/cli/src/commands/checkpoint.ts
- [ ] T181 [US8] Write unit tests for CheckpointManager in tests/unit/core/checkpoint/CheckpointManager.test.ts (90%+ coverage)
- [ ] T182 [US8] Write unit tests for CheckpointCommand in tests/unit/cli/commands/checkpoint.test.ts (90%+ coverage)

**Checkpoint**: User Story 8 complete - conversation checkpointing working

---

## Phase 13: User Story 9 - Custom Context Files (GEMINI.md style) (Priority: P3)

**Goal**: Developer bisa create custom context files yang memberikan persistent context untuk project mereka

**Independent Test**: Developer bisa create `.zulu-pilot-context.md` atau similar file, dan AI akan menggunakan context dari file ini dalam semua conversations di project tersebut.

### Tests for User Story 9

- [ ] T183 [P] [US9] Write unit tests for ContextFileLoader in tests/unit/core/context/ContextFileLoader.test.ts
- [ ] T184 [P] [US9] Write integration test for context file loading in tests/integration/cli/context-file.test.ts
- [ ] T185 [P] [US9] Write E2E test for context file workflow in tests/e2e/full-workflows/context-file.test.ts

### Implementation for User Story 9

- [ ] T186 [P] [US9] Create ContextFileLoader class in packages/core/src/context/ContextFileLoader.ts
- [ ] T187 [US9] Implement context file discovery (project root and subdirectories) in packages/core/src/context/ContextFileLoader.ts
- [ ] T188 [US9] Implement context file loading and merging in packages/core/src/context/ContextFileLoader.ts
- [ ] T189 [US9] Integrate context files with conversation manager in packages/core/src/conversation/ConversationManager.ts
- [ ] T190 [US9] Add context file priority (subdirectory > root) in packages/core/src/context/ContextFileLoader.ts
- [ ] T191 [US9] Write unit tests for ContextFileLoader in tests/unit/core/context/ContextFileLoader.test.ts (90%+ coverage)

**Checkpoint**: User Story 9 complete - custom context files working

---

## Phase 14: User Story 11 - Headless Mode untuk Scripting & Automation (Priority: P3)

**Goal**: Developer bisa menggunakan aplikasi dalam headless/non-interactive mode untuk scripting dan automation

**Independent Test**: Developer bisa run `zulu-pilot -p "explain this code" --output-format json` dan mendapatkan structured response yang bisa di-parse oleh scripts.

### Tests for User Story 11

- [ ] T192 [P] [US11] Write integration test for headless mode in tests/integration/cli/headless-mode.test.ts
- [ ] T193 [P] [US11] Write E2E test for headless mode workflow in tests/e2e/full-workflows/headless-mode.test.ts

### Implementation for User Story 11

- [ ] T194 [US11] Add headless flag to ChatCommand in packages/cli/src/commands/chat.ts
- [ ] T195 [US11] Implement JSON output format in packages/cli/src/ui/OutputFormatter.ts
- [ ] T196 [US11] Implement stream-json output format in packages/cli/src/ui/OutputFormatter.ts
- [ ] T197 [US11] Implement non-interactive mode (no prompts) in packages/cli/src/commands/chat.ts
- [ ] T198 [US11] Add environment variable support for headless config in packages/core/src/config/UnifiedConfigManager.ts
- [ ] T199 [US11] Write unit tests for OutputFormatter in tests/unit/cli/ui/OutputFormatter.test.ts (90%+ coverage)

**Checkpoint**: User Story 11 complete - headless mode working

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, documentation, and cross-cutting improvements

### Documentation

- [ ] T200 [P] Write comprehensive README.md in README.md
- [ ] T201 [P] Write migration guide from Zulu Pilot v1 in docs/migration-guide.md
- [ ] T202 [P] Write API documentation in docs/api.md
- [ ] T203 [P] Write architecture documentation in docs/architecture.md
- [ ] T204 [P] Update quickstart guide in specs/002-gemini-cli-rebuild/quickstart.md

### Performance Optimization

- [ ] T205 [P] Optimize adapter request/response conversion in packages/adapter/src/GeminiCLIModelAdapter.ts
- [ ] T206 [P] Optimize context loading for large file sets in packages/core/src/context/ContextManager.ts
- [ ] T207 [P] Add caching for provider instances in packages/adapter/src/ProviderRegistry.ts
- [ ] T208 [P] Profile and optimize streaming performance in packages/cli/src/ui/StreamOutput.ts

### Additional Providers

- [ ] T209 [P] Implement DeepSeekProvider in packages/providers/src/DeepSeekProvider.ts
- [ ] T210 [P] Implement QwenProvider in packages/providers/src/QwenProvider.ts
- [ ] T211 [P] Write tests for DeepSeekProvider in tests/unit/providers/DeepSeekProvider.test.ts
- [ ] T212 [P] Write tests for QwenProvider in tests/unit/providers/QwenProvider.test.ts

### Quality Improvements

- [ ] T213 [P] Ensure all packages meet 90%+ coverage threshold
- [ ] T214 [P] Run full test suite and fix any failing tests
- [ ] T215 [P] Fix all ESLint warnings and errors
- [ ] T216 [P] Ensure all TypeScript strict mode checks pass
- [ ] T217 [P] Add missing JSDoc comments for public APIs
- [ ] T218 [P] Update CHANGELOG.md with all features

### CI/CD Setup

- [ ] T219 [P] Configure GitHub Actions workflow in .github/workflows/ci.yml
- [ ] T220 [P] Setup coverage reporting (Codecov/Coveralls) in CI
- [ ] T221 [P] Configure branch protection rules
- [ ] T222 [P] Setup automated deployment pipeline

**Checkpoint**: Project ready for release

---

## Parallel Execution Examples

### After Phase 2 (Foundation Complete)

**Parallel Group 1** (can run simultaneously):

- T058-T071 [US1]: Interactive Chat implementation
- T082-T096 [US3]: Context Management implementation
- T119-T127 [US12]: Error Handling implementation

**Parallel Group 2** (after US1 complete):

- T067-T075 [US2]: File Operations testing and verification
- T100-T113 [US4]: Multi-Provider implementation

### After MVP (US1, US4, US12 Complete)

**Parallel Group 3**:

- T128-T140 [US10]: Model Configuration
- T141-T146 [US5]: Google Search Integration
- T147-T153 [US6]: MCP Server Integration

**Parallel Group 4**:

- T154-T167 [US7]: Code Change Workflow
- T168-T184 [US8]: Checkpointing
- T185-T193 [US9]: Custom Context Files
- T194-T201 [US11]: Headless Mode

---

## Task Summary

**Total Tasks**: 222

**Tasks by Phase**:

- Phase 1 (Setup): 14 tasks
- Phase 2 (Foundational): 34 tasks
- Phase 3 (US1 - Interactive Chat): 14 tasks
- Phase 4 (US2 - File Operations): 9 tasks
- Phase 5 (US3 - Context Management): 21 tasks
- Phase 6 (US4 - Multi-Provider): 17 tasks
- Phase 7 (US12 - Error Handling): 14 tasks
- Phase 8 (US10 - Model Config): 13 tasks
- Phase 9 (US5 - Google Search): 6 tasks
- Phase 10 (US6 - MCP Servers): 7 tasks
- Phase 11 (US7 - Code Changes): 14 tasks
- Phase 12 (US8 - Checkpoints): 17 tasks
- Phase 13 (US9 - Context Files): 9 tasks
- Phase 14 (US11 - Headless Mode): 8 tasks
- Phase 15 (Polish): 23 tasks

**Tasks by User Story**:

- US1: 14 tasks
- US2: 9 tasks
- US3: 21 tasks
- US4: 17 tasks
- US5: 6 tasks
- US6: 7 tasks
- US7: 14 tasks
- US8: 17 tasks
- US9: 9 tasks
- US10: 13 tasks
- US11: 8 tasks
- US12: 14 tasks

**Parallel Opportunities**: 89 tasks marked with [P] can run in parallel

**MVP Scope** (Minimum Viable Product):

- Phase 1: Setup (14 tasks)
- Phase 2: Foundational (34 tasks)
- Phase 3: US1 - Interactive Chat (14 tasks)
- Phase 6: US4 - Multi-Provider (17 tasks)
- Phase 7: US12 - Error Handling (14 tasks)

**Total MVP Tasks**: 93 tasks

**Format Validation**: ✅ All tasks follow checklist format with [TaskID] [P?] [Story?] Description with file path
