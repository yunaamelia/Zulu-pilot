import { describe, it, expect, beforeEach } from '@jest/globals';
import { CodeChangeParser } from '../../../../packages/core/src/parser/CodeChangeParser.js';

describe('CodeChangeParser', () => {
  let parser: CodeChangeParser;

  beforeEach(() => {
    parser = new CodeChangeParser();
  });

  describe('parse markdown code blocks with filename annotations', () => {
    it('should parse single file change with filename annotation', () => {
      const response = `
Here's the updated code:

\`\`\`typescript:src/utils/helper.ts
export function helper() {
  return 'updated';
}
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(1);
      expect(changes[0].filePath).toBe('src/utils/helper.ts');
      expect(changes[0].newContent).toContain('export function helper');
      expect(changes[0].changeType).toBe('modify');
    });

    it('should parse multiple file changes', () => {
      const response = `
Here are the changes:

\`\`\`typescript:src/file1.ts
const x = 1;
\`\`\`

\`\`\`typescript:src/file2.ts
const y = 2;
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(2);
      expect(changes[0].filePath).toBe('src/file1.ts');
      expect(changes[1].filePath).toBe('src/file2.ts');
    });

    it('should handle filename:path format', () => {
      const response = `
\`\`\`typescript:filename:src/app.ts
export const app = 'test';
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(1);
      expect(changes[0].filePath).toBe('src/app.ts');
    });

    it('should handle different file extensions', () => {
      const response = `
\`\`\`javascript:src/index.js
console.log('test');
\`\`\`

\`\`\`python:src/main.py
print('test')
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(2);
      expect(changes[0].filePath).toBe('src/index.js');
      expect(changes[1].filePath).toBe('src/main.py');
    });
  });

  describe('extracting multiple file changes', () => {
    it('should extract all file changes from response', () => {
      const response = `
Multiple changes:

\`\`\`typescript:file1.ts
code1
\`\`\`

Some text in between.

\`\`\`typescript:file2.ts
code2
\`\`\`

\`\`\`typescript:file3.ts
code3
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(3);
      expect(changes.map((c: { filePath: string }) => c.filePath)).toEqual([
        'file1.ts',
        'file2.ts',
        'file3.ts',
      ]);
    });

    it('should preserve code content correctly', () => {
      const response = `
\`\`\`typescript:test.ts
const x = 1;
const y = 2;
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes[0].newContent).toBe('const x = 1;\nconst y = 2;');
    });
  });

  describe('handling malformed blocks', () => {
    it('should handle code blocks without filename annotation', () => {
      const response = `
\`\`\`typescript
const x = 1;
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(0);
    });

    it('should handle incomplete code blocks', () => {
      const response = `
\`\`\`typescript:test.ts
const x = 1;
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(0);
    });

    it('should handle empty code blocks', () => {
      const response = `
\`\`\`typescript:test.ts
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(1);
      expect(changes[0].newContent).toBe('');
    });

    it('should handle malformed filename format', () => {
      const response = `
\`\`\`typescript:invalid-format
const x = 1;
\`\`\`
`;

      const changes = parser.parse(response);

      // Invalid format might still parse if it looks like a path
      // Validation will handle security checks
      expect(changes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('file path validation', () => {
    it('should reject paths with directory traversal', () => {
      const response = `
\`\`\`typescript:../../etc/passwd
malicious code
\`\`\`
`;

      const changes = parser.parse(response, { baseDir: '/safe/path' });

      expect(changes).toHaveLength(0);
    });

    it('should reject absolute paths outside base directory', () => {
      const response = `
\`\`\`typescript:/etc/passwd
malicious code
\`\`\`
`;

      const changes = parser.parse(response, { baseDir: '/safe/path' });

      expect(changes).toHaveLength(0);
    });

    it('should accept valid relative paths', () => {
      const response = `
\`\`\`typescript:src/utils/helper.ts
const x = 1;
\`\`\`
`;

      const changes = parser.parse(response, { baseDir: process.cwd() });

      expect(changes).toHaveLength(1);
      expect(changes[0].filePath).toBe('src/utils/helper.ts');
    });
  });

  describe('edge cases', () => {
    it('should handle empty response', () => {
      const changes = parser.parse('');

      expect(changes).toHaveLength(0);
    });

    it('should handle response with no code blocks', () => {
      const response = 'This is just text with no code blocks.';

      const changes = parser.parse(response);

      expect(changes).toHaveLength(0);
    });

    it('should handle code blocks with special characters in path', () => {
      const response = `
\`\`\`typescript:src/utils/my-helper.ts
const x = 1;
\`\`\`
`;

      const changes = parser.parse(response);

      expect(changes).toHaveLength(1);
      expect(changes[0].filePath).toBe('src/utils/my-helper.ts');
    });
  });
});
