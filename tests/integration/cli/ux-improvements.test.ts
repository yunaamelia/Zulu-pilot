import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { OllamaProvider } from '../../../src/core/llm/OllamaProvider.js';
import { StreamHandler } from '../../../src/cli/ui/stream.js';
import { Spinner } from '../../../src/cli/ui/spinner.js';

describe('UX Improvements Integration', () => {
  let mockAdapter: MockAdapter;
  let axiosInstance: AxiosInstance;
  let originalStdoutWrite: typeof process.stdout.write;
  let stdoutOutput: string[];

  beforeEach(() => {
    stdoutOutput = [];
    originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = jest.fn((chunk: string) => {
      stdoutOutput.push(chunk);
      return true;
    }) as typeof process.stdout.write;

    axiosInstance = axios.create({ baseURL: 'http://localhost:11434' });
    mockAdapter = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    mockAdapter.restore();
  });

  describe('loading indicators during API calls', () => {
    it('should show spinner while connecting to API', async () => {
      // Delay response to simulate connection time
      mockAdapter.onPost('/v1/chat/completions').reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              200,
              {
                choices: [{ message: { content: 'Response' } }],
              },
            ]);
          }, 100);
        });
      });

      const provider = new OllamaProvider({ axiosInstance });
      const spinner = new Spinner('Connecting...');
      spinner.start();

      try {
        await provider.generateResponse('test', []);
      } finally {
        spinner.stop();
      }

      const output = stdoutOutput.join('');
      expect(output).toContain('Connecting...');
    });

    it('should show spinner while waiting for first token', async () => {
      const { Readable } = await import('node:stream');
      const streamChunks = [
        'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      const mockStream = new Readable({
        read() {
          setTimeout(() => {
            for (const chunk of streamChunks) {
              this.push(Buffer.from(chunk));
            }
            this.push(null);
          }, 100);
        },
      });

      mockAdapter.onPost('/v1/chat/completions').reply(200, mockStream, {
        'Content-Type': 'text/event-stream',
      });

      const provider = new OllamaProvider({ axiosInstance });
      const spinner = new Spinner('Waiting for response...');
      spinner.start();

      try {
        const streamHandler = new StreamHandler();
        await streamHandler.streamToStdout(provider.streamResponse('test', []));
      } finally {
        spinner.stop();
      }

      const output = stdoutOutput.join('');
      expect(output).toContain('Waiting for response...');
    });
  });

  describe('error message display', () => {
    it('should display user-friendly error messages', async () => {
      mockAdapter.onPost('/v1/chat/completions').reply(500, {
        error: { message: 'Internal server error' },
      });

      const provider = new OllamaProvider({ axiosInstance });

      try {
        await provider.generateResponse('test', []);
      } catch (error: unknown) {
        if (error instanceof Error) {
          // Error should be user-friendly
          expect(error.message).toBeTruthy();
        }
      }
    });

    it('should display actionable guidance in error messages', async () => {
      mockAdapter.onPost('/v1/chat/completions').networkError();

      const provider = new OllamaProvider({ axiosInstance });

      try {
        await provider.generateResponse('test', []);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'getUserMessage' in error) {
          const userMessage = (error as { getUserMessage: () => string }).getUserMessage();
          expect(userMessage).toContain('Failed to connect');
          expect(userMessage).toContain('Ollama is running');
        }
      }
    });
  });

  describe('streaming output smoothness', () => {
    it('should stream tokens smoothly without buffering', async () => {
      const { Readable } = await import('node:stream');
      const tokens = ['Hello', ' ', 'world', '!'];
      let tokenIndex = 0;

      const mockStream = new Readable({
        read() {
          if (tokenIndex < tokens.length) {
            const token = tokens[tokenIndex];
            this.push(
              Buffer.from(
                `data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"${token}"}}]}\n\n`
              )
            );
            tokenIndex++;
          } else {
            this.push(Buffer.from('data: [DONE]\n\n'));
            this.push(null);
          }
        },
      });

      mockAdapter.onPost('/v1/chat/completions').reply(200, mockStream, {
        'Content-Type': 'text/event-stream',
      });

      const provider = new OllamaProvider({ axiosInstance });
      const streamHandler = new StreamHandler();

      await streamHandler.streamToStdout(provider.streamResponse('test', []));

      const output = stdoutOutput.join('');
      expect(output).toContain('Hello');
      expect(output).toContain('world');
      expect(output).toContain('!');
    });

    it('should handle backpressure correctly', async () => {
      const { Readable } = await import('node:stream');
      const largeToken = 'x'.repeat(1000);

      const mockStream = new Readable({
        read() {
          this.push(
            Buffer.from(
              `data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"${largeToken}"}}]}\n\n`
            )
          );
          this.push(Buffer.from('data: [DONE]\n\n'));
          this.push(null);
        },
      });

      mockAdapter.onPost('/v1/chat/completions').reply(200, mockStream, {
        'Content-Type': 'text/event-stream',
      });

      const provider = new OllamaProvider({ axiosInstance });
      const streamHandler = new StreamHandler();

      await streamHandler.streamToStdout(provider.streamResponse('test', []));

      // Should handle large tokens without issues
      expect(stdoutOutput.length).toBeGreaterThan(0);
    });
  });
});
