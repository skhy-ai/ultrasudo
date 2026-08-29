// Auth Check Script - Frictionless Guest Mode Enabled
// Automatically initializes guest user session without forcing login or redirecting.

document.addEventListener('DOMContentLoaded', async () => {
    // Default guest session for zero-friction access
    const guestUser = {
        id: 'guest-user',
        email: 'guest@ultrasudo.local',
        user_metadata: { full_name: 'Guest User' }
    };

    window.currentUser = guestUser;

    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session && session.user) {
                window.currentUser = session.user;
            }
        } catch (e) {
            console.warn('Supabase session check skipped, using Guest mode:', e);
        }
    }

    // Dispatch event letting apps know auth/guest status is ready
    const event = new CustomEvent('auth-ready', { detail: { user: window.currentUser } });
    document.dispatchEvent(event);
});

// Global logout / reset function
window.logout = async () => {
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.auth.signOut();
        } catch (e) {
            console.warn('Sign out warning:', e);
        }
    }
    window.location.reload();
};
