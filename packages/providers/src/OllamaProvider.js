import axios from 'axios';
import { ConnectionError, RateLimitError, getProviderTimeout } from './utils/errors.js';
/**
 * Ollama provider implementation.
 * Connects to local Ollama instance using OpenAI-compatible API.
 */
export class OllamaProvider {
    baseUrl;
    model;
    timeout;
    axiosInstance;
    constructor(config = {}) {
        this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
        this.model = config.model ?? 'qwen2.5-coder';
        this.timeout = config.timeout ?? getProviderTimeout(true); // Local provider
        this.axiosInstance =
            config.axiosInstance ??
                axios.create({
                    baseURL: this.baseUrl,
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
    }
    /**
     * Get the configured model name.
     */
    getModel() {
        return this.model;
    }
    /**
     * Stream response from Ollama.
     */
    async *streamResponse(prompt, context) {
        try {
            const messages = this.buildMessages(prompt, context);
            const response = await this.axiosInstance.post('/v1/chat/completions', {
                model: this.model,
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
     * Generate complete response from Ollama.
     */
    async generateResponse(prompt, context) {
        try {
            const messages = this.buildMessages(prompt, context);
            const response = await this.axiosInstance.post('/v1/chat/completions', {
                model: this.model,
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
            return new ConnectionError(`Failed to connect to Ollama at ${this.baseUrl}`, 'ollama', error);
        }
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after']
                ? parseInt(error.response.headers['retry-after'], 10)
                : undefined;
            const errorData = error.response.data;
            return new RateLimitError(errorData?.error?.message ?? 'Rate limit exceeded', retryAfter, error);
        }
        if (error.response?.status === 404) {
            return new ConnectionError(`Model "${this.model}" not found. Please ensure the model is installed: ollama pull ${this.model}`, 'ollama', error);
        }
        return new ConnectionError(error.message ?? 'Unknown error occurred', 'ollama', error);
    }
}
//# sourceMappingURL=OllamaProvider.js.map