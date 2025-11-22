import { describe, it, expect } from '@jest/globals';
import { createCodeChange } from '../../../../src/core/parser/CodeChange.js';

describe('CodeChange', () => {
  describe('createCodeChange', () => {
    it('should create CodeChange with modify type by default', () => {
      const change = createCodeChange('test.ts', 'const x = 1;', 'const x = 2;');

      expect(change).toEqual({
        filePath: 'test.ts',
        originalContent: 'const x = 1;',
        newContent: 'const x = 2;',
        changeType: 'modify',
        diff: '',
        lineNumbers: undefined,
      });
    });

    it('should create CodeChange with add type', () => {
      const change = createCodeChange('new.ts', '', 'const x = 1;', 'add');

      expect(change.changeType).toBe('add');
      expect(change.originalContent).toBe('');
      expect(change.newContent).toBe('const x = 1;');
    });

    it('should create CodeChange with delete type', () => {
      const change = createCodeChange('old.ts', 'const x = 1;', '', 'delete');

      expect(change.changeType).toBe('delete');
      expect(change.originalContent).toBe('const x = 1;');
      expect(change.newContent).toBe('');
    });

    it('should create CodeChange with modify type explicitly', () => {
      const change = createCodeChange('test.ts', 'const x = 1;', 'const x = 2;', 'modify');

      expect(change.changeType).toBe('modify');
    });

    it('should set empty diff initially', () => {
      const change = createCodeChange('test.ts', 'const x = 1;', 'const x = 2;');

      expect(change.diff).toBe('');
    });

    it('should not set lineNumbers by default', () => {
      const change = createCodeChange('test.ts', 'const x = 1;', 'const x = 2;');

      expect(change.lineNumbers).toBeUndefined();
    });

    it('should handle empty file paths', () => {
      const change = createCodeChange('', 'content', 'new content');

      expect(change.filePath).toBe('');
    });

    it('should handle large content', () => {
      const largeContent = 'x'.repeat(10000);
      const change = createCodeChange('large.ts', largeContent, largeContent + '\nnew line');

      expect(change.originalContent).toBe(largeContent);
      expect(change.newContent).toBe(largeContent + '\nnew line');
    });
  });
});

