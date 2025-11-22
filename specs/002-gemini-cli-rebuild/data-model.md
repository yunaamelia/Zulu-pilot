# Data Model: Zulu Pilot v2

**Feature**: 002-gemini-cli-rebuild  
**Date**: 2025-11-22

## Overview

This document defines the core data structures and entities for Zulu Pilot v2. Since this is a CLI application with file-based storage (no database), entities are represented as TypeScript interfaces and JSON-serializable structures.

## Core Entities

### 1. ProviderConfiguration

**Purpose**: Represents configuration for a single AI provider (Ollama, OpenAI, Google Cloud, etc.)

**Fields**:

- `type` (string, required): Provider type identifier ("ollama", "openai", "googleCloud", "gemini", etc.)
- `name` (string, required): User-friendly provider name
- `apiKey` (string, optional): API key or credential reference (can be "env:VAR_NAME" for environment variables)
- `baseUrl` (string, optional): Base URL for API (defaults to provider-specific defaults)
- `model` (string, optional): Default model for this provider
- `timeout` (number, optional): Request timeout in milliseconds
- `enabled` (boolean, optional): Whether provider is enabled (default: true)
- `providerSpecific` (object, optional): Provider-specific configuration (e.g., projectId for Google Cloud, region, etc.)

**Validation Rules**:

- `type` must be one of supported provider types
- `apiKey` required for cloud providers (OpenAI, Google Cloud, Gemini)
- `baseUrl` required for custom endpoints
- `timeout` must be positive number if provided

**State Transitions**: None (static configuration)

**Example**:

```typescript
interface ProviderConfiguration {
  type: 'ollama' | 'openai' | 'googleCloud' | 'gemini' | 'deepseek' | 'qwen';
  name: string;
  apiKey?: string; // Can be "env:OPENAI_API_KEY"
  baseUrl?: string;
  model?: string;
  timeout?: number;
  enabled?: boolean;
  providerSpecific?: {
    projectId?: string; // Google Cloud
    region?: string; // Google Cloud
    credentialsPath?: string; // Google Cloud
    endpoint?: string; // Google Cloud
  };
}
```

---

### 2. UnifiedConfiguration

**Purpose**: Root configuration object that combines Gemini CLI config with custom provider configs

**Fields**:

- `defaultProvider` (string, required): Name of default provider to use
- `defaultModel` (string, optional): Default model ID (can be "provider:model" format)
- `providers` (Record<string, ProviderConfiguration>, required): Map of provider name to configuration
- `geminiCLI` (object, optional): Gemini CLI specific configuration (tools, MCP servers, etc.)
- `providerDefaults` (object, optional): Default settings per provider type

**Validation Rules**:

- `defaultProvider` must exist in `providers` map
- At least one provider must be configured
- `defaultModel` format: "model" (uses default provider) or "provider:model"

**State Transitions**:

- Load from file → Validate → Use
- Update provider → Save to file

**Example**:

```typescript
interface UnifiedConfiguration {
  defaultProvider: string;
  defaultModel?: string;
  providers: Record<string, ProviderConfiguration>;
  geminiCLI?: {
    mcpServers?: Record<string, MCPServerConfig>;
    tools?: {
      googleSearch?: { enabled: boolean };
    };
  };
  providerDefaults?: {
    ollama?: { baseUrl: string; timeout: number };
    openai?: { baseUrl: string; timeout: number };
    googleCloud?: { projectId: string; region: string };
  };
}
```

---

### 3. FileContext

**Purpose**: Represents a file added to conversation context (port from current Zulu Pilot)

**Fields**:

- `path` (string, required): Absolute or relative file path
- `content` (string, required): File content
- `size` (number, required): File size in bytes
- `lastModified` (Date | number, required): Last modification timestamp
- `estimatedTokens` (number, optional): Estimated token count for this file

**Validation Rules**:

- `path` must be within allowed directories (prevent directory traversal)
- `size` must be positive
- `size` must not exceed maximum (e.g., 1MB)
- File must exist and be readable
- File must not be binary (unless explicitly allowed)

**State Transitions**:

- Add to context → Validate → Store
- Remove from context → Delete

**Example**:

```typescript
interface FileContext {
  path: string;
  content: string;
  size: number;
  lastModified: Date | number;
  estimatedTokens?: number;
}
```

---

### 4. ConversationCheckpoint

**Purpose**: Represents a saved conversation state for resuming later

**Fields**:

