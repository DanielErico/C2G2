import { motion } from "motion/react";
import { GitMerge, Activity, Lightbulb, Fingerprint } from "lucide-react";

export interface ConsensusPanelProps {
    topic: string;
    outcome: "Consensus" | "Split Decision" | "No Agreement";
    summaryText: string;
}

export function ConsensusPanel({
    topic,
    outcome,
    summaryText,
}: ConsensusPanelProps) {
    // Determine color and icon by outcome type
    const isConsensus = outcome === "Consensus";
    const outcomeColor = isConsensus ? "#10b981" : outcome === "Split Decision" ? "#f59e0b" : "#ef4444";
    const glow = isConsensus ? "rgba(16,185,129,0.15)" : outcome === "Split Decision" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)";

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{
                background: "var(--card)",
                border: `1px solid ${outcomeColor}`,
                borderRadius: "20px",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
                boxShadow: `0 0 40px ${glow}`,
                display: "flex",
                flexDirection: "column",
                gap: "24px",
            }}
        >
            {/* Background decoration */}
            <div
                style={{
                    position: "absolute",
                    top: "-50px",
                    right: "-50px",
                    width: "200px",
                    height: "200px",
                    background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
                    pointerEvents: "none",
                }}
            />

            {/* Top Section - Status & Summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            background: isConsensus ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `1px solid ${isConsensus ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                        }}
                    >
                        <GitMerge size={24} style={{ color: outcomeColor }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, color: "var(--foreground)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                            AI Consensus Engine
                        </h2>
                        <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "14px" }}>
                            Final synthesis across 4 models
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        padding: "20px",
                        background: "var(--secondary)",
                        borderRadius: "14px",
                        border: "1px solid var(--border)",
                        flex: 1,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Final Outcome:
                        </span>
                        <div
                            style={{
                                padding: "4px 10px",
                                background: isConsensus ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                                border: `1px solid ${isConsensus ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                                borderRadius: "6px",
                                color: outcomeColor,
                                fontSize: "12px",
                                fontWeight: 800,
                            }}
                        >
                            {outcome}
                        </div>
                    </div>

                    <p style={{ margin: 0, color: "var(--foreground)", fontSize: "15px", lineHeight: 1.7 }}>
                        {summaryText}
                    </p>
                </div>
            </div>

            {/* Bottom Section - Reasoning Visual Tree (Placeholder) */}
            <div
                style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.02)",
                    borderRadius: "14px",
                    border: "1px dashed var(--border)",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <Activity size={16} style={{ color: "#60a5fa" }} />
                    <h3 style={{ margin: 0, color: "var(--foreground)", fontSize: "15px", fontWeight: 700 }}>
                        Reasoning Graph
                    </h3>
                </div>

                {/* Dummy Tree Visual */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "center", position: "relative" }}>

                    {/* Connecting line */}
                    <div style={{ position: "absolute", left: "15px", top: "20px", bottom: "20px", width: "2px", background: "var(--border)", zIndex: 0 }} />

                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        style={{ display: "flex", gap: "12px", zIndex: 1, position: "relative" }}
                    >
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#10b981", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--card)" }}>
                            <Lightbulb size={14} color="white" />
                        </div>
                        <div style={{ background: "var(--card)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "12px", color: "var(--muted-foreground)" }}>
                            <strong style={{ color: "var(--foreground)", display: "block", marginBottom: "2px" }}>Initial Stances</strong>
                            Efficiency vs. Ethical Risk
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                        style={{ display: "flex", gap: "12px", zIndex: 1, position: "relative" }}
                    >
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f97316", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--card)" }}>
                            <GitMerge size={14} color="white" />
                        </div>
                        <div style={{ background: "var(--card)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "12px", color: "var(--muted-foreground)" }}>
                            <strong style={{ color: "var(--foreground)", display: "block", marginBottom: "2px" }}>Counter-Arguments</strong>
                            Human-in-the-loop validation
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                        style={{ display: "flex", gap: "12px", zIndex: 1, position: "relative" }}
                    >
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: outcomeColor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--card)", boxShadow: `0 0 15px ${glow}` }}>
                            <Fingerprint size={14} color="white" />
                        </div>
                        <div style={{ background: "var(--secondary)", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${outcomeColor}`, fontSize: "12px", color: "var(--foreground)", fontWeight: 500 }}>
                            Synthesized Conclusion Reached
                        </div>
                    </motion.div>

                </div>
            </div>

        </motion.div>
    );
}
