# Quickstart Guide: Zulu Pilot CLI

**Purpose**: Validate the implementation through end-to-end user scenarios

## Prerequisites

1. Node.js 18+ installed
2. Ollama installed and running (for local models)
3. API keys for remote providers (if using Gemini, OpenAI, etc.)

## Installation

```bash
npm install
npm run build
npm link  # or npm install -g . for global install
```

## Configuration

Create `~/.zulu-pilotrc`:

```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder",
  "ollama": {
    "baseUrl": "http://localhost:11434"
  }
}
```

## Scenario 1: Basic Chat with Local Model (P1)

**Goal**: Verify basic chat functionality with local Ollama

**Steps**:

1. Start Ollama: `ollama serve`
2. Pull model: `ollama pull qwen2.5-coder`
3. Run: `zulu-pilot chat "How do I sort an array in TypeScript?"`
4. Verify: Response streams in real-time

**Expected**: Response appears token-by-token, completes successfully

## Scenario 2: Context-Aware Assistance (P1)

**Goal**: Verify file context loading and context-aware responses

**Steps**:

1. Create test file: `echo "export function hello() { return 'world'; }" > test.ts`
2. Run: `zulu-pilot chat`
3. In interactive mode: `/add test.ts`
4. Verify: `/context` shows test.ts loaded
5. Ask: "What does the hello function do?"
6. Verify: Response references the loaded file content

**Expected**: AI response mentions the hello function from test.ts

## Scenario 3: Provider Switching (P2)

**Goal**: Verify switching between different providers

**Steps**:

1. Configure OpenAI in `~/.zulu-pilotrc`
2. Run: `zulu-pilot chat --provider openai "Hello"`
3. Verify: Uses OpenAI API
4. Switch: `zulu-pilot chat --provider ollama "Hello"`
5. Verify: Uses local Ollama

**Expected**: Both providers work with same interface

## Scenario 4: Code Change Proposal (P2)

**Goal**: Verify agentic file modification with approval

**Steps**:

1. Create file: `echo "function add(a, b) { return a + b; }" > math.ts`
2. Run: `zulu-pilot chat "Add error handling to the add function"`
3. Verify: AI proposes code change with diff
4. Approve: Type `y` when prompted
5. Verify: File updated with error handling
6. Verify: Backup created in `.zulu-pilot-backups/`

**Expected**: File modified, backup preserved, diff shown correctly

## Scenario 5: Token Limit Warning (P1)

**Goal**: Verify token estimation and warnings

**Steps**:

1. Load many large files: `/add src/**/*.ts` (20+ files)
2. Verify: Warning shown if approaching token limit
3. Verify: Guidance on which files to remove
4. Clear some: `/clear` then reload fewer files
5. Verify: Warning disappears

**Expected**: Accurate token estimation, helpful warnings

## Scenario 6: Error Handling (P3)

**Goal**: Verify graceful error handling

**Steps**:

1. Stop Ollama: `pkill ollama`
2. Run: `zulu-pilot chat "Hello"`
3. Verify: Clear error message with resolution steps
4. Start Ollama: `ollama serve`
5. Run again: Should work now

**Expected**: User-friendly error messages, actionable guidance

## Scenario 7: Google Cloud Models (P2)

**Goal**: Verify Google Cloud AI Platform integration

**Steps**:

1. Authenticate: `gcloud auth login`
2. Configure in `~/.zulu-pilotrc`:
   ```json
   {
     "provider": "googleCloud",
     "model": "deepseek-ai/deepseek-v3.1-maas",
     "googleCloud": {
       "projectId": "protean-tooling-476420-i8",
       "region": "us-west2"
     }
   }
   ```
3. Run: `zulu-pilot chat "Hello"`
4. Verify: Connects to Google Cloud, uses gcloud auth token

**Expected**: Successful connection and response from Google Cloud model

## Validation Checklist

After completing all scenarios:

- [ ] Local Ollama connection works
- [ ] File context loading works (`/add`, `/context`, `/clear`)
- [ ] Provider switching works
- [ ] Code change proposals work with approval
- [ ] Token estimation and warnings work
- [ ] Error handling is user-friendly
- [ ] Google Cloud integration works
- [ ] Streaming responses work in real-time
- [ ] File backups are created
- [ ] Configuration file is respected

## Troubleshooting

**Ollama connection refused**:

- Verify Ollama is running: `ollama serve`
- Check port: Default is 11434
- Verify in config: `baseUrl` matches Ollama URL

**API key errors**:

- Check `~/.zulu-pilotrc` has correct API keys
- For env vars: Use format `"env:VAR_NAME"`
- Verify API key is valid and has quota

**Token limit warnings**:

- Reduce number of files in context
- Use `/context` to see what's loaded
- Use `/clear` to start fresh

**File modification errors**:

- Check file permissions
- Verify file path is valid
- Check backup directory is writable
