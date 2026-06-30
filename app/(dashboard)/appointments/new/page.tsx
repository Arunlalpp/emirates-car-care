'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const SERVICE_TYPES = [
    'Oil & Filter Change',
    'Tyre Replacement',
    'Brake Service',
    'Battery Replacement',
    'AC Service',
    'General Service',
    'Wheel Alignment',
    'Clutch Repair',
    'Engine Repair',
    'Electrical Work',
    'Denting & Painting',
    'Insurance Repair',
]

const TIME_SLOTS = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
]

interface Customer { _id: string; name: string; phone: string }
interface Vehicle { _id: string; regNumber: string; brand: string; model: string; year: number }

function getWeekDays(startDate: Date) {
    const days = []
    const start = new Date(startDate)
    start.setDate(start.getDate() - start.getDay() + 1) // Monday
    for (let i = 0; i < 14; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        days.push(d)
    }
    return days
}

export default function NewAppointmentPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preCustomerId = searchParams.get('customerId') ?? ''

    const [step, setStep] = useState(preCustomerId ? 2 : 1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [customerSearch, setCustomerSearch] = useState('')
    const [customers, setCustomers] = useState<Customer[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])

    const today = new Date()
    const [calStart] = useState(today)
    const weekDays = getWeekDays(calStart)

    const [form, setForm] = useState({
        customerId: preCustomerId,
        customerName: '',
        vehicleId: '',
        vehicleLabel: '',
        date: today.toISOString().split('T')[0],
        timeSlot: '',
        serviceType: '',
        notes: '',
        estimatedDuration: 60,
    })

    // Load pre-selected customer name
    useEffect(() => {
        if (!preCustomerId) return
        fetch(`/api/customers/${preCustomerId}`)
            .then(r => r.json())
            .then(j => {
                if (j.data) setForm(f => ({ ...f, customerName: j.data.name }))
            })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Search customers
    useEffect(() => {
        if (customerSearch.length < 2) { setCustomers([]); return }
        const t = setTimeout(async () => {
            const res = await fetch(`/api/customers?q=${encodeURIComponent(customerSearch)}`)
            if (res.ok) { const j = await res.json(); setCustomers(j.data ?? []) }
        }, 300)
        return () => clearTimeout(t)
    }, [customerSearch])

    // Load vehicles when customer selected
    useEffect(() => {
        if (!form.customerId) return
        fetch(`/api/vehicles?customerId=${form.customerId}`)
            .then(r => r.json())
            .then(j => setVehicles(j.data ?? []))
    }, [form.customerId])

    async function handleSubmit() {
        if (!form.customerId || !form.vehicleId || !form.date || !form.timeSlot || !form.serviceType) {
            setError('Please complete all required fields')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: form.customerId,
                    vehicleId: form.vehicleId,
                    date: form.date,
                    timeSlot: form.timeSlot,
                    serviceType: form.serviceType,
                    notes: form.notes,
                    estimatedDuration: form.estimatedDuration,
                }),
            })
            if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Failed'); setLoading(false); return }
            router.push('/appointments')
        } catch {
            setError('Something went wrong')
            setLoading(false)
        }
    }

    const STEP_LABELS = ['Customer', 'Vehicle', 'Date & Time', 'Service']

    return (
        <div className="max-w-lg mx-auto px-4">
            {/* Header */}
            <div className="pt-12 pb-6 flex items-center gap-3">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                    className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center"
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">New Appointment</h1>
                    <p className="text-xs text-slate-400">Step {step} of 4 — {STEP_LABELS[step - 1]}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5 mb-6">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-slate-900' : 'bg-slate-200'}`} />
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Step 1: Customer */}
            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                            Search Customer
                        </label>
                        <input
                            autoFocus
                            placeholder="Name or phone number..."
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>

                    {form.customerId && (
                        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-green-800">{form.customerName}</p>
                                <p className="text-xs text-green-600">Customer selected</p>
                            </div>
                            <button
                                onClick={() => { setForm({ ...form, customerId: '', customerName: '', vehicleId: '', vehicleLabel: '' }); setCustomerSearch('') }}
                                className="text-xs text-green-600 underline"
                            >
                                Change
                            </button>
                        </div>
                    )}

                    {customers.length > 0 && !form.customerId && (
                        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                            {customers.map((c, i) => (
                                <button
                                    key={c._id}
                                    onClick={() => {
                                        setForm({ ...form, customerId: c._id, customerName: c.name })
                                        setCustomers([])
                                        setCustomerSearch(c.name)
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 ${i > 0 ? 'border-t border-slate-50' : ''}`}
                                >
                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-slate-600">{c.name[0]}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                                        <p className="text-xs text-slate-400">{c.phone}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {customerSearch.length >= 2 && customers.length === 0 && !form.customerId && (
                        <div className="text-center py-8">
                            <p className="text-sm text-slate-500">No customer found</p>
                            <Link href="/customers/new" className="text-sm text-slate-900 font-medium underline mt-1 inline-block">
                                Add new customer →
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={() => { setError(''); setStep(2) }}
                        disabled={!form.customerId}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
                    >
                        Next: Select Vehicle
                    </button>
                </div>
            )}

            {/* Step 2: Vehicle */}
            {step === 2 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                            Select Vehicle
                        </label>
                        {vehicles.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
                                <p className="text-sm text-slate-500">No vehicles for this customer</p>
                                <a href={`/customers/${form.customerId}/vehicles/new`} className="text-sm text-slate-900 font-medium underline mt-1 inline-block">
                                    Add vehicle →
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {vehicles.map(v => (
                                    <button
                                        key={v._id}
                                        onClick={() => setForm({ ...form, vehicleId: v._id, vehicleLabel: `${v.regNumber} · ${v.brand} ${v.model}` })}
                                        className={`w-full flex items-center gap-3 bg-white border rounded-xl px-4 py-3.5 text-left transition-colors ${
                                            form.vehicleId === v._id ? 'border-slate-900 bg-slate-50' : 'border-slate-100'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                            form.vehicleId === v._id ? 'bg-slate-900' : 'bg-slate-100'
                                        }`}>
                                            <span className={form.vehicleId === v._id ? 'text-white' : 'text-slate-500'}>🚗</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{v.regNumber}</p>
                                            <p className="text-xs text-slate-400">{v.brand} {v.model} · {v.year}</p>
                                        </div>
                                        {form.vehicleId === v._id && (
                                            <svg className="ml-auto text-slate-900" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { setError(''); setStep(3) }}
                        disabled={!form.vehicleId}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
                    >
                        Next: Pick Date & Time
                    </button>
                </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
                <div className="space-y-5">
                    {/* Calendar strip */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Select Date</label>
                        <div className="overflow-x-auto -mx-4 px-4">
                            <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
                                {weekDays.map(day => {
                                    const iso = day.toISOString().split('T')[0]
                                    const isSelected = form.date === iso
                                    const isPast = day < today && iso !== today.toISOString().split('T')[0]
                                    const dayName = day.toLocaleDateString('en', { weekday: 'short' })
                                    const dayNum = day.getDate()
                                    const month = day.toLocaleDateString('en', { month: 'short' })

                                    return (
                                        <button
                                            key={iso}
                                            disabled={isPast}
                                            onClick={() => setForm({ ...form, date: iso, timeSlot: '' })}
                                            className={`flex flex-col items-center w-14 py-3 rounded-2xl transition-colors shrink-0 ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white'
                                                    : isPast
                                                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                                    : 'bg-white border border-slate-100 text-slate-700'
                                            }`}
                                        >
                                            <span className="text-[10px] font-medium">{dayName}</span>
                                            <span className="text-lg font-bold mt-0.5">{dayNum}</span>
                                            <span className="text-[10px]">{month}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Time slots */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Select Time Slot</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TIME_SLOTS.map(slot => (
                                <button
                                    key={slot}
                                    onClick={() => setForm({ ...form, timeSlot: slot })}
                                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                                        form.timeSlot === slot
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-100 text-slate-700'
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Estimated Duration</label>
                        <select
                            value={form.estimatedDuration}
                            onChange={e => setForm({ ...form, estimatedDuration: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none"
                        >
                            {[30, 60, 90, 120, 180, 240].map(m => (
                                <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}min` : ''}`}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => { setError(''); setStep(4) }}
                        disabled={!form.date || !form.timeSlot}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
                    >
                        Next: Select Service
                    </button>
                </div>
            )}

            {/* Step 4: Service + confirm */}
            {step === 4 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Service Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {SERVICE_TYPES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setForm({ ...form, serviceType: s })}
                                    className={`text-left px-3 py-3 rounded-xl text-sm font-medium border transition-colors ${
                                        form.serviceType === s
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-slate-100'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Notes (optional)</label>
                        <textarea
                            placeholder="Additional details about the issue..."
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            rows={3}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                        <p className="font-semibold text-slate-900 mb-3">Appointment Summary</p>
                        {[
                            ['Customer', form.customerName],
                            ['Vehicle', form.vehicleLabel],
                            ['Date', new Date(form.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })],
                            ['Time', form.timeSlot],
                            ['Service', form.serviceType || '—'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between">
                                <span className="text-slate-400">{label}</span>
                                <span className="font-medium text-slate-900">{value}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !form.serviceType}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Booking...
                            </>
                        ) : 'Confirm Appointment'}
                    </button>
                </div>
            )}
        </div>
    )
}