- `id` (string, required): Unique checkpoint identifier
- `name` (string, required): User-friendly checkpoint name
- `createdAt` (Date | number, required): Creation timestamp
- `updatedAt` (Date | number, required): Last update timestamp
- `messageCount` (number, required): Number of messages in conversation
- `contextFiles` (FileContext[], required): Files in context at checkpoint time
- `conversationHistory` (Message[], required): Full conversation history
- `currentProvider` (string, required): Provider used at checkpoint time
- `currentModel` (string, optional): Model used at checkpoint time

**Validation Rules**:

- `id` must be unique
- `name` must be non-empty
- `messageCount` must match `conversationHistory.length`
- `contextFiles` must be valid FileContext objects

**State Transitions**:

- Create checkpoint → Save to file
- Load checkpoint → Restore state
- Delete checkpoint → Remove file

**Example**:

```typescript
interface ConversationCheckpoint {
  id: string;
  name: string;
  createdAt: Date | number;
  updatedAt: Date | number;
  messageCount: number;
  contextFiles: FileContext[];
  conversationHistory: Message[];
  currentProvider: string;
  currentModel?: string;
}
```

---

### 5. Message

**Purpose**: Represents a single message in conversation history (compatible with Gemini CLI format)

**Fields**:

- `role` (string, required): Message role ("user", "assistant", "system")
- `content` (string | Content[], required): Message content (text or multimodal)
- `timestamp` (Date | number, optional): Message timestamp

**Validation Rules**:

- `role` must be valid role type
- `content` must be non-empty
- For multimodal: content array must have at least one item

**State Transitions**: None (immutable once created)

**Example**:

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | Content[];
  timestamp?: Date | number;
}

