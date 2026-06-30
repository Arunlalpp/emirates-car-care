'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function extractId(v: unknown): string {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object' && v !== null && '_id' in v) return String((v as Record<string, unknown>)._id)
    return String(v)
}

export default function NewJobCardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const appointmentId = searchParams.get('appointmentId') ?? ''
    const preCustomerId = searchParams.get('customerId') ?? ''

    const [loading, setLoading] = useState(false)
    const [prefilling, setPrefilling] = useState(!!appointmentId)
    const [error, setError] = useState('')

    // Locked customer info when coming from appointment
    const [lockedCustomer, setLockedCustomer] = useState<{ name: string; phone: string } | null>(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [customers, setCustomers] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [vehicles, setVehicles] = useState<any[]>([])

    const [form, setForm] = useState({
        customerId: preCustomerId,
        vehicleId: '',
        serviceType: '',
        customerComplaint: '',
        odometerIn: '',
        estimatedCost: '',
        expectedDelivery: '',
    })

    // When coming FROM an appointment: fetch appointment data first, lock customer + vehicle
    useEffect(() => {
        if (!appointmentId) return
        fetch(`/api/appointments/${appointmentId}`)
            .then(r => r.json())
            .then(j => {
                if (!j.data) { setPrefilling(false); return }
                const appt = j.data
                const cId = extractId(appt.customerId)
                const vId = extractId(appt.vehicleId)

                // Lock the customer display
                const cObj = typeof appt.customerId === 'object' ? appt.customerId as { name?: string; phone?: string } : null
                if (cObj?.name) setLockedCustomer({ name: cObj.name, phone: cObj.phone ?? '' })

                // Update form
                setForm(f => ({
                    ...f,
                    customerId: cId || f.customerId,
                    vehicleId: vId,
                    serviceType: appt.serviceType ?? '',
                    customerComplaint: appt.notes ?? '',
                }))

                // Load vehicles for this customer, then stop prefilling
                const finalCustomerId = cId || preCustomerId
                if (finalCustomerId) {
                    fetch(`/api/vehicles?customerId=${finalCustomerId}`)
                        .then(r => r.json())
                        .then(vj => {
                            setVehicles(vj.data ?? [])
                            setPrefilling(false)
                        })
                } else {
                    setPrefilling(false)
                }
            })
            .catch(() => setPrefilling(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId])

    // When NOT from appointment: load customer list and vehicles
    useEffect(() => {
        if (appointmentId) return // handled above
        fetch('/api/customers?limit=200')
            .then(r => r.json())
            .then(j => setCustomers(j.data ?? []))
    }, [appointmentId])

    useEffect(() => {
        if (appointmentId) return // handled above
        if (!form.customerId) { setVehicles([]); return }
        fetch(`/api/vehicles?customerId=${form.customerId}`)
            .then(r => r.json())
            .then(j => setVehicles(j.data ?? []))
    }, [form.customerId, appointmentId])

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!form.vehicleId) { setError('Please select a vehicle'); return }
        setLoading(true)
        setError('')
        const res = await fetch('/api/jobcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                appointmentId: appointmentId || undefined,
                odometerIn: form.odometerIn ? Number(form.odometerIn) : undefined,
                estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
                expectedDelivery: form.expectedDelivery || undefined,
            }),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Failed to create job card'); setLoading(false); return }
        router.push(`/jobcards/${json.data._id}`)
    }

    const field = (label: string, node: React.ReactNode) => (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
            {node}
        </div>
    )

    const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#C8A44A] focus:ring-1 focus:ring-[#C8A44A]/30 transition-colors'

    if (prefilling) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-20 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#C8A44A]/30 border-t-[#C8A44A] rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading appointment data…</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pb-32">
            <div className="pt-12 pb-6 flex items-center gap-3">
                <Link href="/jobcards" className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <p className="text-sm text-slate-400 font-medium">
                        {appointmentId ? 'From Appointment' : 'Create'}
                    </p>
                    <h1 className="text-xl font-bold text-slate-900">New Job Card</h1>
                </div>
            </div>

            {/* Appointment badge */}
            {appointmentId && (
                <div
                    className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-xs font-medium"
                    style={{ background: 'rgba(200,164,74,0.08)', border: '1px solid rgba(200,164,74,0.2)', color: '#A8843A' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pre-filled from appointment booking
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer — locked when from appointment */}
                {lockedCustomer ? (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Customer</label>
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{lockedCustomer.name}</p>
                                <p className="text-xs text-slate-400">{lockedCustomer.phone}</p>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(200,164,74,0.1)', color: '#A8843A' }}>
                                From booking
                            </span>
                        </div>
                    </div>
                ) : (
                    field('Customer *',
                        <select
                            required
                            value={form.customerId}
                            onChange={e => setForm({ ...form, customerId: e.target.value, vehicleId: '' })}
                            className={inputCls}
                        >
                            <option value="">— Select customer —</option>
                            {customers.map((c: { _id: string; name: string; phone: string }) => (
                                <option key={c._id} value={c._id}>{c.name} · {c.phone}</option>
                            ))}
                        </select>
                    )
                )}

                {/* Vehicle */}
                {field('Vehicle *',
                    <select
                        required
                        value={form.vehicleId}
                        onChange={e => setForm({ ...form, vehicleId: e.target.value })}
                        disabled={!form.customerId}
                        className={inputCls}
                    >
                        <option value="">— Select vehicle —</option>
                        {vehicles.map((v: { _id: string; regNumber: string; brand: string; model: string }) => (
                            <option key={v._id} value={v._id}>{v.regNumber} · {v.brand} {v.model}</option>
                        ))}
                    </select>
                )}

                {/* Service type */}
                {field('Service Type',
                    <input
                        type="text"
                        placeholder="e.g. Full service, Oil change, AC repair"
                        value={form.serviceType}
                        onChange={e => setForm({ ...form, serviceType: e.target.value })}
                        className={inputCls}
                    />
                )}

                {/* Complaint */}
                {field('Customer Complaint',
                    <textarea
                        rows={3}
                        placeholder="What is the customer complaining about?"
                        value={form.customerComplaint}
                        onChange={e => setForm({ ...form, customerComplaint: e.target.value })}
                        className={`${inputCls} resize-none`}
                    />
                )}

                {/* Odometer + Estimate */}
                <div className="grid grid-cols-2 gap-3">
                    {field('Odometer (km)',
                        <input
                            type="number"
                            placeholder="45000"
                            value={form.odometerIn}
                            onChange={e => setForm({ ...form, odometerIn: e.target.value })}
                            className={inputCls}
                        />
                    )}
                    {field('Estimate (₹)',
                        <input
                            type="number"
                            placeholder="250"
                            value={form.estimatedCost}
                            onChange={e => setForm({ ...form, estimatedCost: e.target.value })}
                            className={inputCls}
                        />
                    )}
                </div>

                {/* Expected delivery */}
                {field('Expected Delivery',
                    <input
                        type="date"
                        value={form.expectedDelivery}
                        onChange={e => setForm({ ...form, expectedDelivery: e.target.value })}
                        className={inputCls}
                    />
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    style={{ color: '#0D0D0D' }}
                >
                    {loading
                        ? <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                        : 'CREATE JOB CARD'
                    }
                </button>
            </form>
        </div>
    )
}
