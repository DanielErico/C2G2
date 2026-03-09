export type SavedSession = {
    id: string;
    timestamp: number;
    type: "debate" | "reasoning";
    topic: string;
    snippet: string; // The first 150 chars of the final conclusion
    fullData?: any; // The raw debate or reasoning history (optional/for future expansion)
};

const STORAGE_KEY = "c2g2_history";

export function getHistory(): SavedSession[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data) as SavedSession[];
    } catch (err) {
        console.error("Failed to parse history", err);
        return [];
    }
}

export function saveSession(session: SavedSession) {
    try {
        const history = getHistory();
        // Prevent duplicate saves for the exact same ID
        if (history.some(h => h.id === session.id)) return;

        history.push(session);
        // Sort newest first
        history.sort((a, b) => b.timestamp - a.timestamp);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.error("Failed to save session", err);
    }
}

export function deleteSession(id: string) {
    try {
        let history = getHistory();
        history = history.filter(h => h.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.error("Failed to delete session", err);
    }
}
