export interface ModelResult {
    text: string | null;
    error: string | null;
}

export interface AnalysisResponse {
    chatgpt: ModelResult;
    gemini: ModelResult;
    claude: ModelResult;
    grok: ModelResult;
    conclusion: ModelResult;
}

const API_BASE = "http://localhost:3001";

export async function analyzeWithAllModels(
    query: string,
    role: string,
    depth: number
): Promise<AnalysisResponse> {
    const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, role, depth }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Server error ${response.status}: ${err}`);
    }

    return response.json() as Promise<AnalysisResponse>;
}

export interface DebateResponse {
    rounds: {
        round: number;
        label: string;
        messages: {
            modelId: string;
            text: string;
            confidenceScore: number;
            round: number;
        }[];
    }[];
}

export interface ConcludeDebateResponse {
    conclusion: {
        text: string | null;
        error: string | null;
    };
    convergenceRound: {
        round: number;
        label: string;
        messages: {
            modelId: string;
            text: string;
            confidenceScore: number;
            round: number;
        }[];
    };
}

export async function runDebate(
    topic: string,
    depth: string,
    rounds: number
): Promise<DebateResponse> {
    const response = await fetch(`${API_BASE}/api/debate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, depth, rounds }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server error ${response.status}`);
    }

    return response.json() as Promise<DebateResponse>;
}

export async function concludeDebate(
    topic: string,
    history: { modelId: string; text: string; round?: number }[]
): Promise<ConcludeDebateResponse> {
    const response = await fetch(`${API_BASE}/api/debate/conclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, history }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Server error ${response.status}: ${err}`);
    }

    return response.json() as Promise<DebateResponse>;
}

export interface UserReplyResponse {
    round: {
        label: string;
        messages: {
            modelId: string;
            text: string;
            confidenceScore: number;
        }[];
    };
}

export async function sendUserReply(
    topic: string,
    userMessage: string,
    debateHistory: { modelId: string; text: string }[],
    targetModelId?: string,
    targetExcerpt?: string
): Promise<UserReplyResponse> {
    const response = await fetch(`${API_BASE}/api/debate/user-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, userMessage, debateHistory, targetModelId, targetExcerpt }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Server error ${response.status}: ${err}`);
    }

    return response.json() as Promise<UserReplyResponse>;
}

export async function checkServerHealth(): Promise<{
    status: string;
    models: Record<string, boolean>;
}> {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.json();
}
