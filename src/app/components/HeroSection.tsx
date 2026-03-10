import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Brain,
  Zap,
  Play,
  ArrowRight,
  Shield,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Cpu,
  Layers,
} from "lucide-react";

const AI_MODELS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    role: "Strategic Structurer",
    description:
      "Organizes complex ideas into clear, actionable frameworks with logical precision.",
    accentColor: "#10b981",
    glowColor: "rgba(16,185,129,0.12)",
    borderColor: "rgba(16,185,129,0.25)",
    badgeBg: "rgba(16,185,129,0.08)",
    icon: Brain,
    tag: "GPT-4o",
    score: "92%",
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Data & Context Analyst",
    description:
      "Synthesizes vast data sources and contextual signals to surface hidden insights.",
    accentColor: "#3b82f6",
    glowColor: "rgba(59,130,246,0.12)",
    borderColor: "rgba(59,130,246,0.25)",
    badgeBg: "rgba(59,130,246,0.08)",
    icon: TrendingUp,
    tag: "1.5 Pro",
    score: "87%",
  },
  {
    id: "claude",
    name: "Claude",
    role: "Risk & Ethics Analyst",
    description:
      "Evaluates moral dimensions, identifies blind spots, and stress-tests assumptions.",
    accentColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.12)",
    borderColor: "rgba(168,85,247,0.25)",
    badgeBg: "rgba(168,85,247,0.08)",
    icon: Shield,
    tag: "Sonnet 3.5",
    score: "94%",
  },
  {
    id: "grok",
    name: "Grok",
    role: "Contrarian Thinker",
    description:
      "Challenges consensus, probes weak points, and introduces unconventional angles.",
    accentColor: "#f97316",
    glowColor: "rgba(249,115,22,0.12)",
    borderColor: "rgba(249,115,22,0.25)",
    badgeBg: "rgba(249,115,22,0.08)",
    icon: Zap,
    tag: "Grok 2",
    score: "89%",
  },
];

