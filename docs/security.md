# Security Guide

## API Key Handling

### Storage

API keys are stored in the configuration file (`~/.zulu-pilotrc`). **Never commit this file to version control.**

**Best Practice**: Use environment variables for API keys:

```json
{
  "gemini": {
    "apiKey": "env:GEMINI_API_KEY"
  }
}
```

The `env:VAR_NAME` format tells Zulu Pilot to read the API key from the environment variable instead of storing it directly in the config file.

### Validation

API keys are validated when loaded:
- Must be non-empty strings
- Minimum length: 10 characters
- Environment variable references must be in `env:VAR_NAME` format
- Environment variables must be set if referenced

### Access

API keys are:
- Stored in memory only (never logged)
- Passed directly to provider instances
- Never exposed in error messages
- Never written to stdout/stderr

## File Path Validation

### Directory Traversal Prevention

All file paths are validated to prevent directory traversal attacks:

```typescript
// ✅ Allowed: Relative paths within project
src/utils.ts
./config.json

// ❌ Blocked: Path traversal attempts
../../../etc/passwd
..\\..\\windows\\system32

// ❌ Blocked: Absolute paths outside project
/etc/passwd
C:\\Windows\\System32
```

### Validation Rules

1. **Base Directory**: All file operations are restricted to the project base directory
2. **Normalization**: Paths are normalized to prevent bypass attempts
3. **Absolute Path Check**: Absolute paths are checked against base directory
4. **Relative Path Check**: Relative paths with `..` are blocked

### Implementation

File path validation is implemented in `src/utils/validators.ts`:

```typescript
export function validateFilePath(filePath: string, baseDir: string): string {
  // Resolve to absolute path
  const absolutePath = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(baseDir, filePath);

  // Check if path is within base directory
  if (!absolutePath.startsWith(path.resolve(baseDir))) {
    throw new ValidationError('Path is outside the allowed directory');
  }

  // Check for directory traversal patterns
  if (filePath.includes('..')) {
    const normalized = path.normalize(filePath);
    if (normalized.includes('..')) {
      throw new ValidationError('Invalid directory traversal');
    }
  }

  return absolutePath;
}
```

## Dependency Security

### Vulnerability Scanning

Run `npm audit` regularly to check for vulnerabilities:

```bash
npm audit
npm audit fix  # Automatically fix vulnerabilities
```

### Security Updates

Keep dependencies up to date:

```bash
npm update
npm audit fix
```

## Google Cloud Authentication

### gcloud CLI

Google Cloud AI Platform uses `gcloud auth print-access-token` for authentication. This is more secure than storing long-lived tokens:

1. **Token Lifecycle**: Tokens are generated on-demand and expire automatically
2. **No Storage**: No tokens are stored in configuration files
3. **User Control**: Users control authentication via `gcloud auth login`

### Security Considerations

- Ensure `gcloud` CLI is installed from official sources
- Use `gcloud auth login` to authenticate
- Tokens are automatically refreshed by gcloud
- No API keys needed for Google Cloud (uses OAuth)

## File Modification Safety

### Backups

All file modifications create automatic backups:

- **Location**: `.zulu-pilot-backups/`
- **Format**: `{timestamp}-{filename}`
- **Preservation**: Original content is preserved before modification

### User Approval

All code changes require explicit user approval:

1. AI proposes changes
2. Diff is displayed
3. User must approve (y/n)
4. Changes are applied only after approval

### Syntax Validation

TypeScript/JavaScript files are validated before applying changes:

- Uses `tsc --noEmit` for syntax checking
- Prevents invalid code from being written
- Errors are shown before file modification

## Network Security

### HTTPS Only

All remote API connections use HTTPS:

- Gemini: `https://generativelanguage.googleapis.com`
- OpenAI: `https://api.openai.com`
- Google Cloud: `https://aiplatform.googleapis.com`

### Timeout Configuration

Network timeouts prevent hanging connections:

- **Local (Ollama)**: 5 seconds
- **Remote**: 30 seconds

### Error Handling

Network errors are handled gracefully:

- Connection errors show user-friendly messages
- Rate limit errors include retry guidance
- No sensitive information in error messages

## Best Practices

1. **Never commit API keys**: Use environment variables
2. **Use `.gitignore`**: Ensure `~/.zulu-pilotrc` is ignored
3. **Regular audits**: Run `npm audit` regularly
4. **Keep dependencies updated**: Update packages regularly
5. **Review file changes**: Always review diffs before approving
6. **Use backups**: Backups are automatic, but verify they exist
7. **Validate paths**: Be cautious with file paths from external sources

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Contact the maintainers privately
3. Provide detailed information about the vulnerability
4. Allow time for a fix before public disclosure

