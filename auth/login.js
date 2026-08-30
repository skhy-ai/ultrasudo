/**
 * Ultrasudo Login — Magic Link Auth Handler
 * Supabase Project: uzwkvctnmruesdhtfbvz
 *
 * Flow:
 * 1. User enters email → signInWithOtp → "Check your inbox" view
 * 2. Magic link click → Supabase sets session via URL hash → redirect to /desktop
 * 3. "Forgot password?" → resetPasswordForEmail → "Reset sent" view
 * 4. Password reset link click → lands on reset-password.html
 */

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('[Auth] Supabase client not initialized. Check config.js.');
        return;
    }

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const viewEmail     = document.getElementById('view-email');
    const viewSent      = document.getElementById('view-sent');
    const viewResetSent = document.getElementById('view-reset-sent');

    const magicLinkForm   = document.getElementById('magic-link-form');
    const emailInput      = document.getElementById('email');
    const magicLinkBtn    = document.getElementById('magic-link-btn');
    const btnText         = magicLinkBtn.querySelector('.btn-text');
    const btnSpinner      = magicLinkBtn.querySelector('.btn-spinner');
    const errorMessage    = document.getElementById('error-message');

    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    const resendBtn         = document.getElementById('resend-btn');
    const backToEmailBtn    = document.getElementById('back-to-email-btn');
    const backToEmailBtn2   = document.getElementById('back-to-email-btn-2');

    const sentEmailDisplay   = document.getElementById('sent-email-display');
    const resetEmailDisplay  = document.getElementById('reset-email-display');

    let lastEmailUsed = '';

    // ── Step 1: Handle magic link / recovery token in URL hash ───────────────
    // Supabase appends #access_token=... or ?code=... to the redirect URL.
    // When the page loads, exchange it for a real session.
    await handleIncomingAuthCallback();

    // ── Step 2: Check for existing session → skip to desktop ─────────────────
    await checkExistingSession();

    // ── Helper: parse incoming Supabase callback (magic link / recovery) ──────
    async function handleIncomingAuthCallback() {
        try {
            // Supabase v2 handles hash-based tokens automatically when you call getSession
            // But for explicit hash detection and PKCE flow:
            const hash = window.location.hash;
            const params = new URLSearchParams(window.location.search);

            const hasCode  = params.has('code');
            const hasToken = hash.includes('access_token') || hash.includes('type=recovery');

            if (hasCode || hasToken) {
                // Exchange code / token for session (works for both magic link and recovery)
                const { data, error } = await supabase.auth.exchangeCodeForSession(
                    hasCode ? params.get('code') : hash.substring(1)
                );

                if (error) {
                    // May fail if it's a hash-fragment token (already auto-handled by Supabase)
                    // Silently fall through — getSession() below will pick it up
                    console.warn('[Auth] exchangeCodeForSession skipped:', error.message);
                } else if (data?.session) {
                    // Determine type: recovery → go to reset password page; magic link → go to desktop
                    const type = params.get('type') || (hash.includes('type=recovery') ? 'recovery' : 'magiclink');
                    if (type === 'recovery') {
                        window.location.href = '/auth/reset-password.html';
                    } else {
                        window.location.href = '/desktop';
                    }
                    return;
                }
            }
        } catch (e) {
            // Non-fatal — session check below handles the rest
        }
    }

    async function checkExistingSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            window.location.href = '/desktop';
        }
    }

    // ── View switching ────────────────────────────────────────────────────────
    function showView(view) {
        [viewEmail, viewSent, viewResetSent].forEach(v => v.classList.remove('active'));
        view.classList.add('active');
    }

    function setLoading(loading) {
        magicLinkBtn.disabled = loading;
        btnText.hidden  = loading;
        btnSpinner.hidden = !loading;
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.className = 'message error-message';
        setTimeout(() => { errorMessage.textContent = ''; }, 6000);
    }

    function clearError() {
        errorMessage.textContent = '';
    }

    // ── Magic link form submit ────────────────────────────────────────────────
    magicLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email = emailInput.value.trim().toLowerCase();
        if (!email) { showError('Please enter your email address.'); return; }

        lastEmailUsed = email;
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    // Redirect to /desktop after magic link click.
                    // Supabase will append the auth token to this URL.
                    emailRedirectTo: window.location.origin + '/desktop',
                    shouldCreateUser: true   // creates account on first sign-in
                }
            });

            if (error) throw error;

            sentEmailDisplay.textContent = email;
            showView(viewSent);

        } catch (err) {
            showError(err.message || 'Failed to send magic link. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // ── Forgot password ───────────────────────────────────────────────────────
    forgotPasswordBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim().toLowerCase();
        if (!email) {
            showError('Enter your email above, then click "Forgot password?".');
            return;
        }
        clearError();

        forgotPasswordBtn.disabled = true;
        forgotPasswordBtn.textContent = 'Sending reset link…';

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/auth/reset-password.html'
            });

            if (error) throw error;

            lastEmailUsed = email;
            resetEmailDisplay.textContent = email;
            showView(viewResetSent);

        } catch (err) {
            showError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            forgotPasswordBtn.disabled = false;
            forgotPasswordBtn.innerHTML = 'Forgot password? <strong>Reset it</strong>';
        }
    });

    // ── Resend magic link ─────────────────────────────────────────────────────
    resendBtn.addEventListener('click', async () => {
        if (!lastEmailUsed) { showView(viewEmail); return; }

        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending…';

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: lastEmailUsed,
                options: { emailRedirectTo: window.location.origin + '/desktop' }
            });
            if (error) throw error;
            resendBtn.textContent = 'Sent! Check your inbox ✓';
            setTimeout(() => {
                resendBtn.disabled = false;
                resendBtn.textContent = 'Resend Link';
            }, 5000);
        } catch (err) {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend Link';
        }
    });

    // ── Back to email view ────────────────────────────────────────────────────
    backToEmailBtn.addEventListener('click',  () => showView(viewEmail));
    backToEmailBtn2.addEventListener('click', () => showView(viewEmail));

    // ── Listen for auth state changes (e.g. magic link clicked in same tab) ──
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            window.location.href = '/desktop';
        }
        if (event === 'PASSWORD_RECOVERY') {
            // User clicked recovery link → go to reset page
            window.location.href = '/auth/reset-password.html';
        }
    });
});
