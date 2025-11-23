/**
 * Unit tests for ContextManager
 * @package @zulu-pilot/core
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextManager } from '../../../../packages/core/src/context/ContextManager.js';
import { TokenEstimator } from '../../../../packages/core/src/context/TokenEstimator.js';
import { ValidationError } from '../../../../packages/core/src/utils/contextErrors.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';

describe('ContextManager', () => {
  let testDir: string;
  let manager: ContextManager;

  beforeEach(async () => {
    // Create temporary directory for tests
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-manager-test-'));
    manager = new ContextManager({ baseDir: testDir });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultManager = new ContextManager();
      expect(defaultManager).toBeInstanceOf(ContextManager);
    });

    it('should accept custom baseDir', () => {
      const customManager = new ContextManager({ baseDir: testDir });
      expect(customManager).toBeInstanceOf(ContextManager);
    });

    it('should accept custom maxFileSize', () => {
      const customManager = new ContextManager({
        baseDir: testDir,
        maxFileSize: 2048,
      });
      expect(customManager).toBeInstanceOf(ContextManager);
    });

    it('should accept custom TokenEstimator instance', () => {
      const estimator = new TokenEstimator({ charsPerToken: 5 });
      const customManager = new ContextManager({
        baseDir: testDir,
        tokenEstimator: estimator,
      });
      expect(customManager).toBeInstanceOf(ContextManager);
    });

    it('should accept TokenEstimator config', () => {
      const customManager = new ContextManager({
        baseDir: testDir,
        tokenEstimator: { charsPerToken: 6 },
      });
      expect(customManager).toBeInstanceOf(ContextManager);
    });
  });

  describe('addFile', () => {
    it('should add a valid file to context', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello, world!', 'utf-8');

      await manager.addFile('test.txt');

      const context = manager.getContext();
      expect(context).toHaveLength(1);
      expect(context[0].path).toBe(testFile);
      expect(context[0].content).toBe('Hello, world!');
      expect(context[0].estimatedTokens).toBeDefined();
    });

    it('should throw ValidationError for non-existent file', async () => {
      await expect(manager.addFile('nonexistent.txt')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for file outside baseDir', async () => {
      const outsideFile = path.join(tmpdir(), 'outside.txt');
      await fs.writeFile(outsideFile, 'content', 'utf-8');

      try {
        await expect(manager.addFile(outsideFile)).rejects.toThrow(ValidationError);
      } finally {
        await fs.unlink(outsideFile).catch(() => {});
      }
    });

    it('should not add duplicate files', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await manager.addFile('test.txt');
      await manager.addFile('test.txt');

      const context = manager.getContext();
      expect(context).toHaveLength(1);
    });

    it('should throw ValidationError for file too large', async () => {
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const testFile = path.join(testDir, 'large.txt');
      await fs.writeFile(testFile, largeContent, 'utf-8');

      const smallManager = new ContextManager({
        baseDir: testDir,
        maxFileSize: 1024 * 1024, // 1MB
      });

      await expect(smallManager.addFile('large.txt')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for binary files', async () => {
      const testFile = path.join(testDir, 'binary.bin');
      const buffer = Buffer.from([0, 1, 2, 3, 0]); // Contains null bytes
      await fs.writeFile(testFile, buffer);

      await expect(manager.addFile('binary.bin')).rejects.toThrow(ValidationError);
    });

    it('should add file with absolute path within baseDir', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await manager.addFile(testFile);

      const context = manager.getContext();
      expect(context).toHaveLength(1);
      expect(context[0].path).toBe(testFile);
    });
  });

  describe('addFilesByGlob', () => {
    it('should add multiple files using glob pattern', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2', 'utf-8');
      await fs.writeFile(path.join(testDir, 'other.md'), 'content', 'utf-8');

      await manager.addFile('*.txt');

      const context = manager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
      const paths = context.map((f) => path.basename(f.path));
      expect(paths).toContain('file1.txt');
      expect(paths).toContain('file2.txt');
    });

    it('should skip files that cannot be added', async () => {
      await fs.writeFile(path.join(testDir, 'valid.txt'), 'content', 'utf-8');
      // Create a large file that will be skipped
      const largeContent = 'x'.repeat(2 * 1024 * 1024);
      await fs.writeFile(path.join(testDir, 'large.txt'), largeContent, 'utf-8');

      const smallManager = new ContextManager({
        baseDir: testDir,
        maxFileSize: 1024 * 1024,
      });

      await smallManager.addFile('*.txt');

      const context = smallManager.getContext();
      // Should have at least valid.txt, large.txt should be skipped
      expect(context.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clear', () => {
    it('should clear all context', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await manager.addFile('test.txt');
      expect(manager.getContext()).toHaveLength(1);

      manager.clear();
      expect(manager.getContext()).toHaveLength(0);
    });

    it('should reset token count to zero', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await manager.addFile('test.txt');
      expect(manager.getTotalEstimatedTokens()).toBeGreaterThan(0);

      manager.clear();
      expect(manager.getTotalEstimatedTokens()).toBe(0);
    });
  });

  describe('getContext', () => {
    it('should return empty array initially', () => {
      expect(manager.getContext()).toEqual([]);
    });

    it('should return copy of context to prevent external modification', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await manager.addFile('test.txt');
      const context1 = manager.getContext();
      const context2 = manager.getContext();

      expect(context1).not.toBe(context2); // Different array instances
      expect(context1).toEqual(context2); // But same content
    });
  });

  describe('getTotalEstimatedTokens', () => {
    it('should return zero for empty context', () => {
      expect(manager.getTotalEstimatedTokens()).toBe(0);
    });

    it('should sum tokens from all files', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), '12345', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.txt'), '67890', 'utf-8');

      await manager.addFile('file1.txt');
      await manager.addFile('file2.txt');

      const tokens = manager.getTotalEstimatedTokens();
      expect(tokens).toBeGreaterThan(0);
      // Each file has 5 chars, with default 4 chars/token = ~2 tokens each
      expect(tokens).toBeGreaterThanOrEqual(2);
    });
  });

  describe('checkTokenLimit', () => {
    it('should return null when within limit', () => {
      const warning = manager.checkTokenLimit(100000);
      expect(warning).toBeNull();
    });

    it('should return warning when approaching limit', async () => {
      // Create file with large content
      const largeContent = 'x'.repeat(10000);
      await fs.writeFile(path.join(testDir, 'large.txt'), largeContent, 'utf-8');

      await manager.addFile('large.txt');

      // Set limit to trigger warning (>80%) but still within effective limit
      // Using 1.2 means tokens are 83.33% of limit, which triggers warning but is within limit
      const totalTokens = manager.getTotalEstimatedTokens();
      const warning = manager.checkTokenLimit(totalTokens * 1.2);

      expect(warning).toBeTruthy();
      expect(warning).toContain('approaching');
    });

    it('should return error message when exceeding limit', async () => {
      const largeContent = 'x'.repeat(10000);
      await fs.writeFile(path.join(testDir, 'large.txt'), largeContent, 'utf-8');

      await manager.addFile('large.txt');

      const totalTokens = manager.getTotalEstimatedTokens();
      const warning = manager.checkTokenLimit(totalTokens * 0.5); // Below current

      expect(warning).toBeTruthy();
      expect(warning).toContain('exceeds');
    });
  });
});
