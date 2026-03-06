// Supabase Configuration
// This file connects the frontend to Supabase using the credentials from .env

const SUPABASE_URL = "https://kxvkklltpvlgglqqnjpl.supabase.co"; // Derived from project ID
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmtrbGx0cHZsZ2dscXFuanBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzAzMjIsImV4cCI6MjA4NzUwNjMyMn0.SBOUFz_yX8aClroTuQhwIjP-YhEcxtfZTo1mEW1Jpmc";

// Initialize Supabase client
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
