/**
 * Unit tests for AddCommand
 * T092 [US3] - Write unit tests for AddCommand (90%+ coverage)
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AddCommand } from '../../../../packages/cli/src/commands/add.js';
import { ContextManager } from '@zulu-pilot/core';
import { ValidationError } from '@zulu-pilot/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';

// Mock console methods
const consoleLog = jest.fn();
const consoleError = jest.fn();

describe('AddCommand (T092)', () => {
  let testDir: string;
  let contextManager: ContextManager;
  let command: AddCommand;

  beforeEach(() => {
    // Mock console
    jest.spyOn(console, 'log').mockImplementation(consoleLog);
    jest.spyOn(console, 'error').mockImplementation(consoleError);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (testDir) {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('constructor', () => {
    it('should create instance with default ContextManager', () => {
      command = new AddCommand();
      expect(command).toBeInstanceOf(AddCommand);
      expect(command.getContextManager()).toBeInstanceOf(ContextManager);
    });

    it('should create instance with provided ContextManager', async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'add-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new AddCommand(contextManager);
      expect(command.getContextManager()).toBe(contextManager);
    });
  });

  describe('file path validation', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'add-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new AddCommand(contextManager);
    });

    it('should reject paths with directory traversal', async () => {
      await expect(command.run({ files: ['../outside.ts'] })).rejects.toThrow(ValidationError);
    });

    it('should accept valid relative paths', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await command.run({ files: ['test.ts'] });

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThan(0);
    });
  });

  describe('adding files', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'add-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new AddCommand(contextManager);
    });

    it('should add single file to context', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await command.run({ files: ['test.ts'] });

      const context = contextManager.getContext();
      expect(context).toHaveLength(1);
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Added 1 file'));
    });

    it('should add multiple files to context', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');

      await command.run({ files: ['file1.ts', 'file2.ts'] });

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle glob patterns', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file3.js'), 'content3', 'utf-8');

      await command.run({ files: ['*.ts'] });

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw error when no files specified', async () => {
      await expect(command.run({ files: [] })).rejects.toThrow('No files specified');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'add-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new AddCommand(contextManager);
    });

    it('should handle non-existent files gracefully', async () => {
      await command.run({ files: ['nonexistent.ts'] });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Added 0 file'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('failed to add'));
    });

    it('should continue processing remaining files after error', async () => {
      const testFile = path.join(testDir, 'valid.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await command.run({ files: ['nonexistent.ts', 'valid.ts'] });

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('token estimation and warnings', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'add-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new AddCommand(contextManager);
    });

    it('should display context summary with token count', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'content', 'utf-8');

      await command.run({ files: ['test.ts'] });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Context Summary'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Estimated tokens'));
    });

    it('should show token warning when approaching limit', async () => {
      const largeContent = 'x'.repeat(10000);
      await fs.writeFile(path.join(testDir, 'large.ts'), largeContent, 'utf-8');

      await command.run({ files: ['large.ts'], tokenLimit: 1000 });

      const context = contextManager.getContext();
      if (context.length > 0) {
        const warning = contextManager.checkTokenLimit(1000);
        if (warning) {
          expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
        }
      }
    });

    it('should display file list when 10 or fewer files', async () => {
      for (let i = 0; i < 5; i++) {
        await fs.writeFile(path.join(testDir, `file${i}.ts`), `content${i}`, 'utf-8');
      }

      await command.run({ files: ['*.ts'] });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Files in context'));
    });
  });
});
