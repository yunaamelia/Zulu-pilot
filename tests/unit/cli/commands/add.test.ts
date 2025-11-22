import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  handleAddCommand,
  setContextManager,
  getContextManager,
} from '../../../../src/cli/commands/add.js';
import { ContextManager } from '../../../../src/core/context/ContextManager.js';

describe('add command', () => {
  let tempDir: string;
  let contextManager: ContextManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
    contextManager = new ContextManager({ baseDir: tempDir });
    setContextManager(contextManager);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('handleAddCommand', () => {
    it('should add file to context', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      // Mock console.log and console.warn
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await handleAddCommand(testFile, contextManager);

      expect(contextManager.getContext()).toHaveLength(1);
      expect(contextManager.getContext()[0].path).toBe(testFile);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Added:'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Tokens:'));

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should show token warning when approaching limit', async () => {
      const largeFile = path.join(tempDir, 'large.ts');
      // Create file with ~26k tokens (80%+ of 32k limit to trigger warning)
      await fs.writeFile(largeFile, 'x'.repeat(104000)); // ~26,000 tokens

      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await handleAddCommand(largeFile, contextManager);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should handle ValidationError and exit', async () => {
      const nonExistent = path.join(tempDir, 'nonexistent.ts');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(handleAddCommand(nonExistent, contextManager)).rejects.toThrow(
        'process.exit called'
      );

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should handle glob patterns', async () => {
      await fs.writeFile(path.join(tempDir, 'file1.ts'), 'const x = 1;');
      await fs.writeFile(path.join(tempDir, 'file2.ts'), 'const y = 2;');
      await fs.writeFile(path.join(tempDir, 'file3.js'), 'const z = 3;');

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleAddCommand(path.join(tempDir, '*.ts'), contextManager);

      const context = contextManager.getContext();
      expect(context.length).toBeGreaterThanOrEqual(2);
      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should handle errors that are not ValidationError', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      // Mock contextManager.addFile to throw a generic error
      jest.spyOn(contextManager, 'addFile').mockRejectedValue(new Error('Generic error'));

      await expect(handleAddCommand(testFile, contextManager)).rejects.toThrow('Generic error');
    });

    it('should use global context manager when not provided', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleAddCommand(testFile);

      expect(getContextManager().getContext()).toHaveLength(1);

      logSpy.mockRestore();
    });
  });

  describe('getContextManager', () => {
    it('should return global context manager', () => {
      const manager = getContextManager();
      expect(manager).toBeInstanceOf(ContextManager);
    });

    it('should create new instance if global not set', () => {
      setContextManager(null as unknown as ContextManager);
      const manager = getContextManager();
      expect(manager).toBeInstanceOf(ContextManager);
    });
  });
});
