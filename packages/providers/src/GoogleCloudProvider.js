import axios from 'axios';
import { ConnectionError, RateLimitError, getProviderTimeout, ValidationError, } from './utils/errors.js';
/**
 * Google Cloud provider implementation.
 * Connects to Google Cloud AI Platform using Vertex AI API.
 */
export class GoogleCloudProvider {
    apiKey;
    projectId;
    region;
    baseUrl;
    model;
    timeout;
    axiosInstance;
    currentModel;
    constructor(config = {}) {
        this.projectId = config.projectId ?? process.env.GOOGLE_CLOUD_PROJECT_ID;
        this.region = config.region ?? 'us-central1';
        // credentialsPath can be used for future credential file loading if needed
        // Handle API key or credentials
        if (config.apiKey) {
            this.apiKey = config.apiKey.startsWith('env:')
                ? (process.env[config.apiKey.slice(4)] ?? '')
                : config.apiKey;
            if (!this.apiKey) {
                throw new ValidationError(`Environment variable ${config.apiKey.slice(4)} is not set.`, 'apiKey');
            }
        }
        // Build base URL
        const endpoint = config.baseUrl ??
            `https://${this.region}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.region}/publishers/google/models`;
        this.baseUrl = endpoint;
        this.model = config.model ?? 'gemini-pro';
        this.currentModel = this.model;
        this.timeout = config.timeout ?? getProviderTimeout(false); // Remote provider
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        this.axiosInstance =
            config.axiosInstance ??
                axios.create({
                    baseURL: this.baseUrl,
                    timeout: this.timeout,
                    headers,
                });
    }
    /**
     * Get the current model name.
     */
    getModel() {
        return this.currentModel;
    }
    /**
     * Set the model to use.
     */
    setModel(model) {
        this.currentModel = model;
    }
    /**
     * Stream response from Google Cloud AI Platform.
     */
    async *streamResponse(prompt, context) {
        try {
            const requestBody = this.buildRequest(prompt, context);
            const response = await this.axiosInstance.post(`/${this.currentModel}:streamRawPredict`, requestBody, {
                responseType: 'stream',
            });
            // Parse streaming response
            const stream = response.data;
            let buffer = '';
            for await (const chunk of stream) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.trim()) {
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(line);
                        const content = this.extractContent(parsed);
                        if (content) {
                            yield content;
                        }
                    }
                    catch {
                        // Ignore parse errors for malformed chunks
                    }
                }
            }
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Generate complete response from Google Cloud AI Platform.
     */
    async generateResponse(prompt, context) {
        try {
            const requestBody = this.buildRequest(prompt, context);
            const response = await this.axiosInstance.post(`/${this.currentModel}:rawPredict`, requestBody);
            const content = this.extractContent(response.data);
            if (!content) {
                throw new Error('No content in response');
            }
            return content;
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Build request body for Google Cloud AI Platform.
     */
    buildRequest(prompt, context) {
        // Combine context and prompt
        const fullPrompt = context.length > 0
            ? `${context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n')}\n\nUser: ${prompt}`
            : prompt;
        return {
            instances: [
                {
                    prompt: fullPrompt,
                },
            ],
            parameters: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            },
        };
    }
    /**
     * Extract content from Google Cloud response.
     */
    extractContent(data) {
        try {
            // Handle streaming response format
            if (data && typeof data === 'object') {
                const obj = data;
                if (obj.predictions && Array.isArray(obj.predictions)) {
                    const prediction = obj.predictions[0];
                    if (prediction.content && typeof prediction.content === 'string') {
                        return prediction.content;
                    }
                }
                if (obj.predictions && Array.isArray(obj.predictions) && obj.predictions.length > 0) {
                    const prediction = obj.predictions[0];
                    if (prediction.generatedText && typeof prediction.generatedText === 'string') {
                        return prediction.generatedText;
                    }
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Handle axios errors and convert to application errors.
     */
    handleError(error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return new ConnectionError(`Failed to connect to Google Cloud AI Platform at ${this.baseUrl}`, 'googleCloud', error);
        }
        if (error.response?.status === 401) {
            return new ValidationError('Invalid credentials. Please check your Google Cloud authentication.', 'apiKey', error);
        }
        if (error.response?.status === 403) {
            return new ValidationError('Access denied. Please check your project permissions and API enablement.', 'projectId', error);
        }
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after']
                ? parseInt(error.response.headers['retry-after'], 10)
                : undefined;
            const errorData = error.response.data;
            return new RateLimitError(errorData?.error?.message ?? 'Rate limit exceeded', retryAfter, error);
        }
        if (error.response?.status === 404) {
            return new ValidationError(`Model "${this.currentModel}" not found or not available in region ${this.region}.`, 'model', error);
        }
        const errorData = error.response?.data;
        return new ConnectionError(errorData?.error?.message ?? error.message ?? 'Unknown error occurred', 'googleCloud', error);
    }
}
//# sourceMappingURL=GoogleCloudProvider.js.map