import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CheckpointManager } from '../../../../packages/core/src/checkpoint/CheckpointManager.js';
import { createConversationCheckpoint } from '../../../../packages/core/src/checkpoint/ConversationCheckpoint.js';

/**
 * T182: Unit tests for CheckpointCommand
 */
describe('T182: CheckpointCommand', () => {
  let manager: CheckpointManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-checkpoint-cmd-'));
    manager = new CheckpointManager({ checkpointDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('save command', () => {
    it('should save checkpoint with name', async () => {
      const checkpoint = createConversationCheckpoint({
        name: 'Test Save',
        history: [],
      });

      await manager.saveCheckpoint(checkpoint);

      const loaded = await manager.loadCheckpoint(checkpoint.id);
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.name).toBe('Test Save');
      }
    });

    it('should save checkpoint with description', async () => {
      const checkpoint = createConversationCheckpoint({
        name: 'Test Save',
        description: 'Test description',
        history: [],
      });

      await manager.saveCheckpoint(checkpoint);

      const loaded = await manager.loadCheckpoint(checkpoint.id);
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.description).toBe('Test description');
      }
    });
  });

  describe('list command', () => {
    it('should list all checkpoints', async () => {
      const checkpoint1 = createConversationCheckpoint({
        id: 'cmd-1',
        name: 'Checkpoint 1',
        history: [],
      });
      const checkpoint2 = createConversationCheckpoint({
        id: 'cmd-2',
        name: 'Checkpoint 2',
        history: [],
      });

      await manager.saveCheckpoint(checkpoint1);
      await manager.saveCheckpoint(checkpoint2);

      const list = await manager.listCheckpoints();
      expect(list.length).toBe(2);
      expect(list.map((c) => c.name).sort()).toEqual(['Checkpoint 1', 'Checkpoint 2'].sort());
    });

    it('should return empty list when no checkpoints exist', async () => {
      const list = await manager.listCheckpoints();
      expect(list).toEqual([]);
    });
  });

  describe('load command', () => {
    it('should load checkpoint by ID', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'cmd-load',
        name: 'Load Test',
        history: [{ role: 'user', parts: [{ text: 'Test' }] }],
      });

      await manager.saveCheckpoint(checkpoint);

      const loaded = await manager.loadCheckpoint('cmd-load');
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.name).toBe('Load Test');
        expect(loaded.history.length).toBe(1);
      }
    });

    it('should return null for non-existent checkpoint', async () => {
      const loaded = await manager.loadCheckpoint('non-existent');
      expect(loaded).toBeNull();
    });
  });

  describe('delete command', () => {
    it('should delete checkpoint by ID', async () => {
      const checkpoint = createConversationCheckpoint({
        id: 'cmd-delete',
        name: 'Delete Test',
        history: [],
      });

      await manager.saveCheckpoint(checkpoint);

      const deleted = await manager.deleteCheckpoint('cmd-delete');
      expect(deleted).toBe(true);

      const loaded = await manager.loadCheckpoint('cmd-delete');
      expect(loaded).toBeNull();
    });

    it('should return false for non-existent checkpoint', async () => {
      const deleted = await manager.deleteCheckpoint('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('command integration', () => {
    it('should support full CRUD workflow', async () => {
      // Create
      const checkpoint = createConversationCheckpoint({
        id: 'cmd-crud',
        name: 'CRUD Test',
        description: 'Full workflow test',
        history: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      });
      await manager.saveCheckpoint(checkpoint);

      // Read
      const loaded = await manager.loadCheckpoint('cmd-crud');
      expect(loaded).not.toBeNull();

      // List
      const list = await manager.listCheckpoints();
      expect(list.some((c) => c.id === 'cmd-crud')).toBe(true);

      // Delete
      const deleted = await manager.deleteCheckpoint('cmd-crud');
      expect(deleted).toBe(true);

      // Verify deleted
      const afterDelete = await manager.loadCheckpoint('cmd-crud');
      expect(afterDelete).toBeNull();
    });
  });
});

