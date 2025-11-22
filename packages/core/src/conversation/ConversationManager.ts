/**
 * Conversation Manager
 *
 * Manages conversation history and context
 * T057 [US1] - Conversation history management
 *
 * @package @zulu-pilot/core
 */

import type { Content } from '@google/genai';
import type { GeminiChat } from '../core/geminiChat.js';
import type { Config } from '../config/config.js';

/**
 * Conversation Manager
 *
 * Wrapper around GeminiChat for conversation history management
 */
export class ConversationManager {
  private chat: GeminiChat | null = null;

  constructor(
    private readonly config: Config,
    private readonly getChatFn: () => GeminiChat
  ) {}

  /**
   * Initialize conversation manager
   */
  async initialize(): Promise<void> {
    // Chat is managed by GeminiClient, we just get a reference
    // The chat instance is created by the client
  }

  /**
   * Get conversation history
   *
   * @param curated - Whether to return curated history (exclude system messages, etc.)
   * @returns Conversation history as Content array
   */
  getHistory(curated: boolean = false): Content[] {
    const chat = this.getChatFn();
    return chat.getHistory(curated);
  }

  /**
   * Add message to conversation history
   *
   * @param content - Content to add to history
   */
  addHistory(content: Content): void {
    const chat = this.getChatFn();
    chat.addHistory(content);
  }

  /**
   * Set conversation history
   *
   * @param history - New conversation history
   */
  setHistory(history: Content[]): void {
    const chat = this.getChatFn();
    chat.setHistory(history);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    const chat = this.getChatFn();
    chat.clearHistory();
  }

  /**
   * Get last message from conversation
   *
   * @returns Last message or null if empty
   */
  getLastMessage(): Content | null {
    const history = this.getHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get conversation length
   *
   * @returns Number of messages in conversation
   */
  getMessageCount(): number {
    return this.getHistory().length;
  }

  /**
   * Check if conversation is empty
   *
   * @returns True if conversation has no messages
   */
  isEmpty(): boolean {
    return this.getMessageCount() === 0;
  }
}

