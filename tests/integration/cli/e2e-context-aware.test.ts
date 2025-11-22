import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ContextManager } from '../../../src/core/context/ContextManager.js';
import { OllamaProvider } from '../../../src/core/llm/OllamaProvider.js';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

/**
 * End-to-end test for context-aware assistance.
 * Test: load file → ask question → verify AI references file
 */
describe('E2E Context-Aware Assistance', () => {
  let contextManager: ContextManager;
  let provider: OllamaProvider;
  let mockAdapter: MockAdapter;
  let axiosInstance: ReturnType<typeof axios.create>;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
    contextManager = new ContextManager({ baseDir: tempDir });

    axiosInstance = axios.create({
      baseURL: 'http://localhost:11434',
      timeout: 5000,
    });
    mockAdapter = new MockAdapter(axiosInstance);
    provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5-coder',
      axiosInstance,
    });
  });

  afterEach(async () => {
    mockAdapter.restore();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Context-aware question answering', () => {
    it('should include file context in AI request', async () => {
      // Step 1: Load file into context
      const testFile = path.join(tempDir, 'calculator.ts');
      const fileContent = `
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
`;
      await fs.writeFile(testFile, fileContent);
      await contextManager.addFile(testFile);

      // Step 2: Ask question about the code
      const question = 'What functions are exported from this file?';
      const context = contextManager.getContext();

      // Mock AI response
      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [
          {
            message: {
              content: 'The file exports two functions: add() and multiply()',
            },
          },
        ],
      });

      // Step 3: Verify AI receives context
      await provider.generateResponse(question, context);

      const request = mockAdapter.history.post[0];
      const requestData = JSON.parse(request.data);
      expect(requestData.messages).toBeDefined();

      // Should have system message with context + user message
      const systemMessage = requestData.messages.find(
        (msg: { role: string }) => msg.role === 'system'
      );
      expect(systemMessage).toBeDefined();
      expect(systemMessage.content).toContain('calculator.ts');
      expect(systemMessage.content).toContain('add');
      expect(systemMessage.content).toContain('multiply');
    });

    it('should answer questions using file context', async () => {
      // Load a code file
      const codeFile = path.join(tempDir, 'utils.ts');
      await fs.writeFile(codeFile, 'export const API_URL = "https://api.example.com";');
      await contextManager.addFile(codeFile);

      const question = 'What is the API URL?';
      const context = contextManager.getContext();

      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [
          {
            message: {
              content: 'The API URL is https://api.example.com',
            },
          },
        ],
      });

      const response = await provider.generateResponse(question, context);

      expect(response).toContain('api.example.com');
    });

    it('should handle multiple files in context', async () => {
      // Load multiple files
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'export const X = 1;');
      await fs.writeFile(file2, 'export const Y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);

      const question = 'What constants are defined?';
      const context = contextManager.getContext();

      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [
          {
            message: {
              content: 'X = 1 and Y = 2',
            },
          },
        ],
      });

      await provider.generateResponse(question, context);

      // Verify context was included
      const request = mockAdapter.history.post[0];
      const requestData = JSON.parse(request.data);
      const systemMessage = requestData.messages.find(
        (msg: { role: string }) => msg.role === 'system'
      );
      expect(systemMessage.content).toContain('file1.ts');
      expect(systemMessage.content).toContain('file2.ts');
    });

    it('should work without context when no files loaded', async () => {
      const question = 'What is TypeScript?';
      const context = contextManager.getContext(); // Empty

      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [
          {
            message: {
              content: 'TypeScript is a typed superset of JavaScript',
            },
          },
        ],
      });

      const response = await provider.generateResponse(question, context);

      expect(response).toBeTruthy();
      // Should have system message (with format instructions) and user message
      const request = mockAdapter.history.post[0];
      const requestData = JSON.parse(request.data);
      expect(requestData.messages.length).toBe(2);
      expect(requestData.messages[0].role).toBe('system');
      expect(requestData.messages[1].role).toBe('user');
    });
  });

  describe('Context management in user flow', () => {
    it('should maintain context across multiple questions', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      await fs.writeFile(testFile, 'export const PORT = 3000;');
      await contextManager.addFile(testFile);

      const context = contextManager.getContext();

      // First question
      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'The port is 3000' } }],
      });

      await provider.generateResponse('What port is configured?', context);

      // Second question (same context)
      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'Yes, port 3000' } }],
      });

      await provider.generateResponse('Is this the default port?', context);

      // Context should still be available
      expect(contextManager.getContext()).toHaveLength(1);
    });

    it('should clear context and work without it', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');
      await contextManager.addFile(testFile);

      expect(contextManager.getContext()).toHaveLength(1);

      contextManager.clear();

      expect(contextManager.getContext()).toHaveLength(0);

      // Should work with empty context
      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'Hello' } }],
      });

      await provider.generateResponse('Hello', contextManager.getContext());

      // Verify request was made
      expect(mockAdapter.history.post.length).toBeGreaterThan(0);
    });
  });
});
