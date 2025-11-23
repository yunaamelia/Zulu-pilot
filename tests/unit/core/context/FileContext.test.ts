/**
 * Unit tests for FileContext entity
 * @package @zulu-pilot/core
 */

import { describe, it, expect } from '@jest/globals';
import type { FileContext } from '../../../../packages/core/src/context/FileContext.js';

describe('FileContext', () => {
  describe('interface structure', () => {
    it('should have required path property', () => {
      const fileContext: FileContext = {
        path: '/test/file.ts',
        content: 'test content',
      };

      expect(fileContext.path).toBe('/test/file.ts');
      expect(typeof fileContext.path).toBe('string');
    });

    it('should have required content property', () => {
      const fileContext: FileContext = {
        path: '/test/file.ts',
        content: 'test content',
      };

      expect(fileContext.content).toBe('test content');
      expect(typeof fileContext.content).toBe('string');
    });

    it('should support optional lastModified property', () => {
      const date = new Date();
      const fileContext: FileContext = {
        path: '/test/file.ts',
        content: 'test content',
        lastModified: date,
      };

      expect(fileContext.lastModified).toBe(date);
      expect(fileContext.lastModified).toBeInstanceOf(Date);
    });

    it('should support optional size property', () => {
      const fileContext: FileContext = {
        path: '/test/file.ts',
        content: 'test content',
        size: 1024,
      };

      expect(fileContext.size).toBe(1024);
      expect(typeof fileContext.size).toBe('number');
    });

    it('should support all optional properties together', () => {
      const date = new Date();
      const fileContext: FileContext = {
        path: '/test/file.ts',
        content: 'test content',
        lastModified: date,
        size: 2048,
      };

      expect(fileContext.path).toBe('/test/file.ts');
      expect(fileContext.content).toBe('test content');
      expect(fileContext.lastModified).toBe(date);
      expect(fileContext.size).toBe(2048);
    });

    it('should accept empty content', () => {
      const fileContext: FileContext = {
        path: '/test/empty.txt',
        content: '',
      };

      expect(fileContext.content).toBe('');
    });

    it('should accept long file paths', () => {
      const longPath = '/very/long/path/to/file/with/many/directories/file.ts';
      const fileContext: FileContext = {
        path: longPath,
        content: 'content',
      };

      expect(fileContext.path).toBe(longPath);
    });
  });

  describe('type safety', () => {
    it('should enforce required properties', () => {
      // TypeScript should catch this, but we test runtime behavior
      const fileContext = {
        path: '/test/file.ts',
        content: 'test',
      } as FileContext;

      expect(fileContext.path).toBeDefined();
      expect(fileContext.content).toBeDefined();
    });

    it('should allow undefined for optional properties', () => {
      const fileContext: FileContext = {
        path: '/test/file.ts',
        content: 'test',
        lastModified: undefined,
        size: undefined,
      };

      expect(fileContext.path).toBeDefined();
      expect(fileContext.content).toBeDefined();
    });
  });
});
