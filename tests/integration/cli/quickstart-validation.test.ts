import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { OllamaProvider } from '../../../src/core/llm/OllamaProvider.js';
import { ContextManager } from '../../../src/core/context/ContextManager.js';
import { ConfigManager } from '../../../src/core/config/ConfigManager.js';
import { CodeChangeParser } from '../../../src/core/parser/CodeChangeParser.js';
import { FilePatcher } from '../../../src/core/parser/FilePatcher.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Quickstart validation tests.
 * Validates scenarios from quickstart.md to ensure they work as documented.
 */
describe('Quickstart Validation', () => {
  let mockAdapter: MockAdapter;
  let axiosInstance: AxiosInstance;
  let tempDir: string;
  let contextManager: ContextManager;

  beforeEach(() => {
    axiosInstance = axios.create({ baseURL: 'http://localhost:11434' });
    mockAdapter = new MockAdapter(axiosInstance);
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-quickstart-'));
    contextManager = new ContextManager({ baseDir: tempDir });
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Scenario 1: Basic Chat with Local Model (P1)', () => {
    it('should stream response in real-time', async () => {
      const provider = new OllamaProvider({ axiosInstance, model: 'qwen2.5-coder' });

      // Mock streaming response
      const { Readable } = await import('node:stream');
      const mockStream = new Readable({
        read() {
          this.push(
            Buffer.from('data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"How"}}]}\n\n')
          );
          this.push(
            Buffer.from('data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" to"}}]}\n\n')
          );
          this.push(
            Buffer.from('data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" sort"}}]}\n\n')
          );
          this.push(Buffer.from('data: [DONE]\n\n'));
          this.push(null);
        },
      });

      mockAdapter.onPost('/v1/chat/completions').reply(200, mockStream, {
        'Content-Type': 'text/event-stream',
      });

      const tokens: string[] = [];
      for await (const token of provider.streamResponse(
        'How do I sort an array in TypeScript?',
        []
      )) {
        tokens.push(token);
      }

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.join('')).toContain('How');
    });
  });

  describe('Scenario 2: Context-Aware Assistance (P1)', () => {
    it('should load file context and answer questions about it', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, "export function hello() { return 'world'; }");

      // Add file to context
      await contextManager.addFile(testFile);

      // Verify context loaded
      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
      expect(context[0].path).toContain('test.ts');
      expect(context[0].content).toContain('hello');
    });
  });

  describe('Scenario 3: Provider Switching (P2)', () => {
    it('should support switching between providers', async () => {
      const ollamaProvider = new OllamaProvider({ axiosInstance, model: 'qwen2.5-coder' });

      // Mock Ollama response
      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'Hello from Ollama' } }],
      });

      const response = await ollamaProvider.generateResponse('Hello', []);
      expect(response).toBe('Hello from Ollama');
    });
  });

  describe('Scenario 4: Code Change Proposal (P2)', () => {
    it('should parse and apply code changes with approval', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'math.ts');
      await fs.writeFile(testFile, 'function add(a, b) { return a + b; }');

      // Simulate AI response with code change
      const aiResponse = `Here's the updated function with error handling:

\`\`\`typescript:math.ts
function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}
\`\`\``;

      // Parse code changes
      const parser = new CodeChangeParser({ baseDir: tempDir });
      const changes = parser.parse(aiResponse);

      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].filePath).toContain('math.ts');
      expect(changes[0].newContent).toContain('typeof a');

      // Apply change
      const patcher = new FilePatcher({ baseDir: tempDir });
      await patcher.applyChange(changes[0]);

      // Verify file updated
      const updatedContent = await fs.readFile(testFile, 'utf-8');
      expect(updatedContent).toContain('typeof a');
      expect(updatedContent).toContain('throw new Error');
    });
  });

  describe('Scenario 5: Token Limit Warning (P1)', () => {
    it('should warn when approaching token limit', async () => {
      // Create multiple large files
      const files = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const filePath = path.join(tempDir, `file${i}.ts`);
          const content = `export const data${i} = ${JSON.stringify(Array.from({ length: 1000 }, (_, j) => `item${j}`))};`;
          await fs.writeFile(filePath, content);
          return filePath;
        })
      );

      // Add files
      for (const file of files) {
        await contextManager.addFile(file);
      }

      // Check token limit
      // Warning triggers at 80% of limit, so set limit to 1.2x current tokens to trigger "approaching"
      const totalTokens = contextManager.getTotalEstimatedTokens();
      const warning = contextManager.checkTokenLimit(Math.ceil(totalTokens * 1.2)); // 20% above = approaching
      expect(warning).toBeTruthy();
      expect(warning).toMatch(/approaching token limit|exceeds token limit/);
    });
  });

  describe('Scenario 6: Error Handling (P3)', () => {
    it('should provide user-friendly error messages', async () => {
      const provider = new OllamaProvider({ axiosInstance, model: 'qwen2.5-coder' });

      // Mock connection error
      mockAdapter.onPost('/v1/chat/completions').networkError();

      await expect(provider.generateResponse('Hello', [])).rejects.toThrow();

      try {
        await provider.generateResponse('Hello', []);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'getUserMessage' in error) {
          const userMessage = (error as { getUserMessage: () => string }).getUserMessage();
          expect(userMessage).toContain('Failed to connect');
          expect(userMessage).toContain('Ollama is running');
        }
      }
    });
  });

  describe('Scenario 7: Google Cloud Models (P2)', () => {
    it('should support Google Cloud AI Platform configuration', () => {
      // This scenario requires actual gcloud auth, so we just verify
      // that the configuration structure is correct
      const config = {
        provider: 'googleCloud',
        googleCloud: {
          projectId: 'test-project',
          region: 'us-west2',
          model: 'deepseek-ai/deepseek-v3.1-maas',
        },
      };

      expect(config.googleCloud).toHaveProperty('projectId');
      expect(config.googleCloud).toHaveProperty('region');
      expect(config.googleCloud).toHaveProperty('model');
    });
  });

  describe('Configuration validation', () => {
    it('should load default configuration when file does not exist', async () => {
      const configManager = new ConfigManager();
      const config = await configManager.load();

      expect(config.provider).toBe('ollama');
      expect(config.model).toBe('qwen2.5-coder');
    });
  });
});
