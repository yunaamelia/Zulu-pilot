import type { CodeChangeProposal } from '../../../packages/core/src/parser/CodeChangeProposal.js';
import { CodeChangeParser } from '../../../packages/core/src/parser/CodeChangeParser.js';
import { FilePatcher } from '../../../packages/core/src/parser/FilePatcher.js';
import { DiffDisplay } from '../ui/DiffDisplay.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Handles code change proposal and approval workflow.
 */
export class CodeChangeApproval {
  private readonly parser: CodeChangeParser;
  private readonly patcher: FilePatcher;
  private readonly diffDisplay: DiffDisplay;
  private readonly rl: readline.Interface;

  constructor(baseDir: string = process.cwd()) {
    this.parser = new CodeChangeParser({ baseDir });
    this.patcher = new FilePatcher({ baseDir });
    this.diffDisplay = new DiffDisplay(baseDir);
    this.rl = readline.createInterface({ input, output });
  }

  /**
   * Process AI response and extract code changes.
   *
   * @param aiResponse - AI response text
   * @returns Array of code change proposals
   */
  extractChanges(aiResponse: string): CodeChangeProposal[] {
    return this.parser.parse(aiResponse);
  }

  /**
   * Display code changes and get user approval/rejection.
   *
   * @param changes - Code changes to review
   * @returns Promise resolving to approved changes
   */
  async reviewChanges(changes: CodeChangeProposal[]): Promise<CodeChangeProposal[]> {
    if (changes.length === 0) {
      return [];
    }

    // Load original content for all changes
    await this.loadOriginalContent(changes);

    // Display summary
    console.log(this.diffDisplay.displaySummary(changes));

    // Display all diffs
    console.log('\n' + this.diffDisplay.displayChanges(changes));

    // Ask for approval
    const approved: CodeChangeProposal[] = [];

    if (changes.length === 1) {
      // Single change - simple approve/reject
      const answer = await this.rl.question(
        '\n❓ Apply this change? (yes/no/all/none): '
      );
      const normalized = answer.toLowerCase().trim();

      if (normalized === 'yes' || normalized === 'y' || normalized === 'all' || normalized === 'a') {
        approved.push(...changes);
      }
    } else {
      // Multiple changes - can approve individually
      for (const change of changes) {
        console.log(`\n📝 Reviewing: ${change.filePath}`);
        console.log(this.diffDisplay.displayChange(change));

        const answer = await this.rl.question(
          `\n❓ Apply this change? (yes/no/all/none): `
        );
        const normalized = answer.toLowerCase().trim();

        if (normalized === 'yes' || normalized === 'y') {
          approved.push(change);
        } else if (normalized === 'all' || normalized === 'a') {
          // Approve this and all remaining
          approved.push(change, ...changes.slice(changes.indexOf(change) + 1));
          break;
        } else if (normalized === 'none' || normalized === 'n' && changes.indexOf(change) === 0) {
          // Reject all if "none" on first change
          break;
        }
        // "no" or "n" - skip this change
      }
    }

    return approved;
  }

  /**
   * Apply approved code changes.
   *
   * @param changes - Approved code changes to apply
   */
  async applyChanges(changes: CodeChangeProposal[]): Promise<void> {
    for (const change of changes) {
      try {
        await this.patcher.applyChange(change);
        console.log(`✅ Applied change to: ${change.filePath}`);
      } catch (error) {
        console.error(`❌ Failed to apply change to ${change.filePath}:`, error);
        throw error;
      }
    }
  }

  /**
   * Complete workflow: extract -> review -> apply.
   *
   * @param aiResponse - AI response text
   * @returns Promise resolving when workflow completes
   */
  async processCodeChanges(aiResponse: string): Promise<void> {
    // Extract changes
    const changes = this.extractChanges(aiResponse);

    if (changes.length === 0) {
      console.log('ℹ️  No code changes detected in AI response.');
      return;
    }

    // Review and get approval
    const approved = await this.reviewChanges(changes);

    if (approved.length === 0) {
      console.log('ℹ️  No changes were approved.');
      return;
    }

    // Apply approved changes
    console.log(`\n🚀 Applying ${approved.length} approved change(s)...`);
    await this.applyChanges(approved);
    console.log('✅ All approved changes have been applied.');
  }

  /**
   * Load original content for code changes.
   *
   * @param changes - Code changes to load content for
   */
  private async loadOriginalContent(changes: CodeChangeProposal[]): Promise<void> {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    for (const change of changes) {
      if (change.originalContent === '') {
        // Try to load from file
        try {
          const absolutePath = path.isAbsolute(change.filePath)
            ? change.filePath
            : path.resolve(process.cwd(), change.filePath);
          change.originalContent = await fs.readFile(absolutePath, 'utf-8');
        } catch {
          // File doesn't exist - it's a new file
          change.originalContent = '';
        }
      }
    }
  }

  /**
   * Close readline interface.
   */
  close(): void {
    this.rl.close();
  }
}

