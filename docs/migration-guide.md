# Migration Guide: Zulu Pilot v1 to v2

This guide helps you migrate from Zulu Pilot v1 to v2, which includes significant architectural improvements and new features.

## Overview of Changes

Zulu Pilot v2 represents a major rewrite with the following key changes:

- **Multi-Provider Architecture**: Support for multiple AI providers (not just Gemini)
- **Unified Configuration System**: Single configuration file for all providers
- **Enhanced Context Management**: Improved context loading and management
- **Checkpoint System**: Save and resume conversations
- **Headless Mode**: Non-interactive mode for automation
- **MCP Server Integration**: Integration with Model Context Protocol servers

## Breaking Changes

### Configuration File Format

**v1 Configuration**:
```
~/.zulu-pilot/config.json
{
  "apiKey": "your-gemini-api-key",
  "model": "gemini-pro"
}
```

**v2 Configuration**:
```json
{
  "defaultProvider": "gemini",
  "defaultModel": "gemini-pro",
  "providers": {
    "gemini": {
      "type": "gemini",
      "name": "gemini",
      "apiKey": "your-gemini-api-key"
    }
  }
}
```

### CLI Commands

**v1**:
```bash
zulu-pilot --model gemini-pro "your prompt"
```

**v2**:
```bash
zulu-pilot chat --provider gemini --model gemini-pro
```

### Configuration Location

The configuration directory structure has changed:
- **v1**: `~/.zulu-pilot/config.json`
- **v2**: `~/.zulu-pilot/config.json` (same location, different format)

## Migration Steps

### Step 1: Backup Current Configuration

```bash
cp ~/.zulu-pilot/config.json ~/.zulu-pilot/config.json.backup
```

### Step 2: Update Configuration Format

Convert your v1 configuration to v2 format:

```bash
# Your v1 config
cat ~/.zulu-pilot/config.json
{
  "apiKey": "your-api-key",
  "model": "gemini-pro"
}

# Convert to v2 format
cat > ~/.zulu-pilot/config.json << EOF
{
  "defaultProvider": "gemini",
  "defaultModel": "gemini-pro",
  "providers": {
    "gemini": {
      "type": "gemini",
      "name": "gemini",
      "apiKey": "your-api-key"
    }
  }
}
EOF
```

### Step 3: Update CLI Usage

Update any scripts or aliases that use Zulu Pilot:

**Old**:
```bash
zulu-pilot "explain this code"
```

**New**:
```bash
zulu-pilot chat --prompt "explain this code"
```

For interactive mode:
```bash
# Old
zulu-pilot

# New
zulu-pilot chat
```

### Step 4: Update Context Files

If you're using custom context files, they now support multiple formats:

- `.zulu-pilot-context.md` (preferred)
- `ZULU-PILOT.md`
- `GEMINI.md` (backward compatible)

### Step 5: Migrate Provider Configurations

If you had custom provider configurations, add them to the new format:

```json
{
  "defaultProvider": "gemini",
  "providers": {
    "gemini": {
      "type": "gemini",
      "apiKey": "your-key"
    },
    "ollama": {
      "type": "ollama",
      "baseUrl": "http://localhost:11434",
      "model": "qwen2.5-coder"
    }
  }
}
```

## New Features in v2

### 1. Multi-Provider Support

```bash
# Switch providers on the fly
zulu-pilot provider set-default ollama

# Use specific provider for a command
zulu-pilot chat --provider ollama --model qwen2.5-coder
```

### 2. Conversation Checkpoints

```bash
# Save conversation
zulu-pilot checkpoint save "important-session"

# Resume later
zulu-pilot chat --resume checkpoint-id
```

### 3. Headless Mode

```bash
# Non-interactive mode for scripts
zulu-pilot chat --headless --prompt "explain code" --output-format json
```

### 4. Enhanced Context Files

Create `.zulu-pilot-context.md` in your project root for persistent context.

## Compatibility

### Backward Compatible Features

- Configuration file location (`~/.zulu-pilot/config.json`)
- Basic chat functionality (with new command structure)
- Context file support (with new formats)

### Not Backward Compatible

- CLI command syntax (must use new command structure)
- Configuration file format (must convert)
- Provider configuration structure
- Some internal APIs (if using programmatic access)

## Troubleshooting

### Issue: Configuration Not Loading

**Solution**: Ensure your configuration follows the v2 format. Run:
```bash
zulu-pilot provider list
```
If providers don't appear, check your configuration format.

### Issue: Commands Not Working

**Solution**: Ensure you're using the new command structure:
```bash
# Old (won't work)
zulu-pilot --model gemini-pro

# New (correct)
zulu-pilot chat --provider gemini --model gemini-pro
```

### Issue: Context Files Not Loading

**Solution**: Ensure your context files use supported names:
- `.zulu-pilot-context.md`
- `ZULU-PILOT.md`
- `GEMINI.md`

## Getting Help

If you encounter issues during migration:

1. Check the [Documentation](README.md)
2. Review [Architecture Documentation](architecture.md)
3. Open an issue on GitHub
4. Check the [FAQ](../docs/faq.md)

## Rollback

If you need to rollback to v1:

1. Restore your backup:
   ```bash
   cp ~/.zulu-pilot/config.json.backup ~/.zulu-pilot/config.json
   ```
2. Uninstall v2 and reinstall v1
3. Note: Some features may not work after rollback

---

**Last Updated**: 2024
**Version**: 2.0.0

