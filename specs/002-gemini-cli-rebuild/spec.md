# Feature Specification: Zulu Pilot v2 - Multi-Provider AI Coding Assistant dengan Gemini CLI Foundation

**Feature Branch**: `002-gemini-cli-rebuild`  
**Created**: 2025-11-22  
**Status**: Draft  
**Input**: Rebuild Zulu Pilot dengan Gemini CLI sebagai pondasi, menggunakan semua tools dari Gemini CLI tapi dengan model pribadi (Ollama, OpenAI, Google Cloud, dll)

## Overview & Goals

### What We're Building

Zulu Pilot v2 adalah CLI coding assistant yang dibangun di atas Gemini CLI. Aplikasi ini memungkinkan developer menggunakan semua tools dan fitur dari Gemini CLI (file operations, Google Search, MCP servers, code editing, dll) sambil menggunakan model AI pribadi mereka sendiri, bukan hanya model Gemini.

### Why We're Building This

1. Developer ingin menggunakan model pribadi (Ollama lokal, OpenAI, Google Cloud, DeepSeek, dll) dengan tools yang sama seperti Gemini CLI.

2. Developer membutuhkan fleksibilitas untuk switch antar provider tanpa kehilangan fitur tools.

3. Developer ingin memanfaatkan ekosistem Gemini CLI (MCP servers, extensions, tools) dengan model yang mereka pilih.

4. Developer ingin kontrol penuh atas model yang digunakan sambil tetap mendapat benefit dari tools yang sudah mature di Gemini CLI.

### Core Value Proposition

"Semua tools dari Gemini CLI, dengan model pribadi Anda."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Interactive Chat dengan Custom Model (Priority: P1)

Developer bisa memulai interactive chat session dengan model pribadi mereka (Ollama, OpenAI, Google Cloud, dll) dan mendapatkan semua fitur interactive chat dari Gemini CLI seperti conversation history, context awareness, dan real-time streaming.

**Why this priority**: Ini adalah core functionality. Tanpa ini, aplikasi tidak bisa digunakan.

**Independent Test**: Developer bisa menjalankan `zulu-pilot` di terminal, memilih model mereka, dan melakukan interactive chat. Semua fitur interactive chat dari Gemini CLI harus bekerja (history, context, streaming, dll).

**Acceptance Scenarios**:

1. **Given** developer sudah configure Ollama provider dengan model `llama-3.1`, **When** mereka run `zulu-pilot` dan pilih Ollama, **Then** mereka bisa chat interactively dengan model llama-3.1 dan semua fitur interactive chat bekerja (history, context, streaming).

2. **Given** developer sudah configure OpenAI provider dengan API key, **When** mereka run `zulu-pilot --provider openai`, **Then** mereka bisa chat dengan OpenAI model dan semua tools dari Gemini CLI tersedia.

3. **Given** developer sedang dalam chat session, **When** mereka mengetik prompt, **Then** response di-stream secara real-time seperti di Gemini CLI, dengan loading indicators dan smooth output.

4. **Given** developer sudah menambahkan files ke context, **When** mereka bertanya tentang codebase, **Then** AI menggunakan context files tersebut untuk menjawab, sama seperti Gemini CLI.

5. **Given** developer menggunakan model yang support thinking/reasoning (seperti DeepSeek R1), **When** mereka bertanya complex question, **Then** mereka bisa melihat thinking process dengan `[thinking]` prefix atau dimmed text, atau mendapatkan response langsung jika model tidak support thinking. User bisa toggle visibility thinking process.

---

### User Story 2 - File Operations dengan Custom Models (Priority: P1)

Developer bisa menggunakan semua file operations dari Gemini CLI (read, write, edit, search files) dengan model pribadi mereka. AI bisa membaca, memodifikasi, dan membuat files berdasarkan instruksi developer.

**Why this priority**: File operations adalah core feature untuk coding assistant. Developer perlu AI yang bisa bekerja dengan files mereka.

**Independent Test**: Developer bisa meminta AI untuk read file, edit file, create new file, atau search across files, dan semua operasi ini bekerja dengan model pribadi mereka.

**Acceptance Scenarios**:

1. **Given** developer ada di project directory dengan beberapa TypeScript files, **When** mereka meminta "read src/utils/helpers.ts and explain what it does", **Then** AI membaca file tersebut dan memberikan explanation menggunakan model pribadi mereka.

