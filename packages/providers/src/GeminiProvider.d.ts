import { AxiosInstance } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '@zulu-pilot/core';
/**
 * Configuration for GeminiProvider.
 */
export interface GeminiProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    timeout?: number;
    axiosInstance?: AxiosInstance;
}
/**
 * Gemini provider implementation.
 * Connects to Google Gemini API using their official API endpoint.
 */
export declare class GeminiProvider implements IModelProvider {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly model;
    private readonly timeout;
    private readonly axiosInstance;
    private currentModel;
    constructor(config?: GeminiProviderConfig);
    /**
     * Get the current model name.
     */
    getModel(): string;
    /**
     * Set the model to use.
     */
    setModel(model: string): void;
    /**
     * Stream response from Gemini API.
     */
    streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string, void, unknown>;
    /**
     * Generate complete response from Gemini API.
     */
    generateResponse(prompt: string, context: FileContext[]): Promise<string>;
    /**
     * Build contents array for Gemini API.
     */
    private buildContents;
    /**
     * Extract content from Gemini response.
     */
    private extractContent;
    /**
     * Handle axios errors and convert to application errors.
     */
    private handleError;
}
//# sourceMappingURL=GeminiProvider.d.ts.map