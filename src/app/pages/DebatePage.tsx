import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { ModeToggle } from "../components/ModeToggle";
import { DebateCard, AIModelId, DEBATE_MODELS } from "../components/debate/DebateCard";
import { ConsensusPanel } from "../components/debate/ConsensusPanel";
import { DebateControls } from "../components/debate/DebateControls";
import { DebateStatus, DebateMessage } from "../components/debate/debateData";
import { runDebate, DebateResponse, sendUserReply, concludeDebate } from "../../lib/api";
import { saveSession } from "../../lib/history";
import {
    Search, Bell, Swords, Cpu, ChevronDown, SlidersHorizontal, Settings2, Play, AlertCircle, GitMerge, MessageSquarePlus, Send, UserRound, CornerUpLeft, CheckCircle, Zap
} from "lucide-react";

type DepthLevel = "Short" | "Standard" | "Deep";

interface ChatMessageData {
    id: string;
    modelId: AIModelId;
    text: string;
    confidenceScore: number;
    round: number;
    label?: string; // e.g. "Round 1: Opening Arguments"
}

export function DebatePage() {
    const [topic, setTopic] = useState("");
    const [depth, setDepth] = useState<DepthLevel>("Standard");
    const [rounds, setRounds] = useState(2);

    const [debateStatus, setDebateStatus] = useState<DebateStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Chat UI state
    const [visibleMessages, setVisibleMessages] = useState<ChatMessageData[]>([]);
    const [typingModel, setTypingModel] = useState<AIModelId | null>(null);
    const [consensusData, setConsensusData] = useState<{ text: string | null; error: string | null } | null>(null);

    const [searchVal, setSearchVal] = useState("");
    const [depthOpen, setDepthOpen] = useState(false);
    const [isConsensusOpen, setIsConsensusOpen] = useState(false);

    // User participation state
    const [userInput, setUserInput] = useState("");
    const [isUserReplying, setIsUserReplying] = useState(false);
    const [replyTarget, setReplyTarget] = useState<{ modelId: AIModelId; modelName: string; excerpt: string; accentColor: string } | null>(null);

    // Refs for pause/resume
    const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const pendingQueueRef = useRef<{ msg: ChatMessageData; delayMs: number }[]>([]);
    const conclusionRef = useRef<{ text: string | null; error: string | null } | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [visibleMessages, typingModel]);

    const handleStartDebate = async () => {
        if (!topic.trim()) return;
        setDebateStatus("running");
        setErrorMsg("");
        setVisibleMessages([]);
        setConsensusData(null);
        setTypingModel("chatgpt"); // Start by showing first model computing

        try {
            // Call Live Backend
            const res: DebateResponse = await runDebate(topic, depth, rounds);

            // Helper: schedule the pending queue from the current position
            const scheduleQueue = (queue: { msg: ChatMessageData; delayMs: number }[]) => {
                let delay = 0;
                queue.forEach(({ msg }, index) => {
                    const preId = setTimeout(() => { setTypingModel(msg.modelId); }, Math.max(0, delay - 800));
                    const msgId = setTimeout(() => {
                        setVisibleMessages(prev => [...prev, msg]);
                        pendingQueueRef.current = pendingQueueRef.current.filter(q => q.msg.id !== msg.id);
                        if (index === queue.length - 1) {
                            setTypingModel(null);

                            // Ask for user opinion before concluding
                            const modMessage: ChatMessageData = {
                                id: `mod-${Date.now()}`,
                                modelId: "chatgpt", // use the first model's styling or neutral if 'user'
                                text: "The council has presented their initial arguments. Before we draw a final conclusion, what is your take on this? (Send a reply, or click Conclude Debate when ready).",
                                confidenceScore: 100,
                                round: 0,
                                label: "Debate Moderator",
                            };
                            setVisibleMessages(prev => [...prev, modMessage]);
                            setDebateStatus("awaiting_conclusion");
                        }
                    }, delay);
                    timeoutIdsRef.current.push(preId, msgId);
                    delay += 3500;
                });
            };

            // Build the full message queue
            let delay = 0;
            const messagesQueue: { msg: ChatMessageData; delayMs: number }[] = [];
            res.rounds.forEach((rObj) => {
                rObj.messages.forEach((m, idx) => {
                    const msg: ChatMessageData = {
                        id: `${rObj.round}-${m.modelId}`,
                        modelId: m.modelId as AIModelId,
                        text: m.text,
                        confidenceScore: m.confidenceScore,
                        round: rObj.round,
                        label: idx === 0 ? rObj.label : undefined,
                    };
                    messagesQueue.push({ msg, delayMs: delay });
                    delay += 3500;
                });
            });

            pendingQueueRef.current = [...messagesQueue];
            timeoutIdsRef.current = [];
            scheduleQueue(messagesQueue);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to start debate");
            setDebateStatus("error");
            setTypingModel(null);
        }
    };

    const handlePause = () => {
        // Clear all pending timeouts
        timeoutIdsRef.current.forEach(id => clearTimeout(id));
        timeoutIdsRef.current = [];
        setTypingModel(null);
        setDebateStatus("paused");
    };

    const handleResume = () => {
        if (pendingQueueRef.current.length === 0) return;
        setDebateStatus("running");
        // Re-schedule remaining messages
        const remaining = pendingQueueRef.current;
        const conclusion = conclusionRef.current!;
        let delay = 0;
        remaining.forEach(({ msg }, index) => {
            const preId = setTimeout(() => { setTypingModel(msg.modelId); }, Math.max(0, delay - 800));
            const msgId = setTimeout(() => {
                setVisibleMessages(prev => [...prev, msg]);
                pendingQueueRef.current = pendingQueueRef.current.filter(q => q.msg.id !== msg.id);
                if (index === remaining.length - 1) {
                    setTypingModel(null);
                    // Determine if we were waiting for conclusion or completed
                    if (!conclusionRef.current) {
                        setDebateStatus("awaiting_conclusion");
                    } else {
                        setConsensusData(conclusionRef.current);
                        setDebateStatus("completed");
                        setIsConsensusOpen(true);
                    }
                }
            }, delay);
            timeoutIdsRef.current.push(preId, msgId);
            delay += 3500;
        });
    };

    const handleConcludeDebate = async () => {
        setDebateStatus("running");
        setIsUserReplying(true);
        setTypingModel("chatgpt");

        try {
            const historyContext = visibleMessages.map(m => ({ modelId: m.modelId, text: m.text, round: m.round }));
            const res = await concludeDebate(topic, historyContext);

            conclusionRef.current = res.conclusion;

            const convergenceMsgQueue: { msg: ChatMessageData; delayMs: number }[] = [];
            let delay = 0;
            res.convergenceRound.messages.forEach((m, idx) => {
                const msg: ChatMessageData = {
                    id: `conv-${m.modelId}-${Date.now()}`,
                    modelId: m.modelId as AIModelId,
                    text: m.text,
                    confidenceScore: m.confidenceScore,
                    round: res.convergenceRound.round,
                    label: idx === 0 ? res.convergenceRound.label : undefined,
                };
                convergenceMsgQueue.push({ msg, delayMs: delay });
                delay += 3500;
            });

            pendingQueueRef.current = [...convergenceMsgQueue];
            timeoutIdsRef.current = [];

            // Precompute final messages array to save to history, since state isn't synchronous inside setTimeout
            const finalMessages = [...visibleMessages, ...convergenceMsgQueue.map(q => q.msg)];

            // Re-use scheduling logic but trigger completion at the end
            convergenceMsgQueue.forEach((item, index) => {
                const { msg, delayMs } = item;
                const preId = setTimeout(() => { setTypingModel(msg.modelId); }, Math.max(0, delayMs - 800));
                const msgId = setTimeout(() => {
                    setVisibleMessages(prev => [...prev, msg]);
                    pendingQueueRef.current = pendingQueueRef.current.filter(q => q.msg.id !== msg.id);
                    if (index === convergenceMsgQueue.length - 1) {
                        setTypingModel(null);
                        setConsensusData(conclusionRef.current);
                        setDebateStatus("completed");
                        setIsConsensusOpen(true);
                        setIsUserReplying(false);

                        // Save to history
                        const synthesis = conclusionRef.current?.text || "";
                        const snippet = synthesis.length > 150 ? synthesis.substring(0, 150) + "..." : synthesis;
                        saveSession({
                            id: `debate_${Date.now()}`,
                            timestamp: Date.now(),
                            type: "debate",
                            topic: topic,
                            snippet: snippet || "Final verdict generated without synthesis text.",
                            fullData: {
                                messages: finalMessages,
                                consensus: conclusionRef.current
                            }
                        });
                    }
                }, delayMs);
                timeoutIdsRef.current.push(preId, msgId);
            });

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to conclude debate");
            setDebateStatus("error");
            setTypingModel(null);
            setIsUserReplying(false);
        }
    };

    const handleUserMessage = async () => {
        const msg = userInput.trim();
        if (!msg || isUserReplying || debateStatus === "idle") return;

        setUserInput("");
        setIsUserReplying(true);
        const currentReplyTarget = replyTarget;
        setReplyTarget(null);

        const userMsg: ChatMessageData = {
            id: `user-${Date.now()}`,
            modelId: "user",
            text: msg,
            confidenceScore: 100,
            round: 0,
            label: currentReplyTarget ? `Replying to ${currentReplyTarget.modelName}` : undefined,
        };
        setVisibleMessages(prev => [...prev, userMsg]);

        try {
            const historyContext = visibleMessages
                .filter(m => m.modelId !== "user")
                .slice(-10)
                .map(m => ({ modelId: m.modelId, text: m.text }));

            const res = await sendUserReply(
                topic, msg, historyContext,
                currentReplyTarget?.modelId,
                currentReplyTarget?.excerpt
            );

            let delay = 0;
            res.round.messages.forEach((m, idx) => {
                setTimeout(() => { setTypingModel(m.modelId as AIModelId); }, Math.max(0, delay - 600));
                setTimeout(() => {
                    const aiMsg: ChatMessageData = {
                        id: `user-reply-${m.modelId}-${Date.now()}`,
                        modelId: m.modelId as AIModelId,
                        text: m.text,
                        confidenceScore: m.confidenceScore,
                        round: 0,
                        label: idx === 0 ? res.round.label : undefined,
                    };
                    setVisibleMessages(prev => [...prev, aiMsg]);
                    if (idx === res.round.messages.length - 1) {
                        setTypingModel(null);
                        setIsUserReplying(false);
                    }
                }, delay);
                delay += 2500;
            });
        } catch (err: any) {
            console.error("User reply error:", err);
            setIsUserReplying(false);
        }
    };

    const isDebating = debateStatus === "running" || debateStatus === "paused";


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
                                gap: "8px",
                                background: "var(--secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: "10px",
                                padding: "7px 12px",
                                width: "280px",
                            }}
                        >
                            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
                            <input
                                value={searchVal}
                                onChange={(e) => setSearchVal(e.target.value)}
                                placeholder="Search debates…"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "var(--foreground)",
                                    fontSize: "13px",
                                    fontFamily: "'Inter', sans-serif",
                                    width: "100%",
                                }}
                            />
                        </div>

                        {/* Breadcrumb */}
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
                                <Swords size={12} style={{ color: "#f97316" }} /> Debate Mode
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "8px",
                                color: "var(--muted-foreground)",
                                position: "relative",
                            }}
                        >
                            <Bell size={16} />
                            <div
                                style={{
                                    position: "absolute",
                                    top: "5px",
                                    right: "5px",
                                    width: "6px",
                                    height: "6px",
                                    background: "#1d4ed8",
                                    borderRadius: "50%",
                                    border: "1.5px solid var(--background)",
                                }}
                            />
                        </button>

                        {/* Toggle Consensus Panel Button */}
                        {debateStatus === "completed" && (
                            <button
                                onClick={() => setIsConsensusOpen(!isConsensusOpen)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 14px",
                                    background: isConsensusOpen ? "rgba(16,185,129,0.15)" : "var(--secondary)",
                                    border: isConsensusOpen ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)",
                                    borderRadius: "8px",
                                    color: isConsensusOpen ? "#10b981" : "var(--foreground)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                <GitMerge size={14} />
                                {isConsensusOpen ? "Hide Consensus" : "View Conclusion"}
                            </button>
                        )}

                        <ModeToggle />

                        <div
                            style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #f97316, #ea580c)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "white",
                                cursor: "pointer",
                                boxShadow: "0 0 12px rgba(249,115,22,0.3)",
                            }}
                        >
                            AC
                        </div>
                    </div>
                </header>

                {/* ── Main Layout Split ── */}
                <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>

                    {/* ── Scrollable Chat Body ── */}
                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: "auto",
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px",
                            transition: "all 0.3s ease",
                        }}
                    >
                        {/* ── INPUT SECTION ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
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
                                    marginBottom: "14px",
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

                            {/* Textarea */}
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Should AI replace human recruiters in internship hiring?"
                                rows={2}
                                disabled={isDebating}
                                style={{
                                    width: "100%",
                                    background: "var(--secondary)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "12px",
                                    padding: "14px 16px",
                                    color: "var(--foreground)",
                                    fontSize: "15px",
                                    fontFamily: "'Inter', sans-serif",
                                    lineHeight: 1.6,
                                    resize: "none",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    boxSizing: "border-box",
                                    opacity: isDebating ? 0.6 : 1,
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "rgba(249,115,22,0.4)")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "var(--border)")
                                }
                            />

                            {/* Controls Row */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginTop: "14px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {/* Depth Selector */}
                                <div style={{ position: "relative" }}>
                                    <button
                                        onClick={() => !isDebating && setDepthOpen(!depthOpen)}
                                        disabled={isDebating}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "8px 14px",
                                            background: depthOpen ? "rgba(249,115,22,0.12)" : "var(--secondary)",
                                            border: depthOpen ? "1px solid rgba(249,115,22,0.3)" : "1px solid var(--border)",
                                            borderRadius: "9px",
                                            color: depthOpen ? "#f97316" : "var(--foreground)",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            cursor: isDebating ? "not-allowed" : "pointer",
                                            fontFamily: "'Inter', sans-serif",
                                            transition: "all 0.15s",
                                            opacity: isDebating ? 0.6 : 1,
                                        }}
                                    >
                                        <SlidersHorizontal size={12} style={{ color: "var(--muted-foreground)" }} />
                                        Depth: {depth}
                                        <ChevronDown
                                            size={11}
                                            style={{
                                                transform: depthOpen ? "rotate(180deg)" : "none",
                                                transition: "transform 0.2s",
                                                color: "var(--muted-foreground)"
                                            }}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {depthOpen && !isDebating && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                                                transition={{ duration: 0.15 }}
                                                style={{
                                                    position: "absolute",
                                                    top: "calc(100% + 6px)",
                                                    left: 0,
                                                    background: "var(--popover)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "12px",
                                                    padding: "6px",
                                                    zIndex: 50,
                                                    minWidth: "140px",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                {(["Short", "Standard", "Deep"] as DepthLevel[]).map((d) => (
                                                    <div
                                                        key={d}
                                                        onClick={() => {
                                                            setDepth(d);
                                                            setDepthOpen(false);
                                                        }}
                                                        style={{
                                                            padding: "8px 12px",
                                                            borderRadius: "8px",
                                                            color: d === depth ? "#f97316" : "var(--foreground)",
                                                            fontSize: "12px",
                                                            fontWeight: d === depth ? 600 : 400,
                                                            cursor: "pointer",
                                                            background: d === depth ? "rgba(249,115,22,0.1)" : "transparent",
                                                            transition: "all 0.1s",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (d !== depth) (e.currentTarget as HTMLElement).style.background = "var(--border)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (d !== depth) (e.currentTarget as HTMLElement).style.background = "transparent";
                                                        }}
                                                    >
                                                        {d}
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Rounds Slider */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "0 14px",
                                        background: "var(--secondary)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "9px",
                                        height: "33px",
                                        opacity: isDebating ? 0.6 : 1,
                                    }}
                                >
                                    <Settings2 size={12} style={{ color: "var(--muted-foreground)" }} />
                                    <span style={{ color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 500 }}>
                                        Rounds
                                    </span>
                                    <input
                                        type="range"
                                        min={1}
                                        max={5}
                                        value={rounds}
                                        onChange={(e) => setRounds(Number(e.target.value))}
                                        disabled={isDebating}
                                        style={{
                                            width: "80px",
                                            accentColor: "#f97316",
                                            cursor: isDebating ? "not-allowed" : "pointer",
                                        }}
                                    />
                                    <span style={{ color: "var(--foreground)", fontSize: "12px", fontWeight: 600, width: "12px" }}>
                                        {rounds}
                                    </span>
                                </div>

                                {/* Start Button */}
                                <button
                                    onClick={handleStartDebate}
                                    disabled={isDebating || !topic.trim()}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "7px",
                                        padding: "9px 22px",
                                        background: isDebating || !topic.trim()
                                            ? "var(--secondary)"
                                            : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                                        border: isDebating || !topic.trim() ? "1px solid var(--border)" : "none",
                                        borderRadius: "10px",
                                        color: isDebating || !topic.trim() ? "var(--muted-foreground)" : "#fff",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: isDebating || !topic.trim() ? "not-allowed" : "pointer",
                                        fontFamily: "'Inter', sans-serif",
                                        boxShadow: isDebating || !topic.trim() ? "none" : "0 0 20px rgba(234,88,12,0.4)",
                                        transition: "all 0.2s",
                                        whiteSpace: "nowrap",
                                        marginLeft: "auto",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isDebating && topic.trim()) {
                                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(234,88,12,0.6)";
                                            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isDebating && topic.trim()) {
                                            (e.currentTarget as HTMLElement).style.boxShadow = "none"; // Reset, wait, need a specific hex
                                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(234,88,12,0.3)";
                                            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                                        }
                                    }}
                                >
                                    {!isDebating && <Play size={13} fill="currentColor" />}
                                    {isDebating ? "Debate in Progress..." : "Start Debate"}
                                </button>
                            </div>
                        </motion.div>

                        {/* Error display */}
                        {debateStatus === "error" && (
                            <div style={{ color: "red", padding: "12px", background: "rgba(255,0,0,0.1)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}

                        {/* Middle Section (Chat Feed) */}
                        {(visibleMessages.length > 0 || debateStatus === "running") && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "24px",
                                    width: "100%",
                                    maxWidth: "1000px",
                                    margin: "0 auto",
                                }}
                            >
                                {visibleMessages.map((msg, idx) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {msg.label && (
                                            <div style={{ textAlign: "center", margin: "32px 0 16px 0" }}>
                                                <span style={{ background: "var(--secondary)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                                                    {msg.label}
                                                </span>
                                            </div>
                                        )}
                                        <DebateCard
                                            modelId={msg.modelId}
                                            text={msg.text}
                                            confidenceScore={msg.confidenceScore}
                                            onReply={msg.modelId !== "user" ? () => {
                                                // Pause if currently running
                                                if (debateStatus === "running") handlePause();
                                                const model = msg.modelId !== "user"
                                                    ? DEBATE_MODELS[msg.modelId as Exclude<AIModelId, "user">]
                                                    : null;
                                                setReplyTarget({
                                                    modelId: msg.modelId,
                                                    modelName: model?.name ?? msg.modelId,
                                                    excerpt: msg.text.slice(0, 100),
                                                    accentColor: model?.accentColor ?? "#14b8a6",
                                                });
                                                // Focus the reply bar
                                                document.getElementById("debate-reply-input")?.focus();
                                            } : undefined}
                                        />
                                    </motion.div>
                                ))}

                                {/* Typing Indicator */}
                                {debateStatus === "running" && typingModel && (
                                    <div style={{ marginTop: "16px" }}>
                                        <DebateCard
                                            modelId={typingModel}
                                            text=""
                                            confidenceScore={0}
                                            isTyping={true}
                                        />
                                    </div>
                                )}

                                {/* Dummy div to auto-scroll to */}
                                <div ref={chatEndRef} />
                            </div>
                        )}


                        {debateStatus === "awaiting_conclusion" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                style={{
                                    position: "absolute",
                                    bottom: "100px", // Float above the reply bar
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    zIndex: 50,
                                }}
                            >
                                <button
                                    onClick={handleConcludeDebate}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 20px",
                                        borderRadius: "14px",
                                        fontSize: "14px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "0 15px 40px rgba(16, 185, 129, 0.5)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.transform = "none";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(16, 185, 129, 0.4)";
                                    }}
                                >
                                    <CheckCircle size={20} />
                                    <span>Conclude Debate & Generate Verdict</span>
                                    <Zap size={16} style={{ color: "rgba(255,255,255,0.8)", marginLeft: "4px" }} />
                                </button>
                            </motion.div>
                        )}

                        {/* Custom Scrollbar Styling inside the component using a style block */}
                        <style>{`
                            .hide-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                            .hide-scrollbar {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                            }
                        `}</style>

                        {/* Explicit Spacer to ensure scroll always clears the fixed bottom controls */}
                        <div style={{ height: "80px", flexShrink: 0 }} />

                    </div>

                    {/* ── User Reply Bar ── */}
                    <AnimatePresence>
                        {(debateStatus === "running" || debateStatus === "completed" || debateStatus === "paused" || debateStatus === "awaiting_conclusion") && (
                            <motion.div
                                key="user-reply-bar"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 24 }}
                                transition={{ type: "spring", damping: 22, stiffness: 220 }}
                                className={`absolute bottom-0 left-0 z-40 px-6 pt-3 pb-4 transition-all duration-300 ease-in-out ${isConsensusOpen ? 'md:right-[420px] right-0' : 'right-0'}`}
                                style={{
                                    background: "linear-gradient(to top, var(--background) 80%, transparent 100%)",
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                    background: "var(--card)",
                                    border: replyTarget ? `1px solid ${replyTarget.accentColor}55` : isUserReplying ? "1px solid rgba(20,184,166,0.4)" : "1px solid var(--border)",
                                    borderRadius: "14px",
                                    padding: "10px 14px",
                                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                                    transition: "border-color 0.2s",
                                }}>
                                    {/* ─ replyTarget context badge ─ */}
                                    <AnimatePresence>
                                        {replyTarget && (
                                            <motion.div
                                                key="reply-target-badge"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}
                                            >
                                                <CornerUpLeft size={12} style={{ color: replyTarget.accentColor, flexShrink: 0 }} />
                                                <span style={{ fontSize: "12px", fontWeight: 600, color: replyTarget.accentColor }}>{replyTarget.modelName}</span>
                                                <span style={{ fontSize: "12px", color: "var(--muted-foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    "{replyTarget.excerpt}..."
                                                </span>
                                                <button
                                                    onClick={() => setReplyTarget(null)}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "14px", padding: "0 2px", flexShrink: 0 }}
                                                >×</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* ─ paused indicator + resume button ─ */}
                                    <AnimatePresence>
                                        {debateStatus === "paused" && (
                                            <motion.div
                                                key="paused-banner"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}
                                            >
                                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#f97316", letterSpacing: "0.05em" }}>⏸ DEBATE PAUSED</span>
                                                <button
                                                    onClick={handleResume}
                                                    style={{
                                                        background: "rgba(249,115,22,0.1)",
                                                        border: "1px solid rgba(249,115,22,0.3)",
                                                        borderRadius: "6px",
                                                        padding: "2px 10px",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: "#f97316",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Resume →
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "8px",
                                            background: "linear-gradient(135deg, #0d9488, #0891b2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            color: "white",
                                        }}>
                                            You
                                        </div>
                                        <input
                                            id="debate-reply-input"
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUserMessage(); } }}
                                            placeholder={
                                                isUserReplying ? "Waiting for AI responses..." :
                                                    replyTarget ? `Reply to ${replyTarget.modelName}...` :
                                                        debateStatus === "completed" ? "Debate ended — but you can still share your take..." :
                                                            "Join the debate — type your argument and press Enter..."
                                            }
                                            disabled={isUserReplying}
                                            style={{
                                                flex: 1,
                                                background: "transparent",
                                                border: "none",
                                                outline: "none",
                                                color: "var(--foreground)",
                                                fontSize: "14px",
                                                opacity: isUserReplying ? 0.5 : 1,
                                            }}
                                        />
                                        <button
                                            onClick={handleUserMessage}
                                            disabled={!userInput.trim() || isUserReplying}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "34px",
                                                height: "34px",
                                                background: userInput.trim() && !isUserReplying
                                                    ? "linear-gradient(135deg, #0d9488, #0891b2)"
                                                    : "var(--secondary)",
                                                border: "none",
                                                borderRadius: "9px",
                                                cursor: userInput.trim() && !isUserReplying ? "pointer" : "not-allowed",
                                                transition: "all 0.2s",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isUserReplying ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Cpu size={14} style={{ color: "var(--muted-foreground)" }} />
                                                </motion.div>
                                            ) : (
                                                <Send size={14} style={{ color: userInput.trim() ? "white" : "var(--muted-foreground)" }} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* ── Right Sidebar (Consensus Panel) ── */}
                    <AnimatePresence>
                        {isConsensusOpen && consensusData && debateStatus === "completed" && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "auto", opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="max-md:absolute max-md:right-0 max-md:z-50 w-full sm:w-[420px]"
                                style={{
                                    height: "100%",
                                    borderLeft: "1px solid var(--border)",
                                    background: "var(--background)",
                                    boxShadow: "-10px 0 30px rgba(0,0,0,0.05)",
                                    overflowY: "auto",
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{ padding: "24px", width: "420px", boxSizing: "border-box" }}>
                                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>
                                        Final AI Conclusion
                                    </h3>
                                    <ConsensusPanel
                                        topic={topic}
                                        outcome={consensusData.error ? "No Agreement" : "Consensus"}
                                        summaryText={consensusData.error || consensusData.text || "No conclusion generated."}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
}