2. **Given** developer meminta "create a new file src/config/database.ts with connection setup", **When** AI generate code, **Then** file baru dibuat dengan code yang sesuai, dan AI menunjukkan diff sebelum membuat file.

3. **Given** developer meminta "add error handling to src/api/users.ts", **When** AI propose changes, **Then** AI menunjukkan unified diff dengan additions/deletions, dan developer bisa approve atau reject changes sebelum file dimodifikasi.

4. **Given** developer meminta "find all files that use the UserService class", **When** AI search, **Then** AI menggunakan file search capabilities dari Gemini CLI untuk menemukan files dan menampilkan results.

5. **Given** developer meminta "refactor this function to use async/await", **When** AI propose refactoring, **Then** AI menunjukkan diff, membuat backup file original, dan apply changes setelah approval.

---

### User Story 3 - Context Management dengan Multiple Files (Priority: P1)

Developer bisa menambahkan multiple files ke context, manage context (list, clear, add more), dan AI akan menggunakan context ini untuk memberikan answers yang lebih accurate. Context management harus bekerja sama seperti di Gemini CLI.

**Why this priority**: Context awareness adalah essential untuk coding assistant. Developer perlu bisa memberikan context tentang codebase mereka.

**Independent Test**: Developer bisa add files ke context, list context, clear context, dan AI menggunakan context tersebut dalam responses.

**Acceptance Scenarios**:

1. **Given** developer ada di project root, **When** mereka run `zulu-pilot add src/**/*.ts`, **Then** semua TypeScript files di src/ ditambahkan ke context, dan mereka melihat summary dengan file count dan estimated tokens.

2. **Given** developer sudah menambahkan beberapa files ke context, **When** mereka run `zulu-pilot context`, **Then** mereka melihat list semua files dalam context dengan metadata (path, size, estimated tokens).

3. **Given** developer sudah menambahkan banyak files (20+ files), **When** mereka bertanya tentang codebase, **Then** AI menggunakan context dari semua files tersebut untuk memberikan comprehensive answer, dan system menunjukkan warning jika approaching token limit.

4. **Given** developer ingin clear context, **When** mereka run `zulu-pilot clear`, **Then** semua files dihapus dari context, dan mereka bisa mulai fresh dengan files baru.

5. **Given** developer menambahkan file yang sangat besar (>1MB), **When** system detect file size, **Then** system menunjukkan error message yang jelas bahwa file terlalu besar, dan suggest alternative approach.

---

### User Story 4 - Multi-Provider Support dengan Easy Switching (Priority: P1)

Developer bisa configure multiple AI providers (Ollama, OpenAI, Google Cloud, Gemini, DeepSeek, dll) dan switch antar providers dengan mudah tanpa kehilangan context atau features.

**Why this priority**: Ini adalah differentiator utama dari Gemini CLI. Developer ingin fleksibilitas untuk menggunakan model yang berbeda untuk task yang berbeda.

**Independent Test**: Developer bisa configure multiple providers, switch provider dengan command atau config, dan semua tools tetap bekerja dengan provider yang dipilih.

**Acceptance Scenarios**:

1. **Given** developer sudah configure Ollama (local) dan OpenAI (cloud), **When** mereka run `zulu-pilot --provider ollama`, **Then** aplikasi menggunakan Ollama model, dan semua tools bekerja dengan Ollama.

2. **Given** developer sedang dalam chat session dengan Ollama, **When** mereka switch ke OpenAI dengan command `/switch-provider openai`, **Then** chat session continue dengan OpenAI, context tetap ada, dan conversation history tetap accessible.

3. **Given** developer ingin set default provider, **When** mereka run `zulu-pilot config --set-default-provider openai`, **Then** OpenAI menjadi default provider untuk semua future sessions.

4. **Given** developer configure provider dengan invalid credentials, **When** mereka mencoba menggunakan provider tersebut, **Then** system menunjukkan error message yang jelas dengan actionable guidance (e.g., "Invalid API key. Please check your .env file or run 'zulu-pilot config --set-api-key openai'").

5. **Given** developer menggunakan provider yang tidak support certain features (e.g., Google Search tool), **When** mereka mencoba menggunakan feature tersebut, **Then** system menunjukkan graceful degradation dengan clear message: "Feature X not available with provider Y. Using fallback Z." atau "Feature X requires provider Y. Current provider: Z."

---

