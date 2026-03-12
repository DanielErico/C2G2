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

import * as pdfjsLib from "pdfjs-dist";
// Ensure PDF.js worker is loaded correctly in Vite
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const API_BASE = (typeof window !== "undefined" && window.location.hostname === "localhost")
    ? "http://localhost:3001"
    : "";

export async function analyzeWithAllModels(
    query: string,
    role: string,
    depth: number,
    documentContext?: string
): Promise<AnalysisResponse> {
    const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, role, depth, documentContext }),
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
    rounds: number,
    documentContext?: string
): Promise<DebateResponse> {
    const response = await fetch(`${API_BASE}/api/debate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, depth, rounds, documentContext }),
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

    return response.json() as Promise<ConcludeDebateResponse>;
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

export async function extractTextFromFile(file: File): Promise<{ text: string }> {
    if (file.type === "application/pdf") {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDocument = await loadingTask.promise;
            let fullText = "";

            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(" ");
                fullText += pageText + "\n";
            }

            return { text: fullText };
        } catch (error) {
            console.error("PDF extraction failed:", error);
            throw new Error("Failed to extract text from PDF in the browser.");
        }
    } else if (file.type.startsWith("text/") || file.type === "application/json" || file.type === "text/csv") {
        const text = await file.text();
        return { text };
    } else {
        throw new Error("Unsupported file type. Please upload a PDF or text file.");
    }
}

export async function checkServerHealth(): Promise<{
    status: string;
    models: Record<string, boolean>;
}> {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.json();
}

export interface SharedDebateData {
    id: string;
    timestamp: number;
    topic: string;
    messages: { modelId: string; text: string; confidenceScore: number; round: number; label?: string; isReaction?: boolean; id: string }[];
    conclusion: { text: string | null; error: string | null };
}

export async function shareDebate(
    topic: string,
    messages: any[],
    conclusion: { text: string | null; error: string | null }
): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE}/api/debate/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, messages, conclusion }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server error ${response.status}`);
    }

    return response.json();
}

export async function getSharedDebate(id: string): Promise<SharedDebateData> {
    const response = await fetch(`${API_BASE}/api/debate/share/${id}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server error ${response.status}`);
    }

    return response.json();
}
