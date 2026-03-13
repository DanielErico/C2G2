import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { ModeToggle } from "../components/ModeToggle";
import { getHistory, deleteSession, SavedSession, hasLocalHistory, syncLocalToCloud } from "../../lib/history";
import { useAuth } from "../../lib/auth";
import { Clock, MessageSquare, FlaskConical, Trash2, Calendar, FileText, X, Share2 } from "lucide-react";
import { DEBATE_MODELS } from "../components/debate/DebateCard";
import { shareDebate } from "../../lib/api";
import { toast } from "sonner";

export function HistoryPage() {
    const [history, setHistory] = useState<SavedSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const { user } = useAuth();
    const [showSyncPrompt, setShowSyncPrompt] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        getHistory().then(setHistory);
        if (user && hasLocalHistory()) {
            setShowSyncPrompt(true);
        }
    }, [user]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncLocalToCloud();
            const updated = await getHistory();
            setHistory(updated);
            setShowSyncPrompt(false);
            toast.success("Local history synced to your account");
        } catch (err) {
            toast.error("Failed to sync local history");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleShareSession = async (session: SavedSession) => {
        if (session.type !== "debate" || !session.fullData || !session.fullData.consensus) {
            toast.error("Complete data not available for sharing.");
            return;
        }
        setIsSharing(true);
        try {
            const messages = session.fullData.messages || [];
            const conclusion = session.fullData.consensus;
            const res = await shareDebate(session.topic, messages, conclusion);
            const url = `${window.location.origin}/debate/shared/${res.id}`;
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate share link.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteSession(id);
        const updated = await getHistory();
        setHistory(updated);
    };

    const groupHistoryByDate = (sessions: SavedSession[]) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = new Date(today - 86400000).getTime();

        const groups: Record<string, SavedSession[]> = {
            "Today": [],
            "Yesterday": [],
            "Previous 7 Days": [],
            "Older": []
        };

        sessions.forEach(session => {
            const date = new Date(session.timestamp).getTime();
            if (date >= today) groups["Today"].push(session);
            else if (date >= yesterday) groups["Yesterday"].push(session);
            else if (date >= today - (7 * 86400000)) groups["Previous 7 Days"].push(session);
            else groups["Older"].push(session);
        });

        return groups;
    };

    const groupedHistory = groupHistoryByDate(history);
    const hasHistory = history.length > 0;

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)", fontFamily: "'Inter', sans-serif" }}>
            <Sidebar />

            <main
                className="md:ml-[220px]"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    overflow: "hidden",
                }}>
                {/* Header (Matches ReasoningPage) */}
                <header style={{
                    height: "58px",
                    minHeight: "58px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--background)",
                    zIndex: 20,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Clock size={16} />
                            <h1 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "var(--foreground)" }}>
                                Activity History
                            </h1>
                        </div>
                    </div>
                    <ModeToggle />
                </header>

                {/* Content Area */}
                <div className="px-4 py-8 md:px-10 md:py-8" style={{ flex: 1, overflowY: "auto" }}>
                    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                        
                        {showSyncPrompt && (
                            <div style={{
                                background: "rgba(59, 130, 246, 0.1)",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                borderRadius: "16px",
                                padding: "20px",
                                marginBottom: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "20px"
                            }}>
                                <div>
                                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px 0" }}>Local history found</h3>
                                    <p style={{ margin: 0, fontSize: "13px", color: "var(--muted-foreground)" }}>You have debates saved on this device. Would you like to sync them to your account?</p>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        onClick={() => setShowSyncPrompt(false)}
                                        style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", color: "var(--foreground)", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={handleSync}
                                        disabled={isSyncing}
                                        style={{ background: "#3b82f6", border: "none", padding: "8px 16px", borderRadius: "8px", color: "white", fontSize: "13px", cursor: isSyncing ? "not-allowed" : "pointer", fontWeight: 600 }}
                                    >
                                        {isSyncing ? "Syncing..." : "Sync Now"}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: "32px" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 8px 0" }}>Saved Sessions</h2>
                            <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "14px" }}>Review past debates and analysis runs.</p>
                        </div>

                        {!hasHistory ? (
                            <div style={{
                                textAlign: "center",
                                padding: "60px 20px",
                                background: "var(--card)",
                                borderRadius: "16px",
                                border: "1px dashed var(--border)",
                                color: "var(--muted-foreground)"
                            }}>
                                <FileText size={40} strokeWidth={1.5} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
                                <h3 style={{ fontSize: "16px", margin: "0 0 4px 0", color: "var(--foreground)" }}>No history yet</h3>
                                <p style={{ margin: 0, fontSize: "13px" }}>Completed debates and analyses will appear here.</p>
                            </div>
                        ) : (
                            Object.entries(groupedHistory).map(([groupName, sessions]) => {
                                if (sessions.length === 0) return null;
                                return (
                                    <div key={groupName} style={{ marginBottom: "32px" }}>
                                        <h3 style={{
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                            color: "var(--muted-foreground)",
                                            marginBottom: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            borderBottom: "1px solid var(--border)",
                                            paddingBottom: "8px"
                                        }}>
                                            <Calendar size={14} />
                                            {groupName}
                                        </h3>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <AnimatePresence>
                                                {sessions.map(session => (
                                                    <motion.div
                                                        key={session.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98, height: 0, overflow: "hidden", marginBottom: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        onClick={() => setSelectedSession(session)}
                                                        style={{
                                                            background: "var(--card)",
                                                            border: "1px solid var(--border)",
                                                            cursor: "pointer",
                                                            borderRadius: "12px",
                                                            padding: "16px 20px",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            gap: "20px",
                                                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                                                            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
                                                            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                                                            (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                                            (e.currentTarget as HTMLElement).style.transform = "none";
                                                        }}
                                                    >
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                                                <div style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    padding: "2px 8px",
                                                                    background: session.type === "debate" ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                                                    color: session.type === "debate" ? "#ef4444" : "#3b82f6",
                                                                    borderRadius: "6px",
                                                                    fontSize: "10px",
                                                                    fontWeight: 700,
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.2px"
                                                                }}>
                                                                    {session.type === "debate" ? <MessageSquare size={10} strokeWidth={2.5} /> : <FlaskConical size={10} strokeWidth={2.5} />}
                                                                    {session.type === "debate" ? "Debate" : "Analysis"}
                                                                </div>
                                                                <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                                                                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <h4 style={{
                                                                fontSize: "15px",
                                                                fontWeight: 600,
                                                                margin: "0 0 4px 0",
                                                                color: "var(--foreground)",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis"
                                                            }}>
                                                                {session.topic}
                                                            </h4>
                                                            <p style={{
                                                                margin: 0,
                                                                fontSize: "13px",
                                                                color: "var(--muted-foreground)",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis"
                                                            }}>
                                                                {session.snippet.replace(/\*\*[^*]+\*\*[:\s]*/g, "")}
                                                            </p>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(session.id);
                                                            }}
                                                            style={{
                                                                background: "transparent",
                                                                border: "none",
                                                                color: "var(--muted-foreground)",
                                                                cursor: "pointer",
                                                                padding: "8px",
                                                                borderRadius: "8px",
                                                                transition: "all 0.2s"
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                (e.currentTarget as HTMLElement).style.background = "rgba(239, 68, 68, 0.1)";
                                                                (e.currentTarget as HTMLElement).style.color = "#ef4444";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                                                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                                                            }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* VIEW MODAL */}
                <AnimatePresence>
                    {selectedSession && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedSession(null)}
                                style={{
                                    position: "fixed",
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: "rgba(0,0,0,0.4)",
                                    backdropFilter: "blur(4px)",
                                    zIndex: 100
                                }}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                style={{
                                    position: "fixed",
                                    top: "5%",
                                    bottom: "5%",
                                    left: "5%",
                                    right: "5%",
                                    width: "90%",
                                    maxWidth: "900px",
                                    background: "var(--background)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "24px",
                                    boxShadow: "0 24px 50px rgba(0,0,0,0.2)",
                                    zIndex: 101,
                                    display: "flex",
                                    flexDirection: "column",
                                    overflow: "hidden"
                                }}
                            >
                                {/* Modal Header */}
                                <div style={{
                                    padding: "20px 24px",
                                    borderBottom: "1px solid var(--border)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "var(--card)"
                                }}>
                                    <div>
                                        <div style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "4px 10px",
                                            background: selectedSession.type === "debate" ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                            color: selectedSession.type === "debate" ? "#ef4444" : "#3b82f6",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            marginBottom: "12px"
                                        }}>
                                            {selectedSession.type === "debate" ? <MessageSquare size={12} /> : <FlaskConical size={12} />}
                                            {selectedSession.type === "debate" ? "Debate Mode" : "Reasoning Analysis"}
                                        </div>
                                        <h2 style={{ fontSize: "20px", margin: 0, color: "var(--foreground)", lineHeight: 1.4 }}>
                                            {selectedSession.topic}
                                        </h2>
                                        <div style={{ fontSize: "13px", color: "var(--muted-foreground)", marginTop: "8px" }}>
                                            {new Date(selectedSession.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {selectedSession.type === "debate" && selectedSession.fullData && selectedSession.fullData.consensus && (
                                            <button
                                                onClick={() => handleShareSession(selectedSession)}
                                                disabled={isSharing}
                                                style={{
                                                    background: "var(--secondary)",
                                                    border: "none",
                                                    color: "var(--foreground)",
                                                    height: "40px",
                                                    borderRadius: "20px",
                                                    padding: "0 16px",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    gap: "6px",
                                                    cursor: isSharing ? "not-allowed" : "pointer",
                                                    opacity: isSharing ? 0.7 : 1,
                                                    fontWeight: 600,
                                                    fontSize: "13px"
                                                }}
                                            >
                                                <Share2 size={16} />
                                                {isSharing ? "Sharing..." : "Share"}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedSession(null)}
                                            style={{
                                                background: "var(--secondary)",
                                                border: "none",
                                                color: "var(--foreground)",
                                                width: "40px", height: "40px",
                                                borderRadius: "50%",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 md:p-8" style={{ flex: 1, overflowY: "auto", background: "var(--background)", display: "flex", flexDirection: "column", gap: "24px" }}>
                                    {!selectedSession.fullData ? (
                                        <div style={{ color: "var(--muted-foreground)", textAlign: "center", padding: "40px 0" }}>
                                            Legacy session: detail data not stored. <br /><br />
                                            {selectedSession.snippet}
                                        </div>
                                    ) : selectedSession.type === "reasoning" ? (
                                        <>
                                            {["chatgpt", "gemini", "claude", "grok"].map(modelKey => {
                                                const res = selectedSession.fullData[modelKey];
                                                const modelInfo = DEBATE_MODELS[modelKey as keyof typeof DEBATE_MODELS];
                                                if (!res?.text) return null;
                                                return (
                                                    <div key={modelKey} style={{ background: "var(--card)", padding: "24px", borderRadius: "16px", border: `1px solid ${modelInfo?.borderColor || "var(--border)"}` }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: modelInfo?.accentColor }}>
                                                            {modelInfo && <modelInfo.icon size={18} />}
                                                            <span style={{ fontWeight: 600 }}>{modelInfo?.name || modelKey}</span>
                                                        </div>
                                                        <div style={{ whiteSpace: "pre-wrap", color: "var(--muted-foreground)", fontSize: "14px", lineHeight: 1.6 }}>
                                                            {res.text}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedSession.fullData.conclusion?.text && (
                                                <div style={{ background: "rgba(59, 130, 246, 0.05)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(59,130,246,0.2)" }}>
                                                    <h3 style={{ margin: "0 0 16px 0", color: "#3b82f6", display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <FlaskConical size={18} /> Final Verdict
                                                    </h3>
                                                    <div style={{ whiteSpace: "pre-wrap", color: "var(--foreground)", fontSize: "14px", lineHeight: 1.6, fontWeight: 500 }}>
                                                        {selectedSession.fullData.conclusion.text}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {selectedSession.fullData.messages?.map((msg: any, i: number) => {
                                                const isUser = msg.modelId === "user";
                                                const modelInfo = !isUser ? DEBATE_MODELS[msg.modelId as keyof typeof DEBATE_MODELS] : null;
                                                return (
                                                    <div key={msg.id || i} style={{
                                                        background: "var(--card)", padding: "16px", borderRadius: "16px",
                                                        border: isUser ? "1px solid var(--border)" : `1px solid ${modelInfo?.borderColor || "var(--border)"}`,
                                                        alignSelf: isUser ? "flex-end" : "flex-start",
                                                        maxWidth: "90%",
                                                        marginLeft: isUser ? "auto" : 0
                                                    }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: isUser ? "var(--foreground)" : modelInfo?.accentColor }}>
                                                            {!isUser && modelInfo && <modelInfo.icon size={16} />}
                                                            <span style={{ fontWeight: 600, fontSize: "13px" }}>{isUser ? "You" : modelInfo?.name || msg.modelId}</span>
                                                        </div>
                                                        <div style={{ whiteSpace: "pre-wrap", color: "var(--muted-foreground)", fontSize: "14px", lineHeight: 1.6 }}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedSession.fullData.consensus?.text && (
                                                <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(16,185,129,0.2)" }}>
                                                    <h3 style={{ margin: "0 0 16px 0", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <MessageSquare size={18} /> Official Consensus
                                                    </h3>
                                                    <div style={{ whiteSpace: "pre-wrap", color: "var(--foreground)", fontSize: "14px", lineHeight: 1.6, fontWeight: 500 }}>
                                                        {selectedSession.fullData.consensus.text}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
