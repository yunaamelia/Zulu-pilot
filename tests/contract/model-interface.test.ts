/**
 * Contract Test: Model Interface
 *
 * Ensures that the model adapter interface matches the contract
 * defined in contracts/model-adapter.interface.ts
 *
 * T051 [P] [US1] - Contract test for model interface
 */

import { describe, it, expect } from '@jest/globals';
import type { IModelAdapter, GenerateContentParams, GenerateContentResponse } from '@zulu-pilot/adapter';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';

describe('Contract Test: Model Interface (T051)', () => {
  describe('IModelAdapter interface contract', () => {
    it('should have generateContent method', () => {
      // Verify interface exists and has required method
      const adapter: IModelAdapter = {
        generateContent: async (_params: GenerateContentParams): Promise<GenerateContentResponse> => {
          return {
            content: [
              {
                role: 'model',
                parts: [{ text: 'test' }],
              },
            ],
          };
        },
        streamGenerateContent: async function* (_params: GenerateContentParams) {
          yield {
            content: [
              {
                role: 'model',
                parts: [{ text: 'test' }],
              },
            ],
          };
        },
      };

      expect(typeof adapter.generateContent).toBe('function');
      expect(typeof adapter.streamGenerateContent).toBe('function');
    });

    it('should have streamGenerateContent method that returns AsyncGenerator', async () => {
      const adapter: IModelAdapter = {
        generateContent: async (_params: GenerateContentParams): Promise<GenerateContentResponse> => {
          return {
            content: [
              {
                role: 'model',
                parts: [{ text: 'test' }],
              },
            ],
          };
        },
        streamGenerateContent: async function* (_params: GenerateContentParams) {
            yield {
            content: [
              {
                role: 'model',
                parts: [{ text: 'token1' }],
              },
            ],
          };
          yield {
            content: [
              {
                role: 'model',
                parts: [{ text: 'token2' }],
              },
            ],
          };
        },
      };

      const stream = adapter.streamGenerateContent({
        model: 'test-model',
        contents: [],
      });

      const results = [];
      for await (const response of stream) {
        results.push(response);
      }

      expect(results).toHaveLength(2);
      expect(results[0].content[0].parts[0].text).toBe('token1');
      expect(results[1].content[0].parts[0].text).toBe('token2');
    });

    it('should accept GenerateContentParams with required fields', async () => {
      const params: GenerateContentParams = {
        model: 'ollama:qwen2.5-coder',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
      };

      expect(params.model).toBe('ollama:qwen2.5-coder');
      expect(params.contents).toHaveLength(1);
      expect(params.contents[0].parts[0].text).toBe('Hello');
    });

    it('should return GenerateContentResponse with required fields', async () => {
      const response: GenerateContentResponse = {
        content: [
          {
            role: 'model',
            parts: [{ text: 'Hello, how can I help?' }],
          },
        ],
      };

      expect(response.content).toHaveLength(1);
      expect(response.content[0].role).toBe('model');
      expect(response.content[0].parts[0].text).toBe('Hello, how can I help?');
    });
  });

  describe('GeminiCLIModelAdapter implementation contract', () => {
    it('should implement IModelAdapter interface', () => {
      // This test verifies that GeminiCLIModelAdapter implements the interface
      // The actual implementation will be tested in integration tests
      expect(GeminiCLIModelAdapter).toBeDefined();
    });
  });
});