### User Story 5 - Google Search Integration dengan Custom Models (Priority: P2)

Developer bisa menggunakan Google Search tool dari Gemini CLI dengan model pribadi mereka. AI bisa search internet untuk informasi real-time dan menggunakan hasil search dalam responses.

**Why this priority**: Google Search adalah powerful tool untuk mendapatkan informasi up-to-date. Developer ingin menggunakan ini dengan model pribadi mereka.

**Independent Test**: Developer bisa enable Google Search, bertanya tentang current events atau latest information, dan AI menggunakan Google Search untuk mendapatkan informasi terkini.

**Acceptance Scenarios**:

1. **Given** developer enable Google Search tool, **When** mereka bertanya "What's the latest version of React?", **Then** AI menggunakan Google Search untuk mendapatkan informasi terkini dan memberikan answer dengan citation.

2. **Given** developer bertanya tentang current events, **When** AI tidak tahu answer dari training data, **Then** AI automatically menggunakan Google Search untuk mendapatkan informasi terkini.

3. **Given** developer menggunakan provider yang tidak support Google Search (e.g., local Ollama), **When** mereka mencoba enable Google Search, **Then** system menunjukkan message bahwa Google Search hanya available untuk certain providers, atau suggest alternative approach.

---

### User Story 6 - MCP Server Integration dengan Custom Models (Priority: P2)

Developer bisa menggunakan MCP (Model Context Protocol) servers dari Gemini CLI dengan model pribadi mereka. Mereka bisa connect ke MCP servers (GitHub, Slack, Database, dll) dan menggunakan tools dari servers tersebut.

**Why this priority**: MCP servers extend capabilities significantly. Developer ingin menggunakan ecosystem MCP dengan model pribadi mereka.

**Independent Test**: Developer bisa configure MCP servers, menggunakan tools dari MCP servers (e.g., `@github list my pull requests`), dan AI menggunakan tools tersebut dengan model pribadi mereka.

**Acceptance Scenarios**:

1. **Given** developer sudah configure GitHub MCP server, **When** mereka meminta "@github list my open pull requests", **Then** AI menggunakan GitHub MCP server untuk mendapatkan list PRs dan menampilkan results.

2. **Given** developer configure multiple MCP servers (GitHub, Slack, Database), **When** mereka menggunakan tools dari different servers, **Then** AI route requests ke appropriate MCP server dan menggunakan results dalam responses.

3. **Given** developer menggunakan MCP server yang require authentication, **When** mereka pertama kali menggunakan server tersebut, **Then** system prompt untuk authentication credentials dan store securely.

---

### User Story 7 - Code Change Proposal & Approval Workflow (Priority: P2)

Developer bisa meminta AI untuk propose code changes, review changes dengan unified diff, approve atau reject changes, dan AI akan apply changes setelah approval. Semua ini bekerja dengan model pribadi mereka.

**Why this priority**: Code modification adalah core feature untuk coding assistant. Developer perlu bisa review dan approve changes sebelum di-apply.

**Independent Test**: Developer bisa meminta code changes, melihat diff, approve/reject, dan changes di-apply sesuai dengan decision mereka.

**Acceptance Scenarios**:

1. **Given** developer meminta "add error handling to this function", **When** AI propose changes, **Then** AI menunjukkan unified diff dengan green (additions) dan red (deletions), dan prompt untuk approve (y) atau reject (n).

2. **Given** developer melihat proposed changes, **When** mereka approve dengan 'y', **Then** system membuat backup file original (with timestamp), apply changes, dan menunjukkan confirmation message.

3. **Given** developer melihat proposed changes, **When** mereka reject dengan 'n', **Then** no changes di-apply, dan mereka bisa continue conversation atau request different changes.

4. **Given** AI propose changes untuk multiple files, **When** AI show diff, **Then** AI menunjukkan summary dengan file count, dan detailed diff untuk each file, dan developer bisa approve/reject per file atau all at once.

5. **Given** developer approve changes, **When** system apply changes, **Then** system validate syntax (untuk TypeScript/JavaScript), dan jika ada syntax error, system menunjukkan error dan tidak apply changes.

---

### User Story 8 - Conversation Checkpointing & Resume (Priority: P3)

Developer bisa save conversation checkpoints, resume conversations dari checkpoint, dan maintain conversation history across sessions. Ini bekerja dengan semua providers.

