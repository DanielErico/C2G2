import type { AnalysisResponse } from "./api";

export interface ConsensusData {
    insights: string[];
    disputed: string[];
    risks: string[];
    actions: string[];
    confidence: number;
}

/**
 * Derive a structured consensus summary from all 4 model responses.
 * Extracts bullet-like content from the bold-labelled paragraphs each model produces.
 */
export function buildConsensus(responses: AnalysisResponse): ConsensusData {
    const texts = [
        responses.chatgpt.text,
        responses.gemini.text,
        responses.claude.text,
        responses.grok.text,
    ].filter(Boolean) as string[];

    if (texts.length === 0) {
        return { insights: [], disputed: [], risks: [], actions: [], confidence: 0 };
    }

    // Extract the first sentence of each bold section as a summary bullet
    const extractBullets = (text: string): string[] => {
        const sections = text.split(/\*\*[^*]+\*\*[:\s]*/);
        return sections
            .slice(1) // skip anything before the first bold header
            .map((s) => s.split(/\n\n/)[0].replace(/\n/g, " ").trim())
            .filter((s) => s.length > 20)
            .slice(0, 2);
    };

    const chatgptBullets = responses.chatgpt.text ? extractBullets(responses.chatgpt.text) : [];
    const geminiBullets = responses.gemini.text ? extractBullets(responses.gemini.text) : [];
    const claudeBullets = responses.claude.text ? extractBullets(responses.claude.text) : [];
    const grokBullets = responses.grok.text ? extractBullets(responses.grok.text) : [];

    // Insights = what ChatGPT (strategy) + Gemini (data) agree on
    const insights = [...chatgptBullets.slice(0, 1), ...geminiBullets.slice(0, 2)].slice(0, 3);

    // Disputed = tensions raised by Claude (risks) and Grok (contrarian)
    const disputed = [...claudeBullets.slice(0, 1), ...grokBullets.slice(0, 1)].slice(0, 2);

    // Risks = Claude's risk sections
    const risks = claudeBullets.slice(0, 2);

    // Actions = ChatGPT's action items
    const actions = chatgptBullets.slice(0, 2);

    // Confidence: reduce by how many models errored
    const successCount = texts.length;
    const confidence = Math.round(65 + (successCount / 4) * 25);

    return { insights, disputed, risks, actions, confidence };
}
