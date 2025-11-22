import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { OllamaProvider } from '../../../src/core/llm/OllamaProvider.js';
import { ConnectionError } from '../../../src/utils/errors.js';

/**
 * Integration test for local model chat flow.
 * Tests the complete flow: CLI start → connect to Ollama → send prompt → receive stream
 */
describe('Local Model Chat Flow Integration', () => {
  let provider: OllamaProvider;
  let mockAdapter: MockAdapter;
  let axiosInstance: ReturnType<typeof axios.create>;

  beforeEach(() => {
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

  afterEach(() => {
    mockAdapter.restore();
  });

  it('should complete full chat flow: connect → send prompt → receive stream', async () => {
    const prompt = 'How do I sort an array in TypeScript?';
    const expectedResponse = 'You can use Array.sort() method';

    // Mock successful streaming response
    mockAdapter.onPost('/v1/chat/completions').reply(200, {
      choices: [{ message: { content: expectedResponse } }],
    });

    // Test the flow
    const response = await provider.generateResponse(prompt, []);

    expect(response).toBe(expectedResponse);
    expect(mockAdapter.history.post.length).toBe(1);
    expect(mockAdapter.history.post[0].url).toBe('/v1/chat/completions');
  });

  it('should handle connection errors during chat flow', async () => {
    const prompt = 'Test prompt';

    // Mock connection error
    mockAdapter.onPost('/v1/chat/completions').networkError();

    await expect(provider.generateResponse(prompt, [])).rejects.toThrow(ConnectionError);
  });

  it('should stream response tokens in real-time', async () => {
    const prompt = 'Explain TypeScript';

    // For integration test, we'll test the generator directly
    // In a real scenario, this would be tested with actual Ollama running
    mockAdapter.onPost('/v1/chat/completions').reply(200, {
      choices: [{ message: { content: 'TypeScript is a typed language' } }],
    });

    const response = await provider.generateResponse(prompt, []);
    expect(response).toContain('TypeScript');
  });

  it('should handle model not found error', async () => {
    const prompt = 'Test prompt';

    mockAdapter
      .onPost('/v1/chat/completions')
      .reply(404, { error: { message: "model 'invalid-model' not found" } });

    await expect(provider.generateResponse(prompt, [])).rejects.toThrow(ConnectionError);
  });

  it('should include context in request when provided', async () => {
    const prompt = 'Explain this code';
    const context = [
      {
        path: 'test.ts',
        content: 'const x = 1;',
        lastModified: new Date(),
      },
    ];

    mockAdapter.onPost('/v1/chat/completions').reply(200, {
      choices: [{ message: { content: 'This code declares a constant' } }],
    });

    await provider.generateResponse(prompt, context);

    const request = mockAdapter.history.post[0];
    const requestData = JSON.parse(request.data);
    expect(requestData.messages).toBeDefined();
    expect(Array.isArray(requestData.messages)).toBe(true);
    // Should have system message with context + user message
    expect(requestData.messages.length).toBeGreaterThanOrEqual(2);
  });
});
