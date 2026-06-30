'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCustomerPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    })

    function set(field: keyof typeof form, value: string) {
        setForm(f => ({ ...f, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim() || !form.phone.trim()) {
            setError('Name and phone are required')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const j = await res.json()
            if (!res.ok) { setError(j.error ?? 'Failed to save'); setLoading(false); return }
            router.push(`/customers/${j.data._id}`)
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
                    <h1 className="text-lg font-bold text-slate-900">New Customer</h1>
                    <p className="text-xs text-slate-400">Fill in the customer details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Name */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        autoFocus
                        placeholder="e.g. Rajan Kumar"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Email <span className="text-slate-300 font-normal normal-case">optional</span>
                    </label>
                    <input
                        type="email"
                        placeholder="e.g. rajan@email.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Address <span className="text-slate-300 font-normal normal-case">optional</span>
                    </label>
                    <input
                        placeholder="Street, City"
                        value={form.address}
                        onChange={e => set('address', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3.5 text-sm placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Notes <span className="text-slate-300 font-normal normal-case">optional</span>
                    </label>
                    <textarea
                        placeholder="Any special notes about this customer..."
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        rows={3}
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
                    ) : 'Save Customer'}
                </button>
            </form>
        </div>
    )
}
