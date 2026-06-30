'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const STAGES = [
    { key: 'received',      label: 'Received',      desc: 'Vehicle checked in',         icon: '🚗' },
    { key: 'inspection',    label: 'Inspection',    desc: 'Diagnosing issues',           icon: '🔍' },
    { key: 'in_service',    label: 'In Service',    desc: 'Work in progress',            icon: '🔧' },
    { key: 'quality_check', label: 'Quality Check', desc: 'Final checks done',           icon: '✅' },
    { key: 'ready',         label: 'Ready',         desc: 'Ready for pickup',            icon: '🎉' },
    { key: 'delivered',     label: 'Delivered',     desc: 'Handed over to customer',     icon: '🏁' },
]

function stageIndex(key: string) {
    return STAGES.findIndex(s => s.key === key)
}

function StatusFlow({ current, onAdvance, advancing }: { current: string; onAdvance: () => void; advancing: boolean }) {
    const ci = stageIndex(current)
    const isLast = ci >= STAGES.length - 1

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Service Flow</p>

            {/* Flowchart steps */}
            <div className="relative">
                {STAGES.map((stage, i) => {
                    const done = i < ci
                    const active = i === ci
                    const future = i > ci
                    return (
                        <div key={stage.key} className="flex gap-4 mb-0">
                            {/* Timeline column */}
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                        background: done ? '#dcfce7' : active ? '#0f172a' : '#f8fafc',
                                        border: done ? '2px solid #16a34a' : active ? '2px solid #0f172a' : '2px solid #e2e8f0',
                                    }}
                                >
                                    {done ? (
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                            <path d="M3 8l4 4 6-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <span className="text-base">{stage.icon}</span>
                                    )}
                                </div>
                                {i < STAGES.length - 1 && (
                                    <div
                                        className="w-0.5 flex-1 my-1 rounded-full transition-all"
                                        style={{
                                            minHeight: 20,
                                            background: done ? '#16a34a' : '#e2e8f0',
                                        }}
                                    />
                                )}
                            </div>

                            {/* Content */}
                            <div className="pb-5 flex-1">
                                <p
                                    className="text-sm font-semibold leading-tight"
                                    style={{ color: done ? '#16a34a' : active ? '#0f172a' : '#94a3b8' }}
                                >
                                    {stage.label}
                                </p>
                                {(active || done) && (
                                    <p className="text-xs mt-0.5" style={{ color: done ? '#86efac' : '#64748b' }}>
                                        {stage.desc}
                                    </p>
                                )}
                                {future && (
                                    <p className="text-xs mt-0.5 text-slate-300">{stage.desc}</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {!isLast && (
                <button
                    onClick={onAdvance}
                    disabled={advancing}
                    className="btn-gold w-full py-3.5 rounded-xl text-sm font-bold tracking-wide mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ color: '#0D0D0D' }}
                >
                    {advancing ? (
                        <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                    ) : (
                        <>Advance to <strong>{STAGES[ci + 1]?.label}</strong> →</>
                    )}
                </button>
            )}
            {isLast && (
                <div className="text-center py-2 text-sm text-slate-400 font-medium">
                    🏁 Job completed and delivered
                </div>
            )}
        </div>
    )
}

function NotifyBanner({ jobId, notified, phone }: { jobId: string; notified: boolean; phone?: string }) {
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState<{ link?: string; phone?: string } | null>(null)
    const [sent, setSent] = useState(notified)

    async function sendNotification() {
        setSending(true)
        const res = await fetch(`/api/jobcards/${jobId}/notify`, { method: 'POST' })
        const json = await res.json()
        if (res.ok) {
            setSent(true)
            if (json.link) setResult(json)
            else setResult({ phone: json.phone })
        }
        setSending(false)
    }

    if (sent && !result) {
        return (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                    <p className="text-sm font-semibold text-green-800">Notification sent</p>
                    <p className="text-xs text-green-600">Customer has been informed their vehicle is ready</p>
                </div>
            </div>
        )
    }

    if (result?.link) {
        return (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-800 mb-2">✅ WhatsApp message ready</p>
                <p className="text-xs text-green-600 mb-3">Twilio is not configured. Open the link below to send manually:</p>
                <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-3 rounded-xl"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Send WhatsApp to {result.phone}
                </a>
            </div>
        )
    }

    return (
        <div
            className="rounded-2xl p-4 mb-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #1A1408, #2A230F)', border: '1px solid rgba(200,164,74,0.3)' }}
        >
            <div>
                <p className="text-sm font-semibold text-white">Vehicle is Ready! 🎉</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(200,164,74,0.8)' }}>
                    {phone ? `Notify ${phone} via WhatsApp` : 'Notify customer via WhatsApp'}
                </p>
            </div>
            <button
                onClick={sendNotification}
                disabled={sending}
                className="btn-gold text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
                style={{ color: '#0D0D0D' }}
            >
                {sending ? '...' : 'Notify'}
            </button>
        </div>
    )
}

export default function JobCardDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [advancing, setAdvancing] = useState(false)

    const load = useCallback(async () => {
        const res = await fetch(`/api/jobcards/${id}`)
        const json = await res.json()
        if (res.ok) setJob(json.data)
        setLoading(false)
    }, [id])

    useEffect(() => { load() }, [load])

    async function advance() {
        if (!job) return
        const ci = stageIndex(job.status)
        const next = STAGES[ci + 1]?.key
        if (!next) return
        setAdvancing(true)
        const res = await fetch(`/api/jobcards/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: next }),
        })
        if (res.ok) {
            const json = await res.json()
            setJob((prev: typeof job) => ({ ...prev, status: json.data.status }))
        }
        setAdvancing(false)
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-12">
                <div className="space-y-3 animate-pulse">
                    <div className="h-8 bg-slate-100 rounded w-40" />
                    <div className="h-4 bg-slate-100 rounded w-64" />
                    <div className="h-48 bg-slate-100 rounded-2xl mt-4" />
                </div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-12 text-center">
                <p className="text-slate-400">Job card not found.</p>
                <Link href="/jobcards" className="text-sm text-slate-900 underline mt-3 block">Back to Job Cards</Link>
            </div>
        )
    }

    const customer = job.customerId
    const vehicle = job.vehicleId

    return (
        <div className="max-w-2xl mx-auto px-4 pb-24">
            {/* Header */}
            <div className="pt-12 pb-5 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-500"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1">
                    <p className="text-sm text-slate-400 font-mono">{job.jobNumber}</p>
                    <h1 className="text-xl font-bold text-slate-900">{customer?.name ?? 'Job Card'}</h1>
                </div>
            </div>

            {/* Notify banner — only when ready */}
            {job.status === 'ready' && (
                <NotifyBanner jobId={id} notified={job.notificationSent} phone={customer?.phone} />
            )}

            {/* Status flowchart */}
            <StatusFlow current={job.status} onAdvance={advance} advancing={advancing} />

            {/* Vehicle + Customer info */}
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
                {[
                    { label: 'Customer', value: customer?.name },
                    { label: 'Phone', value: customer?.phone ?? '—' },
                    { label: 'Vehicle', value: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year ?? ''})` : '—' },
                    { label: 'Reg No.', value: vehicle?.regNumber ?? '—' },
                    { label: 'Fuel Type', value: vehicle?.fuelType ?? '—' },
                    { label: 'Odometer In', value: job.odometerIn ? `${job.odometerIn} km` : '—' },
                ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-slate-400 font-medium">{row.label}</span>
                        <span className="text-sm font-semibold text-slate-900 capitalize">{row.value}</span>
                    </div>
                ))}
            </div>

            {/* Service details */}
            {(job.serviceType || job.customerComplaint) && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
                    {job.serviceType && (
                        <div className="mb-3">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Service Type</p>
                            <p className="text-sm text-slate-800">{job.serviceType}</p>
                        </div>
                    )}
                    {job.customerComplaint && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Customer Complaint</p>
                            <p className="text-sm text-slate-800">{job.customerComplaint}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Cost */}
            {(job.estimatedCost || job.finalCost) && (
                <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
                    {job.estimatedCost && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-xs text-slate-400">Estimate</span>
                            <span className="text-sm font-semibold text-slate-700">AED {job.estimatedCost}</span>
                        </div>
                    )}
                    {job.finalCost && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-xs text-slate-400">Final Amount</span>
                            <span className="text-sm font-bold text-slate-900">AED {job.finalCost}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Timestamps */}
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-400">Created</span>
                    <span className="text-xs text-slate-600">
                        {new Date(job.createdAt).toLocaleString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                {job.expectedDelivery && (
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-slate-400">Expected Delivery</span>
                        <span className="text-xs text-slate-600">
                            {new Date(job.expectedDelivery).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                )}
                {job.notifiedAt && (
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-slate-400">Customer Notified</span>
                        <span className="text-xs text-green-600">
                            {new Date(job.notifiedAt).toLocaleString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
