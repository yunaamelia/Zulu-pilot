import { describe, it, expect } from '@jest/globals';
import type { ConversationCheckpoint } from '../../../../packages/core/src/checkpoint/ConversationCheckpoint.js';
import { createConversationCheckpoint } from '../../../../packages/core/src/checkpoint/ConversationCheckpoint.js';

describe('T166: ConversationCheckpoint Entity', () => {
  describe('interface', () => {
    it('should define ConversationCheckpoint with required fields', () => {
      const checkpoint: ConversationCheckpoint = {
        id: 'test-id',
        name: 'Test Checkpoint',
        createdAt: '2024-01-01T00:00:00.000Z',
        history: [],
      };

      expect(checkpoint.id).toBe('test-id');
      expect(checkpoint.name).toBe('Test Checkpoint');
      expect(checkpoint.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(checkpoint.history).toEqual([]);
    });

    it('should support optional fields', () => {
      const checkpoint: ConversationCheckpoint = {
        id: 'test-id',
        name: 'Test Checkpoint',
        description: 'Test description',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastAccessedAt: '2024-01-02T00:00:00.000Z',
        history: [],
        context: {
          files: ['file1.ts', 'file2.ts'],
          metadata: { key: 'value' },
        },
        provider: {
          providerName: 'gemini',
          modelName: 'gemini-pro',
        },
        workspaceRoot: '/path/to/workspace',
      };

      expect(checkpoint.description).toBe('Test description');
      expect(checkpoint.lastAccessedAt).toBe('2024-01-02T00:00:00.000Z');
      expect(checkpoint.context?.files).toEqual(['file1.ts', 'file2.ts']);
      expect(checkpoint.provider?.providerName).toBe('gemini');
      expect(checkpoint.workspaceRoot).toBe('/path/to/workspace');
    });
  });

  describe('createConversationCheckpoint', () => {
    it('should create checkpoint with all required fields', () => {
      const checkpoint = createConversationCheckpoint({
        name: 'My Checkpoint',
        history: [],
      });

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.name).toBe('My Checkpoint');
      expect(checkpoint.createdAt).toBeDefined();
      expect(checkpoint.lastAccessedAt).toBeDefined();
      expect(checkpoint.history).toEqual([]);
      expect(checkpoint.workspaceRoot).toBe(process.cwd());
    });

    it('should generate unique IDs when not provided', () => {
      const checkpoint1 = createConversationCheckpoint({
        name: 'Checkpoint 1',
        history: [],
      });
      const checkpoint2 = createConversationCheckpoint({
        name: 'Checkpoint 2',
        history: [],
      });

      expect(checkpoint1.id).not.toBe(checkpoint2.id);
      expect(checkpoint1.id).toMatch(/^checkpoint-/);
      expect(checkpoint2.id).toMatch(/^checkpoint-/);
    });

    it('should use provided ID when specified', () => {
      const checkpoint = createConversationCheckpoint({
        id: 'custom-id',
        name: 'Custom Checkpoint',
        history: [],
      });

      expect(checkpoint.id).toBe('custom-id');
    });

    it('should include conversation history', () => {
      const history = [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi there!' }] },
      ];

      const checkpoint = createConversationCheckpoint({
        name: 'Checkpoint with History',
        history,
      });

      expect(checkpoint.history).toEqual(history);
      expect(checkpoint.history.length).toBe(2);
    });

    it('should include context information', () => {
      const checkpoint = createConversationCheckpoint({
        name: 'Checkpoint with Context',
        history: [],
        context: {
          files: ['src/main.ts', 'src/utils.ts'],
          metadata: { project: 'test-project' },
        },
      });

      expect(checkpoint.context?.files).toEqual(['src/main.ts', 'src/utils.ts']);
      expect(checkpoint.context?.metadata).toEqual({ project: 'test-project' });
    });

    it('should include provider information', () => {
      const checkpoint = createConversationCheckpoint({
        name: 'Checkpoint with Provider',
        history: [],
        provider: {
          providerName: 'ollama',
          modelName: 'qwen2.5-coder',
        },
      });

      expect(checkpoint.provider?.providerName).toBe('ollama');
      expect(checkpoint.provider?.modelName).toBe('qwen2.5-coder');
    });

    it('should use custom workspace root when provided', () => {
      const customRoot = '/custom/workspace';
      const checkpoint = createConversationCheckpoint({
        name: 'Checkpoint',
        history: [],
        workspaceRoot: customRoot,
      });

      expect(checkpoint.workspaceRoot).toBe(customRoot);
    });

    it('should set timestamps correctly', () => {
      const before = new Date().toISOString();
      const checkpoint = createConversationCheckpoint({
        name: 'Checkpoint',
        history: [],
      });
      const after = new Date().toISOString();

      expect(checkpoint.createdAt).toBeDefined();
      expect(checkpoint.lastAccessedAt).toBeDefined();
      expect(checkpoint.createdAt).toBe(checkpoint.lastAccessedAt);
      expect(checkpoint.createdAt >= before).toBe(true);
      expect(checkpoint.createdAt <= after).toBe(true);
    });
  });
});

