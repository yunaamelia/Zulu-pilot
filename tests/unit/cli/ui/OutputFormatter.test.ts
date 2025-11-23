import { describe, it, expect } from '@jest/globals';
import { OutputFormatter } from '../../../../packages/cli/src/ui/OutputFormatter.js';
import type { Content } from '@google/genai';

/**
 * T199: Unit tests for OutputFormatter (90%+ coverage target)
 */
describe('T199: OutputFormatter', () => {
  describe('formatResponse - text format', () => {
    it('should format string content as plain text', () => {
      const formatter = new OutputFormatter({ format: 'text' });
      const output = formatter.formatResponse('Hello, world!');
      expect(output).toBe('Hello, world!');
    });

    it('should format Content object as plain text', () => {
      const formatter = new OutputFormatter({ format: 'text' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Hello, world!' }],
      };
      const output = formatter.formatResponse(content);
      expect(output).toBe('Hello, world!');
    });

    it('should format array of Content objects as plain text', () => {
      const formatter = new OutputFormatter({ format: 'text' });
      const contents: Content[] = [
        { role: 'user', parts: [{ text: 'Question' }] },
        { role: 'model', parts: [{ text: 'Answer' }] },
      ];
      const output = formatter.formatResponse(contents);
      expect(output).toBe('Question\n\nAnswer');
    });

    it('should handle multiple parts in Content', () => {
      const formatter = new OutputFormatter({ format: 'text' });
      const content: Content = {
        role: 'model',
        parts: [
          { text: 'First part' },
          { text: 'Second part' },
        ],
      };
      const output = formatter.formatResponse(content);
      expect(output).toContain('First part');
      expect(output).toContain('Second part');
    });
  });

  describe('formatResponse - json format', () => {
    it('should format response as pretty JSON by default', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Test response' }],
      };
      const output = formatter.formatResponse(content);
      const parsed = JSON.parse(output);
      expect(parsed.content).toBe('Test response');
      expect(parsed.parts).toBeDefined();
      expect(output).toContain('\n'); // Pretty formatted with newlines
    });

    it('should format response as compact JSON when pretty is false', () => {
      const formatter = new OutputFormatter({ format: 'json', pretty: false });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Test' }],
      };
      const output = formatter.formatResponse(content);
      expect(output).not.toContain('\n'); // Compact, no newlines
      const parsed = JSON.parse(output);
      expect(parsed.content).toBe('Test');
    });

    it('should include metadata when provided', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Response' }],
      };
      const output = formatter.formatResponse(content, {
        provider: 'gemini',
        model: 'gemini-pro',
      });
      const parsed = JSON.parse(output);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.provider).toBe('gemini');
      expect(parsed.metadata.model).toBe('gemini-pro');
      expect(parsed.metadata.timestamp).toBeDefined();
    });

    it('should include all parts in JSON output', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [
          { text: 'First part' },
          { text: 'Second part' },
        ],
      };
      const output = formatter.formatResponse(content);
      const parsed = JSON.parse(output);
      expect(parsed.parts.length).toBe(2);
      expect(parsed.parts[0].content).toBe('First part');
      expect(parsed.parts[1].content).toBe('Second part');
    });

    it('should handle string input in JSON format', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const output = formatter.formatResponse('Simple string');
      const parsed = JSON.parse(output);
      expect(parsed.content).toBe('Simple string');
      expect(parsed.parts.length).toBe(1);
      expect(parsed.parts[0].type).toBe('text');
    });
  });

  describe('formatResponse - stream-json format', () => {
    it('should format response as NDJSON (newline-delimited JSON)', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Stream response' }],
      };
      const output = formatter.formatResponse(content);
      const lines = output.split('\n').filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(1);
      // Each line should be valid JSON
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });

    it('should output metadata line first in stream-json', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Test' }],
      };
      const output = formatter.formatResponse(content, {
        provider: 'ollama',
        model: 'qwen2.5-coder',
      });
      const lines = output.split('\n').filter((line) => line.trim());
      const firstLine = JSON.parse(lines[0]);
      expect(firstLine.type).toBe('metadata');
      expect(firstLine.provider).toBe('ollama');
    });

    it('should output content lines with type "content"', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Part 1' }, { text: 'Part 2' }],
      };
      const output = formatter.formatResponse(content);
      const lines = output.split('\n').filter((line) => line.trim());
      const contentLines = lines
        .map((line) => JSON.parse(line))
        .filter((obj) => obj.type === 'content');
      expect(contentLines.length).toBeGreaterThan(0);
    });

    it('should output done line last in stream-json', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Final response' }],
      };
      const output = formatter.formatResponse(content);
      const lines = output.split('\n').filter((line) => line.trim());
      const lastLine = JSON.parse(lines[lines.length - 1]);
      expect(lastLine.type).toBe('done');
      expect(lastLine.content).toBeDefined();
    });
  });

  describe('getFormat', () => {
    it('should return current format', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      expect(formatter.getFormat()).toBe('json');
    });

    it('should return stream-json format when set', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      expect(formatter.getFormat()).toBe('stream-json');
    });
  });

  describe('isJSONMode', () => {
    it('should return true for json format', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      expect(formatter.isJSONMode()).toBe(true);
    });

    it('should return true for stream-json format', () => {
      const formatter = new OutputFormatter({ format: 'stream-json' });
      expect(formatter.isJSONMode()).toBe(true);
    });

    it('should return false for text format', () => {
      const formatter = new OutputFormatter({ format: 'text' });
      expect(formatter.isJSONMode()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const formatter = new OutputFormatter({ format: 'text' });
      const content: Content = {
        role: 'model',
        parts: [],
      };
      const output = formatter.formatResponse(content);
      expect(output).toBe('');
    });

    it('should handle content with inlineData', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [
          { text: 'Text part' },
          { inlineData: { mimeType: 'image/png', data: 'base64data' } },
        ],
      };
      const output = formatter.formatResponse(content);
      const parsed = JSON.parse(output);
      const inlineDataPart = parsed.parts.find((p: any) => p.type === 'inlineData');
      expect(inlineDataPart).toBeDefined();
      expect(inlineDataPart.content).toBe('[Binary data]');
    });

    it('should handle content with fileData', () => {
      const formatter = new OutputFormatter({ format: 'json' });
      const content: Content = {
        role: 'model',
        parts: [{ fileData: { mimeType: 'application/json', fileUri: 'file://test.json' } }],
      };
      const output = formatter.formatResponse(content);
      const parsed = JSON.parse(output);
      const fileDataPart = parsed.parts.find((p: any) => p.type === 'fileData');
      expect(fileDataPart).toBeDefined();
      expect(fileDataPart.content).toBe('[File data]');
    });
  });
});

