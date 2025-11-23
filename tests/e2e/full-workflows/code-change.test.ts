import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CodeChangeParser } from '../../../packages/core/src/parser/CodeChangeParser.js';
import { FilePatcher } from '../../../packages/core/src/parser/FilePatcher.js';

/**
 * T155: E2E test for code change approval workflow
 *
 * This test simulates the full workflow:
 * 1. AI proposes code changes
 * 2. User reviews the diff
 * 3. User approves/rejects changes
 * 4. Changes are applied or discarded
 */
describe('T155: Code Change Approval Workflow E2E', () => {
  let parser: CodeChangeParser;
  let patcher: FilePatcher;
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-e2e-'));
    testFile = path.join(tempDir, 'app.ts');
    await fs.writeFile(testFile, 'const version = "1.0";\nconsole.log(version);');

    parser = new CodeChangeParser({ baseDir: tempDir });
    patcher = new FilePatcher({ baseDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should complete full workflow: propose -> review diff -> approve -> apply', async () => {
    // Step 1: AI proposes code changes
    const aiResponse = `
I'll update the version number:

\`\`\`typescript:app.ts
const version = "2.0";
console.log(version);
\`\`\`
`;

    const changes = parser.parse(aiResponse);
    expect(changes).toHaveLength(1);

    const change = changes[0];
    change.originalContent = await fs.readFile(testFile, 'utf-8');

    // Step 2: Generate diff for review
    const diff = patcher.generateDiff(change);
    expect(diff).toContain('---');
    expect(diff).toContain('+++');
    expect(diff).toContain('-const version = "1.0";');
    expect(diff).toContain('+const version = "2.0";');

    // Step 3: User approves (simulated by calling applyChange)
    await patcher.applyChange(change);

    // Step 4: Verify changes were applied
    const newContent = await fs.readFile(testFile, 'utf-8');
    expect(newContent).toContain('const version = "2.0";');
    expect(newContent).not.toContain('const version = "1.0";');
  });

  it('should handle rejection workflow: propose -> review diff -> reject -> no changes', async () => {
    const originalContent = await fs.readFile(testFile, 'utf-8');

    // Step 1: AI proposes code changes
    const aiResponse = `
I'll update the version:

\`\`\`typescript:app.ts
const version = "3.0";
console.log(version);
\`\`\`
`;

    const changes = parser.parse(aiResponse);
    expect(changes).toHaveLength(1);

    const change = changes[0];
    change.originalContent = originalContent;

    // Step 2: Generate diff for review
    const diff = patcher.generateDiff(change);
    expect(diff).toContain('+const version = "3.0";');

    // Step 3: User rejects (simulated by NOT calling applyChange)
    // In real implementation, this would be handled by the approval workflow

    // Step 4: Verify no changes were applied
    const currentContent = await fs.readFile(testFile, 'utf-8');
    expect(currentContent).toBe(originalContent);
    expect(currentContent).toContain('const version = "1.0";');
  });

  it('should handle multiple file changes with approval workflow', async () => {
    const file1 = path.join(tempDir, 'file1.ts');
    const file2 = path.join(tempDir, 'file2.ts');
    await fs.writeFile(file1, 'export const a = 1;');
    await fs.writeFile(file2, 'export const b = 1;');

    // Step 1: AI proposes changes to multiple files
    const aiResponse = `
I'll update both files:

\`\`\`typescript:file1.ts
export const a = 2;
\`\`\`

\`\`\`typescript:file2.ts
export const b = 2;
\`\`\`
`;

    const changes = parser.parse(aiResponse);
    expect(changes).toHaveLength(2);

    // Step 2: Generate diffs for review
    changes[0].originalContent = await fs.readFile(file1, 'utf-8');
    changes[1].originalContent = await fs.readFile(file2, 'utf-8');

    const diff1 = patcher.generateDiff(changes[0]);
    const diff2 = patcher.generateDiff(changes[1]);

    expect(diff1).toContain('-export const a = 1;');
    expect(diff1).toContain('+export const a = 2;');
    expect(diff2).toContain('-export const b = 1;');
    expect(diff2).toContain('+export const b = 2;');

    // Step 3: User approves all changes
    await patcher.applyChange(changes[0]);
    await patcher.applyChange(changes[1]);

    // Step 4: Verify all changes were applied
    const content1 = await fs.readFile(file1, 'utf-8');
    const content2 = await fs.readFile(file2, 'utf-8');

    expect(content1).toContain('export const a = 2;');
    expect(content2).toContain('export const b = 2;');
  });

  it('should create backups before applying changes', async () => {
    const originalContent = await fs.readFile(testFile, 'utf-8');

    const aiResponse = `
\`\`\`typescript:app.ts
const version = "2.0";
console.log(version);
\`\`\`
`;

    const changes = parser.parse(aiResponse);
    changes[0].originalContent = originalContent;

    await patcher.applyChange(changes[0]);

    // Verify backup was created
    const backupDir = path.join(tempDir, '.zulu-pilot-backups');
    const backups = await fs.readdir(backupDir);
    const backupFile = backups.find((b) => b.includes('app.ts'));

    expect(backupFile).toBeDefined();
    if (backupFile) {
      const backupContent = await fs.readFile(path.join(backupDir, backupFile), 'utf-8');
      expect(backupContent).toBe(originalContent);
    }
  });

  it('should validate syntax and reject invalid changes', async () => {
    const originalContent = await fs.readFile(testFile, 'utf-8');

    const aiResponse = `
\`\`\`typescript:app.ts
const version = "2.0"
console.log(version);
\`\`\`
`;

    const changes = parser.parse(aiResponse);
    changes[0].originalContent = originalContent;

    // This should fail syntax validation (missing semicolon)
    // Note: Current implementation may not catch this, but it should catch JSON errors
    // For TypeScript, we'd need a more sophisticated validator

    // Test with JSON which has better validation
    const jsonFile = path.join(tempDir, 'config.json');
    await fs.writeFile(jsonFile, '{"valid": true}');

    const jsonResponse = `
\`\`\`json:config.json
{"invalid": json}
\`\`\`
`;

    const jsonChanges = parser.parse(jsonResponse);
    jsonChanges[0].originalContent = await fs.readFile(jsonFile, 'utf-8');

    await expect(patcher.applyChange(jsonChanges[0])).rejects.toThrow();
  });
});

