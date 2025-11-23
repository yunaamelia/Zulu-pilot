import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CheckpointManager } from '../../../packages/core/src/checkpoint/CheckpointManager.js';
import { createConversationCheckpoint } from '../../../packages/core/src/checkpoint/ConversationCheckpoint.js';

/**
 * T169: Integration test for checkpoint resume
 */
describe('T169: Checkpoint Resume Integration', () => {
  let manager: CheckpointManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-checkpoint-resume-'));
    manager = new CheckpointManager({ checkpointDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load checkpoint and restore conversation history', async () => {
    const originalHistory = [
      { role: 'user', parts: [{ text: 'Question 1' }] },
      { role: 'model', parts: [{ text: 'Answer 1' }] },
      { role: 'user', parts: [{ text: 'Question 2' }] },
      { role: 'model', parts: [{ text: 'Answer 2' }] },
    ];

    const checkpoint = createConversationCheckpoint({
      id: 'resume-1',
      name: 'Resume Test',
      history: originalHistory,
    });

    await manager.saveCheckpoint(checkpoint);

    // Simulate resume: load checkpoint
    const loaded = await manager.loadCheckpoint('resume-1');
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.history.length).toBe(originalHistory.length);
      expect(loaded.history).toEqual(originalHistory);
    }
  });

  it('should restore context information when resuming', async () => {
    const checkpoint = createConversationCheckpoint({
      id: 'resume-2',
      name: 'Context Resume',
      history: [],
      context: {
        files: ['file1.ts', 'file2.ts'],
        metadata: { key: 'value' },
      },
    });

    await manager.saveCheckpoint(checkpoint);

    const loaded = await manager.loadCheckpoint('resume-2');
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.context?.files).toEqual(['file1.ts', 'file2.ts']);
      expect(loaded.context?.metadata).toEqual({ key: 'value' });
    }
  });

  it('should restore provider information when resuming', async () => {
    const checkpoint = createConversationCheckpoint({
      id: 'resume-3',
      name: 'Provider Resume',
      history: [],
      provider: {
        providerName: 'gemini',
        modelName: 'gemini-pro',
      },
    });

    await manager.saveCheckpoint(checkpoint);

    const loaded = await manager.loadCheckpoint('resume-3');
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.provider?.providerName).toBe('gemini');
      expect(loaded.provider?.modelName).toBe('gemini-pro');
    }
  });

  it('should update lastAccessedAt when resuming', async () => {
    const checkpoint = createConversationCheckpoint({
      id: 'resume-4',
      name: 'Access Time Test',
      history: [],
    });

    await manager.saveCheckpoint(checkpoint);
    const originalAccessed = checkpoint.lastAccessedAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    const loaded = await manager.loadCheckpoint('resume-4');
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.lastAccessedAt).not.toBe(originalAccessed);
      expect(new Date(loaded.lastAccessedAt!).getTime()).toBeGreaterThan(
        new Date(originalAccessed!).getTime()
      );
    }
  });

  it('should handle resume with empty history', async () => {
    const checkpoint = createConversationCheckpoint({
      id: 'resume-5',
      name: 'Empty History',
      history: [],
    });

    await manager.saveCheckpoint(checkpoint);

    const loaded = await manager.loadCheckpoint('resume-5');
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.history).toEqual([]);
    }
  });

  it('should handle resume with large conversation history', async () => {
    const largeHistory = Array.from({ length: 100 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('model' as const),
      parts: [{ text: `Message ${i}` }],
    }));

    const checkpoint = createConversationCheckpoint({
      id: 'resume-6',
      name: 'Large History',
      history: largeHistory,
    });

    await manager.saveCheckpoint(checkpoint);

    const loaded = await manager.loadCheckpoint('resume-6');
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.history.length).toBe(100);
      expect(loaded.history[0].parts[0].text).toBe('Message 0');
      expect(loaded.history[99].parts[0].text).toBe('Message 99');
    }
  });
});