**Why this priority**: Long conversations perlu bisa di-save dan di-resume. Developer tidak ingin kehilangan context dari previous sessions.

**Independent Test**: Developer bisa save checkpoint, exit application, dan resume dari checkpoint dengan semua context dan history intact.

**Acceptance Scenarios**:

1. **Given** developer sedang dalam long conversation, **When** mereka run `/checkpoint save my-session`, **Then** conversation di-save dengan name "my-session", dan mereka bisa exit application.

2. **Given** developer sudah save checkpoint, **When** mereka run `zulu-pilot --resume my-session`, **Then** conversation resume dari checkpoint dengan semua history dan context intact.

3. **Given** developer ada multiple checkpoints, **When** mereka run `zulu-pilot --list-checkpoints`, **Then** mereka melihat list semua saved checkpoints dengan metadata (date, message count, context files).

---

### User Story 9 - Custom Context Files (GEMINI.md style) (Priority: P3)

Developer bisa create custom context files (seperti GEMINI.md di Gemini CLI) yang memberikan persistent context untuk project mereka. AI akan selalu menggunakan context dari file ini dalam conversations.

**Why this priority**: Custom context files membantu customize AI behavior untuk specific projects. Developer bisa provide project-specific instructions dan context.

**Independent Test**: Developer bisa create `.zulu-pilot-context.md` atau similar file, dan AI akan menggunakan context dari file ini dalam semua conversations di project tersebut.

**Acceptance Scenarios**:

1. **Given** developer create `.zulu-pilot-context.md` di project root dengan project-specific instructions, **When** mereka start chat session, **Then** AI automatically load context dari file tersebut dan menggunakan instructions dalam responses.

2. **Given** developer update context file, **When** mereka start new chat session, **Then** AI menggunakan updated context dari file tersebut.

3. **Given** developer ada context file di multiple levels (project root dan subdirectory), **When** mereka start chat session, **Then** AI merge context dari all relevant files, dengan priority untuk more specific (subdirectory) context.

---

### User Story 10 - Provider-Specific Model Configuration (Priority: P2)

Developer bisa configure specific models untuk each provider, set default models, dan switch models dengan mudah. Configuration harus persistent dan easy to manage.

**Why this priority**: Different providers support different models. Developer perlu bisa configure dan manage models untuk each provider.

**Independent Test**: Developer bisa configure models untuk each provider, set defaults, list available models, dan switch models.

**Acceptance Scenarios**:

1. **Given** developer configure Ollama provider, **When** mereka run `zulu-pilot model --list --provider ollama`, **Then** mereka melihat list semua available Ollama models (dari local Ollama instance).

2. **Given** developer ingin set default model untuk OpenAI, **When** mereka run `zulu-pilot model --set gpt-4 --provider openai`, **Then** gpt-4 menjadi default model untuk OpenAI provider.

3. **Given** developer configure Google Cloud provider dengan multiple models (DeepSeek, Qwen, GPT OSS), **When** mereka switch model, **Then** mereka bisa menggunakan different models untuk different tasks tanpa reconfiguring provider.

4. **Given** developer menggunakan model yang tidak available atau tidak accessible, **When** system detect error, **Then** system menunjukkan clear error message dengan suggestions untuk fix (e.g., "Model llama-3.1 not found. Run 'ollama pull llama-3.1' to download it.").

---

### User Story 11 - Headless Mode untuk Scripting & Automation (Priority: P3)

Developer bisa menggunakan aplikasi dalam headless/non-interactive mode untuk scripting dan automation. Mereka bisa pass prompts via command line dan get responses dalam JSON atau text format.

**Why this priority**: Automation dan scripting adalah important use case. Developer ingin integrate aplikasi ke dalam workflows mereka.

**Independent Test**: Developer bisa run `zulu-pilot -p "explain this code" --output-format json` dan mendapatkan structured response yang bisa di-parse oleh scripts.

**Acceptance Scenarios**:

1. **Given** developer ingin automate code review, **When** mereka run `zulu-pilot -p "review this code for security issues" --output-format json`, **Then** mereka mendapatkan JSON response dengan structured data yang bisa di-parse oleh scripts.

2. **Given** developer ingin integrate ke CI/CD pipeline, **When** mereka run aplikasi dalam headless mode, **Then** aplikasi tidak prompt untuk user input, menggunakan config dari environment variables, dan output results dalam format yang bisa di-parse.

