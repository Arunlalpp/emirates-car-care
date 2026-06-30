'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// Use local date methods to avoid UTC offset stripping the day (IST = UTC+5:30)
function localDateStr(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function chevron(dir: 'left' | 'right') {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
        </svg>
    )
}

export function DatePicker() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const todayStr = localDateStr(new Date())
    const selected = searchParams.get('date') ?? todayStr
    const isToday = selected === todayStr

    function navigate(delta: number) {
        // Parse as local midnight to avoid UTC-day-shift
        const [y, mo, d] = selected.split('-').map(Number)
        const date = new Date(y, mo - 1, d)
        date.setDate(date.getDate() + delta)
        const next = localDateStr(date)
        const p = new URLSearchParams(searchParams.toString())
        p.set('date', next)
        router.push(`${pathname}?${p.toString()}`)
    }

    // Display: parse as local date
    const [y, mo, d] = selected.split('-').map(Number)
    const display = new Date(y, mo - 1, d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    })

    return (
        <div
            className="flex items-center justify-between rounded-2xl px-3 py-3.5 mb-4"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }}
        >
            <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)' }}
                aria-label="Previous day"
            >
                {chevron('left')}
            </button>

            <div className="text-center select-none">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{display}</p>
                {isToday && (
                    <p className="text-[11px] font-bold tracking-[0.2em] mt-0.5" style={{ color: '#C8A44A' }}>TODAY</p>
                )}
            </div>

            <button
                onClick={() => navigate(1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)' }}
                aria-label="Next day"
            >
                {chevron('right')}
            </button>
        </div>
    )
}
