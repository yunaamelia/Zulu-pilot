/**
 * Thinking Display
 *
 * Display thinking process for models with reasoning capabilities
 * T060 [US1] - Thinking process display (display with `[thinking]` prefix or dimmed text, toggle visibility per FR-019)
 *
 * @package @zulu-pilot/cli
 */

/**
 * Thinking Display Configuration
 */
export interface ThinkingDisplayConfig {
  /**
   * Whether to display thinking process
   * Default: true
   */
  enabled?: boolean;

  /**
   * Prefix for thinking content
   * Default: '[thinking]'
   */
  prefix?: string;

  /**
   * Whether to dim thinking text
   * Default: true
   */
  dimText?: boolean;

  /**
   * Whether to use prefix or dimmed text
   * If true, uses prefix; if false, uses dimmed text
   * Default: true (use prefix)
   */
  usePrefix?: boolean;

  /**
   * Output stream (stdout or custom)
   */
  outputStream?: NodeJS.WritableStream;
}

/**
 * Thinking Display
 *
 * Handles display of thinking process for models with reasoning capabilities
 */
export class ThinkingDisplay {
  private readonly config: Required<Omit<ThinkingDisplayConfig, 'outputStream'>> & {
    outputStream?: NodeJS.WritableStream;
  };
  private isDisplaying: boolean = false;
  private currentThinking: string = '';

  constructor(config: ThinkingDisplayConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      prefix: config.prefix ?? '[thinking]',
      dimText: config.dimText ?? true,
      usePrefix: config.usePrefix ?? true,
      outputStream: config.outputStream ?? process.stdout,
    };
  }

  /**
   * Start displaying thinking process
   */
  start(): void {
    if (!this.config.enabled || this.isDisplaying) {
      return;
    }

    this.isDisplaying = true;
    this.currentThinking = '';
  }

  /**
   * Update thinking content
   *
   * @param content - Thinking content to display
   */
  update(content: string): void {
    if (!this.config.enabled || !this.isDisplaying) {
      return;
    }

    this.currentThinking = content;

    if (this.config.usePrefix) {
      // Display with prefix
      this.displayWithPrefix(content);
    } else {
      // Display with dimmed text
      this.displayDimmed(content);
    }
  }

  /**
   * Display thinking with prefix
   *
   * @param content - Content to display
   */
  private displayWithPrefix(content: string): void {
    const stream = this.config.outputStream || process.stdout;
    const lines = content.split('\n');
    
    // Clear previous thinking display
    stream.write('\r' + ' '.repeat(80) + '\r');

    // Display each line with prefix
    for (const line of lines) {
      if (line.trim()) {
        stream.write(`${this.config.prefix} ${line}\n`);
      }
    }
  }

  /**
   * Display thinking with dimmed text
   *
   * @param content - Content to display
   */
  private displayDimmed(content: string): void {
    const stream = this.config.outputStream || process.stdout;
    const dimCode = '\x1b[2m'; // ANSI dim code
    const resetCode = '\x1b[0m'; // ANSI reset code
    
    // Clear previous thinking display
    stream.write('\r' + ' '.repeat(80) + '\r');

    // Display with dimmed text
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        stream.write(`${dimCode}${line}${resetCode}\n`);
      }
    }
  }

  /**
   * Stop displaying thinking process
   */
  stop(): void {
    if (!this.isDisplaying) {
      return;
    }

    this.isDisplaying = false;
    this.currentThinking = '';

    // Clear display
    const stream = this.config.outputStream || process.stdout;
    stream.write('\r' + ' '.repeat(80) + '\r');
  }

  /**
   * Toggle thinking display visibility
   *
   * @param enabled - Whether to enable thinking display
   */
  toggle(enabled: boolean): void {
    this.config.enabled = enabled;

    if (!enabled && this.isDisplaying) {
      this.stop();
    }
  }

  /**
   * Check if thinking display is active
   *
   * @returns True if thinking display is active
   */
  isActive(): boolean {
    return this.isDisplaying && this.config.enabled;
  }

  /**
   * Get current thinking content
   *
   * @returns Current thinking content
   */
  getCurrentThinking(): string {
    return this.currentThinking;
  }

  /**
   * Check if thinking display is enabled
   *
   * @returns True if thinking display is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

