import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { handleClearCommand } from '../../../../src/cli/commands/clear.js';
import { ContextManager } from '../../../../src/core/context/ContextManager.js';
import { setContextManager } from '../../../../src/cli/commands/add.js';

describe('clear command', () => {
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

  describe('handleClearCommand', () => {
    it('should clear all files from context when confirmed', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 2;');

      await contextManager.addFile(file1);
      await contextManager.addFile(file2);
      expect(contextManager.getContext()).toHaveLength(2);

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleClearCommand(true, contextManager);

      expect(contextManager.getContext()).toHaveLength(0);
      expect(logSpy).toHaveBeenCalledWith('✓ Context cleared.');

      logSpy.mockRestore();
    });

    it('should not clear when not confirmed', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);
      expect(contextManager.getContext()).toHaveLength(1);

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleClearCommand(false, contextManager);

      expect(contextManager.getContext()).toHaveLength(1);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('This will remove'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Use --yes flag'));

      logSpy.mockRestore();
    });

    it('should show message when context is already empty', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleClearCommand(true, contextManager);

      expect(logSpy).toHaveBeenCalledWith('Context is already empty.');

      logSpy.mockRestore();
    });

    it('should use global context manager when not provided', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      await contextManager.addFile(testFile);
      expect(contextManager.getContext()).toHaveLength(1);

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      handleClearCommand(true);

      expect(contextManager.getContext()).toHaveLength(0);
      expect(logSpy).toHaveBeenCalledWith('✓ Context cleared.');

      logSpy.mockRestore();
    });
  });
});
