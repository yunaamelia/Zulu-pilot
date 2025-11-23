import type { Content } from '@google/genai';

/**
 * Output format types supported by OutputFormatter
 */
export type OutputFormat = 'text' | 'json' | 'stream-json';

/**
 * Configuration for OutputFormatter
 */
export interface OutputFormatterConfig {
  format: OutputFormat;
  pretty?: boolean;
}

/**
 * Response structure for JSON output formats
 */
export interface FormattedResponse {
  /** Response text content */
  content: string;
  /** Full response parts (text, code blocks, etc.) */
  parts: Array<{ type: string; content: string }>;
  /** Metadata */
  metadata?: {
    /** Timestamp of response */
    timestamp: string;
    /** Provider used */
    provider?: string;
    /** Model used */
    model?: string;
  };
}

/**
 * T195-T196: OutputFormatter - Formats AI responses for different output types
 * 
 * Supports:
 * - text: Plain text output (default)
 * - json: Structured JSON output
 * - stream-json: Streaming JSON output (newline-delimited JSON)
 */
export class OutputFormatter {
  private readonly format: OutputFormat;
  private readonly pretty: boolean;

  constructor(config: OutputFormatterConfig) {
    this.format = config.format;
    this.pretty = config.pretty ?? true;
  }

  /**
   * Format a response content for output.
   * 
   * @param content - Content to format
   * @param metadata - Optional metadata to include
   * @returns Formatted output string
   */
  formatResponse(
    content: Content | Content[] | string,
    metadata?: { provider?: string; model?: string }
  ): string {
    switch (this.format) {
      case 'json':
        return this.formatAsJSON(content, metadata);
      case 'stream-json':
        return this.formatAsStreamJSON(content, metadata);
      case 'text':
      default:
        return this.formatAsText(content);
    }
  }

  /**
   * T195: Format response as JSON
   * 
   * @param content - Content to format
   * @param metadata - Optional metadata
   * @returns JSON string
   */
  private formatAsJSON(
    content: Content | Content[] | string,
    metadata?: { provider?: string; model?: string }
  ): string {
    const response = this.extractResponseData(content, metadata);

    if (this.pretty) {
      return JSON.stringify(response, null, 2);
    }
    return JSON.stringify(response);
  }

  /**
   * T196: Format response as streaming JSON (NDJSON - newline-delimited JSON)
   * 
   * Each chunk is output as a separate JSON object on a new line.
   * 
   * @param content - Content to format
   * @param metadata - Optional metadata
   * @returns NDJSON string
   */
  private formatAsStreamJSON(
    content: Content | Content[] | string,
    metadata?: { provider?: string; model?: string }
  ): string {
    const response = this.extractResponseData(content, metadata);

    // For stream-json, output each part as a separate JSON line
    const lines: string[] = [];
    
      // Output initial metadata line
      if (metadata) {
        lines.push(JSON.stringify({ type: 'metadata', provider: metadata.provider, model: metadata.model }));
      }

    // Output each part as a separate JSON line
    for (const part of response.parts) {
      lines.push(JSON.stringify({ type: 'content', ...part }));
    }

    // Output final completion line
    lines.push(JSON.stringify({ type: 'done', content: response.content }));

    return lines.join('\n');
  }

  /**
   * Format response as plain text
   * 
   * @param content - Content to format
   * @returns Plain text string
   */
  private formatAsText(content: Content | Content[] | string): string {
    if (typeof content === 'string') {
      return content;
    }

    const contents = Array.isArray(content) ? content : [content];
    const texts: string[] = [];

    for (const msg of contents) {
      for (const part of msg.parts || []) {
        if ('text' in part && typeof part.text === 'string') {
          texts.push(part.text);
        }
      }
    }

    return texts.join('\n\n');
  }

  /**
   * Extract response data structure from content
   * 
   * @param content - Content to extract from
   * @param metadata - Optional metadata
   * @returns Formatted response structure
   */
  private extractResponseData(
    content: Content | Content[] | string,
    metadata?: { provider?: string; model?: string }
  ): FormattedResponse {
    const parts: Array<{ type: string; content: string }> = [];
    let fullContent = '';

    if (typeof content === 'string') {
      fullContent = content;
      parts.push({ type: 'text', content });
    } else {
      const contents = Array.isArray(content) ? content : [content];

      for (const msg of contents) {
        for (const part of msg.parts || []) {
          if ('text' in part && typeof part.text === 'string') {
            const text = part.text;
            fullContent += text + '\n';
            parts.push({ type: 'text', content: text });
          } else if ('inlineData' in part) {
            parts.push({ type: 'inlineData', content: '[Binary data]' });
          } else if ('fileData' in part) {
            parts.push({ type: 'fileData', content: '[File data]' });
          }
        }
      }
    }

    return {
      content: fullContent.trim(),
      parts,
      metadata: metadata
        ? {
            timestamp: new Date().toISOString(),
            ...metadata,
          }
        : undefined,
    };
  }

  /**
   * Get current output format
   * 
   * @returns Current format
   */
  getFormat(): OutputFormat {
    return this.format;
  }

  /**
   * Check if formatter is in JSON mode
   * 
   * @returns True if JSON or stream-json format
   */
  isJSONMode(): boolean {
    return this.format === 'json' || this.format === 'stream-json';
  }
}

