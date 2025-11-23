import fs from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
import type { ConversationCheckpoint } from './ConversationCheckpoint.js';

/**
 * Configuration for CheckpointManager.
 */
export interface CheckpointManagerConfig {
  checkpointDir?: string;
}

/**
 * Manages conversation checkpoints: save, load, list, and delete.
 */
export class CheckpointManager {
  private readonly checkpointDir: string;

  constructor(config: CheckpointManagerConfig = {}) {
    this.checkpointDir =
      config.checkpointDir ?? path.join(homedir(), '.zulu-pilot', 'checkpoints');
  }

  /**
   * Ensure checkpoint directory exists.
   */
  private async ensureCheckpointDir(): Promise<void> {
    await fs.mkdir(this.checkpointDir, { recursive: true });
  }

  /**
   * Get file path for a checkpoint.
   *
   * @param checkpointId - Checkpoint ID
   * @returns File path
   */
  private getCheckpointPath(checkpointId: string): string {
    return path.join(this.checkpointDir, `${checkpointId}.json`);
  }

  /**
   * Save a conversation checkpoint to disk.
   *
   * @param checkpoint - Checkpoint to save
   * @returns Promise resolving when checkpoint is saved
   */
  async saveCheckpoint(checkpoint: ConversationCheckpoint): Promise<void> {
    await this.ensureCheckpointDir();

    const filePath = this.getCheckpointPath(checkpoint.id);
    const data = JSON.stringify(checkpoint, null, 2);

    // Atomic write: write to temp file first, then rename
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, data, 'utf-8');
    await fs.rename(tempPath, filePath);
  }

  /**
   * Load a conversation checkpoint from disk.
   *
   * @param checkpointId - ID of checkpoint to load
   * @returns Promise resolving to checkpoint or null if not found
   */
  async loadCheckpoint(checkpointId: string): Promise<ConversationCheckpoint | null> {
    try {
      const filePath = this.getCheckpointPath(checkpointId);
      const data = await fs.readFile(filePath, 'utf-8');
      const checkpoint = JSON.parse(data) as ConversationCheckpoint;

      // Update last accessed timestamp
      checkpoint.lastAccessedAt = new Date().toISOString();
      await this.saveCheckpoint(checkpoint);

      return checkpoint;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all available checkpoints.
   *
   * @returns Promise resolving to array of checkpoint metadata
   */
  async listCheckpoints(): Promise<Array<Pick<ConversationCheckpoint, 'id' | 'name' | 'description' | 'createdAt' | 'lastAccessedAt'>>> {
    await this.ensureCheckpointDir();

    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpointFiles = files.filter((f) => f.endsWith('.json'));

      const checkpoints: Array<Pick<ConversationCheckpoint, 'id' | 'name' | 'description' | 'createdAt' | 'lastAccessedAt'>> = [];

      for (const file of checkpointFiles) {
        try {
          const filePath = path.join(this.checkpointDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const checkpoint = JSON.parse(data) as ConversationCheckpoint;

          checkpoints.push({
            id: checkpoint.id,
            name: checkpoint.name,
            description: checkpoint.description,
            createdAt: checkpoint.createdAt,
            lastAccessedAt: checkpoint.lastAccessedAt,
          });
        } catch {
          // Skip invalid checkpoint files
          continue;
        }
      }

      // Sort by last accessed (most recent first), then by created date
      checkpoints.sort((a, b) => {
        const aTime = a.lastAccessedAt ?? a.createdAt;
        const bTime = b.lastAccessedAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return checkpoints;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Delete a checkpoint.
   *
   * @param checkpointId - ID of checkpoint to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteCheckpoint(checkpointId: string): Promise<boolean> {
    try {
      const filePath = this.getCheckpointPath(checkpointId);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get checkpoint directory path.
   *
   * @returns Checkpoint directory path
   */
  getCheckpointDir(): string {
    return this.checkpointDir;
  }
}

