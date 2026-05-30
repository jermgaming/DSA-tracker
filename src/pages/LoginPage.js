import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Code2, Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true); setError('');
    const { error } = await signInWithGoogle();
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    if (mode === 'login') {
      const { error } = await signInWithEmail(email, password);
      if (error) { setError(error.message); setLoading(false); }
    } else {
      const { error } = await signUpWithEmail(email, password, name);
      if (error) { setError(error.message); setLoading(false); }
      else { setSuccess('Check your email to confirm your account!'); setLoading(false); }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left decorative panel - hidden on mobile */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg) 50%, #0d0020 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }} className="login-left">
        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <div style={{ background: 'var(--accent)', borderRadius: 16, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--accent-glow)' }}>
              <Code2 size={28} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>DSA Tracker</span>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 42, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16, fontFamily: 'var(--font-display)' }}>
            Master algorithms,<br /><span style={{ color: 'var(--accent)' }}>one day at a time.</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.6, marginBottom: 40 }}>
            Track your daily DSA practice, build streaks, and visualize your progress on a contribution heatmap.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🔥', text: 'Daily streak tracking to keep you motivated' },
              { icon: '📊', text: 'GitHub-style activity heatmap' },
              { icon: '🗂️', text: 'Organized by topic: Arrays, Trees, DP & more' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text2)', fontSize: 14 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--bg2)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }} className="mobile-logo">
            <div style={{ background: 'var(--accent)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18 }}>DSA Tracker</span>
          </div>

          <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 6, letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>
            {mode === 'login' ? "Sign in to continue your streak" : "Start your DSA journey today"}
          </p>

          {/* Google SSO */}
          <button onClick={handleGoogleSignIn} disabled={loading} style={{
            width: '100%', padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--bg3)', color: 'var(--text)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--font-display)', marginBottom: 20, transition: 'all 0.2s'
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: 'var(--green)', fontSize: 13, marginBottom: 16 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label className="label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)' }} />
                  <input className="input" style={{ paddingLeft: 38 }} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)' }} />
                <input className="input" style={{ paddingLeft: 38 }} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)' }} />
                <input className="input" style={{ paddingLeft: 38, paddingRight: 38 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15, marginTop: 4 }}>
              {loading ? <div className="spinner" /> : <><Zap size={16} />{mode === 'login' ? 'Sign In' : 'Create Account'}</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text2)' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-display)' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .mobile-logo { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
