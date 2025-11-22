import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CodeChangeParser } from '../../../src/core/parser/CodeChangeParser.js';
import { FilePatcher } from '../../../src/core/parser/FilePatcher.js';
import { createCodeChange } from '../../../src/core/parser/CodeChange.js';

/**
 * End-to-end test for agentic file modification.
 * Test complete flow: ask for change → review → approve → verify
 */
describe('E2E Agentic File Modification', () => {
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

  describe('complete user journey', () => {
    it('should complete full flow: ask → review → approve → verify', async () => {
      // Step 1: User has a file
      const testFile = path.join(tempDir, 'calculator.ts');
      const initialContent = `
export function add(a: number, b: number): number {
  return a + b;
}
`;
      await fs.writeFile(testFile, initialContent);

      // Step 2: User asks AI to modify file
      // (In real scenario, this would be via chat command)
      const aiResponse = `
I'll add a multiply function to your calculator:

\`\`\`typescript:calculator.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
\`\`\`
`;

      // Step 3: Parse AI response
      const changes = parser.parse(aiResponse, { baseDir: tempDir });
      expect(changes).toHaveLength(1);

      // Step 4: Show diff to user
      const change = changes[0];
      const originalContent = await fs.readFile(testFile, 'utf-8');
      const changeWithContent = createCodeChange(
        change.filePath,
        originalContent,
        change.newContent,
        'modify'
      );
      const diff = patcher.generateDiff(changeWithContent);

      // Verify diff shows the addition
      expect(diff).toContain('multiply');
      expect(diff).toContain('+');

      // Step 5: User approves (simulated)
      await patcher.applyChange(changeWithContent);

      // Step 6: Verify file updated
      const updatedContent = await fs.readFile(testFile, 'utf-8');
      expect(updatedContent).toContain('multiply');
      expect(updatedContent).toContain('a * b');
    });

    it('should handle user rejection', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      const originalContent = 'const x = 1;';
      await fs.writeFile(testFile, originalContent);

      const aiResponse = `
\`\`\`typescript:test.ts
const x = 999; // User doesn't want this
\`\`\`
`;

      const changes = parser.parse(aiResponse, { baseDir: tempDir });
      const change = changes[0];
      const changeWithContent = createCodeChange(
        change.filePath,
        originalContent,
        change.newContent,
        'modify'
      );

      // User reviews diff and rejects
      // (In real scenario, user would see diff and choose 'n')
      // Show diff for review (but don't apply)
      const diff = patcher.generateDiff(changeWithContent);
      expect(diff).toBeTruthy();
      // Don't call applyChange

      // Verify file unchanged
      const currentContent = await fs.readFile(testFile, 'utf-8');
      expect(currentContent).toBe(originalContent);
    });

    it('should handle new file creation', async () => {
      const newFile = path.join(tempDir, 'new.ts');

      const aiResponse = `
\`\`\`typescript:new.ts
export const greeting = 'Hello, World!';
\`\`\`
`;

      const changes = parser.parse(aiResponse, { baseDir: tempDir });
      expect(changes).toHaveLength(1);

      const change = changes[0];
      const changeWithContent = createCodeChange(change.filePath, '', change.newContent, 'add');

      // User approves
      await patcher.applyChange(changeWithContent);

      // Verify file created
      const content = await fs.readFile(newFile, 'utf-8');
      expect(content).toContain('greeting');
    });
  });
});
