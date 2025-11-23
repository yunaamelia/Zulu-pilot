import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CheckpointManager } from '../../../packages/core/src/checkpoint/CheckpointManager.js';
import { createConversationCheckpoint } from '../../../packages/core/src/checkpoint/ConversationCheckpoint.js';

/**
 * T170: E2E test for checkpoint workflow
 *
 * This test simulates the full workflow:
 * 1. Developer has a conversation
 * 2. Developer saves checkpoint
 * 3. Developer exits application
 * 4. Developer resumes from checkpoint
 * 5. All context and history are intact
 */
describe('T170: Checkpoint Workflow E2E', () => {
  let manager: CheckpointManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-e2e-checkpoint-'));
    manager = new CheckpointManager({ checkpointDir: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should complete full workflow: save -> exit -> resume with intact history', async () => {
    // Step 1: Developer has a conversation
    const conversationHistory = [
      { role: 'user', parts: [{ text: 'Hello, can you help me with TypeScript?' }] },
      { role: 'model', parts: [{ text: 'Of course! What would you like to know about TypeScript?' }] },
      { role: 'user', parts: [{ text: 'How do I define types?' }] },
      { role: 'model', parts: [{ text: 'You can define types using interfaces, types, or classes.' }] },
      { role: 'user', parts: [{ text: 'Show me an example' }] },
      {
        role: 'model',
        parts: [
          {
            text: 'Here is an example:\n\n```typescript\ninterface User {\n  name: string;\n  age: number;\n}\n```',
          },
        ],
      },
    ];

    // Step 2: Developer saves checkpoint
    const checkpoint = createConversationCheckpoint({
      name: 'TypeScript Help Session',
      description: 'Conversation about TypeScript types',
      history: conversationHistory,
      context: {
        files: ['src/types.ts', 'src/main.ts'],
        metadata: {
          project: 'typescript-project',
          topic: 'type-definitions',
        },
      },
      provider: {
        providerName: 'gemini',
        modelName: 'gemini-pro',
      },
      workspaceRoot: tempDir,
    });

    await manager.saveCheckpoint(checkpoint);
    const savedId = checkpoint.id;

    // Step 3: Simulate exit (manager instance is "destroyed")
    // In real scenario, application would exit here

    // Step 4: Developer resumes from checkpoint (new session)
    const newManager = new CheckpointManager({ checkpointDir: tempDir });
    const resumed = await newManager.loadCheckpoint(savedId);

    // Step 5: Verify all context and history are intact
    expect(resumed).not.toBeNull();
    if (resumed) {
      // Verify history
      expect(resumed.history.length).toBe(conversationHistory.length);
      expect(resumed.history).toEqual(conversationHistory);

      // Verify context
      expect(resumed.context?.files).toEqual(['src/types.ts', 'src/main.ts']);
      expect(resumed.context?.metadata).toEqual({
        project: 'typescript-project',
        topic: 'type-definitions',
      });

      // Verify provider
      expect(resumed.provider?.providerName).toBe('gemini');
      expect(resumed.provider?.modelName).toBe('gemini-pro');

      // Verify workspace
      expect(resumed.workspaceRoot).toBe(tempDir);

      // Verify metadata
      expect(resumed.name).toBe('TypeScript Help Session');
      expect(resumed.description).toBe('Conversation about TypeScript types');
    }
  });

  it('should handle multiple checkpoints and resume specific one', async () => {
    // Create multiple checkpoints
    const checkpoint1 = createConversationCheckpoint({
      id: 'e2e-1',
      name: 'Session 1',
      history: [{ role: 'user', parts: [{ text: 'Question 1' }] }],
    });

    const checkpoint2 = createConversationCheckpoint({
      id: 'e2e-2',
      name: 'Session 2',
      history: [{ role: 'user', parts: [{ text: 'Question 2' }] }],
    });

    const checkpoint3 = createConversationCheckpoint({
      id: 'e2e-3',
      name: 'Session 3',
      history: [{ role: 'user', parts: [{ text: 'Question 3' }] }],
    });

    await manager.saveCheckpoint(checkpoint1);
    await manager.saveCheckpoint(checkpoint2);
    await manager.saveCheckpoint(checkpoint3);

    // List all checkpoints
    const list = await manager.listCheckpoints();
    expect(list.length).toBe(3);

    // Resume specific checkpoint
    const resumed = await manager.loadCheckpoint('e2e-2');
    expect(resumed).not.toBeNull();
    if (resumed) {
      expect(resumed.name).toBe('Session 2');
      expect(resumed.history[0].parts[0].text).toBe('Question 2');
    }
  });

  it('should maintain checkpoint after application restart simulation', async () => {
    const checkpoint = createConversationCheckpoint({
      name: 'Persistent Session',
      history: [
        { role: 'user', parts: [{ text: 'Initial question' }] },
        { role: 'model', parts: [{ text: 'Initial answer' }] },
      ],
    });

    await manager.saveCheckpoint(checkpoint);
    const checkpointId = checkpoint.id;

    // Simulate application restart: new manager instance
    const restartedManager = new CheckpointManager({ checkpointDir: tempDir });

    // Verify checkpoint still exists
    const list = await restartedManager.listCheckpoints();
    expect(list.some((c) => c.id === checkpointId)).toBe(true);

    // Resume checkpoint
    const resumed = await restartedManager.loadCheckpoint(checkpointId);
    expect(resumed).not.toBeNull();
    if (resumed) {
      expect(resumed.history.length).toBe(2);
      expect(resumed.name).toBe('Persistent Session');
    }
  });

  it('should handle checkpoint deletion and verify it is gone', async () => {
    const checkpoint = createConversationCheckpoint({
      id: 'delete-e2e',
      name: 'To Be Deleted',
      history: [],
    });

    await manager.saveCheckpoint(checkpoint);

    // Verify it exists
    const loaded = await manager.loadCheckpoint('delete-e2e');
    expect(loaded).not.toBeNull();

    // Delete it
    const deleted = await manager.deleteCheckpoint('delete-e2e');
    expect(deleted).toBe(true);

    // Verify it's gone
    const afterDelete = await manager.loadCheckpoint('delete-e2e');
    expect(afterDelete).toBeNull();

    const list = await manager.listCheckpoints();
    expect(list.some((c) => c.id === 'delete-e2e')).toBe(false);
  });
});

