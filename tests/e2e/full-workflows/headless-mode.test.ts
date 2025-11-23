import { describe, it, expect } from '@jest/globals';
import { OutputFormatter } from '../../../packages/cli/src/ui/OutputFormatter.js';
import type { Content } from '@google/genai';

/**
 * T193: E2E test for headless mode workflow
 *
 * This test simulates the full workflow:
 * 1. Developer runs `zulu-pilot -p "explain this code" --output-format json`
 * 2. Application runs in headless mode (no prompts, no interactive elements)
 * 3. Response is formatted as structured JSON
 * 4. Script can parse the JSON response
 */
describe('T193: Headless Mode Workflow E2E', () => {
  describe('full headless workflow simulation', () => {
    it('should complete workflow: prompt -> headless execution -> JSON output -> script parsing', () => {
      // Step 1: Developer provides prompt via CLI flag
      const prompt = 'Explain this code: function add(a, b) { return a + b; }';

      // Step 2: Application runs in headless mode (simulated response)
      const mockResponse: Content = {
        role: 'model',
        parts: [
          {
            text: 'This is a simple addition function that takes two parameters (a and b) and returns their sum.',
          },
        ],
      };

      // Step 3: Response is formatted as JSON
      const formatter = new OutputFormatter({ format: 'json' });
      const jsonOutput = formatter.formatResponse(mockResponse, {
        provider: 'gemini',
        model: 'gemini-pro',
      });

      // Step 4: Script parses JSON response
      let parsed: any;
      expect(() => {
        parsed = JSON.parse(jsonOutput);
      }).not.toThrow();

      // Verify response structure is parseable
      expect(parsed).toHaveProperty('content');
      expect(parsed).toHaveProperty('parts');
      expect(parsed).toHaveProperty('metadata');
      expect(parsed.content).toContain('addition function');
      expect(parsed.metadata.provider).toBe('gemini');
    });

    it('should support stream-json format for streaming scripts', () => {
      const mockResponse: Content = {
        role: 'model',
        parts: [
          { text: 'First chunk' },
          { text: 'Second chunk' },
          { text: 'Third chunk' },
        ],
      };

      const formatter = new OutputFormatter({ format: 'stream-json' });
      const streamOutput = formatter.formatResponse(mockResponse, {
        provider: 'ollama',
        model: 'qwen2.5-coder',
      });

      // Parse as NDJSON (newline-delimited JSON)
      const lines = streamOutput.split('\n').filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(1);

      // Simulate script processing each line
      const parsedLines = lines.map((line) => JSON.parse(line));
      
      // First line should be metadata
      expect(parsedLines[0].type).toBe('metadata');
      expect(parsedLines[0].provider).toBe('ollama');

      // Should have content lines
      const contentLines = parsedLines.filter((line) => line.type === 'content');
      expect(contentLines.length).toBeGreaterThan(0);

      // Last line should be done
      const lastLine = parsedLines[parsedLines.length - 1];
      expect(lastLine.type).toBe('done');
    });

    it('should provide text output when text format is specified', () => {
      const mockResponse: Content = {
        role: 'model',
        parts: [{ text: 'Simple text response for scripts' }],
      };

      const formatter = new OutputFormatter({ format: 'text' });
      const textOutput = formatter.formatResponse(mockResponse);

      // Should be plain text, easy to parse with basic tools
      expect(typeof textOutput).toBe('string');
      expect(textOutput).toBe('Simple text response for scripts');
      expect(() => JSON.parse(textOutput)).toThrow(); // Should not be JSON
    });

    it('should handle complex responses with multiple parts', () => {
      const mockResponse: Content = {
        role: 'model',
        parts: [
          { text: 'Explanation:\n\n' },
          { text: '1. First point\n' },
          { text: '2. Second point\n' },
          { text: '3. Third point' },
        ],
      };

      const formatter = new OutputFormatter({ format: 'json' });
      const output = formatter.formatResponse(mockResponse);

      const parsed = JSON.parse(output);
      expect(parsed.parts.length).toBe(4);
      expect(parsed.content).toContain('Explanation');
      expect(parsed.content).toContain('First point');
      expect(parsed.content).toContain('Second point');
      expect(parsed.content).toContain('Third point');
    });

    it('should include metadata for script context', () => {
      const mockResponse: Content = {
        role: 'model',
        parts: [{ text: 'Response with metadata' }],
      };

      const formatter = new OutputFormatter({ format: 'json' });
      const output = formatter.formatResponse(mockResponse, {
        provider: 'custom-provider',
        model: 'custom-model-v1',
      });

      const parsed = JSON.parse(output);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.provider).toBe('custom-provider');
      expect(parsed.metadata.model).toBe('custom-model-v1');
      expect(parsed.metadata.timestamp).toBeDefined();
      expect(typeof parsed.metadata.timestamp).toBe('string');
    });

    it('should work with automation scripts that parse responses', () => {
      // Simulate an automation script workflow
      const responses: Content[] = [
        { role: 'user', parts: [{ text: 'What is 2+2?' }] },
        { role: 'model', parts: [{ text: '2+2 equals 4' }] },
        { role: 'user', parts: [{ text: 'What is 3*3?' }] },
        { role: 'model', parts: [{ text: '3*3 equals 9' }] },
      ];

      const formatter = new OutputFormatter({ format: 'json' });
      
      // Process each response
      const outputs = responses.map((response) => formatter.formatResponse(response));

      // Script would parse each output
      const parsedOutputs = outputs.map((output) => JSON.parse(output));

      expect(parsedOutputs.length).toBe(4);
      expect(parsedOutputs[0].content).toContain('2+2');
      expect(parsedOutputs[1].content).toContain('equals 4');
      expect(parsedOutputs[2].content).toContain('3*3');
      expect(parsedOutputs[3].content).toContain('equals 9');
    });
  });
});

