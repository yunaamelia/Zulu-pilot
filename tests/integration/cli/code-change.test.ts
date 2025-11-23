import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CodeChangeParser } from '../../../packages/core/src/parser/CodeChangeParser.js';
import { FilePatcher } from '../../../packages/core/src/parser/FilePatcher.js';
import type { CodeChangeProposal } from '../../../packages/core/src/parser/CodeChangeProposal.js';

describe('T154: Code Change Workflow Integration', () => {
  let parser: CodeChangeParser;
  let patcher: FilePatcher;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-code-change-'));
    parser = new CodeChangeParser({ baseDir: tempDir });
    patcher = new FilePatcher({ baseDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should parse AI response and extract code changes', () => {
    const aiResponse = `
Here are the changes I propose:

\`\`\`typescript:src/utils/helper.ts
export function helper() {
  return 'updated helper';
}
\`\`\`

\`\`\`typescript:src/config.ts
export const config = {
  version: '2.0'
};
\`\`\`
`;

    const changes = parser.parse(aiResponse);

    expect(changes).toHaveLength(2);
    expect(changes[0].filePath).toBe('src/utils/helper.ts');
    expect(changes[1].filePath).toBe('src/config.ts');
  });

  it('should generate unified diff for code changes', async () => {
    const testFile = path.join(tempDir, 'test.ts');
    await fs.writeFile(testFile, 'const x = 1;');

    const changes = parser.parse(`
\`\`\`typescript:test.ts
const x = 2;
\`\`\`
`);

    expect(changes).toHaveLength(1);
    const change = changes[0];
    change.originalContent = 'const x = 1;';

    const diff = patcher.generateDiff(change);

    expect(diff).toContain('---');
    expect(diff).toContain('+++');
    expect(diff).toContain('-const x = 1;');
    expect(diff).toContain('+const x = 2;');
  });

  it('should apply code changes to files', async () => {
    const testFile = path.join(tempDir, 'test.ts');
    await fs.writeFile(testFile, 'const x = 1;');

    const changes = parser.parse(`
\`\`\`typescript:test.ts
const x = 2;
\`\`\`
`);

    expect(changes).toHaveLength(1);
    const change = changes[0];
    change.originalContent = await fs.readFile(testFile, 'utf-8');

    await patcher.applyChange(change);

    const newContent = await fs.readFile(testFile, 'utf-8');
    expect(newContent.trim()).toBe('const x = 2;');
  });

  it('should create backup before modifying file', async () => {
    const testFile = path.join(tempDir, 'test.ts');
    const originalContent = 'const x = 1;';
    await fs.writeFile(testFile, originalContent);

    const changes = parser.parse(`
\`\`\`typescript:test.ts
const x = 2;
\`\`\`
`);

    expect(changes).toHaveLength(1);
    const change = changes[0];
    change.originalContent = originalContent;

    await patcher.applyChange(change);

    // Check that backup was created
    const backupDir = path.join(tempDir, '.zulu-pilot-backups');
    const backups = await fs.readdir(backupDir);
    expect(backups.length).toBeGreaterThan(0);
    expect(backups.some((b) => b.includes('test.ts'))).toBe(true);
  });

  it('should validate syntax before applying changes', async () => {
    const testFile = path.join(tempDir, 'test.json');
    await fs.writeFile(testFile, '{"valid": true}');

    const changes = parser.parse(`
\`\`\`json:test.json
{"invalid": json}
\`\`\`
`);

    expect(changes).toHaveLength(1);
    const change = changes[0];
    change.originalContent = await fs.readFile(testFile, 'utf-8');

    await expect(patcher.applyChange(change)).rejects.toThrow();
  });

  it('should handle multiple file changes in sequence', async () => {
    const file1 = path.join(tempDir, 'file1.ts');
    const file2 = path.join(tempDir, 'file2.ts');
    await fs.writeFile(file1, 'const a = 1;');
    await fs.writeFile(file2, 'const b = 1;');

    const changes = parser.parse(`
\`\`\`typescript:file1.ts
const a = 2;
\`\`\`

\`\`\`typescript:file2.ts
const b = 2;
\`\`\`
`);

    expect(changes).toHaveLength(2);

    // Apply first change
    changes[0].originalContent = await fs.readFile(file1, 'utf-8');
    await patcher.applyChange(changes[0]);

    // Apply second change
    changes[1].originalContent = await fs.readFile(file2, 'utf-8');
    await patcher.applyChange(changes[1]);

    const content1 = await fs.readFile(file1, 'utf-8');
    const content2 = await fs.readFile(file2, 'utf-8');

    expect(content1.trim()).toBe('const a = 2;');
    expect(content2.trim()).toBe('const b = 2;');
  });
});

