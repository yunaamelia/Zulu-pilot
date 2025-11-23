import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ContextFileLoader } from '../../../packages/core/src/context/ContextFileLoader.js';

/**
 * T184: Integration test for context file loading
 */
describe('T184: Context File Loading Integration', () => {
  let tempDir: string;
  let loader: ContextFileLoader;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-context-integration-'));
    loader = new ContextFileLoader({ baseDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should discover and load context file from project root', async () => {
    const contextContent = `# Project Context

This project is a TypeScript application with the following structure:
- src/ - Source code
- tests/ - Test files
- package.json - Dependencies
`;

    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), contextContent);

    const merged = await loader.loadContext();

    expect(merged).toContain('Project Context');
    expect(merged).toContain('TypeScript application');
    expect(merged).toContain('.zulu-pilot-context.md');
  });

  it('should merge context from multiple files with priority', async () => {
    const rootContext = `# Root Context

This is the root context file.
It applies to the entire project.
`;

    const subDir = path.join(tempDir, 'src', 'features');
    await fs.mkdir(subDir, { recursive: true });
    const subContext = `# Feature Context

This is feature-specific context.
It overrides root context for this feature.
`;

    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), rootContext);
    await fs.writeFile(path.join(subDir, '.zulu-pilot-context.md'), subContext);

    const merged = await loader.loadContext();

    // Both contexts should be present
    expect(merged).toContain('Root Context');
    expect(merged).toContain('Feature Context');

    // Feature context should appear first (higher priority)
    const featureIndex = merged.indexOf('Feature Context');
    const rootIndex = merged.indexOf('Root Context');
    expect(featureIndex).toBeLessThan(rootIndex);
  });

  it('should handle multiple context file formats', async () => {
    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Custom context');
    await fs.writeFile(path.join(tempDir, 'ZULU-PILOT.md'), 'Zulu Pilot context');
    await fs.writeFile(path.join(tempDir, 'GEMINI.md'), 'Gemini context');

    const files = await loader.discoverContextFiles();

    expect(files.length).toBe(3);
    const fileNames = files.map((f) => path.basename(f.filePath)).sort();
    expect(fileNames).toEqual(['.zulu-pilot-context.md', 'GEMINI.md', 'ZULU-PILOT.md']);
  });

  it('should discover context files in nested subdirectories', async () => {
    const nestedDir = path.join(tempDir, 'src', 'components', 'ui');
    await fs.mkdir(nestedDir, { recursive: true });

    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root');
    await fs.writeFile(path.join(nestedDir, '.zulu-pilot-context.md'), 'Nested');

    const files = await loader.discoverContextFiles();

    expect(files.length).toBe(2);
    const nestedFile = files.find((f) => f.depth > 0);
    expect(nestedFile).toBeDefined();
    expect(nestedFile?.filePath).toContain('components/ui');
  });

  it('should ignore node_modules and hidden directories', async () => {
    const nodeModulesDir = path.join(tempDir, 'node_modules', 'package');
    const hiddenDir = path.join(tempDir, '.git', 'hooks');
    await fs.mkdir(nodeModulesDir, { recursive: true });
    await fs.mkdir(hiddenDir, { recursive: true });

    await fs.writeFile(path.join(nodeModulesDir, '.zulu-pilot-context.md'), 'Should be ignored');
    await fs.writeFile(path.join(hiddenDir, '.zulu-pilot-context.md'), 'Should be ignored');
    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Should be found');

    const files = await loader.discoverContextFiles();

    expect(files.length).toBe(1);
    expect(files[0].filePath).toBe('.zulu-pilot-context.md');
  });

  it('should handle empty context files gracefully', async () => {
    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), '');

    const merged = await loader.loadContext();

    expect(merged).toBeTruthy(); // Should still have the file header comment
    expect(merged).toContain('.zulu-pilot-context.md');
  });

  it('should merge contexts in correct priority order', async () => {
    // Create context files at different depths
    const level1 = path.join(tempDir, 'level1');
    const level2 = path.join(level1, 'level2');
    await fs.mkdir(level2, { recursive: true });

    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root (depth 0)');
    await fs.writeFile(path.join(level1, '.zulu-pilot-context.md'), 'Level 1 (depth 1)');
    await fs.writeFile(path.join(level2, '.zulu-pilot-context.md'), 'Level 2 (depth 2)');

    const merged = await loader.loadContext();

    // Deeper files should have higher priority (appear first)
    const level2Index = merged.indexOf('Level 2');
    const level1Index = merged.indexOf('Level 1');
    const rootIndex = merged.indexOf('Root');

    expect(level2Index).toBeLessThan(level1Index);
    expect(level1Index).toBeLessThan(rootIndex);
  });

  it('should list all discovered context files', async () => {
    const subDir = path.join(tempDir, 'src');
    await fs.mkdir(subDir, { recursive: true });

    await fs.writeFile(path.join(tempDir, '.zulu-pilot-context.md'), 'Root');
    await fs.writeFile(path.join(subDir, 'ZULU-PILOT.md'), 'Sub');

    const fileList = await loader.listContextFiles();

    expect(fileList.length).toBe(2);
    expect(fileList).toContain('.zulu-pilot-context.md');
    expect(fileList).toContain('src/ZULU-PILOT.md');
  });
});

