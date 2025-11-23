/**
 * Integration Test: Context Command
 *
 * Tests the context command for listing files in context
 * T077 [P] [US3] - Integration test for context command
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextManager } from '@zulu-pilot/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';

describe('Integration Test: Context Command (T077)', () => {
  let testDir: string;
  let contextManager: ContextManager;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-command-test-'));
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

  describe('listing context', () => {
    it('should return empty array when context is empty', () => {
      const context = contextManager.getContext();
      expect(context).toEqual([]);
    });

    it('should list all files in context with metadata', async () => {
      // Add multiple files to context
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file3.ts'), 'content3', 'utf-8');

      await contextManager.addFile('file1.ts');
      await contextManager.addFile('file2.ts');
      await contextManager.addFile('file3.ts');

      const context = contextManager.getContext();
      expect(context).toHaveLength(3);
    });

    it('should include path metadata for each file', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      expect(context[0].path).toBe(testFile);
      expect(typeof context[0].path).toBe('string');
    });

    it('should include size metadata for each file', async () => {
      const testFile = path.join(testDir, 'test.ts');
      const content = 'test content';
      await fs.writeFile(testFile, content, 'utf-8');

      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      expect(context[0].size).toBeDefined();
      expect(context[0].size).toBe(content.length);
    });

    it('should include lastModified metadata for each file', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      expect(context[0].lastModified).toBeDefined();
      expect(context[0].lastModified).toBeInstanceOf(Date);
    });

    it('should include estimatedTokens metadata for each file', async () => {
      const testFile = path.join(testDir, 'test.ts');
      const content = 'x'.repeat(100);
      await fs.writeFile(testFile, content, 'utf-8');

      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      expect(context[0].estimatedTokens).toBeDefined();
      expect(typeof context[0].estimatedTokens).toBe('number');
      expect(context[0].estimatedTokens).toBeGreaterThan(0);
    });

    it('should return relative paths in output', async () => {
      const testFile = path.join(testDir, 'subdir', 'test.ts');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'content', 'utf-8');

      await contextManager.addFile('subdir/test.ts');

      const context = contextManager.getContext();
      const relativePath = path.relative(testDir, context[0].path);
      expect(relativePath).toBe('subdir/test.ts');
    });
  });

  describe('context metadata display', () => {
    it('should provide total file count', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');

      await contextManager.addFile('file1.ts');
      await contextManager.addFile('file2.ts');

      const context = contextManager.getContext();
      expect(context.length).toBe(2);
    });

    it('should provide total estimated tokens', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');

      await contextManager.addFile('file1.ts');
      await contextManager.addFile('file2.ts');

      const totalTokens = contextManager.getTotalEstimatedTokens();
      expect(totalTokens).toBeGreaterThan(0);

      // Total should be sum of individual file tokens
      const context = contextManager.getContext();
      const sumOfTokens = context.reduce((sum, file) => sum + (file.estimatedTokens ?? 0), 0);
      expect(totalTokens).toBe(sumOfTokens);
    });

    it('should provide total size in bytes', async () => {
      const content1 = 'content1';
      const content2 = 'content2';
      await fs.writeFile(path.join(testDir, 'file1.ts'), content1, 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), content2, 'utf-8');

      await contextManager.addFile('file1.ts');
      await contextManager.addFile('file2.ts');

      const context = contextManager.getContext();
      const totalSize = context.reduce((sum, file) => sum + (file.size ?? 0), 0);
      expect(totalSize).toBe(content1.length + content2.length);
    });

    it('should format context display with all metadata', async () => {
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');

      const context = contextManager.getContext();
      const formatted = context.map((file) => ({
        path: path.relative(testDir, file.path),
        size: file.size,
        lastModified: file.lastModified?.toISOString(),
        estimatedTokens: file.estimatedTokens,
      }));

      expect(formatted).toHaveLength(1);
      expect(formatted[0].path).toBe('test.ts');
      expect(formatted[0].size).toBeDefined();
      expect(formatted[0].lastModified).toBeDefined();
      expect(formatted[0].estimatedTokens).toBeDefined();
    });
  });

  describe('context listing with many files', () => {
    it('should handle listing 20+ files efficiently', async () => {
      // Create 20+ files
      const filePromises: Promise<void>[] = [];
      for (let i = 0; i < 25; i++) {
        const filePath = path.join(testDir, `file${i}.ts`);
        filePromises.push(fs.writeFile(filePath, `content${i}`, 'utf-8'));
      }
      await Promise.all(filePromises);

      // Add all files
      await contextManager.addFile('*.ts');

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(20);

      // Listing should be fast
      const startTime = Date.now();
      const listed = contextManager.getContext();
      const endTime = Date.now();

      expect(listed).toHaveLength(context.length);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should provide summary statistics for many files', async () => {
      // Create multiple files
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(path.join(testDir, `file${i}.ts`), `content${i}`, 'utf-8');
      }

      await contextManager.addFile('*.ts');

      const context = contextManager.getContext();
      const stats = {
        fileCount: context.length,
        totalTokens: contextManager.getTotalEstimatedTokens(),
        totalSize: context.reduce((sum, file) => sum + (file.size ?? 0), 0),
        averageFileSize: 0,
        averageTokens: 0,
      };

      stats.averageFileSize = stats.totalSize / stats.fileCount;
      stats.averageTokens = stats.totalTokens / stats.fileCount;

      expect(stats.fileCount).toBeGreaterThanOrEqual(10);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.averageFileSize).toBeGreaterThan(0);
      expect(stats.averageTokens).toBeGreaterThan(0);
    });
  });

  describe('context information format', () => {
    it('should return copy of context to prevent external modification', async () => {
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');

      const context1 = contextManager.getContext();
      const context2 = contextManager.getContext();

      expect(context1).not.toBe(context2); // Different array instances
      expect(context1).toEqual(context2); // But same content
    });

    it('should format output in a readable table-like structure', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');

      await contextManager.addFile('*.ts');

      const context = contextManager.getContext();
      const tableData = context.map((file) => ({
        path: path.relative(testDir, file.path),
        size: `${file.size} bytes`,
        tokens: `${file.estimatedTokens} tokens`,
        modified: file.lastModified?.toISOString().split('T')[0],
      }));

      expect(tableData).toHaveLength(2);
      expect(tableData[0].path).toBeDefined();
      expect(tableData[0].size).toContain('bytes');
      expect(tableData[0].tokens).toContain('tokens');
    });
  });
});