3. **Given** developer ingin stream results untuk monitoring, **When** mereka run dengan `--output-format stream-json`, **Then** mereka mendapatkan newline-delimited JSON events yang bisa di-process secara real-time.

---

### User Story 12 - Error Handling & User-Friendly Messages (Priority: P1)

Aplikasi harus handle errors gracefully dan provide user-friendly, actionable error messages. Developer harus tahu apa yang salah dan bagaimana fix it.

**Why this priority**: Good error handling adalah essential untuk developer experience. Developer tidak ingin cryptic error messages.

**Independent Test**: Developer bisa encounter various error scenarios (invalid API key, model not found, network error, dll) dan mendapatkan clear, actionable error messages.

**Acceptance Scenarios**:

1. **Given** developer configure provider dengan invalid API key, **When** mereka mencoba menggunakan provider tersebut, **Then** system menunjukkan error message: "Invalid API key for OpenAI. Please check your configuration. Run 'zulu-pilot config --set-api-key openai' to update it."

2. **Given** developer menggunakan Ollama provider tapi Ollama tidak running, **When** system detect connection error, **Then** system menunjukkan error message: "Cannot connect to Ollama. Make sure Ollama is running. Start it with 'ollama serve' or check your OLLAMA_HOST environment variable."

3. **Given** developer menggunakan model yang tidak available, **When** system detect 404 error, **Then** system menunjukkan error message dengan suggestions: "Model 'gpt-5' not found. Available models: gpt-4, gpt-3.5-turbo. Use 'zulu-pilot model --list' to see all available models."

4. **Given** developer encounter rate limit error, **When** system detect 429 error, **Then** system menunjukkan error message dengan retry information: "Rate limit exceeded. Please wait 60 seconds before retrying. Or upgrade your plan for higher limits."

---

### Edge Cases

- **What happens when** developer menggunakan provider yang tidak support certain tools (e.g., Google Search dengan local Ollama)? System harus menunjukkan graceful degradation atau clear error message.

- **What happens when** developer menambahkan file yang sangat besar (>1MB) ke context? System harus reject dengan clear error message dan suggest alternative approach.

- **What happens when** developer approve code changes yang menyebabkan syntax error? System harus validate syntax sebelum apply dan reject jika ada error.

- **What happens when** developer switch provider di tengah conversation? Context dan history harus tetap accessible dengan provider baru.

- **What happens when** developer menggunakan model yang tidak support streaming? System harus fallback ke non-streaming mode dengan clear indication.

- **What happens when** MCP server tidak available atau authentication failed? System harus show clear error dengan actionable guidance.

- **What happens when** developer menggunakan headless mode tanpa required configuration? System harus show clear error dengan instructions untuk setup.

- **What happens when** network connection lost selama streaming response? System harus handle gracefully dengan retry mechanism atau clear error message.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow developers to start interactive chat sessions with custom AI models (Ollama, OpenAI, Google Cloud, dll) while maintaining all interactive chat features from Gemini CLI (history, context, streaming).

- **FR-002**: System MUST support all file operations from Gemini CLI (read, write, edit, search files) with custom AI models.

- **FR-003**: System MUST allow developers to add multiple files to context, list context, clear context, and AI must use context in responses.

- **FR-004**: System MUST support multiple AI providers (Ollama, OpenAI, Google Cloud, Gemini, DeepSeek, dll) with easy switching between providers without losing context or features.

- **FR-005**: System MUST support Google Search tool integration with custom models for real-time information retrieval.

- **FR-006**: System MUST support MCP (Model Context Protocol) server integration with custom models, allowing connection to MCP servers (GitHub, Slack, Database, dll).

- **FR-007**: System MUST allow developers to request code changes, review changes with unified diff format, and approve or reject changes before applying.

- **FR-008**: System MUST support conversation checkpointing, allowing developers to save and resume conversations with all history and context intact.

- **FR-009**: System MUST support custom context files (like GEMINI.md) that provide persistent project-specific context for AI conversations.

- **FR-010**: System MUST allow developers to configure specific models for each provider, set default models, and switch models easily.

- **FR-011**: System MUST support headless/non-interactive mode for scripting and automation with JSON or text output formats.

- **FR-012**: System MUST provide user-friendly, actionable error messages for all error scenarios (invalid API keys, model not found, network errors, dll).

- **FR-013**: System MUST create backup files before applying code changes, preserving original files even if application crashes.

