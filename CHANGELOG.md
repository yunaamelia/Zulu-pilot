# Changelog

All notable changes to Zulu Pilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024

### Added

#### Core Features
- Multi-provider support (Gemini, Ollama, OpenAI, and more)
- Unified configuration system for all providers
- Provider registry and factory system
- Multi-provider router for request routing

#### Context Management
- Enhanced context manager with file context support
- Custom context files (`.zulu-pilot-context.md`, `ZULU-PILOT.md`, `GEMINI.md`)
- Context file discovery in project root and subdirectories
- Priority system for context files (subdirectory > root)
- Token estimation and limit checking

#### Conversation Management
- Conversation checkpointing system
- Save and resume conversations from checkpoints
- Checkpoint listing and deletion
- Workspace-aware checkpoint management

#### Tools & Integrations
- Code change proposal and approval workflow
- Web search tool integration
- MCP (Model Context Protocol) server integration
- File search and operations tools

#### CLI Features
- Headless/non-interactive mode for scripting
- Multiple output formats (text, json, stream-json)
- Environment variable support for headless config
- Provider management commands
- Model management commands
- Checkpoint management commands
- Context management commands

#### Output Formatting
- JSON output format for structured responses
- Stream-JSON (NDJSON) format for streaming
- Metadata inclusion in JSON responses
- Pretty/compact JSON options

#### Documentation
- Comprehensive README.md
- Migration guide from v1 to v2
- API documentation
- Architecture documentation
- Quickstart guide updates

### Changed

#### Breaking Changes
- **Configuration Format**: Changed from simple config to unified multi-provider config
  - Migration guide provided in `docs/migration-guide.md`
- **CLI Commands**: New command structure (`zulu-pilot chat` instead of `zulu-pilot`)
  - All commands now use subcommand structure
- **Provider System**: New provider registration and routing system
  - Providers must be registered in unified config

#### Improvements
- Better error handling and validation
- Improved context loading performance
- Enhanced conversation history management
- More robust file operations

### Fixed

- Fixed context loading for large file sets
- Fixed token estimation accuracy
- Fixed checkpoint file handling
- Fixed provider switching issues
- Fixed configuration loading errors

## [1.x] - Previous Version

### Features (v1)
- Basic Gemini CLI integration
- Simple configuration
- Interactive chat interface
- File operations

---

## Version History

- **2.0.0**: Major rewrite with multi-provider support
- **1.0.0**: Initial release with Gemini CLI integration

---

**For detailed migration instructions, see [docs/migration-guide.md](docs/migration-guide.md)**