const NAV_LINKS = ["Features", "Pricing", "Docs", "Blog"];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Gradient orbs — deep navy blues only */}
      <div
        style={{
          position: "absolute",
          top: "-180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background:
            "radial-gradient(ellipse at center, rgba(29,78,216,0.14) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "-150px",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(14,54,130,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "100px",
          right: "-100px",
          width: "450px",
          height: "450px",
          background:
            "radial-gradient(ellipse at center, rgba(30,58,138,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Navbar ── */}
      <nav
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box" as const,
        }}
      >
        {/* Logo */}
        <motion.div
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate("/")}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
              borderRadius: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(29,78,216,0.45)",
            }}
          >
            <Cpu size={18} color="white" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "white",
                fontSize: "19px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              C2G2
            </span>
            <span
              style={{
                color: "var(--muted-foreground)",
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
              }}
            >
              AI Roundtable
            </span>
          </div>
        </motion.div>

        {/* Links */}
        <motion.div
          style={{ display: "flex", alignItems: "center", gap: "32px" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item}
              href="#"
              style={{
                color: "var(--muted-foreground)",
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "var(--foreground)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "var(--muted-foreground)")
              }
            >
              {item}
            </a>
          ))}
        </motion.div>

        {/* Nav actions */}
        <motion.div
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted-foreground)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "8px 14px",
              fontFamily: "inherit",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--foreground)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)")
            }
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/reasoning")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "9px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 0 20px rgba(29,78,216,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 35px rgba(29,78,216,0.6)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 20px rgba(29,78,216,0.4)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Get Started
            <ChevronRight size={14} />
          </button>
        </motion.div>
      </nav>

      {/* ── Hero Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "64px 24px 32px",
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box" as const,
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ marginBottom: "28px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              background: "rgba(29,78,216,0.1)",
              border: "1px solid rgba(29,78,216,0.25)",
              borderRadius: "100px",
            }}
          >
            <Layers size={13} style={{ color: "#60a5fa" }} />
            <span
              style={{
                color: "#93c5fd",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Multi-Model AI Reasoning Platform
            </span>
            <div
              style={{
                padding: "2px 7px",
                background: "rgba(29,78,216,0.25)",
                borderRadius: "6px",
              }}
            >
              <span
                style={{ color: "#60a5fa", fontSize: "10px", fontWeight: 700 }}
              >
                v2.0
              </span>
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            color: "white",
            fontSize: "clamp(42px, 6.5vw, 78px)",
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: "-2.5px",
            maxWidth: "820px",
            margin: "0 0 24px",
          }}
        >
          Where AI Models{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #93c5fd 0%, #60a5fa 40%, #1d4ed8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Think Together
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          style={{
            color: "var(--muted-foreground)",
            fontSize: "clamp(15px, 2vw, 19px)",
            fontWeight: 400,
            maxWidth: "560px",
            lineHeight: 1.7,
            margin: "0 0 40px",
          }}
        >
          Submit any complex topic and receive structured, multi-perspective
          analysis from ChatGPT, Gemini, Claude, and Grok — simultaneously and
          in seconds.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "52px",
          }}
        >
          <button
            onClick={() => navigate("/reasoning")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "13px",
              padding: "15px 30px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 0 32px rgba(29,78,216,0.45), 0 4px 20px rgba(0,0,0,0.3)",
              letterSpacing: "-0.2px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 50px rgba(29,78,216,0.6), 0 8px 32px rgba(0,0,0,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 32px rgba(29,78,216,0.45), 0 4px 20px rgba(0,0,0,0.3)";
            }}
          >
            Start Reasoning
            <ArrowRight size={16} />
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--secondary)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "13px",
              padding: "15px 30px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              backdropFilter: "blur(10px)",
              letterSpacing: "-0.2px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--border)";
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(255,255,255,0.18)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--secondary)";
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play size={10} color="white" style={{ marginLeft: "1px" }} />
            </div>
            Watch Demo
          </button>
        </motion.div>

        {/* Feature tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "64px",
          }}
        >
          {[
            { label: "AI Debate Mode", color: "#3b82f6" },
            { label: "Consensus Engine", color: "#10b981" },
            { label: "Deep Brainstorm", color: "#1d4ed8" },
            { label: "Confidence Scoring", color: "#60a5fa" },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 14px",
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                borderRadius: "100px",
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: f.color,
                  boxShadow: `0 0 6px ${f.color}`,
                }}
              />
              <span
                style={{
                  color: "var(--muted-foreground)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {f.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── AI Model Cards ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
          padding: "0 24px 80px",
          boxSizing: "border-box" as const,
        }}
      >
        {/* Divider label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              height: "1px",
              width: "100px",
              background:
                "linear-gradient(90deg, transparent, var(--border))",
            }}
          />
          <span
            style={{
              color: "var(--muted-foreground)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
            }}
          >
            Your AI Panel
          </span>
          <div
            style={{
              height: "1px",
              width: "100px",
              background:
                "linear-gradient(270deg, transparent, var(--border))",
            }}
          />
        </motion.div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          style={{
            gap: "14px",
          }}
        >
          {AI_MODELS.map((model, i) => {
            const Icon = model.icon;
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65 + i * 0.08 }}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255,255,255,0.025)",
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${model.borderColor}`,
                  borderRadius: "20px",
                  padding: "22px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onHoverStart={(e) => {
                  (e.target as HTMLElement).closest?.("div");
                }}
                whileHover={{
                  y: -5,
                  boxShadow: `0 0 30px ${model.glowColor}, 0 12px 40px rgba(0,0,0,0.4)`,
                  borderColor: model.accentColor,
                }}
              >
                {/* Top accent strip */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "20%",
                    right: "20%",
                    height: "1.5px",
                    background: `linear-gradient(90deg, transparent, ${model.accentColor}, transparent)`,
                    borderRadius: "2px",
                    opacity: 0.7,
                  }}
                />

                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "18px",
                  }}
                >
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
                    }}
                  >
                    <Icon size={19} style={{ color: model.accentColor }} />
                  </div>
                  <div
                    style={{
                      padding: "3px 8px",
                      background: model.badgeBg,
                      border: `1px solid ${model.borderColor}`,
                      borderRadius: "6px",
                    }}
                  >
                    <span
                      style={{
                        color: model.accentColor,
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {model.tag}
                    </span>
                  </div>
                </div>

                {/* Name & role */}
                <span
                  style={{
                    color: "white",
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                    marginBottom: "6px",
                  }}
                >
                  {model.name}
                </span>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "14px",
                  }}
                >
                  <MessageSquare size={10} style={{ color: model.accentColor }} />
                  <span
                    style={{
                      color: model.accentColor,
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {model.role}
                  </span>
                </div>

                {/* Description */}
                <p
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "12.5px",
                    lineHeight: 1.65,
                    flex: 1,
                    margin: 0,
                  }}
                >
                  {model.description}
                </p>

                {/* Depth bar */}
                <div
                  style={{
                    marginTop: "18px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "7px",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: "10px",
                        fontWeight: 500,
                      }}
                    >
                      Reasoning Depth
                    </span>
                    <span
                      style={{
                        color: model.accentColor,
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {model.score}
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
                      animate={{ width: model.score }}
                      transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                      style={{
                        height: "100%",
                        background: model.accentColor,
                        borderRadius: "2px",
                        boxShadow: `0 0 8px ${model.accentColor}`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "60px",
            marginTop: "56px",
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "4", label: "AI Models" },
            { value: "12K+", label: "Analyses Run" },
            { value: "98%", label: "Accuracy Rate" },
            { value: "<2s", label: "Response Time" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-1.5px",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  color: "var(--muted-foreground)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
