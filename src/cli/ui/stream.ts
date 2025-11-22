// AsyncGenerator is a built-in TypeScript type

/**
 * Handles streaming output to stdout with real-time token display.
 */
export class StreamHandler {
  private cancelled = false;

  /**
   * Stream tokens to stdout in real-time.
   *
   * @param generator - Async generator yielding response tokens
   * @returns Promise that resolves when streaming completes
   */
  async streamToStdout(generator: AsyncGenerator<string>): Promise<void> {
    this.cancelled = false;

    // Handle Ctrl+C cancellation
    const cancelHandler = () => {
      this.cancelled = true;
    };
    process.on('SIGINT', cancelHandler);

    try {
      for await (const token of generator) {
        if (this.cancelled) {
          process.stdout.write('\n\n[Cancelled]\n');
          break;
        }
        process.stdout.write(token);
      }
      process.stdout.write('\n');
    } catch (error) {
      process.stdout.write('\n');
      throw error;
    } finally {
      process.removeListener('SIGINT', cancelHandler);
    }
  }

  /**
   * Check if streaming was cancelled.
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Cancel streaming.
   */
  cancel(): void {
    this.cancelled = true;
  }
}
