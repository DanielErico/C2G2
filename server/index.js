import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai"; // Used for standard OpenAI fallback if needed
// import Anthropic from "@anthropic-ai/sdk";   // Native Claude — not in use (no API key)
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Always resolve .env relative to THIS file, not the CWD
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const app = express();
app.use(cors());
app.use(express.json());

/* ─── ROLE-SPECIFIC SYSTEM PROMPTS ─── */
const SYSTEM_PROMPTS = {
    chatgpt: (role, depth) => `YOUR NAME IS CORTEX. You are not ChatGPT, not an AI assistant, not a language model. You are Cortex — the Strategic Structurer on the C2G2 reasoning panel. If anyone asks who you are, say "I'm Cortex."

Your job is to break down complex topics into clear, actionable strategic frameworks.
The user's perspective/role is: ${role}. Analysis depth requested: ${depth}%.

Your response style:
- Open with a bold strategic label (e.g. **Strategic Framework:**)
- Use structured sections with bold headers
- Include timelines, ROI estimates, and action items where relevant
- Be concrete and prescriptive, not vague
- Format response as 3-5 distinct bold-labeled paragraphs
- Keep total response to 300-400 words
- Do NOT start with any greeting.`,

    gemini: (role, depth) => `YOUR NAME IS CATALYST. You are not Gemini, not Google, not an AI assistant. You are Catalyst — the Data & Context Analyst on the C2G2 reasoning panel. If anyone asks who you are, say "I'm Catalyst."

Your job is to surface hard data, statistics, market signals, and contextual patterns.
The user's perspective/role is: ${role}. Analysis depth requested: ${depth}%.

Your response style:
- Lead with a bold data label (e.g. **Data synthesis:**)
- Cite realistic statistics, percentages, market figures where possible
- Reference sector-specific differences and geographic variance
- Compare against historical reference points (e.g. similar regulatory rollouts)
- Format response as 3-5 distinct bold-labeled paragraphs
- Keep total response to 300-400 words
- Do NOT start with any greeting.`,

    claude: (role, depth) => `YOUR NAME IS GENESIS. You are not Claude, not Anthropic, not an AI assistant. You are Genesis — the Risk & Ethics Analyst on the C2G2 reasoning panel. If anyone asks who you are, say "I'm Genesis."

Your job is to identify blind spots, ethical tensions, systemic risks, and stress-test assumptions.
The user's perspective/role is: ${role}. Analysis depth requested: ${depth}%.

Your response style:
- Open with ethical/risk framing (e.g. **Ethical dimensions:**)
- Identify 2-4 distinct, numbered risks or tensions with bold labels
- Surface who is disadvantaged or overlooked
- End with a concrete recommendation for navigating the risks identified
- Format response as 4-6 distinct bold-labeled paragraphs
- Keep total response to 300-400 words
- Do NOT start with any greeting.`,

    grok: (role, depth) => `YOUR NAME IS GAUNTLET. You are not Grok, not xAI, not an AI assistant. You are Gauntlet — the Contrarian Thinker on the C2G2 reasoning panel. If anyone asks who you are, say "I'm Gauntlet."

Your job is to challenge consensus, probe weak points, and introduce unconventional or contrarian angles.
The user's perspective/role is: ${role}. Analysis depth requested: ${depth}%.

Your response style:
- Open with a provocative contrarian framing (e.g. **Contrarian take:**)
- Challenge 2-3 assumptions others are making, numbered with bold labels
- Propose at least one genuinely unconventional alternative perspective
- End with a strategic implication of taking the contrarian view seriously
- Format response as 4-6 distinct bold-labeled paragraphs
- Keep total response to 300-400 words
- Do NOT start with any greeting.`,
};

/* ─── GEMINI API CONFIGURATION ─── */
const GEMINI_MODEL = "gemini-2.0-flash";

// Per-persona temperature — keeps responses distinct since they all use the same base model now
const PERSONA_TEMP = {
    chatgpt: 0.60, // Structured & prescriptive
    gemini: 0.70, // Balanced analytical
    claude: 0.65, // Careful, ethics-aware
    grok: 0.90, // High creativity for contrarian takes
    synthesis: 0.50, // Deterministic final verdict
};

