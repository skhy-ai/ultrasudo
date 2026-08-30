/**
 * Ultrasudo Auth Check — Session Persistence & Guest Fallback
 * Supabase Project: uzwkvctnmruesdhtfbvz
 *
 * Strategy:
 * - On page load, read Supabase session from localStorage (auto-persisted by Supabase SDK).
 * - If session exists → set window.currentUser to the authenticated user.
 * - If no session → fall back to guest mode (zero-friction access).
 * - Listen for auth state changes (magic link click, sign-out, token refresh) reactively.
 * - Dispatch 'auth-ready' event so apps can initialize with the correct user.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ── Default: Guest mode for zero-friction access ──────────────────────────
    const guestUser = {
        id: 'guest-user',
        email: 'guest@ultrasudo.local',
        user_metadata: { full_name: 'Guest User' },
        isGuest: true
    };

    window.currentUser = guestUser;

    if (window.supabaseClient) {
        const supabase = window.supabaseClient;

        try {
            // Supabase persists session in localStorage automatically.
            // getSession() reads it without any network call.
            const { data: { session }, error } = await supabase.auth.getSession();

            if (!error && session?.user) {
                window.currentUser = { ...session.user, isGuest: false };
            }
        } catch (e) {
            console.warn('[AuthCheck] Session read skipped, using Guest mode:', e);
        }

        // ── Listen for real-time auth state changes ───────────────────────────
        // This fires when:
        //  - Magic link is clicked in another tab → SIGNED_IN
        //  - Token is refreshed → TOKEN_REFRESHED
        //  - User signs out → SIGNED_OUT
        //  - Password recovery link is used → PASSWORD_RECOVERY
        supabase.auth.onAuthStateChange((event, session) => {
            console.info('[AuthCheck] Auth state change:', event);

            switch (event) {
                case 'SIGNED_IN':
                case 'TOKEN_REFRESHED':
                    if (session?.user) {
                        window.currentUser = { ...session.user, isGuest: false };
                        dispatchAuthReady();
                    }
                    break;

                case 'SIGNED_OUT':
                    window.currentUser = { ...guestUser };
                    dispatchAuthReady();
                    break;

                case 'PASSWORD_RECOVERY':
                    // Redirect to reset password page if we're not already there
                    if (!window.location.pathname.includes('reset-password')) {
                        window.location.href = '/auth/reset-password.html';
                    }
                    break;

                case 'USER_UPDATED':
                    if (session?.user) {
                        window.currentUser = { ...session.user, isGuest: false };
                        dispatchAuthReady();
                    }
                    break;
            }
        });
    }

    // ── Dispatch auth-ready event ─────────────────────────────────────────────
    dispatchAuthReady();

    function dispatchAuthReady() {
        const event = new CustomEvent('auth-ready', {
            detail: {
                user: window.currentUser,
                isGuest: window.currentUser?.isGuest === true,
                supabaseProjectId: 'uzwkvctnmruesdhtfbvz'
            }
        });
        document.dispatchEvent(event);
    }
});

// ── Global sign-out ───────────────────────────────────────────────────────────
window.logout = async () => {
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.auth.signOut();
        } catch (e) {
            console.warn('[AuthCheck] Sign-out error:', e);
        }
    }
    // Clear any local app data for the session
    window.currentUser = null;
    window.location.href = '/auth/login.html';
};

// ── Global helper: check if user is authenticated ────────────────────────────
window.isAuthenticated = () =>
    window.currentUser && !window.currentUser.isGuest;

window.getCurrentUserId = () =>
    window.currentUser?.id || null;
