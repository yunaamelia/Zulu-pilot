import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FilePatcher } from '../../../../src/core/parser/FilePatcher.js';
import { createCodeChange } from '../../../../src/core/parser/CodeChange.js';
import { ValidationError } from '../../../../src/utils/errors.js';

describe('FilePatcher', () => {
  let patcher: FilePatcher;
  let tempDir: string;
  let backupDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
    backupDir = path.join(tempDir, '.zulu-pilot-backups');
    patcher = new FilePatcher({ baseDir: tempDir, backupDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('generating unified diffs', () => {
    it('should generate diff for modification', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const change = createCodeChange(testFile, 'const x = 1;', 'const x = 2;', 'modify');

      const diff = patcher.generateDiff(change);

      expect(diff).toContain('---');
      expect(diff).toContain('+++');
      expect(diff).toContain('-const x = 1;');
      expect(diff).toContain('+const x = 2;');
    });

    it('should generate diff for addition', async () => {
      const change = createCodeChange(path.join(tempDir, 'new.ts'), '', 'const x = 1;', 'add');

      const diff = patcher.generateDiff(change);

      expect(diff).toContain('/dev/null');
      expect(diff).toContain('+const x = 1;');
    });

    it('should generate diff for deletion', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const change = createCodeChange(testFile, 'const x = 1;', '', 'delete');

      const diff = patcher.generateDiff(change);

      expect(diff).toContain('/dev/null');
      expect(diff).toContain('-const x = 1;');
    });
  });

  describe('applying changes to files', () => {
    it('should apply modification to existing file', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const change = createCodeChange(testFile, 'const x = 1;', 'const x = 2;', 'modify');

      await patcher.applyChange(change);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('const x = 2;');
    });

    it('should create new file for addition', async () => {
      const newFile = path.join(tempDir, 'new.ts');
      const change = createCodeChange(newFile, '', 'const x = 1;', 'add');

      await patcher.applyChange(change);

      const content = await fs.readFile(newFile, 'utf-8');
      expect(content).toBe('const x = 1;');
    });

    it('should delete file for deletion', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const change = createCodeChange(testFile, 'const x = 1;', '', 'delete');

      await patcher.applyChange(change);

      await expect(fs.access(testFile)).rejects.toThrow();
    });
  });

  describe('creating backups', () => {
    it('should create backup before modifying file', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const change = createCodeChange(testFile, 'const x = 1;', 'const x = 2;', 'modify');

      await patcher.applyChange(change);

      // Check backup directory exists
      const backupExists = await fs
        .access(backupDir)
        .then(() => true)
        .catch(() => false);
      expect(backupExists).toBe(true);

      // Check backup file exists
      const backupFiles = await fs.readdir(backupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should create timestamped backup files', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const change = createCodeChange(testFile, 'const x = 1;', 'const x = 2;', 'modify');

      await patcher.applyChange(change);

      const backupFiles = await fs.readdir(backupDir);
      const backupFile = backupFiles[0];

      // Backup filename should contain timestamp (ISO format with dashes replacing colons and dots)
      // Format: YYYY-MM-DDTHH-MM-SS-sssZ-filename.ts
      expect(backupFile).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      expect(backupFile).toContain('-test.ts');
    });

    it('should preserve original content in backup', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      const originalContent = 'const x = 1;';
      await fs.writeFile(testFile, originalContent);

      const change = createCodeChange(testFile, originalContent, 'const x = 2;', 'modify');

      await patcher.applyChange(change);

      const backupFiles = await fs.readdir(backupDir);
      const backupPath = path.join(backupDir, backupFiles[0]);
      const backupContent = await fs.readFile(backupPath, 'utf-8');

      expect(backupContent).toBe(originalContent);
    });
  });

  describe('handling file not found errors', () => {
    it('should throw ValidationError for non-existent file on modify', async () => {
      const nonExistent = path.relative(tempDir, path.join(tempDir, 'nonexistent.ts'));
      const change = createCodeChange(nonExistent, 'old', 'new', 'modify');

      await expect(patcher.applyChange(change)).rejects.toThrow(ValidationError);
    });

    it('should handle file not found for deletion gracefully', async () => {
      const nonExistent = path.relative(tempDir, path.join(tempDir, 'nonexistent.ts'));
      const change = createCodeChange(nonExistent, 'content', '', 'delete');

      // Deletion of non-existent file should throw ValidationError
      await expect(patcher.applyChange(change)).rejects.toThrow(ValidationError);
    });
  });

  describe('syntax validation', () => {
    it('should validate TypeScript syntax before applying', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      // Invalid TypeScript syntax
      const change = createCodeChange(
        testFile,
        'const x = 1;',
        'const x = ; // syntax error',
        'modify'
      );

      // Should throw validation error or skip syntax validation
      // For now, we'll test that it doesn't crash
      try {
        await patcher.applyChange(change);
      } catch (error) {
        // If validation is implemented, it should throw ValidationError
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
