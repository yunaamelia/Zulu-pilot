import { describe, it, expect } from '@jest/globals';
import type { CodeChangeProposal } from '../../../../packages/core/src/parser/CodeChangeProposal.js';
import {
  createCodeChangeProposal,
  createCodeChange,
} from '../../../../packages/core/src/parser/CodeChangeProposal.js';

describe('CodeChangeProposal', () => {
  describe('interface', () => {
    it('should define CodeChangeProposal interface with required fields', () => {
      const proposal: CodeChangeProposal = {
        filePath: 'test.ts',
        originalContent: 'const x = 1;',
        newContent: 'const x = 2;',
        changeType: 'modify',
        diff: '',
      };

      expect(proposal.filePath).toBe('test.ts');
      expect(proposal.originalContent).toBe('const x = 1;');
      expect(proposal.newContent).toBe('const x = 2;');
      expect(proposal.changeType).toBe('modify');
      expect(proposal.diff).toBe('');
    });

    it('should support optional lineNumbers field', () => {
      const proposal: CodeChangeProposal = {
        filePath: 'test.ts',
        originalContent: 'const x = 1;',
        newContent: 'const x = 2;',
        changeType: 'modify',
        diff: '',
        lineNumbers: {
          start: 1,
          end: 5,
        },
      };

      expect(proposal.lineNumbers).toBeDefined();
      expect(proposal.lineNumbers?.start).toBe(1);
      expect(proposal.lineNumbers?.end).toBe(5);
    });

    it('should support all change types', () => {
      const addProposal: CodeChangeProposal = {
        filePath: 'new.ts',
        originalContent: '',
        newContent: 'const x = 1;',
        changeType: 'add',
        diff: '',
      };

      const modifyProposal: CodeChangeProposal = {
        filePath: 'existing.ts',
        originalContent: 'const x = 1;',
        newContent: 'const x = 2;',
        changeType: 'modify',
        diff: '',
      };

      const deleteProposal: CodeChangeProposal = {
        filePath: 'old.ts',
        originalContent: 'const x = 1;',
        newContent: '',
        changeType: 'delete',
        diff: '',
      };

      expect(addProposal.changeType).toBe('add');
      expect(modifyProposal.changeType).toBe('modify');
      expect(deleteProposal.changeType).toBe('delete');
    });
  });

  describe('createCodeChangeProposal', () => {
    it('should create CodeChangeProposal with all fields', () => {
      const proposal = createCodeChangeProposal(
        'test.ts',
        'const x = 1;',
        'const x = 2;',
        'modify'
      );

      expect(proposal.filePath).toBe('test.ts');
      expect(proposal.originalContent).toBe('const x = 1;');
      expect(proposal.newContent).toBe('const x = 2;');
      expect(proposal.changeType).toBe('modify');
      expect(proposal.diff).toBe('');
      expect(proposal.lineNumbers).toBeUndefined();
    });

    it('should default to modify change type when not specified', () => {
      const proposal = createCodeChangeProposal('test.ts', 'const x = 1;', 'const x = 2;');

      expect(proposal.changeType).toBe('modify');
    });

    it('should create add change type proposal', () => {
      const proposal = createCodeChangeProposal('new.ts', '', 'const x = 1;', 'add');

      expect(proposal.changeType).toBe('add');
      expect(proposal.originalContent).toBe('');
      expect(proposal.newContent).toBe('const x = 1;');
    });

    it('should create delete change type proposal', () => {
      const proposal = createCodeChangeProposal('old.ts', 'const x = 1;', '', 'delete');

      expect(proposal.changeType).toBe('delete');
      expect(proposal.originalContent).toBe('const x = 1;');
      expect(proposal.newContent).toBe('');
    });
  });

  describe('createCodeChange (legacy compatibility)', () => {
    it('should create CodeChangeProposal using legacy function name', () => {
      const proposal = createCodeChange('test.ts', 'const x = 1;', 'const x = 2;', 'modify');

      expect(proposal.filePath).toBe('test.ts');
      expect(proposal.originalContent).toBe('const x = 1;');
      expect(proposal.newContent).toBe('const x = 2;');
      expect(proposal.changeType).toBe('modify');
    });

    it('should have same behavior as createCodeChangeProposal', () => {
      const proposal1 = createCodeChangeProposal('test.ts', 'const x = 1;', 'const x = 2;');
      const proposal2 = createCodeChange('test.ts', 'const x = 1;', 'const x = 2;');

      expect(proposal1).toEqual(proposal2);
    });
  });
});

