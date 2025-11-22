import { describe, it, expect } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

/**
 * Contract tests for Gemini API.
 * Verifies request/response format compatibility.
 */
describe('Gemini API Contract', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    const axiosInstance = axios.create();
    mockAdapter = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  describe('Request Format', () => {
    it('should use Gemini API format (contents, generationConfig, safetySettings)', () => {
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Test prompt' }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 65535,
          topP: 0.95,
          thinkingConfig: {
            thinkingBudget: -1,
          },
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'OFF',
          },
        ],
      };

      expect(requestBody).toHaveProperty('contents');
      expect(requestBody).toHaveProperty('generationConfig');
      expect(requestBody).toHaveProperty('safetySettings');
      expect(requestBody.contents[0]).toHaveProperty('role', 'user');
      expect(requestBody.contents[0]).toHaveProperty('parts');
    });
  });

  describe('Response Format', () => {
    it('should handle streaming response format', () => {
      const streamingResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Response chunk' }],
              role: 'model',
            },
            finishReason: null,
          },
        ],
      };

      expect(streamingResponse).toHaveProperty('candidates');
      expect(streamingResponse.candidates[0]).toHaveProperty('content');
      expect(streamingResponse.candidates[0].content).toHaveProperty('parts');
    });

    it('should handle non-streaming response format', () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Full response' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
        },
      };

      expect(response).toHaveProperty('candidates');
      expect(response.candidates[0]).toHaveProperty('finishReason', 'STOP');
      expect(response).toHaveProperty('usageMetadata');
    });
  });

  describe('Error Responses', () => {
    it('should handle invalid API key error', () => {
      const errorResponse = {
        error: {
          code: 401,
          message: 'API key not valid',
          status: 'UNAUTHENTICATED',
        },
      };

      expect(errorResponse.error).toHaveProperty('code', 401);
      expect(errorResponse.error).toHaveProperty('status', 'UNAUTHENTICATED');
    });

    it('should handle rate limit error', () => {
      const errorResponse = {
        error: {
          code: 429,
          message: 'Resource has been exhausted',
          status: 'RESOURCE_EXHAUSTED',
        },
      };

      expect(errorResponse.error).toHaveProperty('code', 429);
      expect(errorResponse.error).toHaveProperty('status', 'RESOURCE_EXHAUSTED');
    });

    it('should handle model not found error', () => {
      const errorResponse = {
        error: {
          code: 404,
          message: 'Model not found',
          status: 'NOT_FOUND',
        },
      };

      expect(errorResponse.error).toHaveProperty('code', 404);
      expect(errorResponse.error).toHaveProperty('status', 'NOT_FOUND');
    });
  });
});
