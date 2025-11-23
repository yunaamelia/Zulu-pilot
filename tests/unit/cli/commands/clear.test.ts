/**
 * Unit tests for ClearCommand
 * T094 [US3] - Write unit tests for ClearCommand (90%+ coverage)
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ClearCommand } from '../../../../packages/cli/src/commands/clear.js';
import { ContextManager } from '@zulu-pilot/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';
import readline from 'node:readline';

// Mock console methods
const consoleLog = jest.fn();
const consoleError = jest.fn();

// Mock readline
jest.mock('node:readline');

describe('ClearCommand (T094)', () => {
  let testDir: string;
  let contextManager: ContextManager;
  let command: ClearCommand;
  let mockReadline: jest.Mocked<typeof readline>;

  beforeEach(() => {
    // Mock console
    jest.spyOn(console, 'log').mockImplementation(consoleLog);
    jest.spyOn(console, 'error').mockImplementation(consoleError);

    // Mock readline
    mockReadline = readline as jest.Mocked<typeof readline>;
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
      command = new ClearCommand();
      expect(command).toBeInstanceOf(ClearCommand);
      expect(command.getContextManager()).toBeInstanceOf(ContextManager);
    });

    it('should create instance with provided ContextManager', async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'clear-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ClearCommand(contextManager);
      expect(command.getContextManager()).toBe(contextManager);
    });
  });

  describe('clearing empty context', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'clear-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ClearCommand(contextManager);
    });

    it('should display message when context is already empty', async () => {
      await command.run({});

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('already empty'));
    });
  });

  describe('clearing context with confirmation', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'clear-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ClearCommand(contextManager);

      // Add files to context
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');
    });

    it('should clear context when force flag is set', async () => {
      await command.run({ force: true });

      expect(contextManager.getContext()).toEqual([]);
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Successfully cleared'));
    });

    it('should clear context when yes flag is set', async () => {
      await command.run({ yes: true });

      expect(contextManager.getContext()).toEqual([]);
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Successfully cleared'));
    });

    it('should display context info before clearing', async () => {
      await command.run({ force: true });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Context'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Files: 1'));
    });
  });

  describe('confirmation workflow', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'clear-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ClearCommand(contextManager);

      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');
    });

    it('should prompt for confirmation when no flags are set', async () => {
      // Mock readline to return 'yes'
      const mockQuestion = jest.fn((_question: string, callback: (answer: string) => void) => {
        callback('yes');
      });
      const mockClose = jest.fn();

      mockReadline.createInterface = jest.fn(() => ({
        question: mockQuestion,
        close: mockClose,
      })) as any;

      await command.run({});

      expect(mockReadline.createInterface).toHaveBeenCalled();
      expect(contextManager.getContext()).toEqual([]);
    });

    it('should not clear when user cancels', async () => {
      // Mock readline to return 'no'
      const mockQuestion = jest.fn((_question: string, callback: (answer: string) => void) => {
        callback('no');
      });
      const mockClose = jest.fn();

      mockReadline.createInterface = jest.fn(() => ({
        question: mockQuestion,
        close: mockClose,
      })) as any;

      await command.run({});

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
      expect(contextManager.getContext().length).toBeGreaterThan(0);
    });
  });

  describe('success feedback', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'clear-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ClearCommand(contextManager);

      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');
    });

    it('should display success message after clearing', async () => {
      await command.run({ force: true });

      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Successfully cleared'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('1 file'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Context is now empty'));
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'clear-command-test-'));
      contextManager = new ContextManager({ baseDir: testDir });
      command = new ClearCommand(contextManager);
    });

    it('should handle clearing multiple times', async () => {
      await fs.writeFile(path.join(testDir, 'test.ts'), 'content', 'utf-8');
      await contextManager.addFile('test.ts');

      await command.run({ force: true });
      expect(contextManager.getContext()).toEqual([]);

      await command.run({ force: true });
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('already empty'));
    });

    it('should handle clearing many files', async () => {
      // Add multiple files
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(path.join(testDir, `file${i}.ts`), `content${i}`, 'utf-8');
      }
      await contextManager.addFile('*.ts');

      expect(contextManager.getContext().length).toBeGreaterThanOrEqual(10);

      await command.run({ force: true });

      expect(contextManager.getContext()).toEqual([]);
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Successfully cleared'));
    });
  });
});
