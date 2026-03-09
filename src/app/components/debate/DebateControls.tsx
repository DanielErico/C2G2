import { motion } from "motion/react";
import { Crosshair, ShieldAlert, Sparkles, Hand, Network } from "lucide-react";

export function DebateControls() {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "16px 20px",
                marginTop: "10px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>

                {/* Bias Detector Toggle */}
                <motion.button
                    whileHover={{ y: -1 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#ef4444",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
                    }}
                >
                    <ShieldAlert size={14} />
                    <span>Bias Detector</span>
                </motion.button>

                {/* Perspective Mode */}
                <motion.div
                    whileHover={{ y: -1 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--ring)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    }}
                >
                    <Sparkles size={14} style={{ color: "#a855f7" }} />
                    <span>Perspective:</span>
                    <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>General</span>
                </motion.div>

                {/* Reasoning Transparency */}
                <motion.button
                    whileHover={{ y: -1 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--muted-foreground)",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--ring)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    }}
                >
                    <Network size={14} />
                    <span>Show Chain Reasoning</span>
                </motion.button>

            </div>

            <div style={{ display: "flex", gap: "12px" }}>
                {/* Attack Argument Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(249,115,22,0.1)",
                        border: "1px solid rgba(249,115,22,0.3)",
                        color: "#f97316",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 0 10px rgba(249,115,22,0.1)",
                    }}
                >
                    <Crosshair size={14} />
                    Attack Argument
                </motion.button>

                {/* Pause / Interrupt */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    <Hand size={14} style={{ color: "#ef4444" }} />
                    Pause Debate
                </motion.button>
            </div>

        </div>
    );
}