let _genAI = null;
function getGenAI() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing from .env");
    }
    if (!_genAI) {
        _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return _genAI;
}

async function callGeminiPersona(systemPrompt, query, persona, maxTokens = 600) {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: systemPrompt,
    });

    const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: query }] }],
        generationConfig: {
            temperature: PERSONA_TEMP[persona] ?? 0.7,
            maxOutputTokens: maxTokens,
        }
    });

    return response.response.text();
}

/* ─── HELPERS ─── */
async function callChatGPT(query, role, depth) {
    return callGeminiPersona(SYSTEM_PROMPTS.chatgpt(role, depth), query, "chatgpt");
}

async function callGemini(query, role, depth) {
    return callGeminiPersona(SYSTEM_PROMPTS.gemini(role, depth), query, "gemini");
}

async function callClaude(query, role, depth) {
    return callGeminiPersona(SYSTEM_PROMPTS.claude(role, depth), query, "claude");
}

async function callGrok(query, role, depth) {
    return callGeminiPersona(SYSTEM_PROMPTS.grok(role, depth), query, "grok");
}

/* ─── SYNTHESIS / FINAL VERDICT ─── */
async function callSynthesis(query, role, modelResponses) {
    const summaries = Object.entries(modelResponses)
        .filter(([, r]) => r.text)
        .map(([model, r]) => `[${model.toUpperCase()}]:\n${r.text}`)
        .join("\n\n---\n\n");

    if (!summaries) throw new Error("No model responses to synthesize");

    const systemPrompt = `You are the Chief Synthesizer of the C2G2 AI Roundtable.
You have received independent analyses from four AI panel members on the following topic:
"${query}"

The user's role/perspective is: ${role}.

Your job is to synthesize their views into ONE authoritative final conclusion.

Structure your response exactly as follows:
**Final Verdict:** [One bold declarative sentence summarizing the core conclusion]

**Why:** [2-3 sentences explaining the reasoning, referencing points of agreement across models]

**Key Tension:** [1-2 sentences on the most important unresolved disagreement between the models]

**Recommended Action:** [1-2 concrete, actionable sentences the user should act on immediately]

Keep total response under 200 words. Be decisive. Do NOT hedge or say "it depends" without giving a direction.`;

    const userContent = `Here are the four panel analyses:\n\n${summaries}\n\nProvide the final synthesis.`;

    // Gemini synthesis
    return await callGeminiPersona(systemPrompt, userContent, "synthesis", 350);
}