- **FR-014**: System MUST validate syntax (for TypeScript/JavaScript) before applying code changes and reject changes that cause syntax errors.

- **FR-015**: System MUST handle network errors gracefully with automatic retry mechanism (with exponential backoff) for transient errors.

- **FR-016**: System MUST only access files within allowed directories and prevent directory traversal attacks.

- **FR-017**: System MUST require explicit user approval before applying file modifications.

- **FR-018**: System MUST support real-time token streaming with smooth output and loading indicators.

- **FR-019**: System MUST support models that provide thinking/reasoning capabilities (like DeepSeek R1) and display thinking process when available.
  - **Display Format**: Thinking process harus ditampilkan dengan visual indicator yang jelas:
    - Prefix dengan `[thinking]` marker atau dimmed text
    - Separate section atau stream dari regular output
    - Distinguishable dari regular response (e.g., dimmed, italic, atau separate panel)
  - **User Control**: User bisa toggle visibility thinking process (show/hide)
  - **Fallback**: Jika model tidak support thinking, tampilkan response langsung tanpa thinking section

- **FR-020**: System MUST support graceful degradation when provider does not support certain features (e.g., Google Search with local Ollama).
  - **Measurable Criteria**: Display clear message: "Feature X not available with provider Y. Using fallback Z." atau "Feature X requires provider Y. Current provider: Z."
  - **User Experience**: User harus tahu mengapa feature tidak available dan apa alternatifnya
  - **Error Handling**: Tidak crash atau show cryptic error, tetapi provide actionable guidance

### Key Entities

- **Provider Configuration**: Represents configured AI provider (Ollama, OpenAI, Google Cloud, dll) with credentials, default model, and provider-specific settings.

- **Model Configuration**: Represents specific model configuration for a provider, including model name, capabilities, and compatibility information.

- **Context**: Represents collection of files added to conversation context, including file paths, metadata (size, last modified), and estimated tokens.

- **Conversation Checkpoint**: Represents saved conversation state including history, context files, and session metadata (date, message count).

- **Code Change Proposal**: Represents proposed code modification including file path, unified diff, and change type (add, modify, delete).

- **MCP Server Configuration**: Represents configured MCP server connection including server type, authentication credentials, and available tools.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developers can start interactive chat with at least 2 different providers (Ollama and OpenAI) and complete a conversation successfully.

- **SC-002**: Developers can add files to context and AI uses context to provide accurate answers about their codebase in 95% of test cases.

- **SC-003**: Developers can request code changes, review diff, and approve/reject changes with 100% accuracy (no unintended changes applied).

- **SC-004**: All file operations from Gemini CLI work correctly with custom models (read, write, edit, search) with 100% feature parity.

- **SC-005**: Error messages provide actionable guidance that allows developers to resolve issues without external help in 90% of cases.

- **SC-006**: First token latency is under 2 seconds for local models (Ollama) and under 5 seconds for cloud models (OpenAI, Google Cloud) in 95% of requests.

- **SC-007**: Token streaming is smooth without buffering delays, with tokens appearing in real-time as they are generated.
  - **Measurable**: Token interval < 100ms, no buffering delays > 500ms
  - **User Experience**: Tokens muncul secara real-time tanpa blocking atau batching yang terlihat

- **SC-008**: Context loading from multiple files (20+ files) completes within 3 seconds in 95% of cases.

- **SC-009**: File read/write operations complete within 1 second for files under 100KB in 95% of cases.

- **SC-010**: Developers can switch between providers without losing context or conversation history in 100% of cases.

- **SC-011**: Developers can use Google Search tool with custom models to get real-time information with accurate citations in 90% of queries.

- **SC-012**: Developers can configure and use MCP servers (GitHub, Slack, dll) with custom models successfully in 90% of configurations.

- **SC-013**: Developers can save and resume conversations from checkpoints with all history and context intact in 100% of cases.

- **SC-014**: Developers can use custom context files to customize AI behavior for specific projects, with context loaded automatically in 100% of sessions.

- **SC-015**: Developers can use headless mode for automation and get structured JSON responses that can be parsed by scripts in 100% of requests.

## Non-Functional Requirements

### Performance Requirements

1. **Response Time**: First token latency harus < 2 seconds untuk local models (Ollama) dan < 5 seconds untuk cloud models (OpenAI, Google Cloud).

