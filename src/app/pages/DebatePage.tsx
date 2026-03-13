import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "../components/Sidebar";
import { ModeToggle } from "../components/ModeToggle";
import { DebateCard, AIModelId, DEBATE_MODELS } from "../components/debate/DebateCard";
import { ConsensusPanel } from "../components/debate/ConsensusPanel";
import { DebateControls } from "../components/debate/DebateControls";
import { DebateStatus, DebateMessage } from "../components/debate/debateData";
import { runDebate, DebateResponse, sendUserReply, concludeDebate, shareDebate } from "../../lib/api";
import { saveSession } from "../../lib/history";
import {
    Search, Bell, Swords, Cpu, ChevronDown, SlidersHorizontal, Settings2, Play, AlertCircle, GitMerge, MessageSquarePlus, Send, UserRound, CornerUpLeft, CheckCircle, Zap, X, Share2
} from "lucide-react";
import { toast } from "sonner";

type DepthLevel = "Short" | "Standard" | "Deep";

interface ChatMessageData {
    id: string;
    modelId: AIModelId;
    text: string;
    confidenceScore: number;
    round: number;
    label?: string; // e.g. "Round 1: Opening Arguments"
    isReaction?: boolean;
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

    const [isSharing, setIsSharing] = useState(false);

    // Refs for pause/resume
    const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const pendingQueueRef = useRef<{ msg: ChatMessageData; delayMs: number; typingDuration: number }[]>([]);
    const conclusionRef = useRef<{ text: string | null; error: string | null } | null>(null);

    const handleShareDebate = async () => {
        // Use conclusionRef first, fall back to consensusData state
        const conclusion = conclusionRef.current ?? consensusData;
        if (!conclusion) {
            toast.error("No debate conclusion available to share.");
            return;
        }
        setIsSharing(true);
        try {
            const res = await shareDebate(topic, visibleMessages, conclusion);
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

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio("/notify.mp3");
    }, []);

