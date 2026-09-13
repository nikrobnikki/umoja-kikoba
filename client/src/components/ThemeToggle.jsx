import React from 'react';

/**
 * ThemeToggle — compact pill toggle shown in Header and MemberPortal.
 * Works for any user (officer or member).
 */
export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={isDark ? 'Badilisha hadi mwanga' : 'Badilisha hadi giza'}
      aria-label={isDark ? 'Mwanga mode' : 'Giza mode'}
      type="button"
    >
      {/* Icon */}
      <span style={{ fontSize: 13, lineHeight: 1 }}>
        {isDark ? '☀️' : '🌙'}
      </span>

      {/* Sliding pill track */}
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          {isDark ? '☀' : '●'}
        </div>
      </div>
    </button>
  );
}
