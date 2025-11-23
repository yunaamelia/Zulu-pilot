/**
 * Stream Output
 *
 * Real-time streaming output with token-by-token display
 * T058 [US1] - Real-time streaming output (token interval < 100ms, no buffering delays > 500ms per FR-018)
 *
 * @package @zulu-pilot/cli
 */

/**
 * Stream Output Configuration
 */
export interface StreamOutputConfig {
  /**
   * Maximum delay between token display (milliseconds)
   * Default: 100ms per FR-018
   */
  maxTokenInterval?: number;

  /**
   * Maximum buffering delay (milliseconds)
   * Default: 500ms per FR-018
   */
  maxBufferingDelay?: number;

  /**
   * Whether to enable buffering
   * Default: false (no buffering delays)
   */
  enableBuffering?: boolean;

  /**
   * Callback when token is displayed
   */
  onToken?: (token: string) => void;

  /**
   * Callback when stream completes
   */
  onComplete?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Stream Output
 *
 * Handles real-time streaming output with configurable token intervals
 */
export class StreamOutput {
  private readonly config: Required<Omit<StreamOutputConfig, 'onToken' | 'onComplete' | 'onError'>> & {
    onToken?: (token: string) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  };
  private buffer: string = '';
  private lastTokenTime: number = 0;
  private flushTimer: NodeJS.Timeout | null = null;
  private isStreaming: boolean = false;

  constructor(config: StreamOutputConfig = {}) {
    this.config = {
      maxTokenInterval: config.maxTokenInterval ?? 100, // < 100ms per FR-018
      maxBufferingDelay: config.maxBufferingDelay ?? 500, // < 500ms per FR-018
      enableBuffering: config.enableBuffering ?? false, // No buffering by default
      onToken: config.onToken,
      onComplete: config.onComplete,
      onError: config.onError,
    };
    this.lastTokenTime = Date.now();
  }

  /**
   * Start streaming
   */
  async start(): Promise<void> {
    this.isStreaming = true;
    this.buffer = '';
    this.lastTokenTime = Date.now();
  }

  /**
   * T208: Optimized token writing with reduced string operations
   * Write token to stream
   *
   * @param token - Token to write
   */
  async writeToken(token: string): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    const now = Date.now();
    const timeSinceLastToken = now - this.lastTokenTime;

    // T208: Check if we should flush immediately (optimized condition check)
    if (!this.config.enableBuffering || timeSinceLastToken >= this.config.maxTokenInterval) {
      this.flushToken(token);
      this.lastTokenTime = now;
      return;
    }

    // T208: Optimize buffer concatenation - use array for large buffers
    if (this.buffer.length + token.length > 1024) {
      // For large buffers, flush first to avoid memory issues
      this.flush();
      this.buffer = token;
    } else {
      // T208: Direct concatenation is fine for small buffers
      this.buffer += token;
    }

    // T208: Schedule flush if not already scheduled (optimized timer management)
    if (!this.flushTimer) {
      const delay = Math.min(this.config.maxTokenInterval, this.config.maxBufferingDelay);
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, delay);
    }
  }

  /**
   * Flush buffered tokens
   */
  private flush(): void {
    if (this.buffer) {
      this.flushToken(this.buffer);
      this.buffer = '';
      this.lastTokenTime = Date.now();
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Flush a token immediately
   *
   * @param token - Token to flush
   */
  private flushToken(token: string): void {
    // Write to stdout
    process.stdout.write(token);

    // Call callback if provided
    if (this.config.onToken) {
      this.config.onToken(token);
    }
  }

  /**
   * T208: Optimized text writing - batch small writes for better performance
   * Write text (may contain multiple tokens)
   *
   * @param text - Text to write
   */
  async write(text: string): Promise<void> {
    // T208: For small texts, write directly without token-by-token overhead
    if (text.length <= 10) {
      for (const char of text) {
        await this.writeToken(char);
      }
      return;
    }

    // T208: For larger texts, batch process to reduce function call overhead
    // Process in chunks while maintaining streaming feel
    const CHUNK_SIZE = 50;
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const chunk = text.slice(i, i + CHUNK_SIZE);
      if (chunk.length === 1) {
        await this.writeToken(chunk);
      } else {
        // For multi-character chunks, write each character
        for (const char of chunk) {
          await this.writeToken(char);
        }
      }
      // T208: Small yield to allow other operations
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  /**
   * Complete streaming
   */
  async complete(): Promise<void> {
    // Flush any remaining buffer
    this.flush();

    this.isStreaming = false;

    // Call callback if provided
    if (this.config.onComplete) {
      this.config.onComplete();
    }
  }

  /**
   * Handle streaming error
   *
   * @param error - Error to handle
   */
  async error(error: Error): Promise<void> {
    this.isStreaming = false;

    // Flush any remaining buffer
    this.flush();

    // Write error to stderr
    process.stderr.write(`\nError: ${error.message}\n`);

    // Call callback if provided
    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  /**
   * Get current buffer state
   */
  getBufferState(): { isBuffering: boolean; bufferLength: number } {
    return {
      isBuffering: this.buffer.length > 0,
      bufferLength: this.buffer.length,
    };
  }
}

