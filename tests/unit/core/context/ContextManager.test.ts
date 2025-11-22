import { describe, it, expect, beforeEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ContextManager } from '../../../../src/core/context/ContextManager.js';
import { ValidationError } from '../../../../src/utils/errors.js';

describe('ContextManager', () => {
  let contextManager: ContextManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
    contextManager = new ContextManager({ baseDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('addFile', () => {
    it('should add file to context', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
      expect(context[0].path).toBe(testFile);
      expect(context[0].content).toBe('const x = 1;');
    });

    it('should add multiple files to context', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);

      const context = contextManager.getContext();
      expect(context).toHaveLength(2);
    });

    it('should prevent adding same file twice', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);
      await contextManager.addFile(testFile);

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
    });

    it('should throw ValidationError for non-existent file', async () => {
      const nonExistent = path.join(tempDir, 'nonexistent.ts');

      await expect(contextManager.addFile(nonExistent)).rejects.toThrow(ValidationError);
    });

    it('should prevent directory traversal', async () => {
      const maliciousPath = path.join(tempDir, '..', '..', 'etc', 'passwd');

      await expect(contextManager.addFile(maliciousPath)).rejects.toThrow(ValidationError);
    });

    it('should handle glob patterns', async () => {
      await fs.writeFile(path.join(tempDir, 'file1.ts'), 'const x = 1;');
      await fs.writeFile(path.join(tempDir, 'file2.ts'), 'const y = 2;');
      await fs.writeFile(path.join(tempDir, 'file3.js'), 'const z = 3;');

      await contextManager.addFile(path.join(tempDir, '*.ts'));

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
      expect(context.every((f: { path: string }) => f.path.endsWith('.ts'))).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all context', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);
      expect(contextManager.getContext()).toHaveLength(1);

      contextManager.clear();
      expect(contextManager.getContext()).toHaveLength(0);
    });

    it('should handle clear on empty context', () => {
      expect(() => contextManager.clear()).not.toThrow();
      expect(contextManager.getContext()).toHaveLength(0);
    });
  });

  describe('getContext', () => {
    it('should return empty array when no files added', () => {
      const context = contextManager.getContext();
      expect(context).toEqual([]);
    });

    it('should return all added files', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);

      const context = contextManager.getContext();
      expect(context).toHaveLength(2);
      expect(context.map((f: { path: string }) => f.path)).toContain(file1);
      expect(context.map((f: { path: string }) => f.path)).toContain(file2);
    });
  });

  describe('file path validation', () => {
    it('should validate file paths are within base directory', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);

      // Should succeed for valid path
      expect(contextManager.getContext()).toHaveLength(1);
    });

    it('should reject paths outside base directory', async () => {
      const outsidePath = path.join(os.tmpdir(), 'outside.ts');
      await fs.writeFile(outsidePath, 'const x = 1;');

      await expect(contextManager.addFile(outsidePath)).rejects.toThrow(ValidationError);

      // Cleanup
      await fs.unlink(outsidePath);
    });

    it('should handle file too large error', async () => {
      const largeFile = path.join(tempDir, 'large.ts');
      // Create file larger than maxFileSize (1MB default)
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      await fs.writeFile(largeFile, largeContent);

      const smallContextManager = new ContextManager({
        baseDir: tempDir,
        maxFileSize: 1024 * 1024, // 1MB
      });

      await expect(smallContextManager.addFile(largeFile)).rejects.toThrow(ValidationError);
    });

    it('should handle binary file detection', async () => {
      const binaryFile = path.join(tempDir, 'binary.bin');
      // Create file with null bytes (binary indicator)
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      await fs.writeFile(binaryFile, binaryContent);

      await expect(contextManager.addFile(binaryFile)).rejects.toThrow(ValidationError);
    });

    it('should handle directory instead of file', async () => {
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir, { recursive: true });

      await expect(contextManager.addFile(subDir)).rejects.toThrow(ValidationError);
    });
  });

  describe('token management', () => {
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
        contextManager.getContext()[0].estimatedTokens! +
          contextManager.getContext()[1].estimatedTokens!
      );
    });

    it('should check token limit and return warning when exceeded', async () => {
      const largeFile = path.join(tempDir, 'large.ts');
      await fs.writeFile(largeFile, 'x'.repeat(30000)); // ~7500 tokens

      await contextManager.addFile(largeFile);

      const warning = contextManager.checkTokenLimit(1000); // Small limit
      expect(warning).toBeTruthy();
      expect(warning).toContain('exceeds');
    });

    it('should check token limit and return warning when approaching', async () => {
      const largeFile = path.join(tempDir, 'large.ts');
      await fs.writeFile(largeFile, 'x'.repeat(26000)); // ~6500 tokens (81% of 8000)

      await contextManager.addFile(largeFile);

      const warning = contextManager.checkTokenLimit(8000);
      expect(warning).toBeTruthy();
      expect(warning).toContain('approaching');
    });

    it('should check token limit and return null when within limit', async () => {
      const smallFile = path.join(tempDir, 'small.ts');
      await fs.writeFile(smallFile, 'const x = 1;'); // ~3 tokens

      await contextManager.addFile(smallFile);

      const warning = contextManager.checkTokenLimit(10000);
      expect(warning).toBeNull();
    });
  });

  describe('glob patterns', () => {
    it('should handle glob pattern with no matches', async () => {
      // No files matching pattern
      await contextManager.addFile(path.join(tempDir, 'nonexistent*.ts'));

      // Should not throw, just have no files added
      expect(contextManager.getContext()).toHaveLength(0);
    });
  });
});
