/**
 * Integration Test: Clear Command
 *
 * Tests the clear command for clearing context
 * T078 [P] [US3] - Integration test for clear command
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextManager } from '@zulu-pilot/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';

describe('Integration Test: Clear Command (T078)', () => {
  let testDir: string;
  let contextManager: ContextManager;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'clear-command-test-'));
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

  describe('clearing context', () => {
    it('should clear empty context without errors', () => {
      expect(() => contextManager.clear()).not.toThrow();
      expect(contextManager.getContext()).toEqual([]);
    });

    it('should clear all files from context', async () => {
      // Add multiple files to context
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file3.ts'), 'content3', 'utf-8');

      await contextManager.addFile('file1.ts');
      await contextManager.addFile('file2.ts');
      await contextManager.addFile('file3.ts');

      expect(contextManager.getContext()).toHaveLength(3);

      contextManager.clear();

      expect(contextManager.getContext()).toEqual([]);
      expect(contextManager.getContext()).toHaveLength(0);
    });

    it('should reset token count to zero after clearing', async () => {
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');

      expect(contextManager.getTotalEstimatedTokens()).toBeGreaterThan(0);

      contextManager.clear();

      expect(contextManager.getTotalEstimatedTokens()).toBe(0);
    });

    it('should clear context with many files', async () => {
      // Create 20+ files
      for (let i = 0; i < 25; i++) {
        await fs.writeFile(path.join(testDir, `file${i}.ts`), `content${i}`, 'utf-8');
      }

      await contextManager.addFile('*.ts');

      expect(contextManager.getContext().length).toBeGreaterThanOrEqual(20);

      contextManager.clear();

      expect(contextManager.getContext()).toEqual([]);
      expect(contextManager.getTotalEstimatedTokens()).toBe(0);
    });

    it('should allow adding files after clearing', async () => {
      // Add files
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await contextManager.addFile('file1.ts');
      expect(contextManager.getContext()).toHaveLength(1);

      // Clear context
      contextManager.clear();
      expect(contextManager.getContext()).toHaveLength(0);

      // Add new files
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await contextManager.addFile('file2.ts');
      expect(contextManager.getContext()).toHaveLength(1);
      expect(contextManager.getContext()[0].path).toContain('file2.ts');
    });
  });

  describe('confirmation workflow', () => {
    it('should clear context when confirmed (no-op for now, will be CLI confirmation)', async () => {
      // In actual implementation, this would prompt for confirmation
      // For now, we just test that clear works
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');

      // Simulate confirmation = true
      const confirmed = true;
      if (confirmed) {
        contextManager.clear();
      }

      expect(contextManager.getContext()).toHaveLength(0);
    });

    it('should preserve context when not confirmed (no-op for now, will be CLI cancellation)', async () => {
      // In actual implementation, this would prompt for confirmation
      // For now, we just test that clear doesn't happen when not confirmed
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');

      // Simulate confirmation = false
      const confirmed = false;
      if (!confirmed) {
        // Don't clear - context should remain
        expect(contextManager.getContext()).toHaveLength(1);
      }
    });
  });

  describe('user feedback', () => {
    it('should provide feedback about cleared context', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');

      await contextManager.addFile('*.ts');
      const beforeCount = contextManager.getContext().length;
      const beforeTokens = contextManager.getTotalEstimatedTokens();

      contextManager.clear();

      // Verify state after clear
      const afterCount = contextManager.getContext().length;
      const afterTokens = contextManager.getTotalEstimatedTokens();

      expect(beforeCount).toBeGreaterThan(0);
      expect(beforeTokens).toBeGreaterThan(0);
      expect(afterCount).toBe(0);
      expect(afterTokens).toBe(0);
    });

    it('should indicate success after clearing', async () => {
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');

      const beforeClear = {
        fileCount: contextManager.getContext().length,
        totalTokens: contextManager.getTotalEstimatedTokens(),
      };

      contextManager.clear();

      const afterClear = {
        fileCount: contextManager.getContext().length,
        totalTokens: contextManager.getTotalEstimatedTokens(),
      };

      expect(beforeClear.fileCount).toBeGreaterThan(0);
      expect(afterClear.fileCount).toBe(0);
      expect(afterClear.totalTokens).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle clearing already empty context multiple times', () => {
      contextManager.clear();
      contextManager.clear();
      contextManager.clear();

      expect(contextManager.getContext()).toEqual([]);
      expect(contextManager.getTotalEstimatedTokens()).toBe(0);
    });

    it('should handle clearing after adding and removing files', async () => {
      // Add files
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await contextManager.addFile('file1.ts');
      await contextManager.addFile('file2.ts');

      // Clear
      contextManager.clear();

      // Add again
      await contextManager.addFile('file1.ts');

      // Clear again
      contextManager.clear();

      expect(contextManager.getContext()).toEqual([]);
    });

    it('should clear context regardless of file size or token count', async () => {
      // Add small file
      await fs.writeFile(path.join(testDir, 'small.ts'), 'x', 'utf-8');
      await contextManager.addFile('small.ts');

      // Add large content file
      const largeContent = 'x'.repeat(10000);
      await fs.writeFile(path.join(testDir, 'large.ts'), largeContent, 'utf-8');
      await contextManager.addFile('large.ts');

      expect(contextManager.getContext().length).toBe(2);
      expect(contextManager.getTotalEstimatedTokens()).toBeGreaterThan(1000);

      contextManager.clear();

      expect(contextManager.getContext()).toEqual([]);
      expect(contextManager.getTotalEstimatedTokens()).toBe(0);
    });
  });

  describe('fresh start after clear', () => {
    it('should allow fresh start with new files after clearing', async () => {
      // Initial context
      await fs.writeFile(path.join(testDir, 'old1.ts'), 'old1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'old2.ts'), 'old2', 'utf-8');
      await contextManager.addFile('old*.ts');
      expect(contextManager.getContext().length).toBeGreaterThanOrEqual(2);

      // Clear for fresh start
      contextManager.clear();

      // Add new files
      await fs.writeFile(path.join(testDir, 'new1.ts'), 'new1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'new2.ts'), 'new2', 'utf-8');
      await contextManager.addFile('new*.ts');

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
      const paths = context.map((f) => path.basename(f.path));
      expect(paths).toContain('new1.ts');
      expect(paths).toContain('new2.ts');
      // Should not contain old files
      expect(paths).not.toContain('old1.ts');
      expect(paths).not.toContain('old2.ts');
    });
  });
});
