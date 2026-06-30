'use client'

import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
    const { theme, toggle } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            onClick={toggle}
            className="flex items-center justify-between px-4 py-3.5 w-full transition-colors"
            style={{ borderTop: '1px solid var(--border-dim)' }}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
                    {isDark ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: '#C8A44A' }}>
                            <path strokeLinecap="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: '#C8A44A' }}>
                            <path strokeLinecap="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </div>
                <div style={{ textAlign: 'left' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {isDark ? 'Light Mode' : 'Dark Mode'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Currently {isDark ? 'dark' : 'light'} — tap to switch
                    </p>
                </div>
            </div>
            {/* Toggle pill */}
            <div
                className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
                style={{ background: isDark ? '#C8A44A' : 'var(--surface-3)' }}
            >
                <div
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300"
                    style={{
                        background: isDark ? '#0A0C10' : '#fff',
                        transform: isDark ? 'translateX(26px)' : 'translateX(2px)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                />
            </div>
        </button>
    )
}
