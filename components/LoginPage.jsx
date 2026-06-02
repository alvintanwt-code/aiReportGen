'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  LineChart,
} from 'lucide-react';
import { signUp, login, resetPassword } from '../lib/firebaseUtils';

export default function LoginPage({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const tagline = 'Smarter portfolio reviews.';
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    let currentIndex = 0;
    const id = setInterval(() => {
      if (currentIndex <= tagline.length) {
        setDisplayedText(tagline.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(id);
      }
    }, 55);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name.');
          setIsLoading(false);
          return;
        }
        await signUp(email, password, name);
      } else {
        await login(email, password);
      }
      onAuthSuccess();
    } catch (err) {
      console.error('[LoginPage] Auth error:', err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReset = async () => {
    if (!resetEmail.trim()) {
      setError('Enter the email tied to your account.');
      return;
    }
    setError('');
    setResetSending(true);
    try {
      await resetPassword(resetEmail);
      setResetMessage('Check your inbox for a reset link.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setResetSending(false);
    }
  };

  const closeReset = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetMessage('');
    setError('');
  };

  const toggleMode = () => {
    setIsSignUp((v) => !v);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setShowForgotPassword(false);
  };

  return (
    <div className="dash-auth">
      <aside className="dash-auth-aside">
        <div className="dash-auth-brand">
          <div className="dash-brand-mark">
            {logoFailed ? (
              'L'
            ) : (
              <img
                src="/leet-logo.png"
                alt="Leet Studio"
                onError={() => setLogoFailed(true)}
                style={{ width: '92%', height: '92%', objectFit: 'contain' }}
              />
            )}
          </div>
          <span>Leet Studio</span>
        </div>

        <div className="dash-auth-pitch">
          <h2>
            {displayedText}
            {displayedText.length < tagline.length && (
              <span className="dash-typing-cursor" aria-hidden="true" />
            )}
          </h2>
          <p>
            Upload statements, generate insights, and deliver client-ready reviews with an AI workflow built for financial advisors.
          </p>
        </div>

        <div className="dash-auth-features">
          <div className="dash-auth-feature">
            <span className="dash-auth-feature-icon">
              <Sparkles size={14} strokeWidth={2.2} />
            </span>
            <span>Extract holdings from screenshots or CSV in seconds.</span>
          </div>
          <div className="dash-auth-feature">
            <span className="dash-auth-feature-icon">
              <LineChart size={14} strokeWidth={2.2} />
            </span>
            <span>Generate quarterly reviews with allocation analysis baked in.</span>
          </div>
          <div className="dash-auth-feature">
            <span className="dash-auth-feature-icon">
              <ShieldCheck size={14} strokeWidth={2.2} />
            </span>
            <span>Client data stays scoped to your account, encrypted at rest.</span>
          </div>
        </div>
      </aside>

      <main className="dash-auth-main">
        <form className="dash-auth-form" onSubmit={handleSubmit}>
          <header className="dash-auth-header">
            <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
            <p>
              {isSignUp
                ? 'Set up an advisor account in under a minute.'
                : 'Sign in to continue managing client portfolios.'}
            </p>
          </header>

          {isSignUp && (
            <div className="dash-field">
              <label className="dash-label" htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                type="text"
                className="dash-input dash-input-lg"
                placeholder="Jordan Tan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="dash-field">
            <label className="dash-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="dash-input dash-input-lg"
              placeholder="you@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="dash-field">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <label className="dash-label" htmlFor="auth-password">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  className="dash-link dash-link-quiet"
                  style={{ fontSize: 12.5 }}
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              className="dash-input dash-input-lg"
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="dash-banner dash-banner-danger" role="alert">
              <span className="dash-banner-icon">
                <AlertCircle size={15} strokeWidth={2.2} />
              </span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="dash-btn dash-btn-primary dash-auth-submit"
            disabled={isLoading}
            style={isLoading ? { opacity: 0.7, cursor: 'wait' } : undefined}
          >
            {isLoading ? (
              <>
                <span className="dash-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                {isSignUp ? 'Creating account' : 'Signing in'}
              </>
            ) : (
              <>
                {isSignUp ? 'Create account' : 'Sign in'}
                <ArrowRight size={14} strokeWidth={2.4} />
              </>
            )}
          </button>

          <div className="dash-auth-divider">
            {isSignUp ? 'Already have an account?' : "New to Leet Studio?"}{' '}
            <button type="button" className="dash-link" onClick={toggleMode}>
              {isSignUp ? 'Sign in' : 'Create an account'}
            </button>
          </div>
        </form>
      </main>

      {showForgotPassword && (
        <div className="dash-modal" onClick={(e) => { if (e.target === e.currentTarget) closeReset(); }}>
          <div className="dash-modal-card is-small">
            <div className="dash-panel-header">
              <div>
                <div className="dash-h2" style={{ fontSize: 18 }}>Reset your password</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  We'll email you a link to set a new one.
                </div>
              </div>
            </div>
            <div className="dash-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resetMessage ? (
                <>
                  <div className="dash-banner dash-banner-success">
                    <span className="dash-banner-icon">
                      <CheckCircle2 size={15} strokeWidth={2.2} />
                    </span>
                    <span>{resetMessage}</span>
                  </div>
                  <button type="button" className="dash-btn dash-btn-primary" onClick={closeReset}>
                    Back to sign in
                  </button>
                </>
              ) : (
                <>
                  <div className="dash-field">
                    <label className="dash-label" htmlFor="reset-email">Email</label>
                    <input
                      id="reset-email"
                      type="email"
                      className="dash-input"
                      placeholder="you@firm.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <div className="dash-banner dash-banner-danger" role="alert">
                      <span className="dash-banner-icon">
                        <AlertCircle size={15} strokeWidth={2.2} />
                      </span>
                      <span>{error}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost"
                      onClick={closeReset}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="dash-btn dash-btn-primary"
                      onClick={handleSendReset}
                      disabled={resetSending}
                      style={{ flex: 1, ...(resetSending ? { opacity: 0.7, cursor: 'wait' } : null) }}
                    >
                      {resetSending ? 'Sending' : 'Send reset link'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
