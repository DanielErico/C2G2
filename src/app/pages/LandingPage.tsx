import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../lib/auth";
import { HeroSection } from "../components/HeroSection";

export function LandingPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate("/debate");
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    return <HeroSection />;
}
