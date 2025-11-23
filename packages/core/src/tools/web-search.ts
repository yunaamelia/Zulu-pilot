/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MessageBus } from '../confirmation-bus/message-bus.js';
import { WEB_SEARCH_TOOL_NAME } from './tool-names.js';
import type { GroundingMetadata } from '@google/genai';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { ToolErrorType } from './tool-error.js';

import { getErrorMessage } from '../utils/errors.js';
import { type Config } from '../config/config.js';
import { getResponseText } from '../utils/partUtils.js';
import type { UnifiedConfiguration } from '../config/UnifiedConfiguration.js';

/**
 * T141: Interface for adapter to support Google Search with custom models
 * This allows WebSearchTool to work with custom providers via adapter
 */
export interface GoogleSearchAdapter {
  generateContent(
    params: { model: string },
    contents: Array<{ role: string; parts: Array<{ text: string }> }>,
    signal?: AbortSignal
  ): Promise<{
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: GroundingMetadata;
    }>;
  }>;
  /**
   * Check if the current provider supports Google Search
   * T143: Implement graceful degradation for providers without Google Search
   */
  supportsGoogleSearch?(): boolean;
  /**
   * Get the current provider name
   */
  getCurrentProvider?(): string;
}

interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

interface GroundingChunkItem {
  web?: GroundingChunkWeb;
  // Other properties might exist if needed in the future
}

interface GroundingSupportSegment {
  startIndex: number;
  endIndex: number;
  text?: string; // text is optional as per the example
}

interface GroundingSupportItem {
  segment?: GroundingSupportSegment;
  groundingChunkIndices?: number[];
  confidenceScores?: number[]; // Optional as per example
}

/**
 * Parameters for the WebSearchTool.
 */
export interface WebSearchToolParams {
  /**
   * The search query.
   */

  query: string;
}

/**
 * Extends ToolResult to include sources for web search.
 */
export interface WebSearchToolResult extends ToolResult {
  sources?: GroundingMetadata extends { groundingChunks: GroundingChunkItem[] }
    ? GroundingMetadata['groundingChunks']
    : GroundingChunkItem[];
}

class WebSearchToolInvocation extends BaseToolInvocation<WebSearchToolParams, WebSearchToolResult> {
  constructor(
    private readonly config: Config,
    params: WebSearchToolParams,
    messageBus?: MessageBus,
    _toolName?: string,
    _toolDisplayName?: string,
    private readonly adapter?: GoogleSearchAdapter,
    private readonly unifiedConfig?: UnifiedConfiguration
  ) {
    super(params, messageBus, _toolName, _toolDisplayName);
  }

  override getDescription(): string {
    return `Searching the web for: "${this.params.query}"`;
  }

  async execute(signal: AbortSignal): Promise<WebSearchToolResult> {
    // T143: Check if Google Search is enabled in configuration
    const googleSearchConfig = this.unifiedConfig?.googleSearch;
    const isEnabled = googleSearchConfig?.enabled ?? true; // Default to enabled for backward compatibility

    if (!isEnabled) {
      return {
        llmContent: `Google Search is disabled in configuration. Enable it in the config to use web search.`,
        returnDisplay: 'Google Search is disabled.',
        error: {
          message: 'Google Search is disabled in configuration',
          type: ToolErrorType.WEB_SEARCH_FAILED,
        },
      };
    }

    // T141: Use adapter if provided, otherwise fall back to Gemini client
    // T143: Check if provider supports Google Search
    if (this.adapter) {
      // Check if the provider supports Google Search
      if (this.adapter.supportsGoogleSearch && !this.adapter.supportsGoogleSearch()) {
        const allowAllProviders = googleSearchConfig?.allowAllProviders ?? false;
        if (!allowAllProviders) {
          const providerName = this.adapter.getCurrentProvider?.() ?? 'current provider';
          return {
            llmContent: `Google Search is only available with Gemini providers. Current provider: ${providerName}. To enable Google Search with all providers, set googleSearch.allowAllProviders to true in configuration.`,
            returnDisplay: `Google Search not available with ${providerName}.`,
            error: {
              message: `Google Search not supported by provider: ${providerName}`,
              type: ToolErrorType.WEB_SEARCH_FAILED,
            },
          };
        }
      }

      try {
        const response = await this.adapter.generateContent(
          { model: 'web-search' },
          [{ role: 'user', parts: [{ text: this.params.query }] }],
          signal
        );
        return this.processSearchResponse(response, this.params.query);
      } catch (error: unknown) {
        return this.handleSearchError(error, this.params.query);
      }
    }

    // Fallback to direct Gemini client (backward compatibility)
    const geminiClient = this.config.getGeminiClient();

    try {
      const response = await geminiClient.generateContent(
        { model: 'web-search' },
        [{ role: 'user', parts: [{ text: this.params.query }] }],
        signal
      );
      return this.processSearchResponse(response, this.params.query);

      return this.processSearchResponse(response, this.params.query);
    } catch (error: unknown) {
      return this.handleSearchError(error, this.params.query);
    }
  }

