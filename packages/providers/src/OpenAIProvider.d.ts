import { AxiosInstance } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '@zulu-pilot/core';
/**
 * Configuration for OpenAIProvider.
 */
export interface OpenAIProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    timeout?: number;
    axiosInstance?: AxiosInstance;
    organization?: string;
}
/**
 * OpenAI provider implementation.
 * Connects to OpenAI API using their official chat completions endpoint.
 */
export declare class OpenAIProvider implements IModelProvider {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly model;
    private readonly timeout;
    private readonly axiosInstance;
    private readonly organization?;
    private currentModel;
    constructor(config?: OpenAIProviderConfig);
    /**
     * Get the current model name.
     */
    getModel(): string;
    /**
     * Set the model to use.
     */
    setModel(model: string): void;
    /**
     * Stream response from OpenAI.
     */
    streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string, void, unknown>;
    /**
     * Generate complete response from OpenAI.
     */
    generateResponse(prompt: string, context: FileContext[]): Promise<string>;
    /**
     * Parse a single stream chunk and extract content.
     *
     * @param data - Raw chunk data from stream
     * @returns Content string if found, null otherwise
     */
    private parseStreamChunk;
    /**
     * Build messages array from prompt and context.
     */
    private buildMessages;
    /**
     * Handle axios errors and convert to application errors.
     */
    private handleError;
}
//# sourceMappingURL=OpenAIProvider.d.ts.map