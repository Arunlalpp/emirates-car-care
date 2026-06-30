'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'

interface ServiceItem {
    _id: string
    name: string
    category: string
    type: 'part' | 'labor' | 'service'
    defaultPrice: number
    description?: string
    isActive: boolean
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    part:    { label: 'Part',    color: 'rgba(59,130,246,0.15)'   },
    labor:   { label: 'Labor',   color: 'rgba(200,164,74,0.15)'   },
    service: { label: 'Service', color: 'rgba(139,92,246,0.15)'   },
}
const TYPE_TEXT: Record<string, string> = {
    part: '#60A5FA', labor: '#C8A44A', service: '#A78BFA',
}

const cardStyle = { background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }
const inputCls = 'w-full border rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-[#C8A44A] focus:ring-1 focus:ring-[#C8A44A]/30 transition-colors'
const inputStyle = { background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }

const BLANK: { name: string; category: string; type: 'part' | 'labor' | 'service'; defaultPrice: number; description: string } = {
    name: '', category: '', type: 'service', defaultPrice: 0, description: '',
}

export default function PricingPage() {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<ServiceItem | null>(null)
    const [form, setForm] = useState(BLANK)
    const [filterType, setFilterType] = useState('')
    const [search, setSearch] = useState('')

    const { data: items = [], isLoading } = useQuery<ServiceItem[]>({
        queryKey: ['service-items'],
        queryFn: async () => {
            const res = await fetch('/api/service-items')
            if (!res.ok) throw new Error('Failed')
            return (await res.json()).data
        },
    })

    const { mutate: save, isPending: saving } = useMutation({
        mutationFn: async () => {
            if (editing) {
                await fetch(`/api/service-items/${editing._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })
            } else {
                await fetch('/api/service-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-items'] })
            setShowForm(false)
            setEditing(null)
            setForm(BLANK)
        },
    })

    const { mutate: remove } = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/service-items/${id}`, { method: 'DELETE' })
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-items'] }),
    })

    function openEdit(item: ServiceItem) {
        setEditing(item)
        setForm({ name: item.name, category: item.category, type: item.type, defaultPrice: item.defaultPrice, description: item.description ?? '' })
        setShowForm(true)
    }

    function openNew() {
        setEditing(null)
        setForm(BLANK)
        setShowForm(true)
    }

    const filtered = items.filter(it =>
        (!filterType || it.type === filterType) &&
        (!search || it.name.toLowerCase().includes(search.toLowerCase()) || it.category.toLowerCase().includes(search.toLowerCase()))
    )

    const grouped = filtered.reduce<Record<string, ServiceItem[]>>((acc, it) => {
        const cat = it.category || 'General'
        acc[cat] = [...(acc[cat] ?? []), it]
        return acc
    }, {})

    return (
        <div className="max-w-2xl mx-auto px-4 pb-24">
            {/* Header */}
            <div className="pt-12 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/profile"
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={cardStyle}
                    >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ color: 'var(--text-secondary)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Settings</p>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Service Pricing</h1>
                    </div>
                </div>
                <button
                    onClick={openNew}
                    className="btn-gold w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ color: '#0D0D0D' }}
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Search + filter */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        placeholder="Search items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={inputCls}
                        style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                    />
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className={inputCls}
                    style={{ ...inputStyle, width: 110 }}
                >
                    <option value="">All Types</option>
                    <option value="part">Parts</option>
                    <option value="labor">Labor</option>
                    <option value="service">Services</option>
                </select>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-2xl p-4 animate-pulse h-16" style={{ background: 'var(--surface-1)' }} />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)' }}>
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
                            <path strokeLinecap="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No pricing items yet</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add parts, labour rates and services to build your catalog</p>
                    <button onClick={openNew} className="btn-gold mt-5 px-6 py-3 rounded-2xl text-sm font-bold" style={{ color: '#0D0D0D' }}>
                        Add First Item
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {Object.entries(grouped).map(([cat, catItems]) => (
                        <div key={cat}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>{cat}</p>
                            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                                {catItems.map((item, i) => (
                                    <div
                                        key={item._id}
                                        className="flex items-center gap-3 px-4 py-3.5"
                                        style={{ borderTop: i > 0 ? '1px solid var(--border-dim)' : 'none' }}
                                    >
                                        <span
                                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                                            style={{ background: TYPE_LABELS[item.type]?.color, color: TYPE_TEXT[item.type] }}
                                        >
                                            {TYPE_LABELS[item.type]?.label}
                                        </span>
                                        <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                        <span className="font-bold text-sm" style={{ color: '#C8A44A' }}>₹{item.defaultPrice}</span>
                                        <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-secondary)' }}>
                                                <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => remove(item._id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
                                                <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit bottom sheet */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 z-200 flex items-end" onClick={() => { setShowForm(false); setEditing(null) }}>
                    <div
                        className="w-full rounded-t-3xl p-5 space-y-3"
                        style={{ background: 'var(--surface-1)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                {editing ? 'Edit Item' : 'New Item'}
                            </p>
                            <button onClick={() => { setShowForm(false); setEditing(null) }}>
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
                                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Name *</label>
                            <input
                                autoFocus
                                placeholder="e.g. Engine Oil 5W-30"
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                className={inputCls}
                                style={inputStyle}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                                <input
                                    placeholder="e.g. Engine, Brakes"
                                    value={form.category}
                                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                    className={inputCls}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Type</label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm(p => ({ ...p, type: e.target.value as 'part' | 'labor' | 'service' }))}
                                    className={inputCls}
                                    style={inputStyle}
                                >
                                    <option value="part">Part</option>
                                    <option value="labor">Labor</option>
                                    <option value="service">Service</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Default Price (₹) *</label>
                            <input
                                type="number"
                                min={0}
                                placeholder="0.00"
                                value={form.defaultPrice || ''}
                                onChange={e => setForm(p => ({ ...p, defaultPrice: +e.target.value }))}
                                className={inputCls}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Description (optional)</label>
                            <input
                                placeholder="Short description..."
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                className={inputCls}
                                style={inputStyle}
                            />
                        </div>

                        <button
                            onClick={() => save()}
                            disabled={saving || !form.name || !form.defaultPrice}
                            className="btn-gold w-full py-4 rounded-2xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                            style={{ color: '#0D0D0D' }}
                        >
                            {saving ? <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" /> : (editing ? 'Save Changes' : 'Add Item')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
