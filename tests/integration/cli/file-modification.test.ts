import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CodeChangeParser } from '../../../src/core/parser/CodeChangeParser.js';
import { FilePatcher } from '../../../src/core/parser/FilePatcher.js';
import { createCodeChange } from '../../../src/core/parser/CodeChange.js';

/**
 * Integration test for file modification flow.
 * Tests: propose change → show diff → approve → verify file updated
 */
describe('File Modification Flow Integration', () => {
  let parser: CodeChangeParser;
  let patcher: FilePatcher;
  let tempDir: string;
  let backupDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-'));
    backupDir = path.join(tempDir, '.zulu-pilot-backups');
    parser = new CodeChangeParser({ baseDir: tempDir });
    patcher = new FilePatcher({ baseDir: tempDir, backupDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('propose change → show diff → approve → verify file updated', () => {
    it('should complete full flow: parse → diff → apply → verify', async () => {
      // Step 1: Create initial file
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      // Step 2: AI proposes change
      const aiResponse = `
Here's the updated code:

\`\`\`typescript:test.ts
const x = 2;
\`\`\`
`;

      // Step 3: Parse changes
      const changes = parser.parse(aiResponse, { baseDir: tempDir });
      expect(changes).toHaveLength(1);

      // Step 4: Show diff
      const change = changes[0];
      // Load original content for diff
      const originalContent = await fs.readFile(testFile, 'utf-8');
      const changeWithContent = createCodeChange(
        change.filePath,
        originalContent,
        change.newContent,
        'modify'
      );
      const diff = patcher.generateDiff(changeWithContent);
      expect(diff).toContain('-const x = 1;');
      expect(diff).toContain('+const x = 2;');

      // Step 5: Approve and apply
      await patcher.applyChange(changeWithContent);

      // Step 6: Verify file updated
      const updatedContent = await fs.readFile(testFile, 'utf-8');
      expect(updatedContent).toBe('const x = 2;');
    });

    it('should create backup before applying change', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 1;');

      const aiResponse = `
\`\`\`typescript:test.ts
const x = 2;
\`\`\`
`;

      const changes = parser.parse(aiResponse, { baseDir: tempDir });
      const change = changes[0];
      const originalContent = await fs.readFile(testFile, 'utf-8');
      const changeWithContent = createCodeChange(
        change.filePath,
        originalContent,
        change.newContent,
        'modify'
      );

      await patcher.applyChange(changeWithContent);

      // Verify backup exists
      const backupExists = await fs
        .access(backupDir)
        .then(() => true)
        .catch(() => false);
      expect(backupExists).toBe(true);

      const backupFiles = await fs.readdir(backupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('propose change → show diff → reject → verify file unchanged', () => {
    it('should not apply changes when rejected', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      const originalContent = 'const x = 1;';
      await fs.writeFile(testFile, originalContent);

      const aiResponse = `
\`\`\`typescript:test.ts
const x = 2;
\`\`\`
`;

      const changes = parser.parse(aiResponse, { baseDir: tempDir });
      expect(changes).toHaveLength(1);

      // Show diff (user reviews)
      const change = changes[0];
      const changeWithContent = createCodeChange(
        change.filePath,
        originalContent,
        change.newContent,
        'modify'
      );
      const diff = patcher.generateDiff(changeWithContent);
      expect(diff).toBeTruthy();

      // User rejects - don't call applyChange
      // File should remain unchanged
      const currentContent = await fs.readFile(testFile, 'utf-8');
      expect(currentContent).toBe(originalContent);
    });
  });

  describe('multiple file changes', () => {
    it('should handle multiple file changes in one response', async () => {
      const file1 = path.join(tempDir, 'file1.ts');
      const file2 = path.join(tempDir, 'file2.ts');
      await fs.writeFile(file1, 'const x = 1;');
      await fs.writeFile(file2, 'const y = 1;');

      const aiResponse = `
\`\`\`typescript:file1.ts
const x = 2;
\`\`\`

\`\`\`typescript:file2.ts
const y = 2;
\`\`\`
`;

      const changes = parser.parse(aiResponse, { baseDir: tempDir });
      expect(changes).toHaveLength(2);

      // Apply both changes
      for (const change of changes) {
        const originalContent = await fs.readFile(path.join(tempDir, change.filePath), 'utf-8');
        const changeWithContent = createCodeChange(
          change.filePath,
          originalContent,
          change.newContent,
          'modify'
        );
        await patcher.applyChange(changeWithContent);
      }

      // Verify both files updated
      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');
      expect(content1).toBe('const x = 2;');
      expect(content2).toBe('const y = 2;');
    });
  });
});
