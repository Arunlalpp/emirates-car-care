'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function compressImage(file: File): Promise<string> {
    return new Promise(resolve => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const img = new window.Image()
        img.onload = () => {
            const MAX = 900
            let { width, height } = img
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round(height * MAX / width); width = MAX }
                else { width = Math.round(width * MAX / height); height = MAX }
            }
            canvas.width = width; canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.72))
        }
        img.src = URL.createObjectURL(file)
    })
}

const SERVICE_TYPES = [
    'Oil & Filter Change', 'Tyre Replacement', 'Brake Service', 'Battery Replacement',
    'AC Service', 'General Service', 'Wheel Alignment', 'Clutch Repair',
    'Engine Repair', 'Electrical Work', 'Denting & Painting', 'Insurance Repair',
]

const COMPLAINT_CHIPS = [
    'Engine noise / knocking', 'Engine overheating', 'AC not cooling',
    'Brake vibration / noise', 'Steering issue', 'Oil leak',
    'Battery dead / weak', 'Check engine light', 'Tyre pressure warning',
    'Suspension noise', 'Electrical fault', 'Transmission issue',
    'Fuel smell', 'Windscreen damage', 'Body dent / scratch',
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
    start.setDate(start.getDate() - start.getDay() + 1)
    for (let i = 0; i < 14; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        days.push(d)
    }
    return days
}

