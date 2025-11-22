import fs from 'node:fs/promises';
import path from 'node:path';
import { createPatch } from 'diff';
import type { CodeChange } from './CodeChange.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Configuration for FilePatcher.
 */
export interface FilePatcherConfig {
  baseDir?: string;
  backupDir?: string;
}

/**
 * Handles applying code changes to files with backups and diff generation.
 */
export class FilePatcher {
  private readonly baseDir: string;
  private readonly backupDir: string;

  constructor(config: FilePatcherConfig = {}) {
    this.baseDir = config.baseDir ?? process.cwd();
    this.backupDir = config.backupDir ?? path.join(this.baseDir, '.zulu-pilot-backups');
  }

  /**
   * Generate unified diff for a code change.
   *
   * @param change - Code change to generate diff for
   * @returns Unified diff string
   */
  generateDiff(change: CodeChange): string {
    const filePath = path.relative(this.baseDir, change.filePath);
    const oldHeader = change.changeType === 'add' ? '/dev/null' : `a/${filePath}`;
    const newHeader = change.changeType === 'delete' ? '/dev/null' : `b/${filePath}`;

    const diff = createPatch(
      filePath,
      change.originalContent,
      change.newContent,
      oldHeader,
      newHeader,
      {
        context: 3,
      }
    );

    return diff;
  }

  /**
   * Apply a code change to a file.
   * Creates backup before applying changes.
   *
   * @param change - Code change to apply
   * @throws {ValidationError} If file validation fails
   */
  async applyChange(change: CodeChange): Promise<void> {
    const absolutePath = path.isAbsolute(change.filePath)
      ? change.filePath
      : path.resolve(this.baseDir, change.filePath);

    // Determine actual change type
    let fileExists = false;
    try {
      await fs.access(absolutePath);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    // Determine actual change type
    // If changeType is explicitly 'delete', always delete
    // If changeType is 'modify', file must exist
    // If changeType is 'add' or not specified, infer from file existence
    let actualChangeType: 'add' | 'modify' | 'delete';
    if (change.changeType === 'delete') {
      // For explicit delete, file must exist
      if (!fileExists) {
        throw new ValidationError(`File not found: ${change.filePath}`, 'filePath');
      }
      actualChangeType = 'delete';
    } else if (change.changeType === 'modify') {
      // For explicit modify, file must exist
      if (!fileExists) {
        throw new ValidationError(`File not found: ${change.filePath}`, 'filePath');
      }
      actualChangeType = 'modify';
    } else {
      // 'add' or inferred - check file existence
      actualChangeType = fileExists ? 'modify' : 'add';
    }

    // Load original content if modifying or deleting
    let originalContent = change.originalContent;
    if (actualChangeType === 'modify' || actualChangeType === 'delete') {
      // Load actual file content (ignore provided originalContent for safety)
      originalContent = await fs.readFile(absolutePath, 'utf-8');
    }

    // Create backup for modify operations
    if (actualChangeType === 'modify') {
      await this.createBackup(absolutePath, originalContent);
    }

    // Apply change
    if (actualChangeType === 'delete') {
      await fs.unlink(absolutePath);
    } else if (actualChangeType === 'add' || actualChangeType === 'modify') {
      // Ensure directory exists
      const dir = path.dirname(absolutePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(absolutePath, change.newContent, 'utf-8');
    }
  }

  /**
   * Create a timestamped backup of a file.
   *
   * @param filePath - File to backup
   * @param content - File content to backup
   */
  private async createBackup(filePath: string, content: string): Promise<void> {
    // Ensure backup directory exists
    await fs.mkdir(this.backupDir, { recursive: true });

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupFileName = `${timestamp}-${fileName}`;
    const backupPath = path.join(this.backupDir, backupFileName);

    // Write backup
    await fs.writeFile(backupPath, content, 'utf-8');
  }
}
