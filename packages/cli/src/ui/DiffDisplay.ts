import type { CodeChangeProposal } from '../../../packages/core/src/parser/CodeChangeProposal.js';
import { FilePatcher } from '../../../packages/core/src/parser/FilePatcher.js';

/**
 * Display unified diff for code changes in the CLI.
 */
export class DiffDisplay {
  private readonly patcher: FilePatcher;

  constructor(baseDir: string = process.cwd()) {
    this.patcher = new FilePatcher({ baseDir });
  }

  /**
   * Display a single code change as a unified diff.
   *
   * @param change - Code change to display
   * @returns Formatted diff string
   */
  displayChange(change: CodeChangeProposal): string {
    const diff = this.patcher.generateDiff(change);
    return this.formatDiff(diff, change.filePath);
  }

  /**
   * Display multiple code changes as unified diffs.
   *
   * @param changes - Array of code changes to display
   * @returns Formatted diff string with all changes
   */
  displayChanges(changes: CodeChangeProposal[]): string {
    if (changes.length === 0) {
      return 'No changes to display.';
    }

    const diffs = changes.map((change) => this.displayChange(change));
    return diffs.join('\n\n' + '='.repeat(80) + '\n\n');
  }

  /**
   * Format diff with color coding and file headers.
   *
   * @param diff - Raw unified diff string
   * @param filePath - File path for the change
   * @returns Formatted diff string
   */
  private formatDiff(diff: string, filePath: string): string {
    const lines = diff.split('\n');
    const formatted: string[] = [];

    // Add file header
    formatted.push(`\n📝 File: ${filePath}`);
    formatted.push('─'.repeat(80));

    // Format diff lines with color indicators
    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++')) {
        formatted.push(`  ${line}`);
      } else if (line.startsWith('-')) {
        // Removed line (red)
        formatted.push(`\x1b[31m- ${line.slice(1)}\x1b[0m`);
      } else if (line.startsWith('+')) {
        // Added line (green)
        formatted.push(`\x1b[32m+ ${line.slice(1)}\x1b[0m`);
      } else if (line.startsWith('@@')) {
        // Hunk header
        formatted.push(`  \x1b[36m${line}\x1b[0m`);
      } else {
        // Context line
        formatted.push(`  ${line}`);
      }
    }

    return formatted.join('\n');
  }

  /**
   * Display a summary of changes.
   *
   * @param changes - Array of code changes
   * @returns Summary string
   */
  displaySummary(changes: CodeChangeProposal[]): string {
    if (changes.length === 0) {
      return 'No changes proposed.';
    }

    const summary: string[] = [];
    summary.push('\n📊 Change Summary:');
    summary.push('─'.repeat(80));

    const byType = {
      add: changes.filter((c) => c.changeType === 'add').length,
      modify: changes.filter((c) => c.changeType === 'modify').length,
      delete: changes.filter((c) => c.changeType === 'delete').length,
    };

    summary.push(`  Files to add:    ${byType.add}`);
    summary.push(`  Files to modify: ${byType.modify}`);
    summary.push(`  Files to delete: ${byType.delete}`);
    summary.push(`  Total changes:   ${changes.length}`);

    summary.push('\n📋 Files affected:');
    for (const change of changes) {
      const icon = change.changeType === 'add' ? '➕' : change.changeType === 'delete' ? '➖' : '✏️';
      summary.push(`  ${icon} ${change.filePath}`);
    }

    return summary.join('\n');
  }
}

