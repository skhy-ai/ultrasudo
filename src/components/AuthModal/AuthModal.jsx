import React, { useState } from 'react';
import './AuthModal.css';

const SUPABASE_URL = "https://kxvkklltpvlgglqqnjpl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmtrbGx0cHZsZ2dscXFuanBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzAzMjIsImV4cCI6MjA4NzUwNjMyMn0.SBOUFz_yX8aClroTuQhwIjP-YhEcxtfZTo1mEW1Jpmc";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (window.supabaseClient) {
        if (tab === 'signin') {
          const { data, error: err } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
          });
          if (err) throw err;
          setMessage('Successfully signed in!');
          if (onAuthSuccess) onAuthSuccess(data.user);
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          const { data, error: err } = await window.supabaseClient.auth.signUp({
            email,
            password
          });
          if (err) throw err;
          setMessage('Account created successfully! Check your email or sign in.');
          if (onAuthSuccess && data.user) onAuthSuccess(data.user);
        }
      } else {
        // Fallback to Supabase Auth REST API directly if JS SDK isn't on window
        const endpoint = tab === 'signin' 
          ? `${SUPABASE_URL}/auth/v1/token?grant_type=password`
          : `${SUPABASE_URL}/auth/v1/signup`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error_description || data.msg || data.message || 'Authentication failed');
        }

        const user = data.user || { email, id: data.access_token ? 'user_' + Date.now() : 'guest' };
        localStorage.setItem('supabase_auth_token', data.access_token || '');
        localStorage.setItem('supabase_user_email', email);

        setMessage(tab === 'signin' ? 'Signed in successfully!' : 'Account created successfully!');
        if (onAuthSuccess) onAuthSuccess(user);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal-card">
        <button className="auth-modal-close" onClick={onClose}>
          <i className="fas fa-xmark"></i>
        </button>

        <div className="auth-modal-header">
          <h2 className="auth-modal-title">UltraSudo Account</h2>
          <p className="auth-modal-subtitle">Sync your workspace across all desktop & web devices</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError(''); setMessage(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); setMessage(''); }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}
        {message && <div className="auth-success-msg">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              type="email"
              id="auth-email"
              className="auth-form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              type="password"
              id="auth-password"
              className="auth-form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : (tab === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-guest-notice">
          <i className="fas fa-shield-halved"></i> Guest Mode is active by default. You don't need an account to use local apps.
        </p>
      </div>
    </div>
  );
}
