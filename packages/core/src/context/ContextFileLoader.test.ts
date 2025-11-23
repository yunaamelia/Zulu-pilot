import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ContextFileLoader } from './ContextFileLoader.js';

/**
 * T183/T191: Unit tests for ContextFileLoader
 */
describe('T183/T191: ContextFileLoader', () => {
  let loader: ContextFileLoader;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-context-test-'));
    loader = new ContextFileLoader({ baseDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('discoverContextFiles', () => {
    it('should discover context file at root level', async () => {
      const contextFile = path.join(tempDir, '.zulu-pilot-context.md');
      await fs.writeFile(contextFile, '# Project Context\n\nThis is the context.');

      const files = await loader.discoverContextFiles();

      expect(files.length).toBe(1);
      expect(files[0].filePath).toBe('.zulu-pilot-context.md');
      expect(files[0].content).toContain('Project Context');
      expect(files[0].depth).toBe(0);
    });

    it('should discover multiple context file formats', async () => {
      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Context 1');
      await fs.writeFile(path.join(tempDir, 'ZULU-PILOT.md'), 'Context 2');
      await fs.writeFile(path.join(tempDir, 'GEMINI.md'), 'Context 3');

      const files = await loader.discoverContextFiles();

      expect(files.length).toBe(3);
      expect(files.map((f) => f.filePath).sort()).toEqual([
        '.zulu-pilot-context.md',
        'GEMINI.md',
        'ZULU-PILOT.md',
      ]);
    });

    it('should discover context files in subdirectories', async () => {
      const subDir = path.join(tempDir, 'src');
      await fs.mkdir(subDir, { recursive: true });

      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root context');
      await fs.writeFile(path.join(subDir, '.zulu-pilot-context.md'), 'Subdirectory context');

      const files = await loader.discoverContextFiles();

      expect(files.length).toBe(2);
      const rootFile = files.find((f) => f.depth === 0);
      const subFile = files.find((f) => f.depth === 1);

      expect(rootFile).toBeDefined();
      expect(subFile).toBeDefined();
      expect(rootFile?.content).toBe('Root context');
      expect(subFile?.content).toBe('Subdirectory context');
    });

    it('should respect max depth limit', async () => {
      const loaderWithDepth = new ContextFileLoader({ baseDir: tempDir, maxDepth: 2 });

      // Create nested directories
      let currentDir = tempDir;
      for (let i = 0; i < 5; i++) {
        currentDir = path.join(currentDir, `level${i}`);
        await fs.mkdir(currentDir, { recursive: true });
        await fs.writeFile(path.join(currentDir, '.zulu-pilot-context.md'), `Level ${i} context`);
      }

      const files = await loaderWithDepth.discoverContextFiles();

      // Should only find files up to depth 2
      expect(files.every((f) => f.depth <= 2)).toBe(true);
      expect(files.length).toBeLessThanOrEqual(3); // depth 0, 1, 2
    });

    it('should ignore node_modules directory', async () => {
      const nodeModulesDir = path.join(tempDir, 'node_modules');
      await fs.mkdir(nodeModulesDir, { recursive: true });
      await fs.writeFile(path.join(nodeModulesDir, '.zulu-pilot-context.md'), 'Should be ignored');

      const files = await loader.discoverContextFiles();

      expect(files.length).toBe(0);
    });

    it('should ignore hidden directories (starting with .)', async () => {
      const hiddenDir = path.join(tempDir, '.hidden');
      await fs.mkdir(hiddenDir, { recursive: true });
      await fs.writeFile(path.join(hiddenDir, '.zulu-pilot-context.md'), 'Should be ignored');

      const files = await loader.discoverContextFiles();

      expect(files.length).toBe(0);
    });

    it('should return empty array when no context files exist', async () => {
      const files = await loader.discoverContextFiles();
      expect(files).toEqual([]);
    });
  });

  describe('loadContext', () => {
    it('should load and merge context from single file', async () => {
      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Single context file');

      const merged = await loader.loadContext();

      expect(merged).toContain('Single context file');
      expect(merged).toContain('.zulu-pilot-context.md');
    });

    it('should merge multiple context files with priority', async () => {
      // T190: Subdirectory context should override root context
      const subDir = path.join(tempDir, 'src');
      await fs.mkdir(subDir, { recursive: true });

      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root context');
      await fs.writeFile(path.join(subDir, '.zulu-pilot-context.md'), 'Subdirectory context');

      const merged = await loader.loadContext();

      // Subdirectory context should come first (higher priority)
      const subIndex = merged.indexOf('Subdirectory context');
      const rootIndex = merged.indexOf('Root context');
      expect(subIndex).toBeGreaterThan(-1);
      expect(rootIndex).toBeGreaterThan(-1);
      expect(subIndex).toBeLessThan(rootIndex); // Subdirectory appears before root
    });

    it('should merge files at same depth alphabetically (later = higher priority)', async () => {
      await fs.writeFile(path.join(tempDir, 'A-context.md'), 'Context A');
      await fs.writeFile(path.join(tempDir, 'Z-context.md'), 'Context Z');

      const merged = await loader.loadContext();

      // Z should come before A (alphabetically later = higher priority)
      const zIndex = merged.indexOf('Context Z');
      const aIndex = merged.indexOf('Context A');
      expect(zIndex).toBeLessThan(aIndex);
    });

    it('should return empty string when no context files exist', async () => {
      const merged = await loader.loadContext();
      expect(merged).toBe('');
    });

    it('should include file path comments in merged context', async () => {
      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Context content');

      const merged = await loader.loadContext();

      expect(merged).toContain('<!-- Context from');
      expect(merged).toContain('.zulu-pilot-context.md');
    });

    it('should handle nested subdirectories with priority', async () => {
      const level1 = path.join(tempDir, 'level1');
      const level2 = path.join(level1, 'level2');
      await fs.mkdir(level2, { recursive: true });

      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root');
      await fs.writeFile(path.join(level1, '.zulu-pilot-context.md'), 'Level 1');
      await fs.writeFile(path.join(level2, '.zulu-pilot-context.md'), 'Level 2');

      const merged = await loader.loadContext();

      // Deeper files should have higher priority (appear first)
      const level2Index = merged.indexOf('Level 2');
      const level1Index = merged.indexOf('Level 1');
      const rootIndex = merged.indexOf('Root');

      expect(level2Index).toBeLessThan(level1Index);
      expect(level1Index).toBeLessThan(rootIndex);
    });
  });

  describe('listContextFiles', () => {
    it('should list all discovered context files', async () => {
      const subDir = path.join(tempDir, 'src');
      await fs.mkdir(subDir, { recursive: true });

      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root');
      await fs.writeFile(path.join(subDir, 'ZULU-PILOT.md'), 'Sub');

      const files = await loader.listContextFiles();

      expect(files.length).toBe(2);
      expect(files).toContain('.zulu-pilot-context.md');
      expect(files).toContain('src/ZULU-PILOT.md');
    });

    it('should return empty array when no files exist', async () => {
      const files = await loader.listContextFiles();
      expect(files).toEqual([]);
    });
  });

  describe('hasRootContextFile', () => {
    it('should return true when root context file exists', async () => {
      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Context');

      const hasRoot = await loader.hasRootContextFile();

      expect(hasRoot).toBe(true);
    });

    it('should return false when no root context file exists', async () => {
      const hasRoot = await loader.hasRootContextFile();
      expect(hasRoot).toBe(false);
    });

    it('should return false when context file exists only in subdirectory', async () => {
      const subDir = path.join(tempDir, 'src');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(subDir, '.zulu-pilot-context.md'), 'Context');

      const hasRoot = await loader.hasRootContextFile();

      expect(hasRoot).toBe(false);
    });
  });

  describe('getBaseDir', () => {
    it('should return base directory', () => {
      const baseDir = loader.getBaseDir();
      expect(baseDir).toBe(tempDir);
    });

    it('should use process.cwd() as default', () => {
      const defaultLoader = new ContextFileLoader();
      expect(defaultLoader.getBaseDir()).toBe(process.cwd());
    });
  });

  describe('custom file names', () => {
    it('should support custom context file names', async () => {
      const customLoader = new ContextFileLoader({
        baseDir: tempDir,
        fileNames: ['CUSTOM.md', 'MY-CONTEXT.md'],
      });

      await fs.writeFile(path.join(tempDir, 'CUSTOM.md'), 'Custom context');
      await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Should be ignored');

      const files = await customLoader.discoverContextFiles();

      expect(files.length).toBe(1);
      expect(files[0].filePath).toBe('CUSTOM.md');
    });
  });
});

