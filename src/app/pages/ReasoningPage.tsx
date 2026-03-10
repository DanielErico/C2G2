import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Bell,
  Upload,
  ChevronDown,
  SlidersHorizontal,
  Zap,
  Brain,
  Shield,
  TrendingUp,
  ChevronUp,
  RefreshCw,
  Highlighter,
  LayoutGrid,
  AlignJustify,
  MessageSquareMore,
  GitMerge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ListChecks,
  Download,
  Share2,
  Loader2,
  Cpu,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { analyzeWithAllModels, extractTextFromFile, type AnalysisResponse } from "../../lib/api";
import { buildConsensus } from "../../lib/consensus";
import { ModeToggle } from "../components/ModeToggle";
import { saveSession } from "../../lib/history";

/* ─── CONSTANTS ─── */
const ROLES = [
  "Investor",
  "Policy Analyst",
  "Student",
  "Startup Founder",
  "Researcher",
  "Product Manager",
  "Legal Advisor",
  "Journalist",
];

const AI_MODELS = [
  {
    id: "chatgpt",
    name: "Cortex",
    tag: "Strategic Thinker",
    role: "Strategic Structurer",
    accentColor: "#10b981",
    glowColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.22)",
    badgeBg: "rgba(16,185,129,0.1)",
    icon: Brain,
  },
  {
    id: "gemini",
    name: "Catalyst",
    tag: "Research Engine",
    role: "Data & Context Analyst",
    accentColor: "#3b82f6",
    glowColor: "rgba(59,130,246,0.15)",
    borderColor: "rgba(59,130,246,0.22)",
    badgeBg: "rgba(59,130,246,0.1)",
    icon: TrendingUp,
  },
  {
    id: "claude",
    name: "Genesis",
    tag: "Ethical Analyst",
    role: "Risk & Ethics Analyst",
    accentColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.15)",
    borderColor: "rgba(168,85,247,0.22)",
    badgeBg: "rgba(168,85,247,0.1)",
    icon: Shield,
  },
  {
    id: "grok",
    name: "Gauntlet",
    tag: "Contrarian",
    role: "Contrarian Thinker",
    accentColor: "#f97316",
    glowColor: "rgba(249,115,22,0.15)",
    borderColor: "rgba(249,115,22,0.22)",
    badgeBg: "rgba(249,115,22,0.1)",
    icon: Zap,
  },
];

/* Debate view: derive a simple debate flow from real responses */
function buildDebateFlow(responses: AnalysisResponse) {
  const DEBATE_TYPES: Record<string, string> = {
    chatgpt: "opens",
    gemini: "responds",
    claude: "challenges",
    grok: "disrupts",
  };
  return AI_MODELS.filter((m) => responses[m.id as keyof AnalysisResponse]?.text).map((m) => {
    const text = responses[m.id as keyof AnalysisResponse]?.text ?? "";
    // Extract first non-empty paragraph as debate snippet
    const snippet = text
      .replace(/\*\*[^*]+\*\*[:\s]*/g, "")
      .split("\n\n")
      .find((p) => p.trim().length > 40) ?? text.slice(0, 200);
    return { modelId: m.id, type: DEBATE_TYPES[m.id], text: snippet.trim() };
  });
}

type ViewMode = "split" | "stacked" | "debate" | "consensus";

