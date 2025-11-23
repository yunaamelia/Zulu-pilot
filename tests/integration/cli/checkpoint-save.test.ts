import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CheckpointManager } from '../../../packages/core/src/checkpoint/CheckpointManager.js';
import { createConversationCheckpoint } from '../../../packages/core/src/checkpoint/ConversationCheckpoint.js';

/**
 * T168: Integration test for checkpoint save
 */
describe('T168: Checkpoint Save Integration', () => {
  let manager: CheckpointManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-checkpoint-save-'));
    manager = new CheckpointManager({ checkpointDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should save checkpoint with conversation history', async () => {
    const history = [
      { role: 'user', parts: [{ text: 'What is TypeScript?' }] },
      { role: 'model', parts: [{ text: 'TypeScript is a typed superset of JavaScript.' }] },
      { role: 'user', parts: [{ text: 'How do I use it?' }] },
      { role: 'model', parts: [{ text: 'You can use TypeScript by installing it and compiling to JavaScript.' }] },
    ];

    const checkpoint = createConversationCheckpoint({
      name: 'TypeScript Discussion',
      description: 'Conversation about TypeScript',
      history,
      workspaceRoot: tempDir,
    });

    await manager.saveCheckpoint(checkpoint);

    const loaded = await manager.loadCheckpoint(checkpoint.id);
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.history.length).toBe(4);
      expect(loaded.history[0].role).toBe('user');
      expect(loaded.history[1].role).toBe('model');
    }
  });

  it('should save checkpoint with context information', async () => {
    const checkpoint = createConversationCheckpoint({
      name: 'Project Discussion',
      history: [],
      context: {
        files: ['src/main.ts', 'src/utils.ts', 'package.json'],
        metadata: {
          project: 'test-project',
          language: 'typescript',
        },
      },
      workspaceRoot: tempDir,
    });

    await manager.saveCheckpoint(checkpoint);

    const loaded = await manager.loadCheckpoint(checkpoint.id);
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.context?.files).toEqual(['src/main.ts', 'src/utils.ts', 'package.json']);
      expect(loaded.context?.metadata).toEqual({
        project: 'test-project',
        language: 'typescript',
      });
    }
  });

  it('should save checkpoint with provider information', async () => {
    const checkpoint = createConversationCheckpoint({
      name: 'Provider Test',
      history: [],
      provider: {
        providerName: 'ollama',
        modelName: 'qwen2.5-coder',
      },
    });

    await manager.saveCheckpoint(checkpoint);

    const loaded = await manager.loadCheckpoint(checkpoint.id);
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.provider?.providerName).toBe('ollama');
      expect(loaded.provider?.modelName).toBe('qwen2.5-coder');
    }
  });

  it('should persist checkpoint across manager instances', async () => {
    const checkpoint = createConversationCheckpoint({
      id: 'persist-test',
      name: 'Persistence Test',
      history: [{ role: 'user', parts: [{ text: 'Test' }] }],
    });

    await manager.saveCheckpoint(checkpoint);

    // Create new manager instance pointing to same directory
    const newManager = new CheckpointManager({ checkpointDir: tempDir });
    const loaded = await newManager.loadCheckpoint('persist-test');

    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.name).toBe('Persistence Test');
      expect(loaded.history.length).toBe(1);
    }
  });

  it('should handle multiple checkpoints', async () => {
    const checkpoint1 = createConversationCheckpoint({
      id: 'multi-1',
      name: 'Checkpoint 1',
      history: [],
    });
    const checkpoint2 = createConversationCheckpoint({
      id: 'multi-2',
      name: 'Checkpoint 2',
      history: [],
    });
    const checkpoint3 = createConversationCheckpoint({
      id: 'multi-3',
      name: 'Checkpoint 3',
      history: [],
    });

    await manager.saveCheckpoint(checkpoint1);
    await manager.saveCheckpoint(checkpoint2);
    await manager.saveCheckpoint(checkpoint3);

    const list = await manager.listCheckpoints();
    expect(list.length).toBe(3);
    expect(list.map((c) => c.id).sort()).toEqual(['multi-1', 'multi-2', 'multi-3'].sort());
  });
});

