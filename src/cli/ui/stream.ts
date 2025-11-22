// AsyncGenerator is a built-in TypeScript type

/**
 * Handles streaming output to stdout with real-time token display.
 * Improved for smooth token-by-token display with better formatting.
 */
export class StreamHandler {
  private cancelled = false;
  private buffer: string = '';
  private readonly bufferSize = 10; // Buffer tokens for smoother display

  /**
   * Stream tokens to stdout in real-time with smooth display.
   *
   * @param generator - Async generator yielding response tokens
   * @returns Promise that resolves when streaming completes
   */
  async streamToStdout(generator: AsyncGenerator<string>): Promise<string> {
    this.cancelled = false;
    this.buffer = '';
    let fullResponse = '';

    // Handle Ctrl+C cancellation
    const cancelHandler = (): void => {
      this.cancelled = true;
    };
    process.on('SIGINT', cancelHandler);

    try {
      for await (const token of generator) {
        if (this.cancelled) {
          process.stdout.write('\n\n[Cancelled]\n');
          break;
        }

        fullResponse += token;
        this.buffer += token;

        // Flush buffer periodically for smoother display
        if (this.buffer.length >= this.bufferSize || token.includes('\n')) {
          this.flushBuffer();
        }
      }

      // Flush remaining buffer
      if (this.buffer.length > 0) {
        this.flushBuffer();
      }

      process.stdout.write('\n');
      return fullResponse;
    } catch (error) {
      // Flush buffer on error
      if (this.buffer.length > 0) {
        this.flushBuffer();
      }
      process.stdout.write('\n');
      throw error;
    } finally {
      process.removeListener('SIGINT', cancelHandler);
    }
  }

  /**
   * Flush buffered tokens to stdout.
   */
  private flushBuffer(): void {
    if (this.buffer.length > 0) {
      process.stdout.write(this.buffer);
      this.buffer = '';
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
