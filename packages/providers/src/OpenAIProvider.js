import axios from 'axios';
import { ConnectionError, RateLimitError, getProviderTimeout, ValidationError, } from './utils/errors.js';
/**
 * OpenAI provider implementation.
 * Connects to OpenAI API using their official chat completions endpoint.
 */
export class OpenAIProvider {
    apiKey;
    baseUrl;
    model;
    timeout;
    axiosInstance;
    organization;
    currentModel;
    constructor(config = {}) {
        this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? '';
        if (!this.apiKey) {
            throw new ValidationError('OpenAI API key is required. Set OPENAI_API_KEY environment variable or provide in config.', 'apiKey');
        }
        // Handle environment variable reference
        if (this.apiKey.startsWith('env:')) {
            const envVar = this.apiKey.slice(4);
            this.apiKey = process.env[envVar] ?? '';
            if (!this.apiKey) {
                throw new ValidationError(`Environment variable ${envVar} is not set.`, 'apiKey');
            }
        }
        this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
        this.model = config.model ?? 'gpt-4';
        this.currentModel = this.model;
        this.timeout = config.timeout ?? getProviderTimeout(false); // Remote provider
        this.organization = config.organization;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
        };
        if (this.organization) {
            headers['OpenAI-Organization'] = this.organization;
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
     * Stream response from OpenAI.
     */
    async *streamResponse(prompt, context) {
        try {
            const messages = this.buildMessages(prompt, context);
            const response = await this.axiosInstance.post('/chat/completions', {
                model: this.currentModel,
                messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 4096,
            }, {
                responseType: 'stream',
            });
            // Parse Server-Sent Events stream
            const stream = response.data;
            let buffer = '';
            for await (const chunk of stream) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.startsWith('data: ')) {
                        continue;
                    }
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') {
                        return;
                    }
                    const parsedContent = this.parseStreamChunk(data);
                    if (parsedContent) {
                        yield parsedContent;
                    }
                }
            }
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Generate complete response from OpenAI.
     */
    async generateResponse(prompt, context) {
        try {
            const messages = this.buildMessages(prompt, context);
            const response = await this.axiosInstance.post('/chat/completions', {
                model: this.currentModel,
                messages,
                stream: false,
                temperature: 0.7,
                max_tokens: 4096,
            });
            const content = response.data.choices?.[0]?.message?.content;
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
     * Parse a single stream chunk and extract content.
     *
     * @param data - Raw chunk data from stream
     * @returns Content string if found, null otherwise
     */
    parseStreamChunk(data) {
        try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            return content ?? null;
        }
        catch {
            // Ignore parse errors for malformed chunks
            return null;
        }
    }
    /**
     * Build messages array from prompt and context.
     */
    buildMessages(prompt, context) {
        const messages = [];
        // System prompt with code change format instructions
        const systemPrompt = `You are a coding assistant. When proposing code changes, use this format:

\`\`\`typescript:filename:path/to/file.ts
// Your code changes here
\`\`\`

For multiple files, use separate code blocks. Always include the file path after the language identifier.

${context.length > 0 ? `Here is the codebase context:\n\n${context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n')}` : ''}`;
        messages.push({
            role: 'system',
            content: systemPrompt,
        });
        // Add user prompt
        messages.push({
            role: 'user',
            content: prompt,
        });
        return messages;
    }
    /**
     * Handle axios errors and convert to application errors.
     */
    handleError(error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return new ConnectionError(`Failed to connect to OpenAI at ${this.baseUrl}`, 'openai', error);
        }
        if (error.response?.status === 401) {
            return new ValidationError('Invalid API key. Please check your OPENAI_API_KEY.', 'apiKey', error);
        }
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after']
                ? parseInt(error.response.headers['retry-after'], 10)
                : undefined;
            const errorData = error.response.data;
            return new RateLimitError(errorData?.error?.message ?? 'Rate limit exceeded', retryAfter, error);
        }
        if (error.response?.status === 404) {
            return new ValidationError(`Model "${this.currentModel}" not found or not available for your API key.`, 'model', error);
        }
        const errorData = error.response?.data;
        return new ConnectionError(errorData?.error?.message ?? error.message ?? 'Unknown error occurred', 'openai', error);
    }
}
//# sourceMappingURL=OpenAIProvider.js.map