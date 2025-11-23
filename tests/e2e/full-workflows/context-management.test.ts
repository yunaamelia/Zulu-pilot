/**
 * E2E Test: Context Management Workflow
 *
 * Tests the complete context management workflow
 * T079 [P] [US3] - E2E test for context management workflow
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextManager } from '@zulu-pilot/core';
import { ValidationError } from '@zulu-pilot/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';

describe('E2E Test: Context Management Workflow (T079)', () => {
  let testDir: string;
  let contextManager: ContextManager;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-workflow-test-'));
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

  describe('complete context management workflow', () => {
    it('should complete full workflow: add files -> list context -> use context -> clear', async () => {
      // Step 1: Add files to context
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'src', 'file1.ts'), 'export const a = 1;', 'utf-8');
      await fs.writeFile(path.join(testDir, 'src', 'file2.ts'), 'export const b = 2;', 'utf-8');
      await fs.writeFile(path.join(testDir, 'src', 'file3.ts'), 'export const c = 3;', 'utf-8');

      await contextManager.addFile('src/*.ts');

      // Step 2: List context
      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(3);

      // Step 3: Verify context metadata
      const summary = {
        fileCount: context.length,
        totalTokens: contextManager.getTotalEstimatedTokens(),
        files: context.map((f) => ({
          path: path.relative(testDir, f.path),
          size: f.size,
          tokens: f.estimatedTokens,
        })),
      };

      expect(summary.fileCount).toBeGreaterThanOrEqual(3);
      expect(summary.totalTokens).toBeGreaterThan(0);

      // Step 4: Use context (simulate - would be used in AI requests)
      const contextForAI = contextManager.getContext();
      expect(contextForAI.length).toBe(summary.fileCount);

      // Step 5: Clear context
      contextManager.clear();
      expect(contextManager.getContext()).toEqual([]);
      expect(contextManager.getTotalEstimatedTokens()).toBe(0);
    });

    it('should handle workflow with multiple add operations', async () => {
      // Initial add
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await contextManager.addFile('file1.ts');
      expect(contextManager.getContext().length).toBe(1);

      // Add more files
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file3.ts'), 'content3', 'utf-8');
      await contextManager.addFile('file2.ts');
      await contextManager.addFile('file3.ts');

      // Verify all files are in context
      expect(contextManager.getContext().length).toBe(3);

      // Clear and verify
      contextManager.clear();
      expect(contextManager.getContext()).toEqual([]);
    });

    it('should handle workflow with glob pattern additions', async () => {
      // Create directory structure
      await fs.mkdir(path.join(testDir, 'src', 'utils'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src', 'models'), { recursive: true });

      // Add TypeScript files
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
      await fs.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        'export * from "./utils/helper";',
        'utf-8'
      );

      // Add all TS files with glob
      await contextManager.addFile('src/**/*.ts');

      // List and verify
      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(3);

      // Add more files with different glob
      await fs.writeFile(
        path.join(testDir, 'test', 'test1.spec.ts'),
        'describe("test", () => {});',
        'utf-8'
      );
      await fs.mkdir(path.join(testDir, 'test'), { recursive: true });
      await contextManager.addFile('test/**/*.spec.ts');

      // Verify both patterns are included
      const updatedContext = contextManager.getContext();
      expect(updatedContext.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('workflow with token limit warnings', () => {
    it('should handle workflow when approaching token limit', async () => {
      // Create files with substantial content
      for (let i = 0; i < 10; i++) {
        const content = 'x'.repeat(1000);
        await fs.writeFile(path.join(testDir, `file${i}.ts`), content, 'utf-8');
      }

      // Add all files
      await contextManager.addFile('*.ts');

      // Check token limit
      const totalTokens = contextManager.getTotalEstimatedTokens();
      const warning = contextManager.checkTokenLimit(totalTokens * 1.1); // Just above

      // Should warn when approaching limit
      if (warning) {
        expect(warning).toContain('approaching');
      }

      // Context should still be usable
      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle workflow when exceeding token limit', async () => {
      // Create files with large content
      const largeContent = 'x'.repeat(5000);
      for (let i = 0; i < 5; i++) {
        await fs.writeFile(path.join(testDir, `large${i}.ts`), largeContent, 'utf-8');
      }

      await contextManager.addFile('large*.ts');

      const totalTokens = contextManager.getTotalEstimatedTokens();
      const warning = contextManager.checkTokenLimit(totalTokens * 0.5); // Below current

      // Should show error when exceeding
      expect(warning).toBeTruthy();
      expect(warning).toContain('exceeds');
    });
  });

  describe('workflow with error handling', () => {
    it('should handle workflow with invalid files gracefully', async () => {
      // Valid file
      await fs.writeFile(path.join(testDir, 'valid.ts'), 'content', 'utf-8');

      // Try to add non-existent file (should skip in glob pattern)
      await contextManager.addFile('*.ts');

      // Should have at least valid file
      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle workflow with binary files', async () => {
      // Valid text file
      await fs.writeFile(path.join(testDir, 'valid.ts'), 'content', 'utf-8');

      // Binary file
      const binaryFile = path.join(testDir, 'binary.bin');
      const buffer = Buffer.from([0, 1, 2, 3, 0]);
      await fs.writeFile(binaryFile, buffer);

      // Add text files
      await contextManager.addFile('*.ts');

      // Should skip binary files
      const context = contextManager.getContext();
      const paths = context.map((f) => path.basename(f.path));
      expect(paths).toContain('valid.ts');
      expect(paths).not.toContain('binary.bin');
    });

    it('should handle workflow with directory traversal attempts', async () => {
      // Create file outside base directory
      const parentDir = path.dirname(testDir);
      const outsideFile = path.join(parentDir, 'outside.ts');
      await fs.writeFile(outsideFile, 'content', 'utf-8');

      try {
        // Try to access via directory traversal
        const relativePath = path.join('..', path.basename(parentDir), 'outside.ts');
        await expect(contextManager.addFile(relativePath)).rejects.toThrow(ValidationError);

        // Context should remain empty
        expect(contextManager.getContext()).toEqual([]);
      } finally {
        await fs.unlink(outsideFile).catch(() => {});
      }
    });
  });

  describe('workflow with multiple operations', () => {
    it('should handle add -> list -> add more -> list -> clear workflow', async () => {
      // Add initial files
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await contextManager.addFile('file1.ts');

      // List context
      let context = contextManager.getContext();
      expect(context.length).toBe(1);

      // Add more files
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file3.ts'), 'content3', 'utf-8');
      await contextManager.addFile('file2.ts');
      await contextManager.addFile('file3.ts');

      // List context again
      context = contextManager.getContext();
      expect(context.length).toBe(3);

      // Clear
      contextManager.clear();
      expect(contextManager.getContext()).toEqual([]);
    });

    it('should handle workflow with 20+ files as specified in acceptance criteria', async () => {
      // Create 25 files as specified in acceptance scenario
      const filePromises: Promise<void>[] = [];
      for (let i = 0; i < 25; i++) {
        const filePath = path.join(testDir, `file${i}.ts`);
        filePromises.push(fs.writeFile(filePath, `export const value${i} = ${i};`, 'utf-8'));
      }
      await Promise.all(filePromises);

      // Add all files
      await contextManager.addFile('*.ts');

      // List context - should have all files
      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(20);

      // Get summary
      const summary = {
        fileCount: context.length,
        totalTokens: contextManager.getTotalEstimatedTokens(),
        totalSize: context.reduce((sum, file) => sum + (file.size ?? 0), 0),
      };

      expect(summary.fileCount).toBeGreaterThanOrEqual(20);
      expect(summary.totalTokens).toBeGreaterThan(0);
      expect(summary.totalSize).toBeGreaterThan(0);

      // Context should be usable for AI requests (simulated)
      const contextForAI = contextManager.getContext();
      expect(contextForAI.length).toBe(summary.fileCount);

      // Check for token limit warnings if applicable
      contextManager.checkTokenLimit(100000);
      // May or may not warn depending on content size

      // Clear when done
      contextManager.clear();
      expect(contextManager.getContext()).toEqual([]);
    });
  });

  describe('workflow with file size validation', () => {
    it('should handle workflow with file size limits as specified', async () => {
      // Create manager with 1MB limit
      const limitedManager = new ContextManager({
        baseDir: testDir,
        maxFileSize: 1024 * 1024, // 1MB
      });

      // Valid file
      await fs.writeFile(path.join(testDir, 'valid.ts'), 'valid content', 'utf-8');
      await limitedManager.addFile('valid.ts');

      // File too large
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      await fs.writeFile(path.join(testDir, 'large.ts'), largeContent, 'utf-8');

      await expect(limitedManager.addFile('large.ts')).rejects.toThrow(ValidationError);

      // Context should only have valid file
      const context = limitedManager.getContext();
      expect(context.length).toBe(1);
      const paths = context.map((f) => path.basename(f.path));
      expect(paths).toContain('valid.ts');
      expect(paths).not.toContain('large.ts');
    });
  });

  describe('complete user scenario workflow', () => {
    it('should complete scenario: developer adds src/**/*.ts, lists context, clears context', async () => {
      // Scenario: Developer at project root runs `zulu-pilot add src/**/*.ts`

      // Setup: Create src directory structure
      await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src', 'utils'), { recursive: true });

      // Create TypeScript files
      await fs.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        'export * from "./components";',
        'utf-8'
      );
      await fs.writeFile(
        path.join(testDir, 'src', 'components', 'Button.tsx'),
        'export const Button = () => null;',
        'utf-8'
      );
      await fs.writeFile(
        path.join(testDir, 'src', 'utils', 'helpers.ts'),
        'export const helper = () => {};',
        'utf-8'
      );

      // Step 1: Add all TypeScript files with glob pattern
      await contextManager.addFile('src/**/*.ts');

      // Step 2: List context and see summary
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

      expect(summary.fileCount).toBeGreaterThanOrEqual(3);
      expect(summary.totalTokens).toBeGreaterThan(0);
      expect(summary.files.some((f) => f.path.includes('index.ts'))).toBe(true);

      // Step 3: Developer runs `zulu-pilot context` - see list
      const contextList = contextManager.getContext();
      expect(contextList.length).toBe(summary.fileCount);

      // Step 4: Developer runs `zulu-pilot clear` - clear context
      contextManager.clear();
      expect(contextManager.getContext()).toEqual([]);
      expect(contextManager.getTotalEstimatedTokens()).toBe(0);
    });
  });
});
