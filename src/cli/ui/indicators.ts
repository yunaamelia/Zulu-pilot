/**
 * Loading indicators for operations that take > 500ms.
 * Distinct from spinner - shows progress for longer operations.
 */

/**
 * Show a loading indicator for file operations.
 *
 * @param operation - Operation description
 * @param fileCount - Number of files being processed
 */
export function showFileLoadingIndicator(operation: string, fileCount: number): void {
  if (fileCount > 0) {
    process.stdout.write(`${operation} ${fileCount} file${fileCount > 1 ? 's' : ''}...\n`);
  }
}

/**
 * Show a loading indicator for context operations.
 *
 * @param operation - Operation description
 */
export function showContextLoadingIndicator(operation: string): void {
  process.stdout.write(`${operation}...\n`);
}

/**
 * Show progress indicator for long-running operations.
 *
 * @param current - Current progress
 * @param total - Total items
 * @param label - Label for the operation
 */
export function showProgressIndicator(current: number, total: number, label: string): void {
  const percentage = Math.round((current / total) * 100);
  process.stdout.write(`\r${label}: ${current}/${total} (${percentage}%)`);
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * Measure operation time and show indicator if > 500ms.
 *
 * @param operation - Operation description
 * @param fn - Function to execute
 * @returns Result of the function
 */
export async function withLoadingIndicator<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  const indicator = showContextLoadingIndicator;
  indicator(operation);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    if (duration > 500) {
      process.stdout.write(`✓ ${operation} completed (${duration}ms)\n`);
    } else {
      // Clear the loading message for fast operations
      process.stdout.write(`\r\x1b[K`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    process.stdout.write(`✗ ${operation} failed after ${duration}ms\n`);
    throw error;
  }
}