  /**
   * Process search response and format with sources
   * T141: Extract response processing to helper method for reuse
   */
  private processSearchResponse(
    response: {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        groundingMetadata?: GroundingMetadata;
      }>;
    },
    query: string
  ): WebSearchToolResult {
    const responseText = getResponseText(response);
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks as GroundingChunkItem[] | undefined;
    const groundingSupports = groundingMetadata?.groundingSupports as
      | GroundingSupportItem[]
      | undefined;

    if (!responseText || !responseText.trim()) {
      return {
        llmContent: `No search results or information found for query: "${query}"`,
        returnDisplay: 'No information found.',
      };
    }

    let modifiedResponseText = responseText;
    const sourceListFormatted: string[] = [];

    if (sources && sources.length > 0) {
      sources.forEach((source: GroundingChunkItem, index: number) => {
        const title = source.web?.title || 'Untitled';
        const uri = source.web?.uri || 'No URI';
        sourceListFormatted.push(`[${index + 1}] ${title} (${uri})`);
      });

      if (groundingSupports && groundingSupports.length > 0) {
        const insertions: Array<{ index: number; marker: string }> = [];
        groundingSupports.forEach((support: GroundingSupportItem) => {
          if (support.segment && support.groundingChunkIndices) {
            const citationMarker = support.groundingChunkIndices
              .map((chunkIndex: number) => `[${chunkIndex + 1}]`)
              .join('');
            insertions.push({
              index: support.segment.endIndex,
              marker: citationMarker,
            });
          }
        });

        // Sort insertions by index in descending order to avoid shifting subsequent indices
        insertions.sort((a, b) => b.index - a.index);

        // Use TextEncoder/TextDecoder since segment indices are UTF-8 byte positions
        const encoder = new TextEncoder();
        const responseBytes = encoder.encode(modifiedResponseText);
        const parts: Uint8Array[] = [];
        let lastIndex = responseBytes.length;
        for (const ins of insertions) {
          const pos = Math.min(ins.index, lastIndex);
          parts.unshift(responseBytes.subarray(pos, lastIndex));
          parts.unshift(encoder.encode(ins.marker));
          lastIndex = pos;
        }
        parts.unshift(responseBytes.subarray(0, lastIndex));

        // Concatenate all parts into a single buffer
        const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
        const finalBytes = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of parts) {
          finalBytes.set(part, offset);
          offset += part.length;
        }
        modifiedResponseText = new TextDecoder().decode(finalBytes);
      }

      if (sourceListFormatted.length > 0) {
        modifiedResponseText += '\n\nSources:\n' + sourceListFormatted.join('\n');
      }
    }

    return {
      llmContent: `Web search results for "${query}":\n\n${modifiedResponseText}`,
      returnDisplay: `Search results for "${query}" returned.`,
      sources,
    };
  }

  /**
   * Handle search errors
   * T141: Extract error handling to helper method for reuse
   */
  private handleSearchError(error: unknown, query: string): WebSearchToolResult {
    const errorMessage = `Error during web search for query "${query}": ${getErrorMessage(error)}`;
    console.error(errorMessage, error);
    return {
      llmContent: `Error: ${errorMessage}`,
      returnDisplay: `Error performing web search.`,
      error: {
        message: errorMessage,
        type: ToolErrorType.WEB_SEARCH_FAILED,
      },
    };
  }
}

/**
 * A tool to perform web searches using Google Search via the Gemini API.
 */
export class WebSearchTool extends BaseDeclarativeTool<WebSearchToolParams, WebSearchToolResult> {
  static readonly Name = WEB_SEARCH_TOOL_NAME;

  constructor(
    private readonly config: Config,
    messageBus?: MessageBus,
    private readonly adapter?: GoogleSearchAdapter,
    private readonly unifiedConfig?: UnifiedConfiguration
  ) {
    super(
      WebSearchTool.Name,
      'GoogleSearch',
      'Performs a web search using Google Search (via the Gemini API) and returns the results. This tool is useful for finding information on the internet based on a query.',
      Kind.Search,
      {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find information on the web.',
          },
        },
        required: ['query'],
      },
      true, // isOutputMarkdown
      false, // canUpdateOutput
      messageBus
    );
  }

  /**
   * Validates the parameters for the WebSearchTool.
   * @param params The parameters to validate
   * @returns An error message string if validation fails, null if valid
   */
  protected override validateToolParamValues(params: WebSearchToolParams): string | null {
    if (!params.query || params.query.trim() === '') {
      return "The 'query' parameter cannot be empty.";
    }
    return null;
  }

  protected createInvocation(
    params: WebSearchToolParams,
    messageBus?: MessageBus,
    _toolName?: string,
    _toolDisplayName?: string
  ): ToolInvocation<WebSearchToolParams, WebSearchToolResult> {
    return new WebSearchToolInvocation(
      this.config,
      params,
      messageBus,
      _toolName,
      _toolDisplayName,
      this.adapter,
      this.unifiedConfig
    );
  }
}
