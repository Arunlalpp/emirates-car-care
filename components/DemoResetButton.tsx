'use client'

import { useState } from 'react'

interface ResetResult {
    message: string
    staff: { name: string; email: string; role: string }[]
    customers: string[]
    staffPassword: string
}

export default function DemoResetButton() {
    const [state, setState] = useState<'idle' | 'confirm' | 'loading' | 'done' | 'error'>('idle')
    const [result, setResult] = useState<ResetResult | null>(null)
    const [errMsg, setErrMsg] = useState('')

    async function handleReset() {
        setState('loading')
        try {
            const res = await fetch('/api/admin/reset', { method: 'POST' })
            const json = await res.json()
            if (!res.ok) {
                setErrMsg(json.error ?? 'Reset failed')
                setState('error')
            } else {
                setResult(json)
                setState('done')
            }
        } catch {
            setErrMsg('Network error')
            setState('error')
        }
    }

    if (state === 'idle') {
        return (
            <button
                onClick={() => setState('confirm')}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold active:scale-[0.98] transition-transform"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', color: '#EAB308' }}
            >
                Demo Reset — Load Sample Data
            </button>
        )
    }

    if (state === 'confirm') {
        return (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-sm font-semibold" style={{ color: '#F87171' }}>⚠️ This will delete all job cards, appointments, customers and vehicles.</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>10 demo customers + 6 staff members will be created. Service items are kept.</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setState('idle')}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        Yes, Reset
                    </button>
                </div>
            </div>
        )
    }

    if (state === 'loading') {
        return (
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }}>
                <span className="w-4 h-4 border-2 border-t-[#C8A44A] rounded-full animate-spin shrink-0" style={{ borderColor: 'var(--border-dim)', borderTopColor: '#C8A44A' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Seeding demo data…</p>
            </div>
        )
    }

    if (state === 'done' && result) {
        return (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>✓ {result.message}</p>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Staff Accounts</p>
                    <div className="space-y-1.5">
                        {result.staff.map(s => (
                            <div key={s.email} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'var(--surface-1)' }}>
                                <div>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded capitalize font-medium" style={{ background: 'rgba(200,164,74,0.12)', color: '#C8A44A' }}>{s.role}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                        Password for all staff: <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{result.staffPassword}</span>
                    </p>
                </div>

                <button
                    onClick={() => setState('idle')}
                    className="text-xs font-semibold"
                    style={{ color: 'var(--text-muted)' }}
                >
                    Dismiss
                </button>
            </div>
        )
    }

    return (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#F87171' }}>Reset failed</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{errMsg}</p>
            <button onClick={() => setState('idle')} className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Try again</button>
        </div>
    )
}