const inputCls = 'w-full border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#C8A44A] focus:ring-1 focus:ring-[#C8A44A]/30 transition-colors'
const inputStyle = { background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }

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
    const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([])
    const [photoUploading, setPhotoUploading] = useState(false)
    const cameraRef = useRef<HTMLInputElement>(null)
    const libraryRef = useRef<HTMLInputElement>(null)

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
        complaints: [] as string[],
        customComplaint: '',
        notes: '',
        estimatedDuration: 60,
    })

    useEffect(() => {
        if (!preCustomerId) return
        fetch(`/api/customers/${preCustomerId}`)
            .then(r => r.json())
            .then(j => { if (j.data) setForm(f => ({ ...f, customerName: j.data.name })) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (customerSearch.length < 2) { setCustomers([]); return }
        const t = setTimeout(async () => {
            const res = await fetch(`/api/customers?q=${encodeURIComponent(customerSearch)}`)
            if (res.ok) { const j = await res.json(); setCustomers(j.data ?? []) }
        }, 300)
        return () => clearTimeout(t)
    }, [customerSearch])

    useEffect(() => {
        if (!form.customerId) return
        fetch(`/api/vehicles?customerId=${form.customerId}`)
            .then(r => r.json())
            .then(j => setVehicles(j.data ?? []))
    }, [form.customerId])

    function toggleComplaint(c: string) {
        setForm(f => ({
            ...f,
            complaints: f.complaints.includes(c)
                ? f.complaints.filter(x => x !== c)
                : [...f.complaints, c],
        }))
    }

    async function handleSubmit() {
        if (!form.customerId || !form.vehicleId || !form.date || !form.timeSlot || !form.serviceType) {
            setError('Please complete all required fields')
            return
        }
        setLoading(true)
        setError('')
        const allComplaints = [...form.complaints]
        if (form.customComplaint.trim()) allComplaints.push(form.customComplaint.trim())
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
                    complaints: allComplaints,
                    notes: form.notes,
                    estimatedDuration: form.estimatedDuration,
                    vehiclePhotos,
                }),
            })
            if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Failed'); setLoading(false); return }
            router.push('/appointments')
        } catch {
            setError('Something went wrong')
            setLoading(false)
        }
    }

    async function handlePhotoFiles(files: FileList | null) {
        if (!files?.length) return
        setPhotoUploading(true)
        const compressed = await Promise.all(Array.from(files).map(compressImage))
        setVehiclePhotos(prev => [...prev, ...compressed])
        setPhotoUploading(false)
    }

    const STEP_LABELS = ['Customer', 'Vehicle', 'Date & Time', 'Service', 'Complaints', 'Vehicle Photos']
    const totalSteps = 6

    const cardStyle = { background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }

    return (
        <div className="max-w-lg mx-auto px-4 pb-10">
            {/* Header */}
            <div className="pt-12 pb-6 flex items-center gap-3">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={cardStyle}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>New Appointment</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Step {step} of {totalSteps} — {STEP_LABELS[step - 1]}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5 mb-6">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{ background: i < step ? '#C8A44A' : 'var(--surface-3)' }}
                    />
                ))}
            </div>

            {error && (
                <div className="text-red-400 text-xs rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                </div>
            )}

            {/* Step 1: Customer */}
            {step === 1 && (
                <div className="space-y-4">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        Search Customer
                    </label>
                    <input
                        autoFocus
                        placeholder="Name or phone number..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className={inputCls}
                        style={inputStyle}
                    />

                    {form.customerId && (
                        <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <div>
                                <p className="text-sm font-semibold text-green-400">{form.customerName}</p>
                                <p className="text-xs text-green-600">Customer selected</p>
                            </div>
                            <button
                                onClick={() => { setForm({ ...form, customerId: '', customerName: '', vehicleId: '', vehicleLabel: '' }); setCustomerSearch('') }}
                                className="text-xs text-green-500 underline"
                            >
                                Change
                            </button>
                        </div>
                    )}

                    {customers.length > 0 && !form.customerId && (
                        <div className="rounded-xl overflow-hidden" style={cardStyle}>
                            {customers.map((c, i) => (
                                <button
                                    key={c._id}
                                    onClick={() => {
                                        setForm({ ...form, customerId: c._id, customerName: c.name })
                                        setCustomers([])
                                        setCustomerSearch(c.name)
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                                    style={{ borderTop: i > 0 ? '1px solid var(--border-dim)' : 'none' }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-3)' }}>
                                        <span className="text-sm font-bold" style={{ color: '#C8A44A' }}>{c.name[0]}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.phone}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {customerSearch.length >= 2 && customers.length === 0 && !form.customerId && (
                        <div className="text-center py-8">
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No customer found</p>
                            <Link href="/customers/new" className="text-sm font-medium underline mt-1 inline-block" style={{ color: '#C8A44A' }}>
                                Add new customer →
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={() => { setError(''); setStep(2) }}
                        disabled={!form.customerId}
                        className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-wide disabled:opacity-40"
                        style={{ color: '#0D0D0D' }}
                    >
                        Next: Select Vehicle
                    </button>
                </div>
            )}

            {/* Step 2: Vehicle */}
            {step === 2 && (
                <div className="space-y-4">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        Select Vehicle
                    </label>
                    {vehicles.length === 0 ? (
                        <div className="text-center py-8 rounded-2xl" style={cardStyle}>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No vehicles for this customer</p>
                            <a href={`/customers/${form.customerId}/vehicles/new`} className="text-sm font-medium underline mt-1 inline-block" style={{ color: '#C8A44A' }}>
                                Add vehicle →
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {vehicles.map(v => (
                                <button
                                    key={v._id}
                                    onClick={() => setForm({ ...form, vehicleId: v._id, vehicleLabel: `${v.regNumber} · ${v.brand} ${v.model}` })}
                                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all"
                                    style={{
                                        background: form.vehicleId === v._id ? 'rgba(200,164,74,0.12)' : 'var(--surface-1)',
                                        border: `1px solid ${form.vehicleId === v._id ? 'rgba(200,164,74,0.4)' : 'var(--border-dim)'}`,
                                    }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: form.vehicleId === v._id ? 'rgba(200,164,74,0.2)' : 'var(--surface-3)' }}>
                                        <span style={{ color: form.vehicleId === v._id ? '#C8A44A' : 'var(--text-muted)' }}>🚗</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v.regNumber}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.brand} {v.model} · {v.year}</p>
                                    </div>
                                    {form.vehicleId === v._id && (
                                        <svg className="ml-auto" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#C8A44A" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => { setError(''); setStep(3) }}
                        disabled={!form.vehicleId}
                        className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-wide disabled:opacity-40"
                        style={{ color: '#0D0D0D' }}
                    >
                        Next: Pick Date & Time
                    </button>
                </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-muted)' }}>Select Date</label>
                        <div className="overflow-x-auto -mx-4 px-4">
                            <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
                                {weekDays.map(day => {
                                    const iso = day.toISOString().split('T')[0]
                                    const isSelected = form.date === iso
                                    const isPast = day < today && iso !== today.toISOString().split('T')[0]
                                    return (
                                        <button
                                            key={iso}
                                            disabled={isPast}
                                            onClick={() => setForm({ ...form, date: iso, timeSlot: '' })}
                                            className="flex flex-col items-center w-14 py-3 rounded-2xl shrink-0 transition-all"
                                            style={{
                                                background: isSelected ? '#C8A44A' : isPast ? 'var(--surface-2)' : 'var(--surface-1)',
                                                border: `1px solid ${isSelected ? '#C8A44A' : 'var(--border-dim)'}`,
                                                color: isSelected ? '#0D0D0D' : isPast ? 'var(--text-muted)' : 'var(--text-primary)',
                                                cursor: isPast ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <span className="text-[10px] font-medium">{day.toLocaleDateString('en', { weekday: 'short' })}</span>
                                            <span className="text-lg font-bold mt-0.5">{day.getDate()}</span>
                                            <span className="text-[10px]">{day.toLocaleDateString('en', { month: 'short' })}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-muted)' }}>Select Time Slot</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TIME_SLOTS.map(slot => (
                                <button
                                    key={slot}
                                    onClick={() => setForm({ ...form, timeSlot: slot })}
                                    className="py-3 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                        background: form.timeSlot === slot ? 'rgba(200,164,74,0.15)' : 'var(--surface-1)',
                                        border: `1px solid ${form.timeSlot === slot ? 'rgba(200,164,74,0.5)' : 'var(--border-dim)'}`,
                                        color: form.timeSlot === slot ? '#C8A44A' : 'var(--text-secondary)',
                                    }}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>Estimated Duration</label>
                        <select
                            value={form.estimatedDuration}
                            onChange={e => setForm({ ...form, estimatedDuration: Number(e.target.value) })}
                            className={inputCls}
                            style={inputStyle}
                        >
                            {[30, 60, 90, 120, 180, 240].map(m => (
                                <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}min` : ''}`}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => { setError(''); setStep(4) }}
                        disabled={!form.date || !form.timeSlot}
                        className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-wide disabled:opacity-40"
                        style={{ color: '#0D0D0D' }}
                    >
                        Next: Select Service
                    </button>
                </div>
            )}

            {/* Step 4: Service Type */}
            {step === 4 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-muted)' }}>Service Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {SERVICE_TYPES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setForm({ ...form, serviceType: s })}
                                    className="text-left px-3 py-3 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                        background: form.serviceType === s ? 'rgba(200,164,74,0.15)' : 'var(--surface-1)',
                                        border: `1px solid ${form.serviceType === s ? 'rgba(200,164,74,0.5)' : 'var(--border-dim)'}`,
                                        color: form.serviceType === s ? '#C8A44A' : 'var(--text-secondary)',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => { setError(''); setStep(5) }}
                        disabled={!form.serviceType}
                        className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-wide disabled:opacity-40"
                        style={{ color: '#0D0D0D' }}
                    >
                        Next: Add Complaints
                    </button>
                </div>
            )}

            {/* Step 5: Complaints + Confirm */}
            {step === 5 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
                            Customer Complaints
                        </label>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Select all issues reported by the customer</p>
                        <div className="flex flex-wrap gap-2">
                            {COMPLAINT_CHIPS.map(c => {
                                const selected = form.complaints.includes(c)
                                return (
                                    <button
                                        key={c}
                                        onClick={() => toggleComplaint(c)}
                                        className="text-xs px-3 py-2 rounded-full font-medium transition-all"
                                        style={{
                                            background: selected ? 'rgba(200,164,74,0.18)' : 'var(--surface-2)',
                                            border: `1px solid ${selected ? 'rgba(200,164,74,0.5)' : 'var(--border-subtle)'}`,
                                            color: selected ? '#C8A44A' : 'var(--text-secondary)',
                                        }}
                                    >
                                        {selected && '✓ '}{c}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>Other / Custom Complaint</label>
                        <textarea
                            placeholder="Describe any other issue..."
                            value={form.customComplaint}
                            onChange={e => setForm({ ...form, customComplaint: e.target.value })}
                            rows={2}
                            className={`${inputCls} resize-none`}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>Additional Notes (optional)</label>
                        <textarea
                            placeholder="Extra details for the workshop..."
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            className={`${inputCls} resize-none`}
                            style={inputStyle}
                        />
                    </div>

                    {/* Summary */}
                    <div className="rounded-2xl p-4 space-y-2 text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-dim)' }}>
                        <p className="font-semibold mb-3" style={{ color: '#C8A44A' }}>Appointment Summary</p>
                        {[
                            ['Customer', form.customerName],
                            ['Vehicle', form.vehicleLabel],
                            ['Date', new Date(form.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })],
                            ['Time', form.timeSlot],
                            ['Service', form.serviceType || '—'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between">
                                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                            </div>
                        ))}
                        {form.complaints.length > 0 && (
                            <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border-dim)' }}>
                                <span style={{ color: 'var(--text-muted)' }} className="text-xs block mb-1">Complaints</span>
                                <div className="flex flex-wrap gap-1">
                                    {form.complaints.map(c => (
                                        <span key={c} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,164,74,0.15)', color: '#C8A44A' }}>{c}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => { setError(''); setStep(6) }}
                        className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-wide"
                        style={{ color: '#0D0D0D' }}
                    >
                        Next: Vehicle Photos
                    </button>
                </div>
            )}

            {/* Step 6: Vehicle Photos + Confirm */}
            {step === 6 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
                            Vehicle Condition Photos
                        </label>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Capture current vehicle damage or condition (optional)</p>

                        {/* Camera / Library buttons */}
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => cameraRef.current?.click()}
                                disabled={photoUploading}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                            >
                                📷 Take Photo
                            </button>
                            <button
                                onClick={() => libraryRef.current?.click()}
                                disabled={photoUploading}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                            >
                                {photoUploading ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : '🖼️'} Library
                            </button>
                        </div>
                        <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handlePhotoFiles(e.target.files)} />
                        <input ref={libraryRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoFiles(e.target.files)} />

                        {vehiclePhotos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {vehiclePhotos.map((src, i) => (
                                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square" style={{ background: 'var(--surface-2)' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={src} alt={`Vehicle photo ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setVehiclePhotos(p => p.filter((_, idx) => idx !== i))}
                                            className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center"
                                        >
                                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl py-6 flex flex-col items-center justify-center" style={{ border: '2px dashed var(--border-subtle)' }}>
                                <span className="text-3xl mb-2">📸</span>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No photos yet — optional</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-gold w-full py-4 rounded-2xl text-sm font-bold tracking-wide disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ color: '#0D0D0D' }}
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />Booking...</>
                        ) : 'Confirm Appointment'}
                    </button>
                </div>
            )}
        </div>
    )
}
