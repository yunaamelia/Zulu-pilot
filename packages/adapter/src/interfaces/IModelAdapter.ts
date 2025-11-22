/**
 * Model Adapter Interface
 *
 * Adapter MUST implement Gemini CLI's expected model interface.
 * This contract ensures compatibility with Gemini CLI core.
 *
 * @package @zulu-pilot/adapter
 */

/**
 * Content interface (text, images, files)
 */
export interface Content {
  role?: 'user' | 'model';
  parts: Part[];
}

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
}

/**
 * Tool interface (for function calling)
 */
export interface Tool {
  functionDeclarations?: FunctionDeclaration[];
}

export interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Generation config
 */
export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
}

/**
 * Safety settings
 */
export interface SafetySetting {
  category: string;
  threshold: string;
}

/**
 * Candidate response
 */
export interface Candidate {
  content: Content;
  finishReason?: string;
  safetyRatings?: SafetyRating[];
}

export interface SafetyRating {
  category: string;
  probability: string;
}

/**
 * Usage metadata
 */
export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

/**
 * Gemini CLI's GenerateContentParams interface
 */
export interface GenerateContentParams {
  model: string; // Model identifier (can be "provider:model" format)
  contents: Content[];
  tools?: Tool[];
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
  systemInstruction?: string;
}

/**
 * Gemini CLI's GenerateContentResponse interface
 */
export interface GenerateContentResponse {
  content: Content[];
  candidates?: Candidate[];
  usageMetadata?: UsageMetadata;
}

/**
 * Model Adapter Interface
 *
 * Adapter MUST implement this interface to work with Gemini CLI core
 */
export interface IModelAdapter {
  /**
   * Generate content - implements Gemini CLI's expected interface
   *
   * @param params - Gemini CLI format parameters
   * @returns Promise resolving to Gemini CLI format response
   *
   * @throws {Error} When adapter cannot route to provider
   * @throws {Error} When format conversion fails
   */
  generateContent(params: GenerateContentParams): Promise<GenerateContentResponse>;

  /**
   * Stream generate content - implements Gemini CLI's expected interface
   *
   * @param params - Gemini CLI format parameters
   * @returns AsyncGenerator yielding Gemini CLI format responses
   *
   * @throws {Error} When adapter cannot route to provider
   * @throws {Error} When format conversion fails
   */
  streamGenerateContent(
    params: GenerateContentParams
  ): AsyncGenerator<GenerateContentResponse, void, unknown>;
}

