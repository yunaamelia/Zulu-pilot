import type { Content } from '@google/genai';

/**
 * Represents a conversation checkpoint that can be saved and resumed.
 */
export interface ConversationCheckpoint {
  /** Unique identifier for the checkpoint */
  id: string;

  /** Human-readable name for the checkpoint */
  name: string;

  /** Description of the checkpoint */
  description?: string;

  /** Timestamp when checkpoint was created */
  createdAt: string;

  /** Timestamp when checkpoint was last accessed */
  lastAccessedAt?: string;

  /** Conversation history at the time of checkpoint */
  history: Content[];

  /** Current context (file contexts, etc.) */
  context?: {
    /** File paths that were in context */
    files?: string[];
    /** Additional context metadata */
    metadata?: Record<string, unknown>;
  };

  /** Provider and model used for this conversation */
  provider?: {
    providerName: string;
    modelName?: string;
  };

  /** Workspace/project root directory */
  workspaceRoot?: string;
}

/**
 * Create a ConversationCheckpoint object.
 *
 * @param params - Checkpoint parameters
 * @returns ConversationCheckpoint object
 */
export function createConversationCheckpoint(params: {
  id?: string;
  name: string;
  description?: string;
  history: Content[];
  context?: ConversationCheckpoint['context'];
  provider?: ConversationCheckpoint['provider'];
  workspaceRoot?: string;
}): ConversationCheckpoint {
  const now = new Date().toISOString();
  return {
    id: params.id ?? `checkpoint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: params.name,
    description: params.description,
    createdAt: now,
    lastAccessedAt: now,
    history: params.history,
    context: params.context,
    provider: params.provider,
    workspaceRoot: params.workspaceRoot ?? process.cwd(),
  };
}