    const playNotifySound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
    };

    // Auto-scroll chat to bottom conditionally
    useEffect(() => {
        if (isAutoScrollEnabled) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setHasNewMessages(false);
        } else {
            // Only set new message if there's actually a new visible message to scroll to
            setHasNewMessages(true);
        }
    }, [visibleMessages, typingModel]);

    // Handle user manual scroll
    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        setIsAutoScrollEnabled(isNearBottom);
        if (isNearBottom) setHasNewMessages(false);
    };

    // Format text into chunks simulating human WhatsApp messages
    const chunkMessageText = (text: string): string[] => {
        // Simple paragraph split for now to keep things fast
        const chunks = text.split("\n\n").filter(c => c.trim().length > 0);
        return chunks.length > 0 ? chunks : [text];
    };

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

            // Build the full message queue with chunking and reactions
            let delay = 0;
            const messagesQueue: { msg: ChatMessageData; delayMs: number; typingDuration: number }[] = [];

            res.rounds.forEach((rObj) => {
                rObj.messages.forEach((m, idxMain) => {
                    const chunks = chunkMessageText(m.text);

                    chunks.forEach((chunkText, idxChunk) => {
                        const isFirstChunk = idxChunk === 0;
                        const msg: ChatMessageData = {
                            id: `${rObj.round}-${m.modelId}-chunk-${idxChunk}`,
                            modelId: m.modelId as AIModelId,
                            text: chunkText,
                            confidenceScore: isFirstChunk ? m.confidenceScore : 0, // Only show conf on first chunk
                            round: rObj.round,
                            label: (idxMain === 0 && isFirstChunk) ? rObj.label : undefined,
                        };

                        // Calculate typing time base on length
                        let typingDuration = 2000 + Math.random() * 2000;
                        if (chunkText.length > 200) typingDuration = 4000 + Math.random() * 2000;
                        if (chunkText.length > 500) typingDuration = 6000 + Math.random() * 3000;

                        // Add a small pause between models
                        if (isFirstChunk && idxMain > 0) delay += 1500;

                        messagesQueue.push({ msg, delayMs: delay, typingDuration });
                        delay += typingDuration;
                    });

                    // Occasionally add a random reaction
                    if (Math.random() > 0.65 && idxMain > 0) {
                        const reactor = rObj.messages[idxMain - 1].modelId;
                        const emojis = ["🤔", "👍", "🔥", "👀", "🎯"];
                        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                        const reactorName = DEBATE_MODELS[reactor as Exclude<AIModelId, "user">].name;
                        const currentName = DEBATE_MODELS[m.modelId as Exclude<AIModelId, "user">].name;

                        const reactionMsg: ChatMessageData = {
                            id: `${rObj.round}-reaction-${idxMain}`,
                            modelId: m.modelId as AIModelId,
                            text: `${currentName} reacted ${emoji} to ${reactorName}'s message`,
                            confidenceScore: 0,
                            round: rObj.round,
                            isReaction: true
                        };

                        messagesQueue.push({ msg: reactionMsg, delayMs: delay + 500, typingDuration: 0 });
                        delay += 1500; // brief pause after reaction
                    }
                });
            });

            pendingQueueRef.current = [...messagesQueue];
            timeoutIdsRef.current = [];
            scheduleQueue(messagesQueue, true);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to start debate");
            setDebateStatus("error");
            setTypingModel(null);
        }
    };

    // Unified scheduling logic
    const scheduleQueue = (queue: { msg: ChatMessageData; delayMs: number; typingDuration: number }[], requireConclusion = false) => {
        let currentTotalDelay = 0; // Local counter to offset from now Date.now()

        queue.forEach(({ msg, delayMs, typingDuration }, index) => {
            // Determine absolute delays from the start of the schedule operation
            // We use the pre-calculated `delayMs` as the start of the typing phase
            // And `delayMs + typingDuration` as the moment the message appears

            if (!msg.isReaction) {
                const preId = setTimeout(() => {
                    setTypingModel(msg.modelId);
                }, delayMs);
                timeoutIdsRef.current.push(preId);
            }

            const msgAppearsTime = delayMs + typingDuration;
            const msgId = setTimeout(() => {
                if (!msg.isReaction) {
                    setTypingModel(null);
                }
                playNotifySound();
                setVisibleMessages(prev => [...prev, msg]);
                pendingQueueRef.current = pendingQueueRef.current.filter(q => q.msg.id !== msg.id);

                if (index === queue.length - 1) {
                    if (requireConclusion) {
                        const modMessage: ChatMessageData = {
                            id: `mod-${Date.now()}`,
                            modelId: "chatgpt",
                            text: "The council has presented their initial arguments. Before we draw a final conclusion, what is your take on this? (Send a reply, or click Conclude Debate when ready).",
                            confidenceScore: 100,
                            round: 0,
                            label: "Debate Moderator",
                            isReaction: true // Using reaction style for the moderator message
                        };
                        playNotifySound();
                        setVisibleMessages(prev => [...prev, modMessage]);
                        setDebateStatus("awaiting_conclusion");
                    } else if (conclusionRef.current) {
                        setConsensusData(conclusionRef.current);
                        setDebateStatus("completed");
                        setIsConsensusOpen(true);
                        setIsUserReplying(false);
                    } else {
                        setIsUserReplying(false);
                    }
                }
            }, msgAppearsTime);

            timeoutIdsRef.current.push(msgId);
        });
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

        // Re-calculate delays starting from 0 for the remaining items
        const remaining = pendingQueueRef.current;
        let cumulativeDelay = 0;
        const adjustedQueue = remaining.map(item => {
            const newItem = { ...item, delayMs: cumulativeDelay, typingDuration: item.typingDuration };
            cumulativeDelay += item.typingDuration;
            // add arbitrary pauses inside remaining queue recalculation
            if (item.msg.isReaction) cumulativeDelay += 1000;
            return newItem;
        });

        // if conclusion exists we are in the finalizing stage
        const isFinalizing = !(!conclusionRef.current);
        const requiresConclusion = !isFinalizing;

        pendingQueueRef.current = [...adjustedQueue];
        timeoutIdsRef.current = [];
        scheduleQueue(adjustedQueue, requiresConclusion && debateStatus === "running");
    };

    const handleConcludeDebate = async () => {
        setDebateStatus("running");
        setIsUserReplying(true);
        setTypingModel("chatgpt");

        try {
            const historyContext = visibleMessages.map(m => ({ modelId: m.modelId, text: m.text, round: m.round }));
            const res = await concludeDebate(topic, historyContext);

            conclusionRef.current = res.conclusion;

            const convergenceMsgQueue: { msg: ChatMessageData; delayMs: number; typingDuration: number }[] = [];
            let delay = 0;

            res.convergenceRound.messages.forEach((m, idxMain) => {
                const chunks = chunkMessageText(m.text);

                chunks.forEach((chunkText, idxChunk) => {
                    const isFirstChunk = idxChunk === 0;
                    const msg: ChatMessageData = {
                        id: `conv-${m.modelId}-chunk-${idxChunk}-${Date.now()}`,
                        modelId: m.modelId as AIModelId,
                        text: chunkText,
                        confidenceScore: isFirstChunk ? m.confidenceScore : 0,
                        round: res.convergenceRound.round,
                        label: (idxMain === 0 && isFirstChunk) ? res.convergenceRound.label : undefined,
                    };

                    let typingDuration = 2000 + Math.random() * 2000;
                    if (chunkText.length > 200) typingDuration = 4000 + Math.random() * 2000;
                    if (chunkText.length > 500) typingDuration = 6000 + Math.random() * 3000;

                    if (isFirstChunk && idxMain > 0) delay += 1500;

                    convergenceMsgQueue.push({ msg, delayMs: delay, typingDuration });
                    delay += typingDuration;
                });
            });

            pendingQueueRef.current = [...convergenceMsgQueue];
            timeoutIdsRef.current = [];

            const finalMessages = [...visibleMessages, ...convergenceMsgQueue.map(q => q.msg)];

            // Schedule the convergence rounds using standard queue, no conclusion needed beyond what's handled internally
            scheduleQueue(convergenceMsgQueue, false);

            // Queue the history save after final render
            setTimeout(async () => {
                const synthesis = conclusionRef.current?.text || "";
                const snippet = synthesis.length > 150 ? synthesis.substring(0, 150) + "..." : synthesis;
                await saveSession({
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
            }, delay + 1000);

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
        playNotifySound();
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
            const replyMsgQueue: { msg: ChatMessageData; delayMs: number; typingDuration: number }[] = [];
            res.round.messages.forEach((m, idxMain) => {
                const chunks = chunkMessageText(m.text);

                chunks.forEach((chunkText, idxChunk) => {
                    const isFirstChunk = idxChunk === 0;
                    const msg: ChatMessageData = {
                        id: `user-reply-${m.modelId}-${idxChunk}-${Date.now()}`,
                        modelId: m.modelId as AIModelId,
                        text: chunkText,
                        confidenceScore: isFirstChunk ? m.confidenceScore : 0,
                        round: 0,
                        label: (idxMain === 0 && isFirstChunk) ? res.round.label : undefined,
                    };

                    let typingDuration = 2000 + Math.random() * 2000;
                    if (chunkText.length > 200) typingDuration = 4000 + Math.random() * 2000;
                    if (chunkText.length > 500) typingDuration = 6000 + Math.random() * 3000;

                    if (isFirstChunk && idxMain > 0) delay += 1000;

                    replyMsgQueue.push({ msg, delayMs: delay, typingDuration });
                    delay += typingDuration;
                });
            });

            pendingQueueRef.current = [...replyMsgQueue];
            timeoutIdsRef.current = [];
            scheduleQueue(replyMsgQueue, false);

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
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    onClick={handleShareDebate}
                                    disabled={isSharing}
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
                                        cursor: isSharing ? "not-allowed" : "pointer",
                                        transition: "all 0.2s",
                                        opacity: isSharing ? 0.7 : 1,
                                    }}
                                >
                                    <Share2 size={14} />
                                    {isSharing ? "Sharing..." : "Share Link"}
                                </button>
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
                            </div>
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
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: "auto",
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px",
                            transition: "all 0.3s ease",
                            position: "relative",
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

                        {/* New Message Floating Button */}
                        <AnimatePresence>
                            {hasNewMessages && !isAutoScrollEnabled && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 50 }}
                                    style={{
                                        position: "fixed",
                                        bottom: "100px",
                                        right: "10%",
                                        zIndex: 50,
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setIsAutoScrollEnabled(true);
                                            setHasNewMessages(false);
                                            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                                        }}
                                        style={{
                                            background: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "20px",
                                            padding: "8px 16px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "var(--foreground)",
                                            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316" }} />
                                        New Message
                                        <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>


                        {debateStatus === "awaiting_conclusion" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    paddingBottom: "16px",
                                    paddingTop: "16px",
                                    width: "100%",
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
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
                                        transition: "all 0.2s ease",
                                    }}
                                    className="text-xs md:text-sm"
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "0 15px 40px rgba(16, 185, 129, 0.5)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.transform = "none";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(16, 185, 129, 0.4)";
                                    }}
                                >
                                    <CheckCircle size={18} />
                                    <span>Conclude Debate & Generate Verdict</span>
                                    <Zap size={14} style={{ color: "rgba(255,255,255,0.8)", marginLeft: "4px" }} />
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
                                className="max-md:absolute max-md:right-0 max-md:z-50 w-full md:w-[420px] max-md:pt-20"
                                style={{
                                    height: "100%",
                                    borderLeft: "1px solid var(--border)",
                                    background: "var(--background)",
                                    boxShadow: "-10px 0 30px rgba(0,0,0,0.05)",
                                    overflowY: "auto",
                                    flexShrink: 0,
                                }}
                            >
                                <div className="w-full md:w-[420px]" style={{ padding: "24px", boxSizing: "border-box" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>
                                            Final AI Conclusion
                                        </h3>
                                        <button
                                            className="md:hidden"
                                            onClick={() => setIsConsensusOpen(false)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: "6px",
                                                borderRadius: "50%",
                                                background: "var(--secondary)",
                                                border: "1px solid var(--border)",
                                                cursor: "pointer",
                                                color: "var(--foreground)"
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
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
