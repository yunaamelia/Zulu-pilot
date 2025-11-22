/**
 * Integration Test: Add Command
 *
 * Tests the add command for adding files to context
 * T076 [P] [US3] - Integration test for add command
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextManager } from '@zulu-pilot/core';
import { ValidationError } from '@zulu-pilot/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';

describe('Integration Test: Add Command (T076)', () => {
  let testDir: string;
  let contextManager: ContextManager;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'add-command-test-'));
    contextManager = new ContextManager({ baseDir: testDir });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('adding single files', () => {
    it('should add a single file to context', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'export const hello = "world";', 'utf-8');

      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
      expect(context[0].path).toBe(testFile);
      expect(context[0].content).toBe('export const hello = "world";');
      expect(context[0].estimatedTokens).toBeDefined();
    });

    it('should add file with absolute path', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await contextManager.addFile(testFile);

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
      expect(context[0].path).toBe(testFile);
    });

    it('should throw ValidationError for non-existent file', async () => {
      await expect(contextManager.addFile('nonexistent.ts')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for file outside base directory', async () => {
      const outsideDir = await fs.mkdtemp(path.join(tmpdir(), 'outside-'));
      const outsideFile = path.join(outsideDir, 'test.ts');
      await fs.writeFile(outsideFile, 'content', 'utf-8');

      try {
        await expect(contextManager.addFile(outsideFile)).rejects.toThrow(ValidationError);
      } finally {
        await fs.rm(outsideDir, { recursive: true, force: true });
      }
    });

    it('should reject paths with directory traversal', async () => {
      // Create a file outside base directory
      const parentDir = path.dirname(testDir);
      const outsideFile = path.join(parentDir, 'outside.ts');
      await fs.writeFile(outsideFile, 'content', 'utf-8');

      try {
        // Try to access it via directory traversal
        const relativePath = path.join('..', path.basename(parentDir), 'outside.ts');
        await expect(contextManager.addFile(relativePath)).rejects.toThrow(ValidationError);
      } finally {
        await fs.unlink(outsideFile).catch(() => {});
      }
    });
  });

  describe('adding multiple files with glob patterns', () => {
    it('should add multiple files matching glob pattern', async () => {
      // Create test files
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'src', 'file1.ts'), 'export const a = 1;', 'utf-8');
      await fs.writeFile(path.join(testDir, 'src', 'file2.ts'), 'export const b = 2;', 'utf-8');
      await fs.writeFile(path.join(testDir, 'src', 'file3.js'), 'export const c = 3;', 'utf-8');

      await contextManager.addFile('src/*.ts');

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
      const paths = context.map((f) => path.basename(f.path));
      expect(paths).toContain('file1.ts');
      expect(paths).toContain('file2.ts');
      expect(paths).not.toContain('file3.js'); // Should not match .ts pattern
    });

    it('should handle recursive glob patterns', async () => {
      // Create nested directory structure
      await fs.mkdir(path.join(testDir, 'src', 'utils'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src', 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'src', 'utils', 'helper.ts'),
        'export const h = 1;',
        'utf-8'
      );
      await fs.writeFile(
        path.join(testDir, 'src', 'models', 'user.ts'),
        'export const u = 2;',
        'utf-8'
      );

      await contextManager.addFile('src/**/*.ts');

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
      const basenames = context.map((f) => path.basename(f.path));
      expect(basenames).toContain('helper.ts');
      expect(basenames).toContain('user.ts');
    });

    it('should skip files that cannot be added (binary, too large, etc.)', async () => {
      // Create valid and invalid files
      await fs.writeFile(path.join(testDir, 'valid.ts'), 'valid content', 'utf-8');

      // Create a large file
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      await fs.writeFile(path.join(testDir, 'large.ts'), largeContent, 'utf-8');

      const smallManager = new ContextManager({
        baseDir: testDir,
        maxFileSize: 1024 * 1024, // 1MB limit
      });

      await smallManager.addFile('*.ts');

      const context = smallManager.getContext();
      // Should have at least valid.ts, large.ts should be skipped
      expect(context.length).toBeGreaterThanOrEqual(1);
      const paths = context.map((f) => path.basename(f.path));
      expect(paths).toContain('valid.ts');
    });
  });

  describe('file validation', () => {
    it('should reject files that are too large', async () => {
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const testFile = path.join(testDir, 'large.ts');
      await fs.writeFile(testFile, largeContent, 'utf-8');

      const smallManager = new ContextManager({
        baseDir: testDir,
        maxFileSize: 1024 * 1024, // 1MB limit
      });

      await expect(smallManager.addFile('large.ts')).rejects.toThrow(ValidationError);
    });

    it('should reject binary files', async () => {
      const testFile = path.join(testDir, 'binary.bin');
      const buffer = Buffer.from([0, 1, 2, 3, 0]); // Contains null bytes
      await fs.writeFile(testFile, buffer);

      await expect(contextManager.addFile('binary.bin')).rejects.toThrow(ValidationError);
    });

    it('should not add duplicate files', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await contextManager.addFile('test.ts');
      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
    });
  });

  describe('token estimation and warnings', () => {
    it('should estimate tokens for added files', async () => {
      const testFile = path.join(testDir, 'test.ts');
      const content = 'x'.repeat(1000); // 1000 characters
      await fs.writeFile(testFile, content, 'utf-8');

      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      expect(context[0].estimatedTokens).toBeDefined();
      expect(context[0].estimatedTokens).toBeGreaterThan(0);
    });

    it('should provide token limit warnings when approaching limit', async () => {
      // Create file with large content
      const largeContent = 'x'.repeat(10000);
      await fs.writeFile(path.join(testDir, 'large.ts'), largeContent, 'utf-8');

      await contextManager.addFile('large.ts');

      const totalTokens = contextManager.getTotalEstimatedTokens();
      const warning = contextManager.checkTokenLimit(totalTokens * 1.1); // Just above limit

      expect(warning).toBeTruthy();
      expect(warning).toContain('approaching');
    });

    it('should provide error message when exceeding token limit', async () => {
      const largeContent = 'x'.repeat(10000);
      await fs.writeFile(path.join(testDir, 'large.ts'), largeContent, 'utf-8');

      await contextManager.addFile('large.ts');

      const totalTokens = contextManager.getTotalEstimatedTokens();
      const warning = contextManager.checkTokenLimit(totalTokens * 0.5); // Below current

      expect(warning).toBeTruthy();
      expect(warning).toContain('exceeds');
    });
  });

  describe('command output and user feedback', () => {
    it('should track file count and total tokens', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');

      await contextManager.addFile('*.ts');

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);

      const totalTokens = contextManager.getTotalEstimatedTokens();
      expect(totalTokens).toBeGreaterThan(0);
    });

    it('should provide summary information for added files', async () => {
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'src', 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'src', 'file2.ts'), 'content2', 'utf-8');

      await contextManager.addFile('src/*.ts');

      const context = contextManager.getContext();
      const summary = {
        fileCount: context.length,
        totalTokens: contextManager.getTotalEstimatedTokens(),
        files: context.map((f) => ({
          path: path.relative(testDir, f.path),
          size: f.size,
          tokens: f.estimatedTokens,
        })),
      };

      expect(summary.fileCount).toBeGreaterThanOrEqual(2);
      expect(summary.totalTokens).toBeGreaterThan(0);
      expect(summary.files).toHaveLength(summary.fileCount);
    });
  });
});
