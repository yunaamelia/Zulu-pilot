import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { handleContextCommand } from '../../../../src/cli/commands/context.js';
import { ContextManager } from '../../../../src/core/context/ContextManager.js';
import { setContextManager } from '../../../../src/cli/commands/add.js';

describe('context command', () => {
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

  describe('handleContextCommand', () => {
    it('should display empty message when no files in context', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleContextCommand(contextManager);

      expect(logSpy).toHaveBeenCalledWith('No files in context.');

      logSpy.mockRestore();
    });

    it('should list all files in context', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleContextCommand(contextManager);

      const logCalls = logSpy.mock.calls.flat().join('\n');
      expect(logCalls).toContain('Context Files:');
      expect(logCalls).toContain(file1);
      expect(logCalls).toContain(file2);
      expect(logCalls).toContain('Total tokens:');

      logSpy.mockRestore();
    });

    it('should show file metadata', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleContextCommand(contextManager);

      const logCalls = logSpy.mock.calls.flat().join('\n');
      expect(logCalls).toContain(testFile);
      expect(logCalls).toContain('Modified:');
      expect(logCalls).toContain('Tokens:');

      logSpy.mockRestore();
    });

    it('should use global context manager when not provided', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleContextCommand();

      const logCalls = logSpy.mock.calls.flat().join('\n');
      expect(logCalls).toContain('Context Files:');

      logSpy.mockRestore();
    });
  });
});

