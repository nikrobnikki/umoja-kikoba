import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import * as api from '../api/index.js';
import ThemeToggle from './ThemeToggle.jsx';

const ROLE_LABEL = {
  admin:      'Msimamizi',
  mwenyekiti: 'Mwenyekiti',
  katibu:     'Katibu',
  mwasibu:    'Mwasibu',
};

/* ══════════════════════════════════════════════════════════
   3D CLICKABLE STAMP — "KITABU CHA KIELEKTRONIKI"
   Click navigates to dashibodi
   ══════════════════════════════════════════════════════════ */
function KitabuStamp({ onClick }) {
  const [pressed,  setPressed]  = useState(false);
  const [stamping, setStamping] = useState(false);

  function handleClick() {
    if (stamping) return;
    setPressed(true);
    setStamping(true);
    setTimeout(() => setPressed(false), 160);
    setTimeout(() => setStamping(false), 700);
    if (onClick) onClick();
  }

  return (
    <button
      className={`ks-wrap${pressed ? ' ks-pressed' : ''}${stamping ? ' ks-stamp' : ''}`}
      onClick={handleClick}
      title="Rudi Dashibodini"
      aria-label="Rudi Dashibodini — Kitabu cha Kielektroniki"
      type="button"
    >
      {/* Outer glow */}
      <div className="ks-glow" />

      {/* Coin disc */}
      <div className="ks-disc">
        <svg viewBox="0 0 110 110" className="ks-svg" aria-hidden="true">
          <defs>
            {/* Disc gradient — warm gold on dark navy */}
            <radialGradient id="ks-bg" cx="40%" cy="35%" r="68%">
              <stop offset="0%"   stopColor="#2a3f5c" />
              <stop offset="55%"  stopColor="#1a2b42" />
              <stop offset="100%" stopColor="#0d1928" />
            </radialGradient>
            {/* Gold rim gradient */}
            <radialGradient id="ks-rim" cx="38%" cy="32%" r="70%">
              <stop offset="0%"   stopColor="#f5e09a" />
              <stop offset="40%"  stopColor="#c8941c" />
              <stop offset="100%" stopColor="#7a4e00" />
            </radialGradient>
            {/* Inner field */}
            <radialGradient id="ks-field" cx="42%" cy="36%" r="62%">
              <stop offset="0%"   stopColor="#243652" />
              <stop offset="100%" stopColor="#111e30" />
            </radialGradient>
            {/* Shine */}
            <radialGradient id="ks-shine" cx="35%" cy="28%" r="48%">
              <stop offset="0%"  stopColor="white" stopOpacity="0.14" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <filter id="ks-drop" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="5"
                floodColor="#000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* ── Outer gold rim ── */}
          <circle cx="55" cy="55" r="53" fill="url(#ks-rim)" filter="url(#ks-drop)" />

          {/* Knurled notches on rim */}
          {Array.from({ length: 44 }, (_, i) => {
            const a  = (i * (360 / 44)) * Math.PI / 180;
            const x1 = 55 + 49 * Math.cos(a), y1 = 55 + 49 * Math.sin(a);
            const x2 = 55 + 53 * Math.cos(a), y2 = 55 + 53 * Math.sin(a);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#5a3000" strokeWidth="1.6" opacity="0.55" />;
          })}

          {/* ── Inner dark field ── */}
          <circle cx="55" cy="55" r="46" fill="url(#ks-field)" />

          {/* Inner gold border rings */}
          <circle cx="55" cy="55" r="46" fill="none" stroke="#c8941c" strokeWidth="1.4" opacity="0.7" />
          <circle cx="55" cy="55" r="43" fill="none" stroke="#c8941c" strokeWidth="0.5" opacity="0.35" />

          {/* ── Book icon (open book SVG path) ── */}
          <g transform="translate(55,44)" fill="none">
            {/* Left page */}
            <path d="M-16,-8 C-16,-8 -16,8 -16,10 C-10,8 -2,9 0,10 L0,-8 C-2,-9 -10,-10 -16,-8 Z"
              fill="#c8941c" opacity="0.9" />
            {/* Right page */}
            <path d="M16,-8 C16,-8 16,8 16,10 C10,8 2,9 0,10 L0,-8 C2,-9 10,-10 16,-8 Z"
              fill="#e8b830" opacity="0.85" />
            {/* Spine */}
            <rect x="-1.2" y="-8" width="2.4" height="18" fill="#fff4c2" opacity="0.9" rx="0.8" />
            {/* Page lines */}
            <line x1="-14" y1="-3" x2="-3" y2="-2.5" stroke="#fff4c2" strokeWidth="0.8" opacity="0.5"/>
            <line x1="-14" y1="0"  x2="-3" y2="0.5"  stroke="#fff4c2" strokeWidth="0.8" opacity="0.5"/>
            <line x1="-14" y1="3"  x2="-3" y2="3.5"  stroke="#fff4c2" strokeWidth="0.8" opacity="0.4"/>
            <line x1="3"  y1="-2.5" x2="14" y2="-3"  stroke="#fff4c2" strokeWidth="0.8" opacity="0.5"/>
            <line x1="3"  y1="0.5"  x2="14" y2="0"   stroke="#fff4c2" strokeWidth="0.8" opacity="0.5"/>
            <line x1="3"  y1="3.5"  x2="14" y2="3"   stroke="#fff4c2" strokeWidth="0.8" opacity="0.4"/>
          </g>

          {/* ── Top arc text: KITABU CHA ── */}
          <path id="ks-top" d="M 18,55 A 37,37 0 0,1 92,55" fill="none" />
          {/* shadow */}
          <text fontSize="7.8" fontFamily="Georgia,serif" fontWeight="700" fill="#0d1928" opacity="0.7">
            <textPath href="#ks-top" startOffset="12%">KITABU CHA</textPath>
          </text>
          {/* face */}
          <text fontSize="7.8" fontFamily="Georgia,serif" fontWeight="700" fill="#f5e09a">
            <textPath href="#ks-top" startOffset="12%">KITABU CHA</textPath>
          </text>

          {/* ── Bottom arc text: KIELEKTRONIKI ── */}
          <path id="ks-bot" d="M 18,55 A 37,37 0 0,0 92,55" fill="none" />
          <text fontSize="7.2" fontFamily="Georgia,serif" fontWeight="700" fill="#0d1928" opacity="0.7">
            <textPath href="#ks-bot" startOffset="4%">KIELEKTRONIKI</textPath>
          </text>
          <text fontSize="7.2" fontFamily="Georgia,serif" fontWeight="700" fill="#f5e09a">
            <textPath href="#ks-bot" startOffset="4%">KIELEKTRONIKI</textPath>
          </text>

          {/* Shine overlay */}
          <circle cx="55" cy="55" r="46" fill="url(#ks-shine)" />

          {/* Star accents */}
          <text x="28" y="60" textAnchor="middle" fontSize="5" fill="#c8941c" opacity="0.8">✦</text>
          <text x="82" y="60" textAnchor="middle" fontSize="5" fill="#c8941c" opacity="0.8">✦</text>
        </svg>

        {/* 3D edges */}
        <div className="ks-edge ks-edge-r" />
        <div className="ks-edge ks-edge-b" />
      </div>

      {/* Ground shadow */}
      <div className="ks-shadow" />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════ */
export default function Header() {
  const { settings, setSettings, user, isAdmin, handleLogout, openLogin, setTab, theme, toggleTheme } = useApp();
  const [localName, setLocalName] = useState(settings.groupName);

  async function handleBlur() {
    if (!isAdmin) return;
    const name = localName.trim() || 'FFU UMOJA GROUP';
    if (name === settings.groupName) return;
    try {
      const s = await api.saveSettings({ groupName: name, sharePrice: settings.sharePrice });
      setSettings(prev => ({ ...prev, groupName: s.groupName }));
    } catch { /* ignore */ }
  }

  const roleLabel = ROLE_LABEL[user?.role] || user?.role || '';

  return (
    <div className="cover">
      <div className="cover-top">

        {/* ── Left: group name + subtitle ── */}
        <div className="cover-left">
          <input
            className="cover-input"
            value={localName}
            onChange={e => setLocalName(e.target.value)}
            onBlur={handleBlur}
            readOnly={!isAdmin}
            title={isAdmin ? 'Bonyeza kubadilisha jina la kikoba' : settings.groupName}
          />
          <p className="cover-subtitle">Mfumo wa Kikoba — Usimamizi wa Hisa na Jamii</p>
        </div>

        {/* ── Right: 3D stamp + theme toggle + admin bar ── */}
        <div className="cover-right">
          <KitabuStamp onClick={() => setTab('dashibodi')} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {user ? (
              <div className="admin-bar">
                <span className="admin-bar-name">
                  <span className="admin-bar-dot" />
                  {user.username}
                  {roleLabel && (
                    <span className="admin-role-chip">{roleLabel}</span>
                  )}
                </span>
                <button className="admin-bar-logout" onClick={handleLogout} title="Toka">Toka</button>
              </div>
            ) : (
              <button className="admin-bar-login" onClick={openLogin} title="Ingia kama msimamizi">
                🔐 Ingia
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
