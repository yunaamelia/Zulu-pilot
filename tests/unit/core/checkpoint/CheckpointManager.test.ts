import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CheckpointManager } from '../../../../packages/core/src/checkpoint/CheckpointManager.js';
import { createConversationCheckpoint } from '../../../../packages/core/src/checkpoint/ConversationCheckpoint.js';
import type { ConversationCheckpoint } from '../../../../packages/core/src/checkpoint/ConversationCheckpoint.js';

describe('T167/T181: CheckpointManager', () => {
  let manager: CheckpointManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-checkpoint-'));
    manager = new CheckpointManager({ checkpointDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('saveCheckpoint', () => {
    it('should save checkpoint to disk', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'test-1',
        name: 'Test Checkpoint',
        history: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      });

      await manager.saveCheckpoint(checkpoint);

      const filePath = path.join(tempDir, 'test-1.json');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const data = await fs.readFile(filePath, 'utf-8');
      const loaded = JSON.parse(data) as ConversationCheckpoint;
      expect(loaded.id).toBe('test-1');
      expect(loaded.name).toBe('Test Checkpoint');
    });

    it('should create checkpoint directory if it does not exist', async () => {
      const newDir = path.join(tempDir, 'new-checkpoints');
      const newManager = new CheckpointManager({ checkpointDir: newDir });

      const checkpoint = createConversationCheckpoint({
        id: 'test-2',
        name: 'Test',
        history: [],
      });

      await newManager.saveCheckpoint(checkpoint);

      const exists = await fs.access(newDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should save checkpoint with all fields', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'test-3',
        name: 'Full Checkpoint',
        description: 'Description',
        history: [
          { role: 'user', parts: [{ text: 'Question' }] },
          { role: 'model', parts: [{ text: 'Answer' }] },
        ],
        context: {
          files: ['file1.ts'],
          metadata: { key: 'value' },
        },
        provider: {
          providerName: 'gemini',
          modelName: 'gemini-pro',
        },
        workspaceRoot: '/workspace',
      });

      await manager.saveCheckpoint(checkpoint);

      const loaded = await manager.loadCheckpoint('test-3');
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.name).toBe('Full Checkpoint');
        expect(loaded.description).toBe('Description');
        expect(loaded.history.length).toBe(2);
        expect(loaded.context?.files).toEqual(['file1.ts']);
        expect(loaded.provider?.providerName).toBe('gemini');
      }
    });
  });

  describe('loadCheckpoint', () => {
    it('should load checkpoint from disk', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'test-4',
        name: 'Load Test',
        history: [{ role: 'user', parts: [{ text: 'Test' }] }],
      });

      await manager.saveCheckpoint(checkpoint);

      const loaded = await manager.loadCheckpoint('test-4');
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.id).toBe('test-4');
        expect(loaded.name).toBe('Load Test');
        expect(loaded.history.length).toBe(1);
      }
    });

    it('should return null for non-existent checkpoint', async () => {
      const loaded = await manager.loadCheckpoint('non-existent');
      expect(loaded).toBeNull();
    });

    it('should update lastAccessedAt when loading', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'test-5',
        name: 'Access Test',
        history: [],
      });

      await manager.saveCheckpoint(checkpoint);
      const originalAccessed = checkpoint.lastAccessedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const loaded = await manager.loadCheckpoint('test-5');
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.lastAccessedAt).not.toBe(originalAccessed);
        expect(new Date(loaded.lastAccessedAt!).getTime()).toBeGreaterThan(
          new Date(originalAccessed!).getTime()
        );
      }
    });
  });

  describe('listCheckpoints', () => {
    it('should return empty array when no checkpoints exist', async () => {
      const list = await manager.listCheckpoints();
      expect(list).toEqual([]);
    });

    it('should list all checkpoints', async () => {
      const checkpoint1 = createConversationCheckpoint({
        id: 'test-6',
        name: 'Checkpoint 1',
        history: [],
      });
      const checkpoint2 = createConversationCheckpoint({
        id: 'test-7',
        name: 'Checkpoint 2',
        history: [],
      });

      await manager.saveCheckpoint(checkpoint1);
      await manager.saveCheckpoint(checkpoint2);

      const list = await manager.listCheckpoints();
      expect(list.length).toBe(2);
      expect(list.map((c) => c.id).sort()).toEqual(['test-6', 'test-7'].sort());
    });

    it('should return only metadata, not full checkpoint', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'test-8',
        name: 'Metadata Test',
        description: 'Description',
        history: [{ role: 'user', parts: [{ text: 'Test' }] }],
      });

      await manager.saveCheckpoint(checkpoint);

      const list = await manager.listCheckpoints();
      expect(list.length).toBe(1);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('name');
      expect(list[0]).toHaveProperty('createdAt');
      expect(list[0]).not.toHaveProperty('history');
    });

    it('should sort checkpoints by lastAccessedAt (most recent first)', async () => {
      const checkpoint1 = createConversationCheckpoint({
        id: 'test-9',
        name: 'Old Checkpoint',
        history: [],
      });
      await manager.saveCheckpoint(checkpoint1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const checkpoint2 = createConversationCheckpoint({
        id: 'test-10',
        name: 'New Checkpoint',
        history: [],
      });
      await manager.saveCheckpoint(checkpoint2);

      // Load checkpoint1 to update its lastAccessedAt
      await manager.loadCheckpoint('test-9');

      const list = await manager.listCheckpoints();
      expect(list.length).toBe(2);
      expect(list[0].id).toBe('test-9'); // Most recently accessed
      expect(list[1].id).toBe('test-10');
    });

    it('should skip invalid checkpoint files', async () => {
      // Create a valid checkpoint
      const validCheckpoint = createConversationCheckpoint({
        id: 'test-11',
        name: 'Valid',
        history: [],
      });
      await manager.saveCheckpoint(validCheckpoint);

      // Create an invalid JSON file
      const invalidPath = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidPath, 'invalid json{', 'utf-8');

      const list = await manager.listCheckpoints();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('test-11');
    });
  });

  describe('deleteCheckpoint', () => {
    it('should delete checkpoint from disk', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'test-12',
        name: 'Delete Test',
        history: [],
      });

      await manager.saveCheckpoint(checkpoint);

      const deleted = await manager.deleteCheckpoint('test-12');
      expect(deleted).toBe(true);

      const loaded = await manager.loadCheckpoint('test-12');
      expect(loaded).toBeNull();
    });

    it('should return false for non-existent checkpoint', async () => {
      const deleted = await manager.deleteCheckpoint('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('getCheckpointDir', () => {
    it('should return checkpoint directory path', () => {
      const dir = manager.getCheckpointDir();
      expect(dir).toBe(tempDir);
    });

    it('should use default directory when not specified', () => {
      const defaultManager = new CheckpointManager();
      const dir = defaultManager.getCheckpointDir();
      expect(dir).toContain('.zulu-pilot');
      expect(dir).toContain('checkpoints');
    });
  });
});

