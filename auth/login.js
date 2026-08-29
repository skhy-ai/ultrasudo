document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.supabaseClient;
    const form = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');

    // Check if session already exists
    checkSession();

    async function checkSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
            window.location.href = '/desktop';
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        setTimeout(() => { errorMessage.textContent = ''; }, 5000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        signinBtn.disabled = true;
        signinBtn.textContent = 'Signing in...';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Success, redirect to desktop
            window.location.href = '/desktop';

        } catch (error) {
            showError(error.message || 'Invalid login credentials.');
        } finally {
            signinBtn.disabled = false;
            signinBtn.textContent = 'Sign In';
        }
    });

    signupBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter email and password to sign up.');
            return;
        }

        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account...';

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) throw error;

            if (data?.user?.identities?.length === 0) {
                showError('An account with this email already exists.');
            } else {
                showError('Account created! You may now sign in.');
                passwordInput.value = '';
            }

        } catch (error) {
            showError(error.message || 'Error occurred during sign up.');
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account';
        }
    });
});
