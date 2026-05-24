'use client';

import { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        if (!name.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        await signUp(email, password, name);
        console.log('[LoginPage] Sign up successful');
      } else {
        // Login
        await login(email, password);
        console.log('[LoginPage] Login successful');
      }

      // Success - callback to parent
      onAuthSuccess();
    } catch (err) {
      console.error('[LoginPage] Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gradient-northern-lights" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '700', margin: '0 0 16px 0', color: '#1a1a1a', letterSpacing: '-1px', fontFamily: "'Albra', sans-serif" }}>
            Welcome
          </h1>
          <p style={{ fontSize: '16px', color: '#666', margin: '0', fontFamily: "'Poppins', sans-serif" }}>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name Field (only for signup) */}
          {isSignUp && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: '14px 18px',
                fontSize: '15px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '45px',
                color: '#1a1a1a',
                outline: 'none',
                fontFamily: "'Poppins', sans-serif",
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 1)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
              }}
            />
          )}

          {/* Email Field */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '14px 18px',
              fontSize: '15px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '45px',
              color: '#1a1a1a',
              outline: 'none',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 1)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            }}
          />

          {/* Password Field */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '14px 18px',
              fontSize: '15px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '45px',
              color: '#1a1a1a',
              outline: 'none',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 1)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            }}
          />

          {/* Error Message */}
          {error && (
            <p style={{ color: '#dc3545', fontSize: '14px', margin: '0', textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '14px 24px',
              backgroundColor: '#FFA366',
              color: 'white',
              border: 'none',
              borderRadius: '45px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'background-color 0.2s ease',
              fontFamily: "'Poppins', sans-serif",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#FF8F44';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#FFA366';
            }}
          >
            {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password Link */}
        {!isSignUp && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: "'Poppins', sans-serif",
                transition: 'color 0.2s ease',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#666';
                e.target.style.boxShadow = 'none';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#999';
                e.target.style.boxShadow = 'none';
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Toggle */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0', fontFamily: "'Poppins', sans-serif" }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setName('');
                setEmail('');
                setPassword('');
                setShowForgotPassword(false);
                setResetEmail('');
                setResetMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFA366',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'Poppins', sans-serif",
                transition: 'opacity 0.2s ease',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.8';
                e.target.style.boxShadow = 'none';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
                e.target.style.boxShadow = 'none';
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#1a1a1a',
              fontFamily: "'Poppins', sans-serif",
            }}>
              Reset Password
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '0 0 24px 0',
              fontFamily: "'Poppins', sans-serif",
            }}>
              Enter your email and we'll send you a password reset link.
            </p>

            {resetMessage && (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px',
                fontFamily: "'Poppins', sans-serif",
              }}>
                {resetMessage}
              </div>
            )}

            {!resetMessage && (
              <>
                <input
                  type="email"
                  placeholder="Email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    marginBottom: '16px',
                    fontFamily: "'Poppins', sans-serif",
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFA366';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                  }}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!resetEmail) {
                        setError('Please enter your email');
                        return;
                      }
                      setIsLoading(true);
                      try {
                        await resetPassword(resetEmail);
                        setResetMessage('Password reset email sent! Check your inbox.');
                      } catch (err) {
                        setError(err.message || 'Failed to send reset email');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: '#FFA366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: "'Poppins', sans-serif",
                      opacity: isLoading ? 0.7 : 1,
                      transition: 'background-color 0.2s ease',
                      boxShadow: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#FF8F44';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.target.style.backgroundColor = '#FFA366';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setResetMessage('');
                      setError('');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: '#f0f0f0',
                      color: '#666',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: "'Poppins', sans-serif",
                      transition: 'background-color 0.2s ease',
                      boxShadow: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e0e0e0';
                      e.target.style.boxShadow = 'none';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {resetMessage && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetMessage('');
                }}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#FFA366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background-color 0.2s ease',
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#FF8F44';
                  e.target.style.boxShadow = 'none';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FFA366';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Back to Login
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