interface Content {
  type: 'text' | 'image' | 'file';
  text?: string;
  data?: string; // Base64 for images/files
  mimeType?: string;
}
```

---

### 6. CodeChangeProposal

**Purpose**: Represents a proposed code change before approval

**Fields**:

- `filePath` (string, required): Path to file to be modified
- `changeType` (string, required): Type of change ("add", "modify", "delete")
- `oldContent` (string, optional): Original file content (for modify/delete)
- `newContent` (string, optional): New file content (for add/modify)
- `unifiedDiff` (string, required): Unified diff format string
- `lineNumbers` (object, optional): Line number ranges affected
- `backupPath` (string, optional): Path to backup file (created after approval)

**Validation Rules**:

- `filePath` must be within allowed directories
- `changeType` must be valid type
- `unifiedDiff` must be valid diff format
- For "modify": both `oldContent` and `newContent` required
- For "add": only `newContent` required
- For "delete": only `oldContent` required

**State Transitions**:

- Propose → Show diff → Await approval
- Approve → Create backup → Apply changes → Update state
- Reject → Discard proposal

**Example**:

```typescript
interface CodeChangeProposal {
  filePath: string;
  changeType: 'add' | 'modify' | 'delete';
  oldContent?: string;
  newContent?: string;
  unifiedDiff: string;
  lineNumbers?: {
    start: number;
    end: number;
  };
  backupPath?: string;
}
```

---

### 7. MCPServerConfiguration

**Purpose**: Configuration for MCP (Model Context Protocol) server integration

**Fields**:

- `name` (string, required): Server identifier
- `command` (string, required): Command to start server
- `args` (string[], optional): Arguments for command
- `env` (Record<string, string>, optional): Environment variables
- `includeTools` (string[], optional): Allowlist of tools to expose
- `excludeTools` (string[], optional): Blocklist of tools to hide
- `enabled` (boolean, optional): Whether server is enabled (default: true)

**Validation Rules**:

- `name` must be unique
- `command` must be executable
- `includeTools` and `excludeTools` cannot both be specified

**State Transitions**: None (static configuration)

**Example**:

```typescript
interface MCPServerConfiguration {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  includeTools?: string[];
  excludeTools?: string[];
  enabled?: boolean;
}
```

---

### 8. ProviderRegistryEntry

**Purpose**: Runtime registry entry for a provider instance

**Fields**:

- `name` (string, required): Provider name
- `provider` (IModelProvider, required): Provider instance
- `config` (ProviderConfiguration, required): Provider configuration
- `initialized` (boolean, required): Whether provider is initialized
- `lastUsed` (Date | number, optional): Last usage timestamp

**Validation Rules**:

- `name` must match `config.name`
- `provider` must implement `IModelProvider` interface

**State Transitions**:

- Register → Initialize → Ready
- Unregister → Cleanup → Removed

**Example**:

```typescript
interface ProviderRegistryEntry {
  name: string;
  provider: IModelProvider;
  config: ProviderConfiguration;
  initialized: boolean;
  lastUsed?: Date | number;
}
```

---

## Relationships

### ProviderConfiguration ↔ UnifiedConfiguration

- **Relationship**: One-to-many (UnifiedConfiguration contains multiple ProviderConfigurations)
- **Cardinality**: UnifiedConfiguration has 1..N ProviderConfigurations
- **Storage**: Nested in UnifiedConfiguration JSON file

### FileContext ↔ ConversationCheckpoint

- **Relationship**: Many-to-many (Checkpoint contains multiple FileContexts, FileContext can be in multiple checkpoints)
- **Cardinality**: Checkpoint has 0..N FileContexts
- **Storage**: Array in ConversationCheckpoint JSON file

### Message ↔ ConversationCheckpoint

- **Relationship**: One-to-many (Checkpoint contains multiple Messages)
- **Cardinality**: Checkpoint has 0..N Messages
- **Storage**: Array in ConversationCheckpoint JSON file

### CodeChangeProposal ↔ FileContext

- **Relationship**: One-to-one (Proposal targets one file)
- **Cardinality**: Proposal has 1 FileContext (implicit via filePath)
- **Storage**: Separate proposal objects, linked by filePath

## Validation Rules Summary

### ProviderConfiguration

- Type must be supported
- API key required for cloud providers
- Base URL must be valid if provided

### UnifiedConfiguration

- Default provider must exist
- At least one provider required
- Model format validation

### FileContext

- Path validation (directory traversal prevention)
- Size limits (max 1MB)
- Binary file detection
- File existence check

### ConversationCheckpoint

- Unique ID requirement
- Message count consistency
- Valid provider reference

### CodeChangeProposal

- File path validation
- Change type validation
- Content requirements per type

## State Management

### Configuration State

- **Storage**: `~/.zulu-pilotrc` (JSON file)
- **Loading**: On application start, validate and load
- **Updates**: Atomic write (write to temp file, then rename)
- **Validation**: Schema validation on load

### Checkpoint State

- **Storage**: `~/.zulu-pilot/checkpoints/{id}.json` (one file per checkpoint)
- **Loading**: On demand (when resuming)
- **Updates**: Overwrite existing file
- **Cleanup**: Manual deletion or automatic cleanup (old checkpoints)

### Context State

- **Storage**: In-memory during session, persisted in checkpoints
- **Loading**: On session start (from checkpoint or fresh)
- **Updates**: Add/remove files, clear all
- **Persistence**: Saved in checkpoints

## Data Flow

### Configuration Flow

```
User updates config → UnifiedConfigManager.setProviderConfig()
→ Validate → Write to ~/.zulu-pilotrc → Reload if needed
```

### Provider Selection Flow

```
User selects provider → MultiProviderRouter.getProviderForModel()
→ ProviderRegistry.getProvider() → Return provider instance
```

### Context Management Flow

```
User adds file → Validate file → Create FileContext
→ Add to ContextManager → Update token estimation
```

### Checkpoint Flow

```
User saves checkpoint → Create ConversationCheckpoint
→ Serialize to JSON → Write to ~/.zulu-pilot/checkpoints/{id}.json
```

## Serialization

All entities must be JSON-serializable for file-based storage:

- Dates → Convert to ISO string or timestamp (number)
- Functions → Not serialized (runtime only)
- Classes → Convert to plain objects
- Circular references → Not allowed (use IDs for references)

## Type Definitions

```typescript
// Core interfaces (to be defined in @zulu-pilot/core package)
export interface IModelProvider {
  streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string>;
  generateResponse(prompt: string, context: FileContext[]): Promise<string>;
  setModel?(model: string): void;
  getModel?(): string;
}

// Adapter interfaces (to be defined in @zulu-pilot/adapter package)
export interface IModelAdapter {
  generateContent(params: GenerateContentParams): Promise<GenerateContentResponse>;
  streamGenerateContent(params: GenerateContentParams): AsyncGenerator<GenerateContentResponse>;
}

// Gemini CLI interfaces (from forked packages/core)
export interface GenerateContentParams {
  model: string;
  contents: Content[];
  tools?: Tool[];
  // ... other Gemini CLI params
}

export interface GenerateContentResponse {
  content: Content[];
  // ... other Gemini CLI response fields
}
```
