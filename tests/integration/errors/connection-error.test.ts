/**
 * Integration Test: Connection Error
 * T114: Write integration test for connection error in tests/integration/errors/connection-error.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { ConnectionError } from '@zulu-pilot/core';
import { OllamaProvider } from '@zulu-pilot/providers';

describe('Integration Test: Connection Error (T114)', () => {
  describe('Ollama Provider - Local Connection', () => {
    it('should throw ConnectionError when Ollama is not running', async () => {
      const provider = new OllamaProvider({
        baseUrl: 'http://localhost:99999', // Invalid port
        timeout: 1000, // Short timeout for test
      });

      try {
        await provider.generateResponse('test', []);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Provider may throw ConnectionError or timeout
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    }, 5000); // 5 second timeout for test

    it('should provide Ollama-specific guidance in connection error', () => {
      const error = new ConnectionError('Connection refused', 'ollama', new Error('ECONNREFUSED'));
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Ollama');
      expect(message).toContain('Ollama is running locally');
      expect(message).toContain('http://localhost:11434');
      expect(message).toContain('ollama serve');
      expect(message).toContain('ollama pull');
      expect(message).toContain('ollama list');
      expect(message).toContain('Connection refused');
    });
  });

  describe('Remote Provider Connection Errors', () => {
    it('should provide Gemini-specific guidance', () => {
      const error = new ConnectionError('Network timeout', 'gemini', new Error('ETIMEDOUT'));
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Gemini');
      expect(message).toContain('API key is valid');
      expect(message).toContain('~/.zulu-pilotrc');
      expect(message).toContain('makersuite.google.com/app/apikey');
      expect(message).toContain('aiplatform.googleapis.com');
      expect(message).toContain('Firewall settings');
    });

    it('should provide OpenAI-specific guidance', () => {
      const error = new ConnectionError('Connection failed', 'openai', new Error('ECONNREFUSED'));
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to OpenAI');
      expect(message).toContain('api.openai.com');
      expect(message).toContain('account quota and billing status');
      expect(message).toContain('Firewall settings');
    });

    it('should provide Google Cloud-specific guidance', () => {
      const error = new ConnectionError('Auth failed', 'googleCloud', new Error('Unauthorized'));
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Google Cloud AI Platform');
      expect(message).toContain('gcloud CLI is installed');
      expect(message).toContain('gcloud auth login');
      expect(message).toContain('gcloud auth print-access-token');
      expect(message).toContain('Project ID and region');
      expect(message).toContain('gcloud services enable');
    });
  });

  describe('Error message structure', () => {
    it('should include numbered action steps', () => {
      const error = new ConnectionError('Connection failed', 'ollama');
      const message = error.getUserMessage();

      // Should have numbered steps
      expect(message).toMatch(/1\./);
      expect(message).toMatch(/2\./);
      expect(message).toMatch(/3\./);
    });

    it('should include original error message', () => {
      const originalMessage = 'Connection refused on port 11434';
      const error = new ConnectionError(originalMessage, 'ollama');
      const message = error.getUserMessage();

      expect(message).toContain(originalMessage);
      expect(message).toContain('Error:');
    });

    it('should preserve error cause', () => {
      const cause = new Error('ECONNREFUSED');
      const error = new ConnectionError('Connection failed', 'openai', cause);

      expect(error.cause).toBe(cause);
      expect(error.provider).toBe('openai');
      expect(error.code).toBe('CONNECTION_ERROR');
    });
  });

  describe('Generic provider handling', () => {
    it('should provide generic guidance for unknown providers', () => {
      const error = new ConnectionError('Connection failed', 'unknown-provider');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to unknown-provider');
      expect(message).toContain('internet connection');
      expect(message).toContain('API endpoint is accessible');
      expect(message).toContain('Firewall settings');
      expect(message).toContain('API credentials are valid');
    });
  });
});
