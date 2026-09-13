import React, { useState } from 'react';
import * as api from '../api/index.js';
import ThemeToggle from './ThemeToggle.jsx';

/* ══════════════════════════════════════════════════════════
   3D GOLD COIN LOGO — clickable with spin & press animation
   ══════════════════════════════════════════════════════════ */
function KikobaLogo({ onClick }) {
  const [pressed,  setPressed]  = useState(false);
  const [spinning, setSpinning] = useState(false);

  function handleClick() {
    if (spinning) return;
    setPressed(true);
    setSpinning(true);
    setTimeout(() => setPressed(false), 150);
    setTimeout(() => setSpinning(false), 900);
    if (onClick) onClick();
  }

  return (
    <div
      className={`kikoba-logo-wrap${pressed ? ' logo-pressed' : ''}${spinning ? ' logo-spin' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title="Bonyeza kuhusu mfumo"
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label="Kikoba System Logo"
    >
      {/* Ambient glow */}
      <div className="logo-glow-ring" />

      {/* 3D coin body */}
      <div className="logo-coin">
        <div className="logo-face">
          <svg viewBox="0 0 120 120" className="logo-svg" aria-hidden="true">
            <defs>
              {/* Main gold gradient */}
              <radialGradient id="lg-coin" cx="38%" cy="32%" r="68%">
                <stop offset="0%"   stopColor="#fff0a0" />
                <stop offset="30%"  stopColor="#f0c030" />
                <stop offset="65%"  stopColor="#b8860b" />
                <stop offset="100%" stopColor="#6b4400" />
              </radialGradient>
              {/* Inner relief gradient */}
              <radialGradient id="lg-inner" cx="42%" cy="36%" r="62%">
                <stop offset="0%"   stopColor="#fff8d0" />
                <stop offset="40%"  stopColor="#daa520" />
                <stop offset="100%" stopColor="#8b6000" />
              </radialGradient>
              {/* Shine spot */}
              <radialGradient id="lg-shine" cx="35%" cy="28%" r="45%">
                <stop offset="0%"  stopColor="white" stopOpacity="0.55" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              {/* Drop shadow filter */}
              <filter id="lg-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#6b4400" floodOpacity="0.6" />
              </filter>
              {/* Emboss filter for text */}
              <filter id="lg-emboss">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                <feOffset dx="0.5" dy="1" in="blur" result="offset" />
                <feComposite in="SourceGraphic" in2="offset" operator="over" />
              </filter>
            </defs>

            {/* ── Outer rim ── */}
            <circle cx="60" cy="60" r="58" fill="url(#lg-coin)" filter="url(#lg-shadow)" />

            {/* Knurled edge — 40 radial notches */}
            {Array.from({ length: 40 }, (_, i) => {
              const a  = (i * 9) * Math.PI / 180;
              const x1 = 60 + 53 * Math.cos(a),  y1 = 60 + 53 * Math.sin(a);
              const x2 = 60 + 57.5 * Math.cos(a), y2 = 60 + 57.5 * Math.sin(a);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#6b4400" strokeWidth="1.8" opacity="0.55" />;
            })}

            {/* ── Inner field ── */}
            <circle cx="60" cy="60" r="49" fill="url(#lg-inner)" />
            {/* Raised inner border rings */}
            <circle cx="60" cy="60" r="49" fill="none" stroke="#fff0a0" strokeWidth="1.2" opacity="0.7" />
            <circle cx="60" cy="60" r="46" fill="none" stroke="#8b6000" strokeWidth="0.7" opacity="0.45" />

            {/* ── KK monogram ── */}
            {/* Shadow layer */}
            <text x="61.5" y="56" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif"
              fontSize="28" fontWeight="900" fill="#5a3000" opacity="0.5">KK</text>
            {/* Main layer */}
            <text x="60" y="55" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif"
              fontSize="28" fontWeight="900" fill="#fff8dc" filter="url(#lg-emboss)">KK</text>

            {/* ── Curved text — TOP ── */}
            <path id="lg-arc-top"
              d="M 24,60 A 36,36 0 0,1 96,60" fill="none" />
            {/* shadow */}
            <text fontSize="8" fontFamily="Georgia,serif" fontWeight="700" fill="#5a3000" opacity="0.45">
              <textPath href="#lg-arc-top" startOffset="6%">✦ UMOJA KIKOBA ✦</textPath>
            </text>
            {/* face */}
            <text fontSize="8" fontFamily="Georgia,serif" fontWeight="700" fill="#fff8dc">
              <textPath href="#lg-arc-top" startOffset="6%">✦ UMOJA KIKOBA ✦</textPath>
            </text>

            {/* ── Curved text — BOTTOM ── */}
            <path id="lg-arc-bot"
              d="M 24,60 A 36,36 0 0,0 96,60" fill="none" />
            <text fontSize="7.5" fontFamily="Georgia,serif" fontWeight="700" fill="#5a3000" opacity="0.45">
              <textPath href="#lg-arc-bot" startOffset="8%">MFUMO WA KIBENKI</textPath>
            </text>
            <text fontSize="7.5" fontFamily="Georgia,serif" fontWeight="700" fill="#fff8dc">
              <textPath href="#lg-arc-bot" startOffset="8%">MFUMO WA KIBENKI</textPath>
            </text>

            {/* ── Shine overlay ── */}
            <circle cx="60" cy="60" r="49" fill="url(#lg-shine)" />

            {/* ── Small star accents ── */}
            <text x="33" y="66" textAnchor="middle" fontSize="5.5" fill="#fff0a0" opacity="0.8">★</text>
            <text x="87" y="66" textAnchor="middle" fontSize="5.5" fill="#fff0a0" opacity="0.8">★</text>
          </svg>
        </div>

        {/* 3D coin thickness — left/right edges */}
        <div className="logo-edge logo-edge-right" />
        <div className="logo-edge logo-edge-bottom" />
      </div>

      {/* Ground shadow */}
      <div className="logo-ground-shadow" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LOGIN PAGE
   ══════════════════════════════════════════════════════════ */
export default function LoginPage({ onLogin, onCancel }) {
  const [mode,     setMode]     = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Read theme directly from DOM (set by main.jsx before React mounts)
  const [theme, setThemeLocal] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  function toggleThemeLocal() {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kikoba_theme', next);
    setThemeLocal(next);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ username, password });
      const user = data.user || data.admin;
      if (!user) throw new Error('Jibu la seva halina taarifa za mtumiaji.');
      if (!user.role) user.role = 'admin';
      localStorage.setItem('kikoba_token', data.token);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.setupAdmin({ username, password, setupKey });
      const data = await api.login({ username, password });
      const user = data.user || data.admin;
      if (!user) throw new Error('Jibu la seva halina taarifa za mtumiaji.');
      if (!user.role) user.role = 'admin';
      localStorage.setItem('kikoba_token', data.token);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      {/* Theme toggle — top right corner */}
      <div style={{ position: 'fixed', top: 14, right: 16, zIndex: 100 }}>
        <ThemeToggle theme={theme} onToggle={toggleThemeLocal} />
      </div>

      <div className="login-card">

        {/* 3D Gold Coin Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <KikobaLogo />
        </div>

        <h1 className="login-title" translate="no" lang="sw">UMOJA KIKOBA</h1>
        <p className="login-sub">Ingia kwa akaunti yako</p>

        {error && (
          <div className="flash error" style={{ marginBottom: 14 }}>{error}</div>
        )}

        <form onSubmit={handleLogin} noValidate>
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label className="form-label">Jina la Mtumiaji</label>
            <input
              className="form-input"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="mf. admin au jina.lako"
              autoFocus
            />
          </div>

          <div className="form-field" style={{ marginBottom: 22 }}>
            <label className="form-label">Nenosiri</label>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Tafadhali subiri...' : 'Ingia'}
          </button>
        </form>

        {onCancel && (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <button className="btn-link" style={{ color: '#aaa', fontSize: 12 }} onClick={onCancel}>
              ← Rudi bila kuingia
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
