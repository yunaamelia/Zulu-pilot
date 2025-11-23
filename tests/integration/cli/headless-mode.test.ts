import { describe, it, expect } from '@jest/globals';
import { OutputFormatter } from '../../../packages/cli/src/ui/OutputFormatter.js';
import type { Content } from '@google/genai';

/**
 * T192: Integration test for headless mode
 */
describe('T192: Headless Mode Integration', () => {
  describe('OutputFormatter integration', () => {
    it('should format response in text format for headless mode', () => {
      const formatter = new OutputFormatter({ format: 'text' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Response text' }],
      };

      const output = formatter.formatResponse(content);

      expect(output).toBe('Response text');
      expect(typeof output).toBe('string');
    });

    it('should format response in JSON format for headless mode', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'JSON response' }],
      };

      const output = formatter.formatResponse(content, {
        provider: 'gemini',
        model: 'gemini-pro',
      });

      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.content).toBe('JSON response');
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.provider).toBe('gemini');
    });

    it('should format response in stream-json format for headless mode', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Stream response' }],
      };

      const output = formatter.formatResponse(content, {
        provider: 'ollama',
        model: 'qwen2.5-coder',
      });

      // Should be NDJSON format (newline-delimited)
      const lines = output.split('\n').filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(1);

      // Each line should be valid JSON
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }

      // First line should be metadata
      const firstLine = JSON.parse(lines[0]);
      expect(firstLine.type).toBe('metadata');
      expect(firstLine.provider).toBe('ollama');
    });

    it('should handle multiple content parts in headless mode', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [
          { text: 'First part' },
          { text: 'Second part' },
          { text: 'Third part' },
        ],
      };

      const output = formatter.formatResponse(content);
      const parsed = JSON.parse(output);

      expect(parsed.parts.length).toBe(3);
      expect(parsed.content).toContain('First part');
      expect(parsed.content).toContain('Second part');
      expect(parsed.content).toContain('Third part');
    });

    it('should work with array of Content objects', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const contents: Content[] = [
        { role: 'user', parts: [{ text: 'Question' }] },
        { role: 'model', parts: [{ text: 'Answer' }] },
      ];

      const output = formatter.formatResponse(contents);
      const parsed = JSON.parse(output);

      expect(parsed.content).toContain('Question');
      expect(parsed.content).toContain('Answer');
    });
  });

  describe('headless mode behavior', () => {
    it('should not include prompts or interactive elements in JSON output', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Pure response content' }],
      };

      const output = formatter.formatResponse(content);
      const parsed = JSON.parse(output);

      // Should be structured data only, no prompts
      expect(parsed.content).toBeDefined();
      expect(parsed.parts).toBeDefined();
      expect(typeof parsed.content).toBe('string');
      expect(Array.isArray(parsed.parts)).toBe(true);
    });

    it('should be parseable by scripts (valid JSON structure)', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Script-parseable response' }],
      };

      const output = formatter.formatResponse(content);

      // Should be valid JSON that can be parsed by scripts
      let parsed: any;
      expect(() => {
        parsed = JSON.parse(output);
      }).not.toThrow();

      expect(parsed).toHaveProperty('content');
      expect(parsed).toHaveProperty('parts');
      expect(typeof parsed.content).toBe('string');
      expect(Array.isArray(parsed.parts)).toBe(true);
    });

    it('should support stream-json for streaming scripts', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Streaming response' }],
      };

      const output = formatter.formatResponse(content);

      // Should be NDJSON format suitable for streaming
      const lines = output.split('\n').filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(0);

      // Each line should be parseable independently
      const parsedLines = lines.map((line) => JSON.parse(line));
      expect(parsedLines.length).toBeGreaterThan(0);
      expect(parsedLines[0]).toHaveProperty('type');
    });
  });
});

