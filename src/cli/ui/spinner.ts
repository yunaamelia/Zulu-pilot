/**
 * Loading spinner for CLI operations.
 * Provides visual feedback during async operations.
 */
export class Spinner {
  private message: string;
  private intervalId: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private frameIndex = 0;
  private isRunning = false;

  constructor(message: string) {
    this.message = message;
  }

  /**
   * Start the spinner animation.
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.frameIndex = 0;

    // Hide cursor
    process.stdout.write('\x1b[?25l');

    this.intervalId = setInterval(() => {
      const frame = this.frames[this.frameIndex % this.frames.length];
      process.stdout.write(`\r${frame} ${this.message}`);
      this.frameIndex++;
    }, 80);
  }

  /**
   * Update the spinner message.
   *
   * @param message - New message to display
   */
  update(message: string): void {
    this.message = message;
  }

  /**
   * Stop the spinner and clear the line.
   */
  stop(): void {
    if (!this.isRunning && !this.intervalId) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Clear line and show cursor
    process.stdout.write('\r\x1b[K\x1b[?25h');
  }

  /**
   * Stop the spinner and show success message.
   *
   * @param message - Success message to display
   */
  succeed(message?: string): void {
    this.stop();
    if (message) {
      process.stdout.write(`\r✓ ${message}\n`);
    }
  }

  /**
   * Stop the spinner and show error message.
   *
   * @param message - Error message to display
   */
  fail(message?: string): void {
    this.stop();
    if (message) {
      process.stdout.write(`\r✗ ${message}\n`);
    }
  }
}
