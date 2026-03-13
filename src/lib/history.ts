import { supabase } from "./supabase";

export type SavedSession = {
    id: string;
    timestamp: number;
    type: "debate" | "reasoning";
    topic: string;
    snippet: string; // The first 150 chars of the final conclusion
    fullData?: any; // The raw debate or reasoning history (optional/for future expansion)
};

const STORAGE_KEY = "c2g2_history";

export async function getHistory(): Promise<SavedSession[]> {
    try {
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session?.user) {
            // Logged in: fetch from Supabase
            const { data, error } = await supabase
                .from('user_sessions')
                .select('session_data')
                .eq('user_id', session.session.user.id)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            return data.map(d => d.session_data as SavedSession);
        } else {
            // Logged out: fetch from local storage
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data) as SavedSession[];
        }
    } catch (err) {
        console.error("Failed to fetch history", err);
        return [];
    }
}

export async function saveSession(sessionData: SavedSession) {
    try {
        const { data: session } = await supabase.auth.getSession();

        if (session?.session?.user) {
            // Logged in: save to Supabase
            // Check if already exists to prevent duplicate inserts
            const { data: existing } = await supabase
                .from('user_sessions')
                .select('id')
                .eq('id', sessionData.id)
                .single();
                
            if (!existing) {
                await supabase.from('user_sessions').insert({
                    id: sessionData.id,
                    user_id: session.session.user.id,
                    session_data: sessionData
                });
            }
        } else {
            // Logged out: save to local storage
            let history: SavedSession[] = [];
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) history = JSON.parse(data);
            
            if (history.some(h => h.id === sessionData.id)) return;

            history.push(sessionData);
            history.sort((a, b) => b.timestamp - a.timestamp);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
    } catch (err) {
        console.error("Failed to save session", err);
    }
}

export async function deleteSession(id: string) {
    try {
        const { data: session } = await supabase.auth.getSession();

        if (session?.session?.user) {
            // Logged in: delete from Supabase
            await supabase
                .from('user_sessions')
                .delete()
                .eq('id', id)
                .eq('user_id', session.session.user.id);
        } else {
            // Logged out: delete from local storage
            let history: SavedSession[] = [];
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) history = JSON.parse(data);
            
            history = history.filter(h => h.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }
    } catch (err) {
        console.error("Failed to delete session", err);
    }
}

export function hasLocalHistory(): boolean {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return false;
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) && parsed.length > 0;
    } catch {
        return false;
    }
}

export async function syncLocalToCloud(): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;
    
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    
    try {
        const localHistory: SavedSession[] = JSON.parse(data);
        if (!Array.isArray(localHistory) || localHistory.length === 0) return;
        
        for (const sessionData of localHistory) {
            const { data: existing } = await supabase
                .from('user_sessions')
                .select('id')
                .eq('id', sessionData.id)
                .single();
                
            if (!existing) {
                await supabase.from('user_sessions').insert({
                    id: sessionData.id,
                    user_id: session.session.user.id,
                    session_data: sessionData
                });
            }
        }
        
        // Clear local storage after successful sync
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error("Failed to sync local history to cloud", err);
        throw err;
    }
}
