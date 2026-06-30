'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const BRANDS = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'Ford', 'Volkswagen', 'Skoda', 'MG', 'Renault', 'Nissan', 'Jeep', 'BMW', 'Mercedes-Benz', 'Audi', 'Other']
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'cng', 'hybrid'] as const
const COLORS = ['White', 'Silver', 'Black', 'Grey', 'Red', 'Blue', 'Brown', 'Green', 'Orange', 'Other']

export default function NewVehiclePage() {
    const router = useRouter()
    const params = useParams()
    const customerId = params.id as string

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        regNumber: '',
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        color: '',
        fuelType: '' as typeof FUEL_TYPES[number] | '',
        vin: '',
        odometer: '',
        notes: '',
    })

    function set(field: keyof typeof form, value: string) {
        setForm(f => ({ ...f, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.regNumber.trim() || !form.brand.trim() || !form.model.trim() || !form.year) {
            setError('Reg number, brand, model and year are required')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    regNumber: form.regNumber.toUpperCase().replace(/\s/g, ''),
                    brand: form.brand,
                    model: form.model,
                    year: Number(form.year),
                    color: form.color || undefined,
                    fuelType: form.fuelType || undefined,
                    vin: form.vin || undefined,
                    odometer: form.odometer ? Number(form.odometer) : undefined,
                    notes: form.notes || undefined,
                }),
            })
            const j = await res.json()
            if (!res.ok) { setError(j.error ?? 'Failed to save'); setLoading(false); return }
            router.push(`/customers/${customerId}`)
        } catch {
            setError('Something went wrong')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-lg mx-auto px-4">
            {/* Header */}
            <div className="pt-12 pb-6 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center"
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Add Vehicle</h1>
                    <p className="text-xs text-slate-400">Vehicle details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Registration number */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Registration Number <span className="text-red-400">*</span>
                    </label>
                    <input
                        autoFocus
                        placeholder="e.g. KA01AB1234"
                        value={form.regNumber}
                        onChange={e => set('regNumber', e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-mono uppercase tracking-widest"
                    />
                </div>

                {/* Brand */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Brand <span className="text-red-400">*</span>
                    </label>
                    <select
                        value={form.brand}
                        onChange={e => set('brand', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    >
                        <option value="">Select brand...</option>
                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                {/* Model + Year row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                            Model <span className="text-red-400">*</span>
                        </label>
                        <input
                            placeholder="e.g. Swift"
                            value={form.model}
                            onChange={e => set('model', e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                            Year <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="1980"
                            max={new Date().getFullYear() + 1}
                            value={form.year}
                            onChange={e => set('year', e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>
                </div>

                {/* Fuel type */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Fuel Type</label>
                    <div className="grid grid-cols-5 gap-2">
                        {FUEL_TYPES.map(f => (
                            <button
                                type="button"
                                key={f}
                                onClick={() => set('fuelType', form.fuelType === f ? '' : f)}
                                className={`py-2.5 rounded-xl text-xs font-medium border capitalize transition-colors ${
                                    form.fuelType === f
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-100'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Color</label>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map(col => (
                            <button
                                type="button"
                                key={col}
                                onClick={() => set('color', form.color === col ? '' : col)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                    form.color === col
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-100'
                                }`}
                            >
                                {col}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Odometer + VIN row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Odometer (km)</label>
                        <input
                            type="number"
                            placeholder="e.g. 45000"
                            value={form.odometer}
                            onChange={e => set('odometer', e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">VIN</label>
                        <input
                            placeholder="Chassis number"
                            value={form.vin}
                            onChange={e => set('vin', e.target.value.toUpperCase())}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none font-mono uppercase"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Notes</label>
                    <textarea
                        placeholder="Any special notes about this vehicle..."
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : 'Save Vehicle'}
                </button>
            </form>
        </div>
    )
}