/* ─── MAIN COMPONENT ─── */
export function ReasoningPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Policy Analyst");
  const [depth, setDepth] = useState(72);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [responses, setResponses] = useState<AnalysisResponse | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [highlightConflicts, setHighlightConflicts] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [documentContext, setDocumentContext] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);
    setIsExtracting(true);
    setGlobalError(null);
    try {
      const { text } = await extractTextFromFile(file);
      setDocumentContext(text);
    } catch (err) {
      setGlobalError("Failed to extract text from document. Please try again.");
      setAttachedFile(null);
      setDocumentContext("");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setIsAnalyzing(true);
    setHasResults(false);
    setResponses(null);
    setGlobalError(null);
    try {
      const result = await analyzeWithAllModels(query, role, depth, documentContext);
      setResponses(result);
      setHasResults(true);

      // Save to history
      const snippet = result.conclusion?.text || "Analysis generated successfully.";
      saveSession({
        id: `reasoning_${Date.now()}`,
        timestamp: Date.now(),
        type: "reasoning",
        topic: query,
        snippet: snippet.length > 150 ? snippet.substring(0, 150) + "..." : snippet,
        fullData: result
      });

    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? `Could not reach the C2G2 server: ${err.message}. Make sure the server is running on port 3001.`
          : "An unexpected error occurred."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const VIEW_MODES: { key: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { key: "split", icon: LayoutGrid, label: "Split" },
    { key: "stacked", icon: AlignJustify, label: "Stacked" },
    { key: "debate", icon: MessageSquareMore, label: "Debate" },
    { key: "consensus", icon: GitMerge, label: "Consensus" },
  ];

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
                placeholder="Search analyses…"
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
              <kbd
                style={{
                  color: "var(--muted-foreground)",
                  fontSize: "10px",
                  fontFamily: "inherit",
                  background: "var(--border)",
                  padding: "2px 5px",
                  borderRadius: "4px",
                }}
              >
                ⌘K
              </kbd>
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
              <span style={{ color: "var(--muted-foreground)" }}>New Analysis</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.18)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px #10b981",
                }}
              />
              <span style={{ color: "#10b981", fontSize: "11px", fontWeight: 600 }}>
                All Models Active
              </span>
            </div>

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
            <ModeToggle />

            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
                boxShadow: "0 0 12px rgba(29,78,216,0.3)",
              }}
            >
              AC
            </div>
          </div>
        </header>

        {/* ── Scrollable Body ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
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
              <Cpu size={14} style={{ color: "#60a5fa" }} />
              <span
                style={{
                  color: "#60a5fa",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Topic Input
              </span>
            </div>

            {/* Textarea */}
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a complex topic or decision to analyze…"
              rows={3}
              style={{
                width: "100%",
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "var(--foreground)",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6,
                resize: "none",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(29,78,216,0.4)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border)")
              }
            />

            {/* Attached file badge */}
            <AnimatePresence>
              {attachedFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(96, 165, 250, 0.1)",
                    border: "1px solid rgba(96, 165, 250, 0.2)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    color: "#60a5fa",
                    fontSize: "12px",
                    fontWeight: 500
                  }}>
                    <Highlighter size={12} />
                    {attachedFile.name}
                    <button
                      onClick={() => {
                        setAttachedFile(null);
                        setDocumentContext("");
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2, marginLeft: 4, color: "#60a5fa" }}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
              {/* Upload */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".txt,.pdf,.csv,.json"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "9px",
                  color: "var(--muted-foreground)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--border)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--foreground)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--secondary)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--muted-foreground)";
                }}
              >
                <Upload size={12} />
                {isExtracting ? "Extracting…" : "Upload Document"}
              </button>

              {/* Role Selector */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setRoleOpen(!roleOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    background: roleOpen
                      ? "rgba(29,78,216,0.12)"
                      : "var(--secondary)",
                    border: roleOpen
                      ? "1px solid rgba(29,78,216,0.3)"
                      : "1px solid var(--border)",
                    borderRadius: "9px",
                    color: roleOpen ? "#60a5fa" : "var(--muted-foreground)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <SlidersHorizontal size={12} />
                  {role}
                  <ChevronDown
                    size={11}
                    style={{
                      transform: roleOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                <AnimatePresence>
                  {roleOpen && (
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
                        minWidth: "160px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                      }}
                    >
                      {ROLES.map((r) => (
                        <div
                          key={r}
                          onClick={() => {
                            setRole(r);
                            setRoleOpen(false);
                          }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            color:
                              r === role ? "#60a5fa" : "var(--muted-foreground)",
                            fontSize: "12px",
                            fontWeight: r === role ? 600 : 400,
                            cursor: "pointer",
                            background:
                              r === role
                                ? "rgba(29,78,216,0.15)"
                                : "transparent",
                            transition: "all 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            if (r !== role)
                              (e.currentTarget as HTMLElement).style.background =
                                "var(--border)";
                          }}
                          onMouseLeave={(e) => {
                            if (r !== role)
                              (e.currentTarget as HTMLElement).style.background =
                                "transparent";
                          }}
                        >
                          {r}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Depth Slider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                  minWidth: "180px",
                }}
              >
                <span
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "11px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  Surface
                </span>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    style={{
                      width: "100%",
                      appearance: "none" as const,
                      height: "4px",
                      borderRadius: "2px",
                      background: `linear-gradient(90deg, #1d4ed8 0%, #1d4ed8 ${depth}%, var(--border) ${depth}%, var(--border) 100%)`,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  />
                </div>
                <span
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "11px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  Deep
                </span>
                <span
                  style={{
                    color: "#60a5fa",
                    fontSize: "11px",
                    fontWeight: 700,
                    minWidth: "30px",
                    textAlign: "right",
                  }}
                >
                  {depth}%
                </span>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !query.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 22px",
                  background:
                    isAnalyzing || !query.trim()
                      ? "rgba(29,78,216,0.3)"
                      : "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
                  border: "none",
                  borderRadius: "10px",
                  color: isAnalyzing || !query.trim() ? "var(--muted-foreground)" : "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  boxShadow:
                    isAnalyzing || !query.trim()
                      ? "none"
                      : "0 0 20px rgba(29,78,216,0.4)",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                }}
                onMouseEnter={(e) => {
                  if (!isAnalyzing && query.trim()) {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 0 30px rgba(29,78,216,0.6)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 20px rgba(29,78,216,0.4)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Zap size={13} />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* ── LOADING STATE ── */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "20px",
                  padding: "48px 24px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "18px",
                }}
              >
                <div style={{ display: "flex", gap: "14px" }}>
                  {AI_MODELS.map((m, i) => (
                    <motion.div
                      key={m.id}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        background: m.badgeBg,
                        border: `1px solid ${m.borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <m.icon size={18} style={{ color: m.accentColor }} />
                    </motion.div>
                  ))}
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: 500,
                      margin: "0 0 4px",
                    }}
                  >
                    All 4 models are reasoning simultaneously
                  </p>
                  <p style={{ color: "var(--muted-foreground)", fontSize: "12px", margin: 0 }}>
                    Depth: {depth}% · Role: {role}
                  </p>
                </div>

                {/* Progress bars */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "10px",
                    width: "100%",
                    maxWidth: "500px",
                  }}
                >
                  {AI_MODELS.map((m, i) => (
                    <div key={m.id}>
                      <p
                        style={{
                          color: m.accentColor,
                          fontSize: "10px",
                          fontWeight: 600,
                          marginBottom: "6px",
                          textAlign: "center",
                        }}
                      >
                        {m.name}
                      </p>
                      <div
                        style={{
                          height: "3px",
                          background: "var(--border)",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: 2,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                          style={{
                            height: "100%",
                            background: m.accentColor,
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RESULTS ── */}
          <AnimatePresence>
            {hasResults && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                {/* View Toggle + Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* View mode tabs */}
                    <div
                      style={{
                        display: "flex",
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "3px",
                        gap: "2px",
                      }}
                    >
                      {VIEW_MODES.map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          onClick={() => setViewMode(key)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            background:
                              viewMode === key
                                ? "rgba(29,78,216,0.2)"
                                : "transparent",
                            border:
                              viewMode === key
                                ? "1px solid rgba(29,78,216,0.3)"
                                : "1px solid transparent",
                            color:
                              viewMode === key
                                ? "#60a5fa"
                                : "var(--muted-foreground)",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            transition: "all 0.15s",
                          }}
                        >
                          <Icon size={12} />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Highlight conflicts */}
                    <button
                      onClick={() => setHighlightConflicts(!highlightConflicts)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 12px",
                        background: highlightConflicts
                          ? "rgba(249,115,22,0.12)"
                          : "var(--secondary)",
                        border: highlightConflicts
                          ? "1px solid rgba(249,115,22,0.3)"
                          : "1px solid var(--border)",
                        borderRadius: "9px",
                        color: highlightConflicts
                          ? "#f97316"
                          : "var(--muted-foreground)",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      <Highlighter size={12} />
                      Highlight Conflicts
                    </button>
                  </div>

                  {/* Export actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "7px 12px",
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "9px",
                        color: "var(--muted-foreground)",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.15s",
                        fontWeight: 500,
                      }}
                    >
                      <Share2 size={12} />
                      Share
                    </button>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "7px 12px",
                        background: "rgba(29,78,216,0.1)",
                        border: "1px solid rgba(29,78,216,0.25)",
                        borderRadius: "9px",
                        color: "#60a5fa",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        transition: "all 0.15s",
                      }}
                    >
                      <Download size={12} />
                      Export PDF
                    </button>
                  </div>
                </div>

                {/* ── FINAL VERDICT CARD ── */}
                {responses && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{
                      position: "relative",
                      background: "linear-gradient(135deg, #050e1d 0%, var(--card) 60%, #0a1e3a 100%)",
                      border: "1px solid rgba(29,78,216,0.35)",
                      borderRadius: "18px",
                      padding: "24px 28px",
                      overflow: "hidden",
                      boxShadow: "0 0 40px rgba(29,78,216,0.1), 0 8px 32px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Glow orb */}
                    <div style={{
                      position: "absolute",
                      top: "-60px",
                      right: "-60px",
                      width: "220px",
                      height: "220px",
                      background: "radial-gradient(ellipse at center, rgba(29,78,216,0.18) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }} />
                    {/* Top accent strip */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: "10%",
                      right: "10%",
                      height: "2px",
                      background: "linear-gradient(90deg, transparent, #1d4ed8, #60a5fa, #1d4ed8, transparent)",
                      borderRadius: "2px",
                    }} />

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "10px",
                        background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 16px rgba(29,78,216,0.5)",
                      }}>
                        <GitMerge size={15} color="white" />
                      </div>
                      <div>
                        <span style={{ color: "white", fontSize: "14px", fontWeight: 700, letterSpacing: "-0.2px" }}>
                          Final Verdict
                        </span>
                        <p style={{ color: "var(--muted-foreground)", fontSize: "11px", margin: 0 }}>
                          Synthesized from all 4 panel analyses
                        </p>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                        {["#10b981", "#3b82f6", "#a855f7", "#f97316"].map((c) => (
                          <div key={c} style={{ width: "7px", height: "7px", borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}` }} />
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    {responses.conclusion?.error ? (
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px" }}>
                        <AlertCircle size={14} style={{ color: "#ef4444", marginTop: "1px", flexShrink: 0 }} />
                        <p style={{ color: "rgba(239,68,68,0.85)", fontSize: "12.5px", lineHeight: 1.6, margin: 0 }}>
                          {responses.conclusion.error}
                        </p>
                      </div>
                    ) : responses.conclusion?.text ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                        {responses.conclusion.text.split("\n\n").filter(p => p.trim()).map((para, pi) => (
                          <p key={pi} style={{
                            color: pi === 0 ? "rgba(255,255,255,0.92)" : "var(--muted-foreground)",
                            fontSize: pi === 0 ? "14.5px" : "13px",
                            lineHeight: 1.75,
                            margin: "0 0 10px",
                          }}>
                            {para.split("**").map((seg, si) =>
                              si % 2 === 1 ? (
                                <strong key={si} style={{ color: pi === 0 ? "#93c5fd" : "rgba(255,255,255,0.9)", fontWeight: 700 }}>
                                  {seg}
                                </strong>
                              ) : seg
                            )}
                          </p>
                        ))}
                      </div>
                    ) : (
                      /* Skeleton while waiting */
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[100, 85, 70, 55].map((w, i) => (
                          <div key={i} style={{ height: "12px", width: `${w}%`, background: "var(--border)", borderRadius: "6px" }} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── SPLIT / STACKED VIEW ── */}
                {(viewMode === "split" || viewMode === "stacked") && (

                  <div
                    className={`grid gap-[14px] ${viewMode === "split"
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1"
                      }`}
                  >
                    {AI_MODELS.map((model, i) => {
                      const Icon = model.icon;
                      const isCollapsed = collapsed[model.id];
                      const modelResult = responses?.[model.id as keyof AnalysisResponse];
                      const paragraphs = modelResult?.text
                        ? modelResult.text.split("\n\n").filter((p) => p.trim().length > 0)
                        : [];
                      return (
                        <motion.div
                          key={model.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.07 }}
                          style={{
                            background: "var(--card)",
                            border: `1px solid ${model.borderColor}`,
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: highlightConflicts && i % 2 !== 0
                              ? `0 0 0 2px rgba(249,115,22,0.3), 0 4px 24px rgba(0,0,0,0.3)`
                              : "0 4px 24px rgba(0,0,0,0.2)",
                            transition: "box-shadow 0.2s",
                          }}
                        >
                          {/* Card Header */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "14px 16px",
                              borderBottom: isCollapsed
                                ? "none"
                                : "1px solid var(--border)",
                              background: model.badgeBg,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "9px",
                                  background: "rgba(0,0,0,0.2)",
                                  border: `1px solid ${model.borderColor}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Icon size={15} style={{ color: model.accentColor }} />
                              </div>
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "white",
                                      fontSize: "14px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {model.name}
                                  </span>
                                  <span
                                    style={{
                                      padding: "1px 6px",
                                      background: "rgba(0,0,0,0.25)",
                                      borderRadius: "5px",
                                      color: model.accentColor,
                                      fontSize: "10px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {model.tag}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    color: "var(--muted-foreground)",
                                    fontSize: "11px",
                                  }}
                                >
                                  {model.role}
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <button
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  background: "rgba(0,0,0,0.2)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "6px",
                                  color: "var(--muted-foreground)",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  fontFamily: "'Inter', sans-serif",
                                }}
                                onClick={() => { void handleAnalyze(); }}
                              >
                                <RefreshCw size={9} />
                                Re-analyze
                              </button>
                              <button
                                onClick={() => toggleCollapse(model.id)}
                                style={{
                                  background: "rgba(0,0,0,0.2)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "6px",
                                  padding: "4px 6px",
                                  cursor: "pointer",
                                  color: "var(--muted-foreground)",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                {isCollapsed ? (
                                  <ChevronDown size={12} />
                                ) : (
                                  <ChevronUp size={12} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Card Body */}
                          <AnimatePresence initial={false}>
                            {!isCollapsed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{ padding: "16px" }}>
                                  {/* Error state for this model */}
                                  {modelResult?.error && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "10px",
                                        padding: "12px 14px",
                                        background: "rgba(239,68,68,0.06)",
                                        border: "1px solid rgba(239,68,68,0.2)",
                                        borderRadius: "10px",
                                        marginBottom: "12px",
                                      }}
                                    >
                                      <AlertCircle size={14} style={{ color: "#ef4444", marginTop: "1px", flexShrink: 0 }} />
                                      <p style={{ color: "rgba(239,68,68,0.85)", fontSize: "12.5px", lineHeight: 1.6, margin: 0 }}>
                                        {modelResult.error}
                                      </p>
                                    </div>
                                  )}

                                  {/* Real response paragraphs */}
                                  {paragraphs.map((para, pi) => (
                                    <p
                                      key={pi}
                                      style={{
                                        color: "var(--foreground)",
                                        fontSize: "13px",
                                        lineHeight: 1.7,
                                        margin: pi < paragraphs.length - 1 ? "0 0 10px" : 0,
                                        padding: highlightConflicts && i % 2 !== 0 && pi === 0
                                          ? "8px 10px"
                                          : undefined,
                                        background: highlightConflicts && i % 2 !== 0 && pi === 0
                                          ? "rgba(249,115,22,0.06)"
                                          : "transparent",
                                        borderRadius: highlightConflicts && i % 2 !== 0 && pi === 0
                                          ? "6px"
                                          : undefined,
                                        borderLeft: highlightConflicts && i % 2 !== 0 && pi === 0
                                          ? "2px solid rgba(249,115,22,0.4)"
                                          : undefined,
                                      }}
                                    >
                                      {para.split("**").map((seg, si) =>
                                        si % 2 === 1 ? (
                                          <strong
                                            key={si}
                                            style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600 }}
                                          >
                                            {seg}
                                          </strong>
                                        ) : (
                                          seg
                                        )
                                      )}
                                    </p>
                                  ))}

                                  {/* Confidence bar */}
                                  <div
                                    style={{
                                      marginTop: "16px",
                                      paddingTop: "14px",
                                      borderTop: "1px solid var(--border)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "var(--muted-foreground)",
                                          fontSize: "10px",
                                          fontWeight: 500,
                                        }}
                                      >
                                        Confidence Score
                                      </span>
                                      <span
                                        style={{
                                          color: model.accentColor,
                                          fontSize: "10px",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {modelResult?.error ? "N/A" : `${[88, 82, 91, 76][i]}%`}
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        height: "3px",
                                        background: "var(--border)",
                                        borderRadius: "2px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: modelResult?.error ? "0%" : `${[88, 82, 91, 76][i]}%` }}
                                        transition={{ duration: 0.8, delay: 0.1 }}
                                        style={{
                                          height: "100%",
                                          background: model.accentColor,
                                          borderRadius: "2px",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* ── DEBATE VIEW ── */}
                {viewMode === "debate" && responses && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {buildDebateFlow(responses).map((msg, i) => {
                      const model = AI_MODELS.find((m) => m.id === msg.modelId)!;
                      const Icon = model.icon;
                      const isLeft = i % 2 === 0;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          style={{
                            display: "flex",
                            flexDirection: isLeft ? "row" : "row-reverse",
                            gap: "14px",
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: model.badgeBg,
                              border: `1px solid ${model.borderColor}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginTop: "4px",
                            }}
                          >
                            <Icon size={16} style={{ color: model.accentColor }} />
                          </div>
                          <div
                            className="max-w-[90%] md:max-w-[68%]"
                            style={{
                              background: "var(--card)",
                              border: `1px solid ${model.borderColor}`,
                              borderRadius: "14px",
                              padding: "14px 16px",
                              boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
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
                              <span style={{ color: model.accentColor, fontSize: "12px", fontWeight: 700 }}>
                                {model.name}
                              </span>
                              <span
                                style={{
                                  padding: "1px 7px",
                                  background: model.badgeBg,
                                  borderRadius: "5px",
                                  color: model.accentColor,
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  textTransform: "capitalize" as const,
                                }}
                              >
                                {msg.type}
                              </span>
                            </div>
                            <p style={{ color: "var(--foreground)", fontSize: "13px", lineHeight: 1.65, margin: 0 }}>
                              {msg.text}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* ── CONSENSUS VIEW ── */}
                {viewMode === "consensus" && responses && (() => {
                  const consensus = buildConsensus(responses);
                  return (
                    <div className="grid gap-[14px] grid-cols-1 md:grid-cols-2">
                      {/* Confidence Score */}
                      <div
                        className="col-span-1 md:col-span-2"
                        style={{
                          background: "var(--card)",
                          border: "1px solid rgba(29,78,216,0.2)",
                          borderRadius: "16px",
                          padding: "20px 24px",
                          display: "flex",
                          alignItems: "center",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <p style={{ color: "var(--muted-foreground)", fontSize: "12px", margin: "0 0 4px" }}>
                            Overall Consensus Score
                          </p>
                          <p style={{ fontSize: "44px", fontWeight: 800, color: "#60a5fa", margin: 0, letterSpacing: "-2px" }}>
                            {consensus.confidence}
                            <span style={{ fontSize: "20px", color: "rgba(96,165,250,0.5)" }}>%</span>
                          </p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: "10px", background: "var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: `${consensus.confidence}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              style={{ height: "100%", background: "linear-gradient(90deg, #1e3a8a, #1d4ed8, #60a5fa)", borderRadius: "6px", boxShadow: "0 0 12px rgba(29,78,216,0.5)" }}
                            />
                          </div>
                          <p style={{ color: "var(--muted-foreground)", fontSize: "11px", margin: "8px 0 0" }}>
                            Based on cross-model agreement across 4 reasoning dimensions
                          </p>
                        </div>
                      </div>

                      <ConsensusCard
                        icon={<CheckCircle2 size={14} style={{ color: "#10b981" }} />}
                        title="High-Confidence Insights"
                        color="#10b981"
                        items={consensus.insights.length > 0 ? consensus.insights : ["Insufficient data — all models errored or returned empty responses."]}
                      />
                      <ConsensusCard
                        icon={<AlertTriangle size={14} style={{ color: "#f59e0b" }} />}
                        title="Disputed Areas"
                        color="#f59e0b"
                        items={consensus.disputed.length > 0 ? consensus.disputed : ["No disputed areas identified."]}
                      />
                      <ConsensusCard
                        icon={<XCircle size={14} style={{ color: "#ef4444" }} />}
                        title="Risk Warnings"
                        color="#ef4444"
                        items={consensus.risks.length > 0 ? consensus.risks : ["No specific risks flagged."]}
                      />
                      <ConsensusCard
                        icon={<ListChecks size={14} style={{ color: "#60a5fa" }} />}
                        title="Strategic Action Plan"
                        color="#60a5fa"
                        items={consensus.actions.length > 0 ? consensus.actions : ["Re-run analysis with a more specific query."]}
                        numbered
                      />
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global error (server unreachable) */}
          {globalError && !isAnalyzing && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "20px 24px",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "16px",
              }}
            >
              <AlertCircle size={18} style={{ color: "#ef4444", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600, margin: "0 0 4px" }}>Server Error</p>
                <p style={{ color: "rgba(239,68,68,0.75)", fontSize: "12.5px", lineHeight: 1.6, margin: 0 }}>{globalError}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasResults && !isAnalyzing && !globalError && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 24px",
                color: "var(--muted-foreground)",
                gap: "12px",
              }}
            >
              <Cpu size={36} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>
                Enter a topic above and click Analyze to begin reasoning
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1d4ed8;
          border: 2px solid #60a5fa;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(29,78,216,0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1d4ed8;
          border: 2px solid #60a5fa;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(29,78,216,0.5);
        }
      `}</style>
    </div>
  );
}

/* ─── Consensus Card Sub-component ─── */
function ConsensusCard({
  icon,
  title,
  color,
  items,
  numbered = false,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "18px 20px",
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
        {icon}
        <span style={{ color, fontSize: "12px", fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <span
              style={{
                color,
                fontSize: "11px",
                fontWeight: 700,
                minWidth: "18px",
                marginTop: "2px",
              }}
            >
              {numbered ? `${i + 1}.` : "·"}
            </span>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "12px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
