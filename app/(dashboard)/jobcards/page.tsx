'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const STAGES = [
    { key: 'received',      label: 'Received',      color: 'bg-slate-100 text-slate-600' },
    { key: 'inspection',    label: 'Inspection',     color: 'bg-blue-100 text-blue-700' },
    { key: 'in_service',    label: 'In Service',     color: 'bg-violet-100 text-violet-700' },
    { key: 'quality_check', label: 'QC',             color: 'bg-amber-100 text-amber-700' },
    { key: 'ready',         label: 'Ready',          color: 'bg-green-100 text-green-700' },
    { key: 'delivered',     label: 'Delivered',      color: 'bg-slate-200 text-slate-500' },
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
                                background: done ? '#16a34a' : active ? '#0f172a' : '#e2e8f0',
                            }}
                        >
                            {done ? (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                </svg>
                            ) : (
                                <div className="w-2 h-2 rounded-full" style={{ background: active ? 'white' : '#cbd5e1' }} />
                            )}
                        </div>
                        {i < STAGES.length - 2 && (
                            <div className="step-connector" style={{ background: done ? '#16a34a' : '#e2e8f0' }} />
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
        <Link href={`/jobcards/${job._id}`} className="block bg-white rounded-2xl border border-slate-100 p-4 shadow-sm card-lift animate-fadeInUp">
            <div className="flex items-start justify-between mb-1">
                <div>
                    <span className="text-xs font-mono font-bold text-slate-400">{job.jobNumber}</span>
                    {job.notificationSent && (
                        <span className="ml-2 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                            ✓ Notified
                        </span>
                    )}
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                    {meta.label}
                </span>
            </div>

            <p className="font-semibold text-slate-900 text-[15px]">{customer?.name ?? '—'}</p>
            <p className="text-xs text-slate-400 mt-0.5">
                {vehicle?.regNumber} · {vehicle?.brand} {vehicle?.model}
            </p>

            {job.serviceType && (
                <p className="text-xs text-slate-500 mt-1">{job.serviceType}</p>
            )}

            <StageBar current={job.status} />

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <span className="text-xs text-slate-400">
                    {new Date(job.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                </span>
                {job.estimatedCost && (
                    <span className="text-xs font-semibold text-slate-700">AED {job.estimatedCost}</span>
                )}
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

export default function JobCardsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        const url = filter ? `/api/jobcards?status=${filter}` : '/api/jobcards'
        const res = await fetch(url)
        const json = await res.json()
        setJobs(json.data ?? [])
        setLoading(false)
    }, [filter])

    useEffect(() => { load() }, [load])

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400 font-medium">Service</p>
                    <h1 className="text-2xl font-bold text-slate-900">Job Cards</h1>
                </div>
                <Link
                    href="/jobcards/new"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: '#C8A44A' }}
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors ${
                            filter === tab.key
                                ? 'text-white'
                                : 'bg-white border border-slate-100 text-slate-500'
                        }`}
                        style={filter === tab.key ? { background: '#C8A44A' } : {}}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                            <div className="h-3 bg-slate-100 rounded w-24 mb-3" />
                            <div className="h-4 bg-slate-100 rounded w-40 mb-2" />
                            <div className="h-3 bg-slate-100 rounded w-32" />
                        </div>
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={1.5}>
                            <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="font-semibold text-slate-800">No job cards {filter ? `with status "${filter}"` : 'yet'}</p>
                    <p className="text-sm text-slate-400 mt-1">Create one from an appointment</p>
                    <Link
                        href="/jobcards/new"
                        className="mt-5 inline-block text-white px-6 py-3 rounded-2xl text-sm font-semibold"
                        style={{ background: '#C8A44A' }}
                    >
                        New Job Card
                    </Link>
                </div>
            ) : (
                <div className="space-y-3 pb-24">
                    {jobs.map(job => <JobCard key={job._id} job={job} />)}
                </div>
            )}

            {/* FAB */}
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
