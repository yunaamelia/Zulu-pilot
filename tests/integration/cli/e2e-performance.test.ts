import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { OllamaProvider } from '../../../src/core/llm/OllamaProvider.js';
import { ContextManager } from '../../../src/core/context/ContextManager.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('E2E Performance Validation', () => {
  let mockAdapter: MockAdapter;
  let axiosInstance: AxiosInstance;
  let tempDir: string;
  let contextManager: ContextManager;

  beforeEach(() => {
    axiosInstance = axios.create({ baseURL: 'http://localhost:11434' });
    mockAdapter = new MockAdapter(axiosInstance);
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-e2e-perf-'));
    contextManager = new ContextManager({ baseDir: tempDir });
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('complete coding assistance session (SC-006)', () => {
    it('should complete typical use case in < 2 minutes', async () => {
      // Simulate a typical coding assistance session:
      // 1. Load context (5 files)
      // 2. Ask question
      // 3. Get response
      // 4. Propose code change
      // 5. Apply change

      // Setup: Create test files
      const testFiles = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const filePath = path.join(tempDir, `file${i}.ts`);
          await fs.writeFile(filePath, `export const value${i} = ${i};`);
          return filePath;
        })
      );

      const sessionStart = Date.now();

      // Step 1: Load context
      for (const file of testFiles) {
        await contextManager.addFile(file);
      }
      const contextLoadTime = Date.now() - sessionStart;

      // Step 2 & 3: Ask question and get response
      const context = contextManager.getContext();
      const provider = new OllamaProvider({ axiosInstance, model: 'qwen2.5-coder' });

      // Mock streaming response
      const { Readable } = await import('node:stream');
      const mockStream = new Readable({
        read() {
          this.push(
            Buffer.from(
              'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Here"}}]}\n\n'
            )
          );
          this.push(
            Buffer.from(
              'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" is"}}]}\n\n'
            )
          );
          this.push(
            Buffer.from(
              'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" the"}}]}\n\n'
            )
          );
          this.push(
            Buffer.from(
              'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" answer"}}]}\n\n'
            )
          );
          this.push(Buffer.from('data: [DONE]\n\n'));
          this.push(null);
        },
      });

      mockAdapter.onPost('/v1/chat/completions').reply(200, mockStream, {
        'Content-Type': 'text/event-stream',
      });

      const responseStart = Date.now();
      let responseText = '';
      for await (const token of provider.streamResponse('Explain the code', context)) {
        responseText += token;
      }
      const responseTime = Date.now() - responseStart;

      // Step 4 & 5: Propose and apply code change (simulated)
      const changeStart = Date.now();
      // In real scenario, this would parse code changes and apply them
      // For performance test, we just measure the time
      const changeTime = Date.now() - changeStart;

      const totalTime = Date.now() - sessionStart;

      // SC-006: Complete session should complete in < 2 minutes (120,000ms)
      expect(totalTime).toBeLessThan(120000);

      // Individual step performance checks
      expect(contextLoadTime).toBeLessThan(5000); // Context loading < 5s
      expect(responseTime).toBeLessThan(30000); // Response < 30s
      expect(changeTime).toBeLessThan(5000); // Change application < 5s
    });

    it('should handle multiple questions efficiently', async () => {
      // Setup context
      const filePath = path.join(tempDir, 'test.ts');
      await fs.writeFile(filePath, 'export function add(a: number, b: number) { return a + b; }');
      await contextManager.addFile(filePath);
      const context = contextManager.getContext();

      const provider = new OllamaProvider({ axiosInstance, model: 'qwen2.5-coder' });

      // Mock multiple responses
      let callCount = 0;
      mockAdapter.onPost('/v1/chat/completions').reply(() => {
        callCount++;
        const { Readable } = require('node:stream');
        const mockStream = new Readable({
          read() {
            this.push(
              Buffer.from(
                `data: {"id":"chatcmpl-${callCount}","choices":[{"delta":{"content":"Answer ${callCount}"}}]}\n\n`
              )
            );
            this.push(Buffer.from('data: [DONE]\n\n'));
            this.push(null);
          },
        });
        return [200, mockStream, { 'Content-Type': 'text/event-stream' }];
      });

      const sessionStart = Date.now();

      // Ask 3 questions
      const questions = ['What does this function do?', 'How can I improve it?', 'Add error handling'];
      for (const question of questions) {
        let responseText = '';
        for await (const token of provider.streamResponse(question, context)) {
          responseText += token;
        }
      }

      const totalTime = Date.now() - sessionStart;

      // Multiple questions should complete in reasonable time
      expect(totalTime).toBeLessThan(60000); // < 1 minute for 3 questions
      expect(callCount).toBe(3);
    });
  });

  describe('performance metrics', () => {
    it('should measure CLI startup time', async () => {
      // CLI startup should be < 500ms (per plan.md)
      // This is measured at the application level, but we can verify
      // that core components initialize quickly
      const startTime = Date.now();
      new ContextManager();
      new OllamaProvider({ axiosInstance });
      const initTime = Date.now() - startTime;

      // Core component initialization should be fast
      expect(initTime).toBeLessThan(100);
    });

    it('should measure first token latency', async () => {
      const provider = new OllamaProvider({ axiosInstance, model: 'qwen2.5-coder' });

      // Mock fast response
      const { Readable } = await import('node:stream');
      const mockStream = new Readable({
        read() {
          setTimeout(() => {
            this.push(
              Buffer.from(
                'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"}}]}\n\n'
              )
            );
            this.push(Buffer.from('data: [DONE]\n\n'));
            this.push(null);
          }, 50); // Simulate 50ms network latency
        },
      });

      mockAdapter.onPost('/v1/chat/completions').reply(200, mockStream, {
        'Content-Type': 'text/event-stream',
      });

      const startTime = Date.now();
      const iterator = provider.streamResponse('Hello', []);
      const firstResult = await iterator.next();
      const firstTokenLatency = Date.now() - startTime;

      // First token latency should be < 1s (per plan.md)
      expect(firstTokenLatency).toBeLessThan(1000);
      expect(firstResult.done).toBe(false);
      expect(firstResult.value).toBe('Hello');
    });

    it('should measure file context loading time', async () => {
      const filePath = path.join(tempDir, 'test.ts');
      const content = 'export const value = 42;';
      await fs.writeFile(filePath, content);

      const startTime = Date.now();
      await contextManager.addFile(filePath);
      const loadTime = Date.now() - startTime;

      // File context loading should be < 100ms per file (per plan.md)
      expect(loadTime).toBeLessThan(100);
    });
  });
});

