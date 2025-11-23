/**
 * Integration tests for Gemini CLI core integration with Zulu Pilot adapter
 * @package @zulu-pilot/core
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createContentGenerator } from '../../../packages/core/src/core/contentGenerator.js';
import { ZuluPilotContentGenerator } from '../../../packages/core/src/core/zuluPilotContentGenerator.js';
import type { IModelAdapter } from '@zulu-pilot/adapter';
import type { GenerateContentParams, GenerateContentResponse } from '@zulu-pilot/adapter';
import type { ContentGeneratorConfig } from '../../../packages/core/src/core/contentGenerator.js';
import type { Config } from '../../../packages/core/src/config/config.js';

// Mock IModelAdapter
class MockModelAdapter implements IModelAdapter {
  async generateContent(params: GenerateContentParams): Promise<GenerateContentResponse> {
    return {
      content: [
        {
          role: 'model',
          parts: [
            {
              text: `Mock response for model: ${params.model}`,
            },
          ],
        },
      ],
    };
  }

  async *streamGenerateContent(
    params: GenerateContentParams
  ): AsyncGenerator<GenerateContentResponse, void, unknown> {
    yield {
      content: [
        {
          role: 'model',
          parts: [
            {
              text: `Stream response for model: ${params.model}`,
            },
          ],
        },
      ],
    };
  }
}

describe('Gemini CLI Core Integration', () => {
  let mockAdapter: IModelAdapter;
  let mockConfig: Partial<Config>;

  beforeEach((): void => {
    mockAdapter = new MockModelAdapter();
    mockConfig = {
      fakeResponses: undefined,
      recordResponses: undefined,
      getUsageStatisticsEnabled: () => false,
      getProxy: () => undefined,
    };
  });

  describe('createContentGenerator with Zulu Pilot adapter', () => {
    it('should create ZuluPilotContentGenerator when adapter is provided', async (): Promise<void> => {
      const config: ContentGeneratorConfig = {
        authType: undefined,
      };

      const generator = await createContentGenerator(
        config,
        mockConfig as Config,
        'test-session',
        mockAdapter
      );

      expect(generator).toBeInstanceOf(ZuluPilotContentGenerator);
    });

    it('should generate content using adapter', async (): Promise<void> => {
      const generator = new ZuluPilotContentGenerator(mockAdapter);
      const response = await generator.generateContent({
        model: 'ollama:qwen2.5-coder',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
      });

      expect(response).toBeDefined();
      // Type assertion needed due to adapter response conversion
      const responseAny = response as any;
      expect(responseAny.content || responseAny.candidates).toBeDefined();
      const content = responseAny.content || responseAny.candidates?.[0]?.content;
      if (content && Array.isArray(content) && content.length > 0 && content[0].parts) {
        expect(content[0].parts[0].text).toContain('Mock response');
      }
    });

    it('should stream content using adapter', async (): Promise<void> => {
      const generator = new ZuluPilotContentGenerator(mockAdapter);
      const stream = await generator.generateContentStream({
        model: 'ollama:qwen2.5-coder',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
      });

      let responseCount = 0;
      for await (const response of stream) {
        expect(response).toBeDefined();
        expect(response.candidates).toBeDefined();
        responseCount++;
      }

      expect(responseCount).toBeGreaterThan(0);
    });
  });

  describe('ZuluPilotContentGenerator', () => {
    it('should implement ContentGenerator interface', (): void => {
      const generator = new ZuluPilotContentGenerator(mockAdapter);

      expect(generator.generateContent).toBeDefined();
      expect(generator.generateContentStream).toBeDefined();
      expect(generator.countTokens).toBeDefined();
      expect(generator.embedContent).toBeDefined();
    });

    it('should handle countTokens', async (): Promise<void> => {
      const generator = new ZuluPilotContentGenerator(mockAdapter);
      const result = await generator.countTokens({
        model: 'test-model',
        contents: [],
      });

      expect(result).toBeDefined();
      expect(result.totalTokens).toBeDefined();
    });

    it('should throw error for embedContent (not yet supported)', async (): Promise<void> => {
      const generator = new ZuluPilotContentGenerator(mockAdapter);

      await expect(
        generator.embedContent({
          model: 'test-model',
          contents: [],
        })
      ).rejects.toThrow('Embedding not yet supported');
    });
  });
});
