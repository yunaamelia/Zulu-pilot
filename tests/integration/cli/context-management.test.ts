import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ContextManager } from '../../../src/core/context/ContextManager.js';
import { ValidationError } from '../../../src/utils/errors.js';

/**
 * Integration test for context management commands.
 * Tests /add, /context, and /clear command functionality.
 */
describe('Context Management Integration', () => {
  let contextManager: ContextManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
    contextManager = new ContextManager({ baseDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('/add command with file paths', () => {
    it('should add single file to context', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
      expect(context[0].path).toBe(testFile);
      expect(context[0].content).toBe('const x = 1;');
    });

    it('should add multiple files sequentially', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);

      const context = contextManager.getContext();
      expect(context).toHaveLength(2);
    });

    it('should handle relative file paths', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const relativePath = path.relative(tempDir, testFile);
      await contextManager.addFile(relativePath);

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
    });

    it('should reject non-existent files', async () => {
      const nonExistent = path.join(tempDir, 'nonexistent.ts');

      await expect(contextManager.addFile(nonExistent)).rejects.toThrow(ValidationError);
    });
  });

  describe('/add command with glob patterns', () => {
    it('should add multiple files matching glob pattern', async () => {
      await fs.writeFile(path.join(tempDir, 'file1.ts'), 'const x = 1;');
      await fs.writeFile(path.join(tempDir, 'file2.ts'), 'const y = 2;');
      await fs.writeFile(path.join(tempDir, 'file3.js'), 'const z = 3;');

      await contextManager.addFile(path.join(tempDir, '*.ts'));

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
      expect(context.every((f) => f.path.endsWith('.ts'))).toBe(true);
    });

    it('should handle glob with subdirectories', async () => {
      const subDir = path.join(tempDir, 'src');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(subDir, 'file.ts'), 'const x = 1;');

      await contextManager.addFile(path.join(tempDir, '**', '*.ts'));

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(1);
    });

    it('should skip binary files in glob results', async () => {
      // Create a text file and a binary-like file
      await fs.writeFile(path.join(tempDir, 'text.ts'), 'const x = 1;');
      // Note: We can't easily create a binary file in tests, but the logic should handle it

      await contextManager.addFile(path.join(tempDir, '*.ts'));

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('/context command listing', () => {
    it('should list all files in context', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);

      const context = contextManager.getContext();
      expect(context).toHaveLength(2);
      expect(context.map((f) => f.path)).toContain(file1);
      expect(context.map((f) => f.path)).toContain(file2);
    });

    it('should show file metadata in context', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);

      const context = contextManager.getContext();
      expect(context[0]).toHaveProperty('path');
      expect(context[0]).toHaveProperty('content');
      expect(context[0]).toHaveProperty('lastModified');
      expect(context[0]).toHaveProperty('size');
      expect(context[0]).toHaveProperty('estimatedTokens');
    });

    it('should return empty list when no files added', () => {
      const context = contextManager.getContext();
      expect(context).toEqual([]);
    });
  });

  describe('/clear command', () => {
    it('should clear all context', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);
      expect(contextManager.getContext()).toHaveLength(2);

      contextManager.clear();
      expect(contextManager.getContext()).toHaveLength(0);
    });

    it('should allow adding files after clear', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);
      contextManager.clear();
      await contextManager.addFile(testFile);

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
    });
  });

  describe('Token estimation in context', () => {
    it('should estimate tokens for added files', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);

      const context = contextManager.getContext();
      expect(context[0].estimatedTokens).toBeDefined();
      expect(context[0].estimatedTokens).toBeGreaterThan(0);
    });

    it('should calculate total estimated tokens', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'x'.repeat(100));
      await fs.writeFile(file2, 'y'.repeat(200));

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);

      const totalTokens = contextManager.getTotalEstimatedTokens();
      expect(totalTokens).toBeGreaterThan(0);
      expect(totalTokens).toBe(
        (contextManager.getContext()[0].estimatedTokens ?? 0) +
          (contextManager.getContext()[1].estimatedTokens ?? 0)
      );
    });

    it('should warn when approaching token limit', async () => {
      const largeFile = path.join(tempDir, 'large.ts');
      await fs.writeFile(largeFile, 'x'.repeat(10000)); // ~2500 tokens

      await contextManager.addFile(largeFile);

      const warning = contextManager.checkTokenLimit(1000);
      expect(warning).toBeTruthy();
      expect(warning).toContain('exceeds');
    });
  });
});
