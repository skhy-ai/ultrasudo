// Auth Check Script
// Include this script on any page that requires the user to be logged in.

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Supabase client is available
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized. Make sure config.js is loaded.');
        return;
    }

    const supabase = window.supabaseClient;

    // Check session
    const { data: { session }, error } = await supabase.auth.getSession();

    // Determine path depth relative to project root
    // For desktop/desktop.html -> '../auth/login.html'
    // For index.html -> 'auth/login.html'
    const isRoot = window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/', window.location.pathname.length - 11) || window.location.pathname === '/';
    const loginPath = isRoot ? 'auth/login.html' : '../auth/login.html';

    if (!session || error) {
        // Redirect to login if not authenticated
        window.location.href = loginPath;
    } else {
        // Dispatch an event letting the app know auth is ready
        window.currentUser = session.user;
        const event = new CustomEvent('auth-ready', { detail: { user: session.user } });
        document.dispatchEvent(event);
    }
});

// Global logout function
window.logout = async () => {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
        const isRoot = window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/', window.location.pathname.length - 11) || window.location.pathname === '/';
        window.location.href = isRoot ? 'auth/login.html' : '../auth/login.html';
    }
};
