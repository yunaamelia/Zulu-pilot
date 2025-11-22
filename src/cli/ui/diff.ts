/**
 * Display unified diff with color coding for terminal.
 */
export class DiffDisplay {
  /**
   * Display a unified diff in the terminal.
   * Uses simple formatting (no colors for now, can be enhanced with chalk later).
   *
   * @param diff - Unified diff string
   * @param filePath - File path being changed
   */
  display(diff: string, filePath: string): void {
    console.log(`\n📝 Changes to ${filePath}:`);
    console.log('─'.repeat(60));

    // Split diff into lines and format
    const lines = diff.split('\n');

    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++')) {
        // File headers
        console.log(line);
      } else if (line.startsWith('@@')) {
        // Hunk headers
        console.log(line);
      } else if (line.startsWith('+')) {
        // Additions (green in colored terminals)
        console.log(`\x1b[32m${line}\x1b[0m`);
      } else if (line.startsWith('-')) {
        // Deletions (red in colored terminals)
        console.log(`\x1b[31m${line}\x1b[0m`);
      } else if (line.startsWith('\\')) {
        // No newline indicator
        console.log(line);
      } else {
        // Context lines
        console.log(line);
      }
    }

    console.log('─'.repeat(60));
  }

  /**
   * Display summary of multiple file changes.
   *
   * @param changes - Array of file paths being changed
   */
  displaySummary(changes: string[]): void {
    console.log(`\n📋 Proposed changes to ${changes.length} file(s):`);
    for (const filePath of changes) {
      console.log(`  - ${filePath}`);
    }
  }
}
