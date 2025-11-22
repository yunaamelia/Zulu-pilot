import { describe, it, expect } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createFileContext, type FileContext } from '../../../../src/core/context/FileContext.js';

describe('FileContext', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('createFileContext', () => {
    it('should create FileContext with required fields', () => {
      const fileContext = createFileContext('test.ts', 'const x = 1;');

      expect(fileContext.path).toBe('test.ts');
      expect(fileContext.content).toBe('const x = 1;');
      expect(fileContext.lastModified).toBeInstanceOf(Date);
      expect(fileContext.size).toBeDefined();
    });

    it('should use provided lastModified date', () => {
      const date = new Date('2024-01-01');
      const fileContext = createFileContext('test.ts', 'content', date);

      expect(fileContext.lastModified).toEqual(date);
    });

    it('should calculate size from content when not provided', () => {
      const content = 'const x = 1;';
      const fileContext = createFileContext('test.ts', content);

      expect(fileContext.size).toBe(content.length);
    });

    it('should use provided size when specified', () => {
      const fileContext = createFileContext('test.ts', 'content', new Date(), 100);

      expect(fileContext.size).toBe(100);
    });

    it('should handle empty content', () => {
      const fileContext = createFileContext('empty.ts', '');

      expect(fileContext.content).toBe('');
      expect(fileContext.size).toBe(0);
    });

    it('should handle large content', () => {
      const largeContent = 'x'.repeat(10000);
      const fileContext = createFileContext('large.ts', largeContent);

      expect(fileContext.size).toBe(10000);
      expect(fileContext.content.length).toBe(10000);
    });
  });

  describe('FileContext interface', () => {
    it('should have all required fields', () => {
      const fileContext: FileContext = {
        path: 'test.ts',
        content: 'const x = 1;',
        lastModified: new Date(),
        size: 12,
        estimatedTokens: 3,
      };

      expect(fileContext.path).toBeDefined();
      expect(fileContext.content).toBeDefined();
      expect(fileContext.lastModified).toBeDefined();
      expect(fileContext.size).toBeDefined();
      expect(fileContext.estimatedTokens).toBeDefined();
    });

    it('should allow optional fields to be undefined', () => {
      const fileContext: FileContext = {
        path: 'test.ts',
        content: 'const x = 1;',
        lastModified: new Date(),
      };

      expect(fileContext.size).toBeUndefined();
      expect(fileContext.estimatedTokens).toBeUndefined();
    });
  });
});
