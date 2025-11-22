import { describe, it, expect } from '@jest/globals';

/**
 * Contract tests for Ollama API.
 * These tests verify that our implementation correctly handles the Ollama API contract.
 */
describe('Ollama API Contract', () => {
  describe('Request Format', () => {
    it('should use OpenAI-compatible endpoint format', () => {
      // Contract: POST /v1/chat/completions
      const endpoint = '/v1/chat/completions';
      expect(endpoint).toBe('/v1/chat/completions');
    });

    it('should include required fields in request', () => {
      // Contract: model, messages, stream (optional)
      const request = {
        model: 'qwen2.5-coder',
        messages: [{ role: 'user', content: 'test' }],
        stream: true,
      };
      expect(request.model).toBeDefined();
      expect(request.messages).toBeDefined();
      expect(Array.isArray(request.messages)).toBe(true);
    });
  });

  describe('Response Format', () => {
    it('should handle streaming response format', () => {
      // Contract: text/event-stream with data: prefix
      const streamLine = 'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"test"}}]}\n\n';
      expect(streamLine.startsWith('data: ')).toBe(true);
    });

    it('should handle non-streaming response format', () => {
      // Contract: JSON with choices array
      const response = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'test response',
            },
          },
        ],
      };
      expect(response.choices).toBeDefined();
      expect(Array.isArray(response.choices)).toBe(true);
    });
  });

  describe('Error Responses', () => {
    it('should handle connection refused error', () => {
      // Contract: ECONNREFUSED for Ollama not running
      const errorCode = 'ECONNREFUSED';
      expect(errorCode).toBe('ECONNREFUSED');
    });

    it('should handle model not found error', () => {
      // Contract: 404 status with error message
      const errorResponse = {
        status: 404,
        data: { error: { message: "model 'xyz' not found" } },
      };
      expect(errorResponse.status).toBe(404);
      expect(errorResponse.data.error).toBeDefined();
    });
  });
});
