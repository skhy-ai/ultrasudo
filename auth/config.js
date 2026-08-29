// Supabase Configuration
// Reads credentials from environment / .env or global configuration with fallbacks

const SUPABASE_URL = (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
    "https://kxvkklltpvlgglqqnjpl.supabase.co";

const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmtrbGx0cHZsZ2dscXFuanBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzAzMjIsImV4cCI6MjA4NzUwNjMyMn0.SBOUFz_yX8aClroTuQhwIjP-YhEcxtfZTo1mEW1Jpmc";

// Initialize Supabase client
if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Supabase SDK not loaded yet. Call initializeSupabase() when ready.");
}

