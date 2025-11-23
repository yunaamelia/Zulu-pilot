/**
 * Spinner
 *
 * Loading indicators during API calls
 * T059 [US1] - Loading indicators during API calls
 *
 * @package @zulu-pilot/cli
 */

/**
 * Spinner Configuration
 */
export interface SpinnerConfig {
  /**
   * Spinner characters/pattern
   * Default: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
   */
  frames?: string[];

  /**
   * Update interval in milliseconds
   * Default: 80ms
   */
  interval?: number;

  /**
   * Message to display
   */
  message?: string;

  /**
   * Whether to hide cursor during spinner
   * Default: true
   */
  hideCursor?: boolean;
}

/**
 * Spinner
 *
 * Provides loading indicators during API calls
 */
export class Spinner {
  private readonly config: Required<Omit<SpinnerConfig, 'message'>> & {
    message?: string;
  };
  private frameIndex: number = 0;
  private interval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private cursorHidden: boolean = false;

  private readonly defaultFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  constructor(config: SpinnerConfig = {}) {
    this.config = {
      frames: config.frames ?? this.defaultFrames,
      interval: config.interval ?? 80,
      hideCursor: config.hideCursor ?? true,
      message: config.message,
    };
  }

  /**
   * Start spinner
   *
   * @param message - Optional message to display
   */
  start(message?: string): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.frameIndex = 0;

    if (message) {
      this.config.message = message;
    }

    if (this.config.hideCursor) {
      this.hideCursor();
    }

    this.render();

    this.interval = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.config.frames.length;
      this.render();
    }, this.config.interval);
  }

  /**
   * Stop spinner
   *
   * @param message - Optional final message
   */
  stop(message?: string): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Clear spinner line
    this.clear();

    if (this.config.hideCursor) {
      this.showCursor();
    }

    if (message) {
      process.stdout.write(`${message}\n`);
    }
  }

  /**
   * Update spinner message
   *
   * @param message - New message
   */
  updateMessage(message: string): void {
    this.config.message = message;
    if (this.isRunning) {
      this.render();
    }
  }

  /**
   * Render current spinner frame
   */
  private render(): void {
    const frame = this.config.frames[this.frameIndex];
    const message = this.config.message ? ` ${this.config.message}` : '';

    // Clear previous line and write new frame
    process.stdout.write(`\r${frame}${message}`);
  }

  /**
   * Clear spinner line
   */
  private clear(): void {
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
  }

  /**
   * Hide cursor
   */
  private hideCursor(): void {
    if (!this.cursorHidden) {
      process.stdout.write('\x1b[?25l'); // Hide cursor
      this.cursorHidden = true;
    }
  }

  /**
   * Show cursor
   */
  private showCursor(): void {
    if (this.cursorHidden) {
      process.stdout.write('\x1b[?25h'); // Show cursor
      this.cursorHidden = false;
    }
  }

  /**
   * Check if spinner is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

