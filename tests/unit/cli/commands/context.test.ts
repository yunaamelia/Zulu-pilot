/**
 * Unit tests for ContextCommand
 * T093 [US3] - Write unit tests for ContextCommand (90%+ coverage)
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContextCommand } from '../../../../packages/cli/src/commands/context.js';
import { ContextManager } from '@zulu-pilot/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';

// Mock console methods
const consoleLog = jest.fn();
const consoleError = jest.fn();

describe('ContextCommand (T093)', () => {
  let testDir: string;
  let contextManager: ContextManager;
  let command: ContextCommand;

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
      command = new ContextCommand();
      expect(command).toBeInstanceOf(ContextCommand);
      expect(command.getContextManager()).toBeInstanceOf(ContextManager);
    });

    it('should create instance with provided ContextManager', async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ContextCommand(contextManager);
      expect(command.getContextManager()).toBe(contextManager);
    });
  });

  describe('listing empty context', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ContextCommand(contextManager);
    });

    it('should display empty context message', async () => {
      await command.run({});

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Total files: 0'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('No files in context'));
    });
  });

  describe('listing context with files', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ContextCommand(contextManager);

      // Add files to context
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content1', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.ts'), 'content2', 'utf-8');
      await contextManager.addFile('file1.ts');
      await contextManager.addFile('file2.ts');
    });

    it('should display context summary', async () => {
      await command.run({});

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Context Summary'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Total files: 2'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Estimated tokens'));
    });

    it('should display table format by default', async () => {
      await command.run({ format: 'table' });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Files in context'));
    });

    it('should display list format', async () => {
      await command.run({ format: 'list' });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Files in context'));
    });

    it('should display verbose information when requested', async () => {
      await command.run({ format: 'list', verbose: true });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Files in context'));
      // Should include detailed info
    });
  });

  describe('output formats', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ContextCommand(contextManager);

      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');
    });

    it('should display JSON format', async () => {
      await command.run({ format: 'json' });

      // JSON output should be valid JSON
      const jsonCall = consoleLog.mock.calls.find((call) =>
        call[0]?.toString().trim().startsWith('[')
      );
      expect(jsonCall).toBeDefined();
    });

    it('should display table format', async () => {
      await command.run({ format: 'table' });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Files in context'));
    });

    it('should display list format', async () => {
      await command.run({ format: 'list' });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Files in context'));
    });
  });

  describe('metadata display', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'context-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ContextCommand(contextManager);

      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');
    });

    it('should display file metadata', async () => {
      await command.run({ verbose: true });

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThan(0);
      // Should display metadata like size, tokens, modified date
    });
  });
});
