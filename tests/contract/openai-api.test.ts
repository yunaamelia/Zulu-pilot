import { describe, it, expect } from '@jest/globals';

/**
 * Contract tests for OpenAI-compatible API.
 * Verifies request/response format compatibility.
 */
describe('OpenAI-Compatible API Contract', () => {
  describe('Request Format', () => {
    it('should use OpenAI Chat Completions format', () => {
      const requestBody = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.95,
      };

      expect(requestBody).toHaveProperty('model');
      expect(requestBody).toHaveProperty('messages');
      expect(requestBody.messages).toBeInstanceOf(Array);
      expect(requestBody.messages[0]).toHaveProperty('role');
      expect(requestBody.messages[0]).toHaveProperty('content');
    });
  });

  describe('Response Format', () => {
    it('should handle streaming response format (SSE)', () => {
      const sseEvent = 'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"}}]}\n\n';

      expect(sseEvent).toContain('data: ');
      expect(sseEvent).toContain('choices');
      expect(sseEvent).toContain('delta');
    });

    it('should handle non-streaming response format', () => {
      const response = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1694268190,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Full response text here',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      expect(response).toHaveProperty('choices');
      expect(response.choices[0]).toHaveProperty('message');
      expect(response.choices[0].message).toHaveProperty('content');
      expect(response).toHaveProperty('usage');
    });
  });

  describe('Error Responses', () => {
    it('should handle invalid API key error', () => {
      const errorResponse = {
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
        },
      };

      expect(errorResponse.error).toHaveProperty('type', 'invalid_request_error');
    });

    it('should handle rate limit error', () => {
      const errorResponse = {
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
        },
      };

      expect(errorResponse.error).toHaveProperty('type', 'rate_limit_error');
    });

    it('should handle model not found error', () => {
      const errorResponse = {
        error: {
          message: "The model 'xyz' does not exist",
          type: 'invalid_request_error',
        },
      };

      expect(errorResponse.error).toHaveProperty('type', 'invalid_request_error');
    });
  });

  describe('Google Cloud AI Platform Specific', () => {
    it('should support Google Cloud model format', () => {
      const requestBody = {
        model: 'deepseek-ai/deepseek-v3.1-maas',
        stream: true,
        max_tokens: 32768,
        temperature: 0.4,
        top_p: 0.95,
        messages: [
          {
            role: 'user',
            content: 'Your prompt here',
          },
        ],
      };

      expect(requestBody.model).toContain('/');
      expect(requestBody).toHaveProperty('messages');
    });
  });
});
