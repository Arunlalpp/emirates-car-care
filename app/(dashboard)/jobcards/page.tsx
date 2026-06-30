'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DatePicker } from '@/components/DatePicker'

const STAGES = [
    { key: 'booked',        label: 'Booked',      color: 'bg-indigo-100 text-indigo-700' },
    { key: 'received',      label: 'Received',    color: 'bg-slate-100 text-slate-600' },
    { key: 'inspection',    label: 'Inspection',  color: 'bg-blue-100 text-blue-700' },
    { key: 'in_service',    label: 'In Service',  color: 'bg-violet-100 text-violet-700' },
    { key: 'quality_check', label: 'QC',          color: 'bg-amber-100 text-amber-700' },
    { key: 'ready',         label: 'Ready',       color: 'bg-green-100 text-green-700' },
    { key: 'delivered',     label: 'Delivered',   color: 'bg-slate-200 text-slate-500' },
]

function stageMeta(key: string) {
    return STAGES.find(s => s.key === key) ?? STAGES[0]
}

function StageBar({ current }: { current: string }) {
    const idx = STAGES.findIndex(s => s.key === current)
    return (
        <div className="flex items-center gap-0 mt-3">
            {STAGES.filter(s => s.key !== 'delivered').map((s, i) => {
                const done = i < idx
                const active = i === idx
                return (
                    <div key={s.key} className="flex items-center flex-1 last:flex-none">
                        <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                            style={{
                                background: done ? '#16a34a' : active ? '#C8A44A' : 'rgba(255,255,255,0.08)',
                                boxShadow: active ? '0 0 8px rgba(200,164,74,0.5)' : 'none',
                            }}
                        >
                            {done ? (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                </svg>
                            ) : (
                                <div className="w-2 h-2 rounded-full" style={{ background: active ? '#0A0C10' : 'rgba(255,255,255,0.22)' }} />
                            )}
                        </div>
                        {i < STAGES.length - 2 && (
                            <div className="step-connector" style={{ background: done ? '#16a34a' : 'rgba(255,255,255,0.08)' }} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JobCard({ job }: { job: any }) {
    const meta = stageMeta(job.status)
    const customer = job.customerId
    const vehicle = job.vehicleId

    return (
        <Link
            href={`/jobcards/${job._id}`}
            className="block rounded-2xl p-4 card-lift animate-fadeInUp"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }}
        >
            <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{job.jobNumber}</span>
                    {job.notificationSent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                            ✓ Notified
                        </span>
                    )}
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                    {meta.label}
                </span>
            </div>

            <p className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{customer?.name ?? '—'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {vehicle?.regNumber} · {vehicle?.brand} {vehicle?.model}
            </p>

            {job.serviceType && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{job.serviceType}</p>
            )}

            <StageBar current={job.status} />

            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-dim)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                {job.totalAmount > 0 ? (
                    <span className="text-xs font-semibold" style={{ color: '#C8A44A' }}>₹{job.totalAmount.toLocaleString('en-IN')}</span>
                ) : job.estimatedCost ? (
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Est. ₹{job.estimatedCost}</span>
                ) : null}
            </div>
        </Link>
    )
}

const FILTER_TABS = [
    { key: '', label: 'All' },
    { key: 'received', label: 'Received' },
    { key: 'in_service', label: 'In Service' },
    { key: 'ready', label: 'Ready' },
]

async function fetchJobCards(filter: string) {
    const url = filter ? `/api/jobcards?status=${filter}` : '/api/jobcards'
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch job cards')
    const json = await res.json()
    return json.data ?? []
}

function JobCardsInner() {
    const [filter, setFilter] = useState('')
    const searchParams = useSearchParams()

    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const selectedDate = searchParams.get('date') ?? todayStr

    const { data: jobs = [], isLoading, isFetching } = useQuery({
        queryKey: ['jobcards', filter],
        queryFn: () => fetchJobCards(filter),
    })

    // Filter by createdAt date using LOCAL date to avoid UTC-day-shift (IST = UTC+5:30)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = jobs.filter((job: any) => {
        const d = new Date(job.createdAt)
        const jobDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return jobDate === selectedDate
    })

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Service</p>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Job Cards
                        {isFetching && !isLoading && (
                            <span className="ml-2 inline-block w-3 h-3 border-2 border-t-[#C8A44A] rounded-full animate-spin align-middle" style={{ borderColor: 'var(--border-dim)', borderTopColor: '#C8A44A' }} />
                        )}
                    </h1>
                </div>
                <Link
                    href="/jobcards/new"
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#C8A44A' }}
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </Link>
            </div>

            {/* Date picker */}
            <DatePicker />

            {/* Status filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
                        style={
                            filter === tab.key
                                ? { background: '#C8A44A', color: '#0D0D0D' }
                                : { background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)' }
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }}>
                            <div className="h-3 rounded w-24 mb-3" style={{ background: 'var(--surface-2)' }} />
                            <div className="h-4 rounded w-40 mb-2" style={{ background: 'var(--surface-2)' }} />
                            <div className="h-3 rounded w-32" style={{ background: 'var(--surface-2)' }} />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
                            <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        No job cards on this date{filter ? ` with status "${filter}"` : ''}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Use ← → to browse other dates</p>
                    <Link
                        href="/jobcards/new"
                        className="mt-5 inline-block px-6 py-3 rounded-2xl text-sm font-semibold"
                        style={{ background: '#C8A44A', color: '#0D0D0D' }}
                    >
                        New Job Card
                    </Link>
                </div>
            ) : (
                <div className="space-y-3 pb-24">
                    <p className="text-xs font-medium px-1 mb-2" style={{ color: 'var(--text-muted)' }}>
                        {filtered.length} job card{filtered.length !== 1 ? 's' : ''}
                    </p>
                    {filtered.map((job: { _id: string }) => <JobCard key={job._id} job={job} />)}
                </div>
            )}

            <Link
                href="/jobcards/new"
                className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg lg:hidden"
                style={{ background: '#C8A44A' }}
            >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </Link>
        </div>
    )
}

export default function JobCardsPage() {
    return (
        <Suspense fallback={
            <div className="max-w-2xl mx-auto px-4 pt-12">
                <div className="h-8 rounded w-32 mb-4 animate-pulse" style={{ background: 'var(--surface-1)' }} />
                <div className="h-14 rounded-2xl mb-4 animate-pulse" style={{ background: 'var(--surface-1)' }} />
            </div>
        }>
            <JobCardsInner />
        </Suspense>
    )
}
