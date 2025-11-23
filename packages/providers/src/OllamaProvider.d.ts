import { AxiosInstance } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '@zulu-pilot/core';
/**
 * Configuration for OllamaProvider.
 */
export interface OllamaProviderConfig {
    baseUrl?: string;
    model?: string;
    timeout?: number;
    axiosInstance?: AxiosInstance;
}
/**
 * Ollama provider implementation.
 * Connects to local Ollama instance using OpenAI-compatible API.
 */
export declare class OllamaProvider implements IModelProvider {
    private readonly baseUrl;
    private readonly model;
    private readonly timeout;
    private readonly axiosInstance;
    constructor(config?: OllamaProviderConfig);
    /**
     * Get the configured model name.
     */
    getModel(): string;
    /**
     * Stream response from Ollama.
     */
    streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string, void, unknown>;
    /**
     * Generate complete response from Ollama.
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
//# sourceMappingURL=OllamaProvider.d.ts.map