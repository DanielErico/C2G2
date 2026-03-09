export type AIModelId = "chatgpt" | "gemini" | "claude" | "grok";

export interface DebateMessage {
    id: string; // We'll generate this on client for React keys
    modelId: AIModelId;
    round: number;
    text: string;
    confidenceScore: number;
    // Removing evidence/challenge for now to fit the simpler chat bubble UI, 
    // but they can be added back if the backend expands.
}

export interface DebateRoundData {
    round: number;
    label: string;
    messages: Omit<DebateMessage, "id">[];
}

export type DebateStatus = "idle" | "running" | "paused" | "awaiting_conclusion" | "completed" | "error";