2. **Streaming**: Token streaming harus smooth tanpa buffering delays. User harus melihat tokens muncul secara real-time.
   - **Measurable Criteria**: Token interval < 100ms antara tokens, tidak ada buffering delays > 500ms
   - **Smooth Output**: Tokens muncul secara real-time tanpa blocking atau batching yang terlihat
   - **Loading Indicators**: Spinner atau indicator harus muncul selama menunggu first token (< 2s local, < 5s cloud)

3. **Context Loading**: Loading context dari multiple files (20+ files) harus complete dalam < 3 seconds.

4. **File Operations**: File read/write operations harus complete dalam < 1 second untuk files < 100KB.

### Reliability Requirements

1. **Error Recovery**: Aplikasi harus handle network errors gracefully dengan automatic retry (with exponential backoff) untuk transient errors.

2. **Data Integrity**: File modifications harus always create backups sebelum apply changes. Backup files harus preserved even jika aplikasi crash.

3. **State Persistence**: Conversation checkpoints dan configuration harus persist across application restarts.

### Usability Requirements

1. **CLI Interface**: Command-line interface harus intuitive dengan clear help messages dan command suggestions.

2. **Error Messages**: Semua error messages harus user-friendly dengan actionable guidance.

3. **Loading Indicators**: Long-running operations harus show loading indicators dengan progress information.

4. **Output Formatting**: Code diffs harus formatted dengan colors (green for additions, red for deletions) untuk easy reading.

### Security Requirements

1. **Credentials Management**: API keys dan credentials harus stored securely. Support untuk environment variables dan secure credential storage.

2. **File Access**: Aplikasi harus only access files within allowed directories. Prevent directory traversal attacks.

3. **Code Execution**: Aplikasi harus not execute arbitrary code. File modifications harus require explicit user approval.

### Compatibility Requirements

1. **Provider Compatibility**: Aplikasi harus support semua major AI providers: Ollama, OpenAI, Google Cloud (Vertex AI), Gemini API, DeepSeek, Qwen, dll.

2. **Model Compatibility**: Aplikasi harus work dengan different model types: chat completion models, embeddings models, thinking models (DeepSeek R1), dll.

3. **Platform Compatibility**: Aplikasi harus work pada Linux, macOS, dan Windows.

## Constraints & Assumptions

### Constraints

1. **Foundation Dependency**: Aplikasi harus built di atas Gemini CLI. Kita tidak bisa completely rewrite dari scratch - kita harus maintain compatibility dengan Gemini CLI's architecture.

2. **Model Provider Interface**: Custom model adapter harus implement interface yang diharapkan oleh Gemini CLI core. Kita tidak bisa change Gemini CLI's internal interfaces arbitrarily.

3. **Upstream Updates**: Gemini CLI akan continue to evolve. Kita harus maintain compatibility dengan upstream updates atau have strategy untuk handle breaking changes.

### Assumptions

1. **Developer Knowledge**: Developer yang menggunakan aplikasi ini familiar dengan CLI tools dan basic concepts seperti API keys, environment variables, dll.

2. **Provider Availability**: Developer sudah have access ke at least one AI provider (Ollama local, atau cloud provider dengan API key).

3. **Network Access**: Untuk cloud providers, developer have network access. Untuk local providers (Ollama), service sudah running locally.

4. **Gemini CLI Foundation**: Gemini CLI provides stable interfaces untuk tools, MCP servers, dan file operations yang bisa di-extend dengan custom model adapters.

5. **Model API Compatibility**: Custom models dari different providers implement similar chat completion interfaces (messages in, tokens out) yang bisa be abstracted.

## Out of Scope (for Initial Phase)

1. **Web UI**: Aplikasi adalah CLI-only. No web interface atau GUI.

2. **User Authentication**: No user accounts atau authentication system. Configuration adalah local per developer.

3. **Collaboration Features**: No real-time collaboration atau sharing conversations dengan other developers.

4. **Model Training**: Aplikasi tidak train atau fine-tune models. Hanya menggunakan existing models.

5. **Payment Integration**: No built-in payment processing. Developer manage their own API keys dan billing dengan providers.

6. **Custom Tool Development**: Aplikasi tidak allow developers to create custom tools. Hanya menggunakan tools dari Gemini CLI dan MCP servers.

7. **Model Fine-tuning Interface**: Aplikasi tidak provide interface untuk fine-tune models. Hanya menggunakan pre-trained models.
