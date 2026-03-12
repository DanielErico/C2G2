import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { ModeToggle } from "../components/ModeToggle";
import { DebateCard, AIModelId } from "../components/debate/DebateCard";
import { ConsensusPanel } from "../components/debate/ConsensusPanel";
import { getSharedDebate, SharedDebateData } from "../../lib/api";
import { Swords, ExternalLink, ShieldAlert } from "lucide-react";

export function SharedDebatePage() {
    const { id } = useParams<{ id: string }>();
    const [debateData, setDebateData] = useState<SharedDebateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!id) return;
        
        getSharedDebate(id)
            .then((data) => {
                setDebateData(data);
                if (data.topic) document.title = `C2G2 Debate: ${data.topic}`;
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setErrorMsg(err.message || "Failed to load shared debate");
                setLoading(false);
            });
    }, [id]);

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                background: "var(--background)",
                fontFamily: "'Inter', sans-serif",
                overflow: "hidden",
            }}
        >
            <Sidebar />

            {/* Main content */}
            <div
                className="md:ml-[220px]"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    overflow: "hidden",
                }}
            >
                {/* ── Top Bar ── */}
                <header
                    style={{
                        height: "58px",
                        minHeight: "58px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 24px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--background)",
                        position: "sticky",
                        top: 0,
                        zIndex: 20,
                        gap: "16px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "var(--muted-foreground)",
                                fontSize: "12px",
                            }}
                        >
                            <span>Dashboard</span>
                            <span>/</span>
                            <span style={{ color: "var(--foreground)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Swords size={12} style={{ color: "#f97316" }} /> Shared Debate
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <a
                            href="https://c2-g2.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 14px",
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                color: "var(--foreground)",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                textDecoration: "none",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "var(--border)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "var(--secondary)";
                            }}
                        >
                            <ExternalLink size={14} />
                            Visit Main Site
                        </a>

                        <ModeToggle />
                    </div>
                </header>

                {/* ── Main Layout ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {loading && (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "14px" }}>
                            Loading shared debate...
                        </div>
                    )}

                    {errorMsg && (
                        <div style={{ padding: "20px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "12px" }}>
                            <ShieldAlert size={18} />
                            <span style={{ fontSize: "14px", fontWeight: 500 }}>{errorMsg}</span>
                        </div>
                    )}

                    {debateData && (
                        <>
                            <div
                                style={{
                                    background: "var(--card)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "18px",
                                    padding: "22px 24px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <Swords size={14} style={{ color: "#f97316" }} />
                                    <span
                                        style={{
                                            color: "#f97316",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            letterSpacing: "0.06em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Debate Topic
                                    </span>
                                </div>
                                <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--foreground)", lineHeight: 1.5 }}>
                                    {debateData.topic}
                                </div>
                                <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--muted-foreground)" }}>
                                    Shared on {new Date(debateData.timestamp).toLocaleString()}
                                </div>
                            </div>

                            {/* Messages */}
                            {debateData.messages.map((msg, i) => {
                                const isUser = msg.modelId === "user";
                                return (
                                    <div
                                        key={msg.id || i}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: isUser ? "flex-end" : "flex-start",
                                            width: "100%",
                                        }}
                                    >
                                        {msg.label && (
                                            <div style={{ textAlign: "center", margin: "32px auto 16px auto", width: "100%" }}>
                                                <span style={{ background: "var(--secondary)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                                                    {msg.label}
                                                </span>
                                            </div>
                                        )}
                                        <div style={{ maxWidth: "85%", minWidth: "300px" }}>
                                            <DebateCard
                                                modelId={msg.modelId as AIModelId}
                                                text={msg.text}
                                                confidenceScore={msg.confidenceScore}
                                                isReaction={msg.isReaction}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Consensus */}
                            {debateData.conclusion && (
                                <ConsensusPanel
                                    topic={debateData.topic}
                                    outcome={debateData.conclusion.text ? "Consensus" : "No Agreement"}
                                    summaryText={debateData.conclusion.text || "No synthesis could be generated."}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
