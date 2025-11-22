import type { FileContext } from '../context/FileContext.js';

/**
 * Interface for AI model providers.
 * All model providers (Ollama, Gemini, OpenAI, etc.) must implement this interface.
 */
export interface IModelProvider {
  /**
   * Stream a response from the AI model in real-time.
   * Returns an async generator that yields tokens as they are generated.
   *
   * @param prompt - The user's prompt/question
   * @param context - Array of file contexts to include in the conversation
   * @returns Async generator yielding response tokens
   * @throws {ConnectionError} If connection to the model fails
   * @throws {RateLimitError} If API rate limit is exceeded
   */
  streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string, void, unknown>;

  /**
   * Generate a complete response from the AI model.
   * Returns the full response as a string after generation completes.
   *
   * @param prompt - The user's prompt/question
   * @param context - Array of file contexts to include in the conversation
   * @returns Promise resolving to the complete response
   * @throws {ConnectionError} If connection to the model fails
   * @throws {RateLimitError} If API rate limit is exceeded
   */
  generateResponse(prompt: string, context: FileContext[]): Promise<string>;
}