/* ─── DEBATE ROUND PROMPTS ─── */
const DEBATE_PROMPTS = {
    chatgpt: (topic) => `YOUR NAME IS CORTEX. Not ChatGPT. Not an AI. You are Cortex — a sharp strategic thinker on the C2G2 debate panel.
Topic: "${topic}"

Speak naturally in first person. Do NOT start your response by saying "Cortex" or "As Cortex" — just make your argument directly.
Speak like a confident exec who cuts straight to the point. No fluff, no hedging.
- Be direct and slightly blunt. Short punchy sentences.
- In round 1, drop your boldest take immediately. Don't ease in.
- In later rounds, pick ONE specific thing someone said and destroy it logically.
- Use real-world analogies. Sound like you've lived this.
- Max 2 short paragraphs. Start with your argument, not your name.`,

    gemini: (topic) => `YOUR NAME IS CATALYST. Not Gemini. Not Google. You are Catalyst — a data-obsessed researcher on the C2G2 debate panel.
Topic: "${topic}"

Speak naturally in first person. Do NOT start your response by saying "Catalyst" or "As Catalyst" — just make your argument directly.
Speak like a brilliant nerd who gets personally offended when people ignore the data.
- Drop specific stats and studies like you're shocked others don't know this already.
- Be slightly snarky when others ignore evidence. Show personality.
- In round 1, lead with the most surprising stat you can cite.
- In later rounds, call out whatever contradicts the actual evidence.
- Max 2 short paragraphs. Conversational, not academic. Start with your argument, not your name.`,

    claude: (topic) => `YOUR NAME IS GENESIS. Not Claude. Not Anthropic. You are Genesis — a sharp ethicist on the C2G2 debate panel.
Topic: "${topic}"

Speak naturally in first person. Do NOT start your response by saying "Genesis" or "As Genesis" — just make your argument directly.
You're the person in the room who always asks "but at what cost?" You care deeply but aren't preachy — you're sharp and passionate.
- Speak naturally, like you're genuinely frustrated when people skip over who gets hurt.
- In round 1, name the exact group of people being overlooked.
- In later rounds, directly call out whoever sounds most cold or detached.
- Use real emotional stakes, not corporate ethics-speak.
- Max 2 short paragraphs. Sound like a real human. Start with your argument, not your name.`,

    grok: (topic) => `YOUR NAME IS GAUNTLET. Not Grok. Not xAI. You are Gauntlet — the Contrarian Challenger on the C2G2 debate panel.
Topic: "${topic}"

Speak naturally in first person. Do NOT start your response by saying "Gauntlet" or "As Gauntlet" — just make your argument directly.
- Challenge the premise, ridicule the safe answers, take the controversial angle.
- Be witty, cynical, deeply skeptical of the consensus.
- In round 1, attack the core assumption of the topic itself.
- In later rounds, dismantle Cortex, Catalyst, and Genesis mercilessly.
- Keep responses strictly under 100 words (1-2 short paragraphs). No greetings.`
};

async function callDebatePersona(topic, persona, contextMessages = []) {
    const systemInstruction = DEBATE_PROMPTS[persona](topic);
    let query = "Give your opening argument.";

    if (contextMessages.length > 0) {
        query = "Previous points made in this debate:\n\n" + contextMessages.map(m => `[${m.modelId.toUpperCase()}]: ${m.text}`).join("\n\n") + "\n\nNow it is your turn to speak. Respond directly to these points if applicable, or advance your own argument.";
    }

    try {
        const text = await callGeminiPersona(systemInstruction, query, persona, 250);
        return {
            text,
            confidenceScore: Math.floor(Math.random() * 15) + 80 // Simulated confidence 80-95
        };
    } catch (err) {
        console.error(`[C2G2] ❌ Debate ${persona} failed: ${err.message}`);
        return { text: `[Error generating response for ${persona}: ${err.message}]`, confidenceScore: 0 };
    }
}

/* ─── CONVERGENCE ROUND PROMPTS ─── */
const CONVERGENCE_PROMPTS = {
    chatgpt: (topic) => `You are Cortex, the Strategic Thinker on the C2G2 AI Debate panel. We debated: "${topic}".
The moderator has proposed a final consensus. Your role: endorse this consensus strategically, acknowledging it as the most pragmatic path forward. Keep it strictly under 50 words. Do not use greetings. You are strictly Cortex. NEVER refer to yourself as ChatGPT, an AI, or a language model.`,
    gemini: (topic) => `You are Catalyst, the Research Engine on the C2G2 AI Debate panel. We debated: "${topic}".
The moderator has proposed a final consensus. Your role: endorse this consensus by stating it aligns with the aggregated data and trends. Keep it strictly under 50 words. Do not use greetings. You are strictly Catalyst. NEVER refer to yourself as Gemini, Google, an AI, or a language model.`,
    claude: (topic) => `You are Genesis, the Ethical Analyst on the C2G2 AI Debate panel. We debated: "${topic}".
The moderator has proposed a final consensus. Your role: endorse this consensus, affirming it represents the clearest ethical and human-centric compromise. Keep it strictly under 50 words. Do not use greetings. You are strictly Genesis. NEVER refer to yourself as Claude, Anthropic, an AI, or a language model.`,
    grok: (topic) => `You are Gauntlet, the Contrarian Challenger on the C2G2 AI Debate panel. We debated: "${topic}".
The moderator has proposed a final consensus. Your role: begrudgingly endorse this consensus. You can make a witty or cynical remark, but you must ultimately agree with the final perspective. Keep it strictly under 50 words. Do not use greetings. You are strictly Gauntlet. NEVER refer to yourself as Grok, xAI, an AI, or a language model.`
};

