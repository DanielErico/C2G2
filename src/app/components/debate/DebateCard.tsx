import { motion, AnimatePresence } from "motion/react";
import { Brain, TrendingUp, Shield, Zap, Target, CornerUpLeft } from "lucide-react";
import { useState, useEffect } from "react";

export type AIModelId = "chatgpt" | "gemini" | "claude" | "grok" | "user";

export interface DebateParticipant {
    id: AIModelId;
    name: string;
    role: string;
    accentColor: string;
    glowColor: string;
    borderColor: string;
    badgeBg: string;
    icon: typeof Brain;
}

export const DEBATE_MODELS: Record<Exclude<AIModelId, "user">, DebateParticipant> = {
    chatgpt: {
        id: "chatgpt",
        name: "Cortex",
        role: "Strategic Thinker",
        accentColor: "#10b981",
        glowColor: "rgba(16,185,129,0.15)",
        borderColor: "rgba(16,185,129,0.22)",
        badgeBg: "rgba(16,185,129,0.1)",
        icon: Brain,
    },
    gemini: {
        id: "gemini",
        name: "Catalyst",
        role: "Research Engine",
        accentColor: "#3b82f6",
        glowColor: "rgba(59,130,246,0.15)",
        borderColor: "rgba(59,130,246,0.22)",
        badgeBg: "rgba(59,130,246,0.1)",
        icon: TrendingUp,
    },
    claude: {
        id: "claude",
        name: "Genesis",
        role: "Ethical Analyst",
        accentColor: "#a855f7",
        glowColor: "rgba(168,85,247,0.15)",
        borderColor: "rgba(168,85,247,0.22)",
        badgeBg: "rgba(168,85,247,0.1)",
        icon: Shield,
    },
    grok: {
        id: "grok",
        name: "Gauntlet",
        role: "Contrarian",
        accentColor: "#f97316",
        glowColor: "rgba(249,115,22,0.15)",
        borderColor: "rgba(249,115,22,0.22)",
        badgeBg: "rgba(249,115,22,0.1)",
        icon: Zap,
    },
};

export interface ChatMessageProps {
    modelId: AIModelId;
    text: string;
    confidenceScore: number;
    isTyping?: boolean;
    onReply?: () => void;
    isReaction?: boolean;
}

export function DebateCard({
    modelId,
    text,
    confidenceScore,
    isTyping = false,
    onReply,
    isReaction = false,
}: ChatMessageProps) {
    const [isHovered, setIsHovered] = useState(false);

    // ─── User Message Bubble ─────────────────────────────────
    if (modelId === "user") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                }}
                className="w-full"
            >
                <div className="max-w-[90%] md:max-w-[75%]" style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#14b8a6", fontWeight: 600 }}>You</span>
                        <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontWeight: 400 }}>Human</span>
                    </div>
                    <div
                        style={{
                            background: "linear-gradient(135deg, #0d9488, #0891b2)",
                            padding: "14px 18px",
                            borderRadius: "16px 4px 16px 16px",
                            color: "white",
                            fontSize: "14.5px",
                            lineHeight: 1.6,
                            boxShadow: "0 4px 20px rgba(13,148,136,0.25)",
                        }}
                    >
                        {text}
                    </div>
                </div>
                <div
                    style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #0d9488, #0891b2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "white",
                        boxShadow: "0 0 15px rgba(13,148,136,0.3)",
                    }}
                >
                    You
                </div>
            </motion.div >
        );
    }

    // ─── AI Model Bubble ─────────────────────────────────────
    const model = DEBATE_MODELS[modelId as Exclude<AIModelId, "user">];
    const Icon = model.icon;

    if (isReaction) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    margin: "12px 0",
                }}
            >
                <div
                    style={{
                        background: model.badgeBg,
                        border: `1px solid ${model.borderColor}`,
                        padding: "6px 16px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: `0 2px 10px ${model.glowColor}`,
                    }}
                >
                    <Icon size={14} style={{ color: model.accentColor }} />
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{
                display: "flex",
                gap: "16px",
            }}
            className="w-full max-w-[95%] md:max-w-[85%]"
        >
            {/* Avatar */}
            <div
                style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: model.badgeBg,
                    border: `1px solid ${model.borderColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 0 15px ${model.glowColor}`,
                }}
            >
                <Icon size={20} style={{ color: model.accentColor }} />
            </div>

            {/* Message Body */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)" }}>
                        {model.name}
                    </span>
                    <span style={{ fontSize: "12px", color: model.accentColor, fontWeight: 500 }}>
                        {model.role}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontWeight: 400, marginLeft: "auto" }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div
                    style={{
                        background: "var(--card)",
                        border: `1px solid var(--border)`,
                        borderRadius: "4px 16px 16px 16px",
                        padding: "16px 20px",
                        position: "relative",
                        color: "var(--foreground)",
                        fontSize: "14.5px",
                        lineHeight: 1.6,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                        wordBreak: "break-word",
                    }}
                >
                    {isTyping ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", height: "18px" }}>
                            <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} style={{ width: "6px", height: "6px", borderRadius: "50%", background: model.accentColor }} />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} style={{ width: "6px", height: "6px", borderRadius: "50%", background: model.accentColor }} />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} style={{ width: "6px", height: "6px", borderRadius: "50%", background: model.accentColor }} />
                        </div>
                    ) : (
                        <span>{text}</span>
                    )}

                    {!isTyping && confidenceScore > 0 && (
                        <div
                            style={{
                                marginTop: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "var(--muted-foreground)",
                            }}
                        >
                            <Target size={12} style={{ color: model.accentColor }} />
                            {confidenceScore}% CONFIDENCE
                        </div>
                    )}

                    {/* ─── Reply Button (hover reveal) ─── */}
                    <AnimatePresence>
                        {!isTyping && onReply && isHovered && (
                            <motion.button
                                key="reply-btn"
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.15 }}
                                onClick={onReply}
                                title={`Reply to ${model.name}`}
                                style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    background: model.badgeBg,
                                    border: `1px solid ${model.borderColor}`,
                                    borderRadius: "8px",
                                    padding: "4px 10px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: model.accentColor,
                                }}
                            >
                                <CornerUpLeft size={11} />
                                Reply
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
