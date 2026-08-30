/**
 * Ultrasudo Reset Password Handler
 * Supabase Project: uzwkvctnmruesdhtfbvz
 *
 * This page handles the recovery flow:
 * 1. User arrives with ?code= or #access_token=...&type=recovery in URL
 * 2. Exchange the token for an authenticated session
 * 3. User sets a new password → supabase.auth.updateUser({ password })
 * 4. On success → redirect to /desktop (session already active)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('[ResetPassword] Supabase client not initialized.');
        showView(viewInvalid);
        return;
    }

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const viewLoading = document.getElementById('view-loading');
    const viewInvalid = document.getElementById('view-invalid');
    const viewReset   = document.getElementById('view-reset');
    const viewSuccess = document.getElementById('view-success');

    const resetForm      = document.getElementById('reset-form');
    const newPwInput     = document.getElementById('new-password');
    const confirmPwInput = document.getElementById('confirm-password');
    const resetBtn       = document.getElementById('reset-btn');
    const btnText        = resetBtn.querySelector('.btn-text');
    const btnSpinner     = resetBtn.querySelector('.btn-spinner');
    const errorEl        = document.getElementById('reset-error');
    const countdownEl    = document.getElementById('countdown');

    const strengthBar   = document.getElementById('strength-bar');
    const strengthLabel = document.getElementById('strength-label');

    const togglePw1 = document.getElementById('toggle-pw-1');
    const togglePw2 = document.getElementById('toggle-pw-2');

    const backBtn = document.getElementById('back-to-login-btn');

    // ── View helper ───────────────────────────────────────────────────────────
    function showView(el) {
        [viewLoading, viewInvalid, viewReset, viewSuccess].forEach(v => {
            v.classList.remove('active');
        });
        el.classList.add('active');
    }

    // ── Step 1: Show loading, then exchange token ─────────────────────────────
    showView(viewLoading);

    let sessionEstablished = false;

    try {
        // Supabase may have already parsed the hash-fragment token automatically.
        // Call getSession first — it works if supabase already exchanged the token.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session?.user) {
            sessionEstablished = true;
        } else {
            // Try manual exchange via URL code or hash
            const params = new URLSearchParams(window.location.search);
            const hash   = window.location.hash;

            const code  = params.get('code');
            const token = hash.includes('access_token') ? hash.substring(1) : null;

            if (code || token) {
                const { data: exchanged, error: exchErr } = await supabase.auth.exchangeCodeForSession(
                    code || token
                );
                if (exchErr) throw exchErr;
                if (exchanged?.session) sessionEstablished = true;
            }
        }

        // Also listen for PASSWORD_RECOVERY event (hash flow on some Supabase versions)
        supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session?.user) {
                if (!sessionEstablished) {
                    sessionEstablished = true;
                    showView(viewReset);
                    newPwInput.focus();
                }
            }
        });

    } catch (err) {
        console.error('[ResetPassword] Token exchange failed:', err);
        showView(viewInvalid);
        return;
    }

    if (sessionEstablished) {
        showView(viewReset);
        newPwInput.focus();
    } else {
        // Give onAuthStateChange a moment to fire
        setTimeout(() => {
            if (!sessionEstablished) showView(viewInvalid);
        }, 2000);
    }

    // ── Password toggle visibility ────────────────────────────────────────────
    function bindToggle(btn, input) {
        btn.addEventListener('click', () => {
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.textContent = isHidden ? '🙈' : '👁';
        });
    }
    bindToggle(togglePw1, newPwInput);
    bindToggle(togglePw2, confirmPwInput);

    // ── Password strength meter ───────────────────────────────────────────────
    const REQ_IDS = {
        len:     { el: document.getElementById('req-len'),     test: v => v.length >= 8 },
        upper:   { el: document.getElementById('req-upper'),   test: v => /[A-Z]/.test(v) },
        lower:   { el: document.getElementById('req-lower'),   test: v => /[a-z]/.test(v) },
        num:     { el: document.getElementById('req-num'),     test: v => /\d/.test(v) },
        special: { el: document.getElementById('req-special'), test: v => /[^A-Za-z0-9]/.test(v) },
    };

    const STRENGTH_LEVELS = [
        { label: '',           color: '',         pct: 0   },
        { label: 'Weak',       color: '#f87171',  pct: 20  },
        { label: 'Fair',       color: '#fb923c',  pct: 40  },
        { label: 'Moderate',   color: '#facc15',  pct: 60  },
        { label: 'Strong',     color: '#34d399',  pct: 80  },
        { label: 'Very Strong',color: '#22d3ee',  pct: 100 },
    ];

    newPwInput.addEventListener('input', () => {
        const v = newPwInput.value;
        let score = 0;

        Object.values(REQ_IDS).forEach(({ el, test }) => {
            const met = test(v);
            el.classList.toggle('met', met);
            if (met) score++;
        });

        const level = STRENGTH_LEVELS[score];
        strengthBar.style.width      = level.pct + '%';
        strengthBar.style.background = level.color;
        strengthLabel.textContent    = level.label;
        strengthLabel.style.color    = level.color || 'var(--text-subtle)';
    });

    // ── Error/success helpers ─────────────────────────────────────────────────
    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.className = 'message error-message';
    }
    function clearError() { errorEl.textContent = ''; }

    // ── Form submit: update password ──────────────────────────────────────────
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const newPw  = newPwInput.value;
        const confPw = confirmPwInput.value;

        // Validation
        if (newPw.length < 8) {
            showError('Password must be at least 8 characters.'); return;
        }
        if (newPw !== confPw) {
            showError('Passwords do not match.'); return;
        }

        // Loading state
        resetBtn.disabled  = true;
        btnText.hidden     = true;
        btnSpinner.hidden  = false;

        try {
            const { error } = await supabase.auth.updateUser({ password: newPw });
            if (error) throw error;

            // Success — show confirmation and countdown
            showView(viewSuccess);
            let secs = 3;
            const timer = setInterval(() => {
                secs--;
                if (countdownEl) countdownEl.textContent = secs;
                if (secs <= 0) {
                    clearInterval(timer);
                    window.location.href = '/desktop';
                }
            }, 1000);

        } catch (err) {
            showError(err.message || 'Failed to update password. Please try again.');
            resetBtn.disabled = false;
            btnText.hidden    = false;
            btnSpinner.hidden = true;
        }
    });

    // ── Back to login ─────────────────────────────────────────────────────────
    backBtn.addEventListener('click', () => {
        window.location.href = '/auth/login.html';
    });
});