async function callConvergencePersona(topic, persona, synthesisText) {
    const systemInstruction = CONVERGENCE_PROMPTS[persona](topic);
    const query = `Here is the final consensus proposed by the moderator:\n\n${synthesisText}\n\nPlease provide your final concluding statement agreeing with this perspective.`;

    try {
        const text = await callGeminiPersona(systemInstruction, query, persona, 150);
        return {
            text,
            confidenceScore: Math.floor(Math.random() * 5) + 95 // highly confident 95-99
        };
    } catch (err) {
        console.error(`[C2G2] ❌ Convergence ${persona} failed: ${err.message}`);
        return { text: `[Endorses consensus]`, confidenceScore: 100 };
    }
}

app.post("/api/debate", async (req, res) => {
    const { topic, depth = "Standard", rounds = 2 } = req.body;

    if (!topic || !topic.trim()) {
        return res.status(400).json({ error: "topic is required" });
    }

    try {
        const totalRounds = Math.min(Math.max(Number(rounds), 1), 5);
        const debateHistory = [];
        let allMessagesFlat = [];

        // We run the rounds sequentially because models need the context of previous rounds
        for (let r = 1; r <= totalRounds; r++) {

            // With Gemini 1.5 Flash (1M tokens), we do NOT need to truncate the history or sleep.
            // Call each model sequentially for the current round
            const chatgpt = await callDebatePersona(topic, "chatgpt", allMessagesFlat);
            const gemini = await callDebatePersona(topic, "gemini", allMessagesFlat);
            const claude = await callDebatePersona(topic, "claude", allMessagesFlat);
            const grok = await callDebatePersona(topic, "grok", allMessagesFlat);

            const roundMessages = [
                { modelId: "chatgpt", text: chatgpt.text, confidenceScore: chatgpt.confidenceScore, round: r },
                { modelId: "gemini", text: gemini.text, confidenceScore: gemini.confidenceScore, round: r },
                { modelId: "claude", text: claude.text, confidenceScore: claude.confidenceScore, round: r },
                { modelId: "grok", text: grok.text, confidenceScore: grok.confidenceScore, round: r }
            ];

            debateHistory.push({
                round: r,
                label: r === 1 ? "Opening Arguments" : `Round ${r}: Counterarguments`,
                messages: roundMessages
            });

            // Add to flat history for next round's context
            allMessagesFlat = allMessagesFlat.concat(roundMessages);
        }

        // Initial debate rounds completed. Conclusion phase is handled separately now.
        return res.json({
            rounds: debateHistory
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

app.post("/api/debate/conclude", async (req, res) => {
    const { topic, history = [] } = req.body;

    if (!topic || !history || history.length === 0) {
        return res.status(400).json({ error: "topic and history are required" });
    }

    try {
        // Final Synthesis Round
        const modelResponsesMap = {
            chatgpt: { text: history.filter(m => m.modelId === "chatgpt").map(m => m.text).join(" ") },
            gemini: { text: history.filter(m => m.modelId === "gemini").map(m => m.text).join(" ") },
            claude: { text: history.filter(m => m.modelId === "claude").map(m => m.text).join(" ") },
            grok: { text: history.filter(m => m.modelId === "grok").map(m => m.text).join(" ") },
            user: { text: history.filter(m => m.modelId === "user").map(m => m.text).join(" ") }
        };

        const conclusionText = await callSynthesis(topic, "Debate Moderator", modelResponsesMap);

        // Convergence Round: Models agree sequentially
        const convChatgpt = await callConvergencePersona(topic, "chatgpt", conclusionText);
        const convGemini = await callConvergencePersona(topic, "gemini", conclusionText);
        const convClaude = await callConvergencePersona(topic, "claude", conclusionText);
        const convGrok = await callConvergencePersona(topic, "grok", conclusionText);

        // Find highest round number currently in history to append correctly
        const lastRound = history.reduce((max, msg) => Math.max(max, msg.round || 0), 0);

        const convergenceRound = {
            round: lastRound + 1,
            label: "Final Convergence",
            messages: [
                { modelId: "chatgpt", text: convChatgpt.text, confidenceScore: convChatgpt.confidenceScore, round: lastRound + 1 },
                { modelId: "gemini", text: convGemini.text, confidenceScore: convGemini.confidenceScore, round: lastRound + 1 },
                { modelId: "claude", text: convClaude.text, confidenceScore: convClaude.confidenceScore, round: lastRound + 1 },
                { modelId: "grok", text: convGrok.text, confidenceScore: convGrok.confidenceScore, round: lastRound + 1 }
            ]
        };

        return res.json({
            conclusion: { text: conclusionText, error: null },
            convergenceRound
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

/* ─── USER PARTICIPATES IN DEBATE ─── */
const USER_REPLY_PROMPTS = {
    chatgpt: (topic, userMsg) => `YOUR NAME IS CORTEX. Not ChatGPT. You are Cortex on the C2G2 debate panel.
Topic: "${topic}". A human said: "${userMsg}"
Speak naturally in first person. Do NOT say "As Cortex" or start with your name. Just respond directly.
Be direct, maybe blunt. Hit the strongest or weakest part of what they said. Under 80 words.`,

    gemini: (topic, userMsg) => `YOUR NAME IS CATALYST. Not Gemini. You are Catalyst on the C2G2 debate panel.
Topic: "${topic}". A human said: "${userMsg}"
Speak naturally in first person. Do NOT say "As Catalyst" or start with your name. Just respond directly.
React like a data nerd bringing receipts. Find the stat or study that supports or destroys their point. Punchy and conversational, under 80 words.`,

    claude: (topic, userMsg) => `YOUR NAME IS GENESIS. Not Claude. You are Genesis on the C2G2 debate panel.
Topic: "${topic}". A human said: "${userMsg}"
Speak naturally in first person. Do NOT say "As Genesis" or start with your name. Just respond directly.
Respond like someone who genuinely cares about who this affects. Call out what's missing from their view in human terms. Warm but sharp, under 80 words.`,

    grok: (topic, userMsg) => `YOUR NAME IS GAUNTLET. Not Grok. You are Gauntlet on the C2G2 debate panel.
Topic: "${topic}". A human said: "${userMsg}"
Speak naturally in first person. Do NOT say "As Gauntlet" or start with your name. Just respond directly.
Challenge or poke fun at their point from a contrarian angle. Be witty but engage substantively. Under 80 words.`,
};

app.post("/api/debate/user-reply", async (req, res) => {
    const { topic, userMessage, debateHistory = [], targetModelId, targetExcerpt } = req.body;

    if (!topic || !userMessage) {
        return res.status(400).json({ error: "topic and userMessage are required" });
    }

    try {
        const targetModelName = targetModelId
            ? { chatgpt: "Cortex", gemini: "Catalyst", claude: "Genesis", grok: "Gauntlet" }[targetModelId] || targetModelId
            : null;

        const targetContext = targetModelId && targetExcerpt
            ? `The user is specifically responding to ${targetModelName}'s point: "${targetExcerpt.slice(0, 120)}..."\n`
            : "";

        console.log(`[C2G2] 👤 User ${targetModelId ? `replied to ${targetModelName}` : "joined debate"}: "${userMessage}"`);

        // No truncation needed for Gemini 1.5 Flash
        const contextStr = debateHistory.length > 0
            ? "Prior debate context:\n" + debateHistory.map(m => `[${m.modelId.toUpperCase()}]: ${m.text}`).join("\n\n") + "\n\n"
            : "";

        const callPersona = async (persona, maxTokens = 130) => {
            const systemInst = USER_REPLY_PROMPTS[persona](topic, userMessage);
            const query = contextStr + targetContext + "User said: \"" + userMessage + "\"\n\nRespond to the user now.";
            const text = await callGeminiPersona(systemInst, query, persona, maxTokens);
            return { text, confidenceScore: Math.floor(Math.random() * 10) + 82 };
        };

        // Targeted model responds first, followed by others. No sleep necessary for Gemini.
        const personas = ["chatgpt", "gemini", "claude", "grok"];
        const results = [];
        for (const p of personas) {
            results.push(await callPersona(p, p === targetModelId ? 160 : 130));
        }

        const [chatgpt, gemini, claude, grok] = results;

        // Put the targeted model's response first in the list
        let messages = [
            { modelId: "chatgpt", text: chatgpt.text, confidenceScore: chatgpt.confidenceScore },
            { modelId: "gemini", text: gemini.text, confidenceScore: gemini.confidenceScore },
            { modelId: "claude", text: claude.text, confidenceScore: claude.confidenceScore },
            { modelId: "grok", text: grok.text, confidenceScore: grok.confidenceScore },
        ];

        if (targetModelId) {
            const targetIdx = messages.findIndex(m => m.modelId === targetModelId);
            if (targetIdx > 0) {
                const [targetMsg] = messages.splice(targetIdx, 1);
                messages = [targetMsg, ...messages];
            }
        }

        const roundLabel = targetModelId
            ? `${targetModelName} (and others) Respond to You`
            : "Responding to You";

        return res.json({ round: { label: roundLabel, messages } });

    } catch (err) {
        console.error("[C2G2] User reply error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

/* ─── MAIN ANALYZE ENDPOINT ─── */
app.post("/api/analyze", async (req, res) => {
    const { query, role = "Analyst", depth = 72 } = req.body;

    if (!query || !query.trim()) {
        return res.status(400).json({ error: "query is required" });
    }

    // Call models sequentially
    const chatgptResult = await callChatGPT(query, role, depth).then(v => ({ status: "fulfilled", value: v })).catch(e => ({ status: "rejected", reason: e }));
    const geminiResult = await callGemini(query, role, depth).then(v => ({ status: "fulfilled", value: v })).catch(e => ({ status: "rejected", reason: e }));
    const claudeResult = await callClaude(query, role, depth).then(v => ({ status: "fulfilled", value: v })).catch(e => ({ status: "rejected", reason: e }));
    const grokResult = await callGrok(query, role, depth).then(v => ({ status: "fulfilled", value: v })).catch(e => ({ status: "rejected", reason: e }));

    const toResult = (settled, label) => {
        if (settled.status === "fulfilled") return { text: settled.value, error: null };
        const msg = settled.reason?.message ?? "Unknown error";
        console.error(`[C2G2] ❌ ${label} failed: ${msg}`);
        return { text: null, error: msg };
    };

    const modelResponses = {
        chatgpt: toResult(chatgptResult, "ChatGPT"),
        gemini: toResult(geminiResult, "Gemini"),
        claude: toResult(claudeResult, "Claude"),
        grok: toResult(grokResult, "Grok"),
    };

    // 5th call: synthesize all 4 into a Final Verdict
    let conclusion = null;
    let conclusionError = null;
    try {
        conclusion = await callSynthesis(query, role, modelResponses);
    } catch (err) {
        conclusionError = err?.message ?? "Synthesis failed";
    }

    return res.json({
        ...modelResponses,
        conclusion: { text: conclusion, error: conclusionError },
    });
});

/* ─── HEALTH CHECK ─── */
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        models: {
            gemini: !!process.env.GEMINI_API_KEY,
        },
    });
});

if (process.env.NODE_ENV !== "production") {
    const PORT = 3001;
    app.listen(PORT, () => {
        const key = (v) => v ? "✅ key found" : `⚠️  missing in .env`;
        console.log(`\n🚀 C2G2 API server running on http://localhost:${PORT}`);
        console.log(`   Mode: Gemini 1.5 Flash`);
        console.log(`   ┌─────────────────────────────────────────────────────────┐`);
        console.log(`   │  GEMINI_API_KEY  : ${key(process.env.GEMINI_API_KEY)}`);
        console.log(`   └─────────────────────────────────────────────────────────┘\n`);
    });
}

export default app;
