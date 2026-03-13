import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { Mail, Lock, Loader2 } from "lucide-react";

export function AuthPage() {
    const { session } = useAuth();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    if (session) {
        return <Navigate to="/" replace />;
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success("Successfully logged in!");
                navigate("/");
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success("Signup successful! You can now log in.");
                setIsLogin(true);
            }
        } catch (error: any) {
            toast.error(error.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message || "Google login failed");
        }
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "var(--background)",
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "400px",
                padding: "32px",
                background: "var(--card)",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "24px"
            }}>
                <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)", margin: "0 0 8px 0" }}>
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p style={{ color: "var(--muted-foreground)", fontSize: "14px", margin: 0 }}>
                        {isLogin ? "Log in to sync your debate history" : "Sign up to save debates to the cloud"}
                    </p>
                </div>

                <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: "100%", padding: "12px 12px 12px 42px",
                                    borderRadius: "8px", border: "1px solid var(--border)",
                                    background: "var(--secondary)", color: "var(--foreground)",
                                    fontSize: "14px", outline: "none", boxSizing: "border-box"
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <div style={{ position: "relative" }}>
                            <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{
                                    width: "100%", padding: "12px 12px 12px 42px",
                                    borderRadius: "8px", border: "1px solid var(--border)",
                                    background: "var(--secondary)", color: "var(--foreground)",
                                    fontSize: "14px", outline: "none", boxSizing: "border-box"
                                }}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            border: "none",
                            padding: "12px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {isLogin ? "Sign In" : "Sign Up"}
                    </button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                    <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>OR</span>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    style={{
                        background: "var(--secondary)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                        padding: "12px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background 0.2s"
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                <div style={{ textAlign: "center", fontSize: "13px", color: "var(--muted-foreground)" }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: "none", border: "none", color: "var(--primary)",
                            cursor: "pointer", fontWeight: 600, padding: 0
                        }}
                    >
                        {isLogin ? "Sign up" : "Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
