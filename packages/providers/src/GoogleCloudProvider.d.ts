import { AxiosInstance } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '@zulu-pilot/core';
/**
 * Configuration for GoogleCloudProvider.
 */
export interface GoogleCloudProviderConfig {
    apiKey?: string;
    projectId?: string;
    region?: string;
    baseUrl?: string;
    model?: string;
    timeout?: number;
    axiosInstance?: AxiosInstance;
    credentialsPath?: string;
}
/**
 * Google Cloud provider implementation.
 * Connects to Google Cloud AI Platform using Vertex AI API.
 */
export declare class GoogleCloudProvider implements IModelProvider {
    private readonly apiKey?;
    private readonly projectId?;
    private readonly region;
    private readonly baseUrl;
    private readonly model;
    private readonly timeout;
    private readonly axiosInstance;
    private currentModel;
    constructor(config?: GoogleCloudProviderConfig);
    /**
     * Get the current model name.
     */
    getModel(): string;
    /**
     * Set the model to use.
     */
    setModel(model: string): void;
    /**
     * Stream response from Google Cloud AI Platform.
     */
    streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string, void, unknown>;
    /**
     * Generate complete response from Google Cloud AI Platform.
     */
    generateResponse(prompt: string, context: FileContext[]): Promise<string>;
    /**
     * Build request body for Google Cloud AI Platform.
     */
    private buildRequest;
    /**
     * Extract content from Google Cloud response.
     */
    private extractContent;
    /**
     * Handle axios errors and convert to application errors.
     */
    private handleError;
}
//# sourceMappingURL=GoogleCloudProvider.d.ts.map