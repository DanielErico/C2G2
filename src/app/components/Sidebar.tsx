import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  FlaskConical,
  MessageSquare,
  Clock,
  Bookmark,
  Settings,
  ChevronRight,
  Cpu,
  LogOut,
  LogIn,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FlaskConical, label: "New Analysis", path: "/reasoning" },
  { icon: MessageSquare, label: "Debate Mode", path: "/debate" },
  { icon: Clock, label: "History", path: "/history" },
  { icon: Bookmark, label: "Saved Reports", path: "/reports" },
];

const MODEL_DOTS = [
  { color: "#10b981", label: "Cor" },
  { color: "#3b82f6", label: "Cat" },
  { color: "#a855f7", label: "Gen" },
  { color: "#f97316", label: "Gau" },
];

import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully signed out");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <>
      {/* Mobile Header (Hamburger Menu) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[58px] bg-background border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center shadow-md">
            <Cpu size={14} color="white" />
          </div>
          <span className="text-foreground font-bold tracking-tight text-lg">C2G2</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 text-foreground/70 hover:text-foreground"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-[100vh] w-[220px] bg-background border-r border-border z-50 flex flex-col font-sans transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Logo */}
        <div
          style={{
            padding: "18px 16px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(29,78,216,0.4)",
              }}
            >
              <Cpu size={16} color="white" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span
                style={{
                  color: "white",
                  fontSize: "17px",
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
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                AI Roundtable
              </span>
            </div>
          </div>

          {/* 4 model dots */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "14px",
              padding: "8px 10px",
              background: "var(--secondary)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            {MODEL_DOTS.map((m) => (
              <div
                key={m.label}
                style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: m.color,
                    boxShadow: `0 0 5px ${m.color}`,
                  }}
                />
                <span
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 10px", flex: 1, overflowY: "auto" }}>
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "8px 12px 6px",
            }}
          >
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  marginBottom: "2px",
                  background: isActive ? "rgba(29,78,216,0.14)" : "transparent",
                  cursor: "pointer",
                  color: isActive ? "#60a5fa" : "var(--muted-foreground)",
                  border: isActive
                    ? "1px solid rgba(29,78,216,0.25)"
                    : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--secondary)";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--muted-foreground)";
                  }
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Icon size={15} />
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    {item.label}
                  </span>
                </div>
                {isActive && (
                  <ChevronRight size={12} style={{ opacity: 0.5 }} />
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "10px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "10px",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--secondary)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--muted-foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "var(--muted-foreground)";
            }}
          >
            <Settings size={15} />
            <span style={{ fontSize: "13px", fontWeight: 500 }}>Settings</span>
          </div>

          {/* User card / Login Button */}
          {user ? (
            <div
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                background: "var(--secondary)",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                position: "relative"
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    color: "var(--foreground)",
                    fontSize: "12px",
                    fontWeight: 600,
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={user.email || ""}
                >
                  {user.email}
                </p>
                <div 
                  onClick={handleSignOut}
                  style={{ 
                    color: "var(--muted-foreground)", 
                    fontSize: "10px", 
                    margin: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "2px",
                  }}
                  className="hover:text-red-400 transition-colors"
                >
                  <LogOut size={10} />
                  Sign Out
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => navigate("/auth")}
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                background: "linear-gradient(135deg, rgba(29,78,216,0.1), rgba(29,78,216,0.05))",
                borderRadius: "10px",
                border: "1px solid rgba(29,78,216,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                color: "#60a5fa"
              }}
              className="hover:bg-blue-900/20"
            >
              <LogIn size={14} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Sign In / Sign Up</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
