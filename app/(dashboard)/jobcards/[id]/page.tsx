'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef } from 'react'

const STAGES = [
    { key: 'booked',        label: 'Booked',        desc: 'Appointment confirmed',       icon: '📅' },
    { key: 'received',      label: 'Received',      desc: 'Vehicle checked in',          icon: '🚗' },
    { key: 'inspection',    label: 'Inspection',    desc: 'Diagnosing issues',           icon: '🔍' },
    { key: 'in_service',    label: 'In Service',    desc: 'Work in progress',            icon: '🔧' },
    { key: 'quality_check', label: 'Quality Check', desc: 'Final checks done',           icon: '✅' },
    { key: 'ready',         label: 'Ready',         desc: 'Ready for pickup',            icon: '🎉' },
    { key: 'delivered',     label: 'Delivered',     desc: 'Handed over to customer',     icon: '🏁' },
]

function stageIndex(key: string) { return STAGES.findIndex(s => s.key === key) }

const cardStyle = { background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }
const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8A44A] focus:ring-1 focus:ring-[#C8A44A]/30 transition-colors'
const inputStyle = { background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }

function StatusFlow({ current, onAdvance, advancing }: { current: string; onAdvance: () => void; advancing: boolean }) {
    const ci = stageIndex(current)
    const isLast = ci >= STAGES.length - 1

    return (
        <div className="rounded-2xl p-5 mb-4" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Service Flow</p>
            <div className="relative">
                {STAGES.map((stage, i) => {
                    const done = i < ci
                    const active = i === ci
                    return (
                        <div key={stage.key} className="flex gap-4 mb-0">
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                        background: done ? 'rgba(34,197,94,0.15)' : active ? '#C8A44A' : 'var(--surface-2)',
                                        border: done ? '2px solid #16a34a' : active ? '2px solid #C8A44A' : '2px solid var(--border-subtle)',
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
                                        style={{ minHeight: 20, background: done ? '#16a34a' : 'var(--border-dim)' }}
                                    />
                                )}
                            </div>
                            <div className="pb-5 flex-1">
                                <p className="text-sm font-semibold leading-tight" style={{ color: done ? '#22c55e' : active ? '#C8A44A' : 'var(--text-muted)' }}>
                                    {stage.label}
                                </p>
                                {(active || done) && (
                                    <p className="text-xs mt-0.5" style={{ color: done ? '#4ade80' : 'var(--text-secondary)' }}>
                                        {stage.desc}
                                    </p>
                                )}
                                {i > ci && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stage.desc}</p>}
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
                <div className="text-center py-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    🏁 Job completed and delivered
                </div>
            )}
        </div>
    )
}

function NotifyBanner({ jobId, notified, phone }: { jobId: string; notified: boolean; phone?: string }) {
    const [result, setResult] = useState<{ link?: string; phone?: string } | null>(null)
    const [sent, setSent] = useState(notified)

    const { mutate: sendNotification, isPending } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/jobcards/${jobId}/notify`, { method: 'POST' })
            if (!res.ok) throw new Error('Failed to send')
            return res.json()
        },
        onSuccess: (json) => {
            setSent(true)
            if (json.link) setResult(json)
            else setResult({ phone: json.phone })
        },
    })

    if (sent && !result) {
        return (
            <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="text-2xl">✅</span>
                <div>
                    <p className="text-sm font-semibold text-green-400">Notification sent</p>
                    <p className="text-xs text-green-600">Customer has been informed their vehicle is ready</p>
                </div>
            </div>
        )
    }

    if (result?.link) {
        return (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-sm font-semibold text-green-400 mb-2">✅ WhatsApp message ready</p>
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
                onClick={() => sendNotification()}
                disabled={isPending}
                className="btn-gold text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
                style={{ color: '#0D0D0D' }}
            >
                {isPending ? '...' : 'Notify'}
            </button>
        </div>
    )
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InspectionPhotos({ jobId, images, refetch }: { jobId: string; images: any[]; refetch: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [lightbox, setLightbox] = useState<string | null>(null)

    async function handleFiles(files: FileList | null) {
        if (!files?.length) return
        setUploading(true)
        for (const file of Array.from(files)) {
            const dataUrl = await compressImage(file)
            await fetch(`/api/jobcards/${jobId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataUrl, caption: file.name.split('.')[0] }),
            })
        }
        setUploading(false)
        refetch()
    }

    async function deletePhoto(index: number) {
        await fetch(`/api/jobcards/${jobId}/photos`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index }),
        })
        refetch()
    }

    return (
        <div className="rounded-2xl p-4 mb-4" style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Inspection Photos</p>
                <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="btn-gold text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                    style={{ color: '#0D0D0D' }}
                >
                    {uploading ? (
                        <span className="w-3 h-3 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                    ) : (
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
                    )}
                    Add Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>

            {images.length === 0 ? (
                <div
                    className="rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer transition-colors"
                    style={{ border: '2px dashed var(--border-subtle)' }}
                    onClick={() => fileRef.current?.click()}
                >
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Tap to add inspection photos</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden aspect-square" style={{ background: 'var(--surface-2)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.dataUrl}
                                alt={img.caption || `Photo ${i + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setLightbox(img.dataUrl)}
                            />
                            <button
                                onClick={() => deletePhoto(i)}
                                className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-xl flex flex-col items-center justify-center transition-colors"
                        style={{ border: '2px dashed var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
                        <span className="text-[10px] mt-1">Add</span>
                    </button>
                </div>
            )}

            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lightbox} alt="Inspection photo" className="max-w-full max-h-full rounded-xl object-contain" />
                    <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
    )
}

interface LineItem { description: string; type: string; quantity: number; unitPrice: number; total: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BillingSection({ jobId, job }: { jobId: string; job: any }) {
    const router = useRouter()
    const [items, setItems] = useState<LineItem[]>(job.lineItems ?? [])
    const [labor, setLabor] = useState<number>(job.laborCharge ?? 0)
    const [discount, setDiscount] = useState<number>(job.discountAmount ?? 0)
    const [vat, setVat] = useState<number>(job.vatPercent ?? 5)
    const [saving, setSaving] = useState(false)
    const [newItem, setNewItem] = useState({ description: '', type: 'part', quantity: 1, unitPrice: 0 })
    const [catalogOpen, setCatalogOpen] = useState(false)
    const [catalog, setCatalog] = useState<{ _id: string; name: string; type: string; defaultPrice: number; category: string }[]>([])
    const [catSearch, setCatSearch] = useState('')

    async function loadCatalog() {
        if (catalog.length) { setCatalogOpen(true); return }
        const res = await fetch('/api/service-items')
        if (res.ok) { const j = await res.json(); setCatalog(j.data ?? []) }
        setCatalogOpen(true)
    }

    function addItem() {
        if (!newItem.description) return
        const total = +(newItem.quantity * newItem.unitPrice).toFixed(2)
        setItems(prev => [...prev, { ...newItem, total }])
        setNewItem({ description: '', type: 'part', quantity: 1, unitPrice: 0 })
    }

    function addFromCatalog(item: { name: string; type: string; defaultPrice: number }) {
        const total = +item.defaultPrice.toFixed(2)
        setItems(prev => [...prev, { description: item.name, type: item.type, quantity: 1, unitPrice: item.defaultPrice, total }])
        setCatalogOpen(false)
    }

    function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)) }

    const subtotal = items.reduce((sum, it) => sum + it.total, 0) + labor
    const discounted = subtotal - discount
    const vatAmt = +(discounted * vat / 100).toFixed(2)
    const total = +(discounted + vatAmt).toFixed(2)

    async function save() {
        setSaving(true)
        await fetch(`/api/jobcards/${jobId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineItems: items, laborCharge: labor, discountAmount: discount, vatPercent: vat, totalAmount: total }),
        })
        setSaving(false)
        router.push(`/jobcards/${jobId}/invoice`)
    }

    const filteredCatalog = catalog.filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()))

    return (
        <div className="rounded-2xl p-4 mb-4" style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Billing & Parts</p>
                <Link href={`/jobcards/${jobId}/invoice`} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(200,164,74,0.12)', color: '#C8A44A', border: '1px solid rgba(200,164,74,0.3)' }}>
                    View Invoice →
                </Link>
            </div>

            {/* Line items list */}
            {items.length > 0 && (
                <div className="mb-3 space-y-1">
                    {items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)' }}>
                            <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{it.description}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{it.quantity}×</span>
                            <span style={{ color: 'var(--text-secondary)' }}>₹{it.unitPrice}</span>
                            <span className="font-semibold w-16 text-right" style={{ color: '#C8A44A' }}>₹{it.total}</span>
                            <button onClick={() => removeItem(i)} className="shrink-0">
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add from catalog */}
            <div className="flex gap-2 mb-3">
                <button onClick={loadCatalog} className="text-xs px-3 py-2 rounded-lg font-medium" style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    + From Catalog
                </button>
            </div>

            {/* Manual add row */}
            <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                    <input
                        placeholder="Description"
                        value={newItem.description}
                        onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                        className={`${inputCls} flex-1`}
                        style={inputStyle}
                    />
                    <select
                        value={newItem.type}
                        onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}
                        className={inputCls}
                        style={{ ...inputStyle, width: 90 }}
                    >
                        <option value="part">Part</option>
                        <option value="labor">Labor</option>
                        <option value="service">Service</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={newItem.quantity}
                        onChange={e => setNewItem(p => ({ ...p, quantity: +e.target.value }))}
                        className={inputCls}
                        style={{ ...inputStyle, width: 70 }}
                    />
                    <input
                        type="number"
                        placeholder="Unit Price (₹)"
                        min={0}
                        value={newItem.unitPrice || ''}
                        onChange={e => setNewItem(p => ({ ...p, unitPrice: +e.target.value }))}
                        className={`${inputCls} flex-1`}
                        style={inputStyle}
                    />
                    <button
                        onClick={addItem}
                        disabled={!newItem.description}
                        className="btn-gold px-4 rounded-xl text-xs font-bold disabled:opacity-40"
                        style={{ color: '#0D0D0D' }}
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Labor, discount, VAT */}
            <div className="space-y-2 border-t pt-3 mb-3" style={{ borderColor: 'var(--border-dim)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-xs w-28" style={{ color: 'var(--text-muted)' }}>Labor Charge (₹)</span>
                    <input type="number" min={0} value={labor || ''} onChange={e => setLabor(+e.target.value)} placeholder="0" className={`${inputCls} flex-1`} style={inputStyle} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs w-28" style={{ color: 'var(--text-muted)' }}>Discount (₹)</span>
                    <input type="number" min={0} value={discount || ''} onChange={e => setDiscount(+e.target.value)} placeholder="0" className={`${inputCls} flex-1`} style={inputStyle} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs w-28" style={{ color: 'var(--text-muted)' }}>VAT %</span>
                    <input type="number" min={0} max={30} value={vat} onChange={e => setVat(+e.target.value)} className={`${inputCls} flex-1`} style={inputStyle} />
                </div>
            </div>

            {/* Totals */}
            <div className="rounded-xl p-3 space-y-1.5 mb-3" style={{ background: 'var(--surface-2)' }}>
                <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span style={{ color: 'var(--text-secondary)' }}>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Discount</span>
                        <span className="text-green-400">−₹{discount.toFixed(2)}</span>
                    </div>
                )}
                {vat > 0 && (
                    <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>VAT ({vat}%)</span>
                        <span style={{ color: 'var(--text-secondary)' }}>₹{vatAmt.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1.5" style={{ borderTop: '1px solid var(--border-dim)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Total</span>
                    <span style={{ color: '#C8A44A' }}>₹{total.toFixed(2)}</span>
                </div>
            </div>

            <button
                onClick={save}
                disabled={saving}
                className="btn-gold w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ color: '#0D0D0D' }}
            >
                {saving ? <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" /> : 'Save & View Invoice →'}
            </button>

            {/* Catalog modal */}
            {catalogOpen && (
                <div className="fixed inset-0 bg-black/80 z-200 flex items-end" onClick={() => setCatalogOpen(false)}>
                    <div
                        className="w-full rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto"
                        style={{ background: 'var(--surface-1)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Service Catalog</p>
                            <button onClick={() => setCatalogOpen(false)}><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <input
                            placeholder="Search..."
                            value={catSearch}
                            onChange={e => setCatSearch(e.target.value)}
                            className={inputCls}
                            style={{ ...inputStyle, marginBottom: 12 }}
                            autoFocus
                        />
                        <div className="space-y-1">
                            {filteredCatalog.map(item => (
                                <button
                                    key={item._id}
                                    onClick={() => addFromCatalog(item)}
                                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors"
                                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-dim)' }}
                                >
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.category} · {item.type}</p>
                                    </div>
                                    <span className="font-semibold text-sm" style={{ color: '#C8A44A' }}>₹{item.defaultPrice}</span>
                                </button>
                            ))}
                            {filteredCatalog.length === 0 && (
                                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                    No items found. <Link href="/settings/pricing" className="underline" style={{ color: '#C8A44A' }}>Manage catalog →</Link>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function JobCardDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [stageLink, setStageLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const { data: job, isLoading, refetch } = useQuery({
        queryKey: ['jobcard', id],
        queryFn: async () => {
            const res = await fetch(`/api/jobcards/${id}`)
            if (!res.ok) throw new Error('Not found')
            return (await res.json()).data
        },
    })

    const { mutate: advance, isPending: advancing } = useMutation({
        mutationFn: async () => {
            const ci = stageIndex(job.status)
            const next = STAGES[ci + 1]?.key
            if (!next) return
            const res = await fetch(`/api/jobcards/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: next }),
            })
            if (!res.ok) throw new Error('Failed to advance')
            return res.json()
        },
        onSuccess: (json) => {
            if (!json) return
            queryClient.setQueryData(['jobcard', id], (old: typeof job) => ({ ...old, status: json.data.status }))
            queryClient.invalidateQueries({ queryKey: ['jobcards'] })
            // Build WhatsApp status update link for customer
            const newStatus = json.data.status
            const stage = STAGES.find(s => s.key === newStatus)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cust = job.customerId as any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const veh = job.vehicleId as any
            const rawPhone = (cust?.phone ?? '').replace(/\D/g, '')
            const waPhone = rawPhone.startsWith('0') ? `91${rawPhone.slice(1)}` : rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
            if (waPhone && stage) {
                const msg = `Hello ${cust?.name ?? 'Customer'}, your vehicle ${veh ? `${veh.brand} ${veh.model}` : ''} (${veh?.regNumber ?? ''}) status update:\n\n*${stage.label}* — ${stage.desc}\n\nJob No: *${job.jobNumber}*\n\n📍 Emirates Car Care, Vengara`
                setStageLink(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`)
            }
        },
    })

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-12">
                <div className="space-y-3 animate-pulse">
                    <div className="h-8 rounded w-40" style={{ background: 'var(--surface-2)' }} />
                    <div className="h-4 rounded w-64" style={{ background: 'var(--surface-2)' }} />
                    <div className="h-48 rounded-2xl mt-4" style={{ background: 'var(--surface-1)' }} />
                </div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="max-w-2xl mx-auto px-4 pt-12 text-center">
                <p style={{ color: 'var(--text-muted)' }}>Job card not found.</p>
                <Link href="/jobcards" className="text-sm underline mt-3 block" style={{ color: '#C8A44A' }}>Back to Job Cards</Link>
            </div>
        )
    }

    const customer = job.customerId
    const vehicle = job.vehicleId

    return (
        <div className="max-w-2xl mx-auto px-4 pb-24">
            <div className="pt-12 pb-5 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={cardStyle}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-secondary)' }}>
                        <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1">
                    <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{job.jobNumber}</p>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{customer?.name ?? 'Job Card'}</h1>
                </div>
                <Link
                    href={`/jobcards/${id}/invoice`}
                    className="text-xs font-semibold px-3 py-2 rounded-xl"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)' }}
                >
                    Invoice
                </Link>
            </div>

            {job.status === 'ready' && (
                <NotifyBanner jobId={id} notified={job.notificationSent} phone={customer?.phone} />
            )}

            {stageLink && (
                <div className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Send status update to customer</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(74,222,128,0.65)' }}>Tap WhatsApp to notify them of the new stage</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={stageLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl"
                            style={{ background: '#22c55e', color: '#fff' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                        </a>
                        <button onClick={() => setStageLink(null)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <StatusFlow current={job.status} onAdvance={() => advance()} advancing={advancing} />

            {/* Customer tracking link */}
            {job.jobNumber && (() => {
                const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/track/${job.jobNumber}`
                const waMsg = `Hello ${customer?.name ?? 'there'}, track your vehicle service status here:\n${trackUrl}`
                const waPhone = (() => {
                    const raw = (customer?.phone ?? '').replace(/\D/g, '')
                    return raw.startsWith('0') ? `91${raw.slice(1)}` : raw.length === 10 ? `91${raw}` : raw
                })()
                return (
                    <div className="rounded-2xl p-4 mb-4" style={cardStyle}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Customer Tracking</p>
                        <p className="text-xs mb-3 font-mono truncate" style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 8 }}>
                            /track/{job.jobNumber}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(trackUrl)
                                    setCopied(true)
                                    setTimeout(() => setCopied(false), 2000)
                                }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                                style={{ background: 'var(--surface-3)', color: copied ? '#4ade80' : 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                            >
                                {copied ? '✓ Copied' : 'Copy Link'}
                            </button>
                            {waPhone && (
                                <a
                                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5"
                                    style={{ background: '#22c55e', color: '#fff' }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Send to Customer
                                </a>
                            )}
                        </div>
                    </div>
                )
            })()}

            {/* Vehicle & Customer info */}
            <div className="rounded-2xl mb-4 overflow-hidden" style={cardStyle}>
                {[
                    { label: 'Customer', value: customer?.name },
                    { label: 'Phone', value: customer?.phone ?? '—' },
                    { label: 'Vehicle', value: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year ?? ''})` : '—' },
                    { label: 'Reg No.', value: vehicle?.regNumber ?? '—' },
                    { label: 'Odometer In', value: job.odometerIn ? `${job.odometerIn} km` : '—' },
                ].map((row, i) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i > 0 ? '1px solid var(--border-dim)' : 'none' }}>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                ))}
            </div>

            {/* Service & Complaints */}
            {(job.serviceType || job.customerComplaint || (job.complaints && job.complaints.length > 0)) && (
                <div className="rounded-2xl p-4 mb-4" style={cardStyle}>
                    {job.serviceType && (
                        <div className="mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Service Type</p>
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{job.serviceType}</p>
                        </div>
                    )}
                    {job.complaints?.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Reported Complaints</p>
                            <div className="flex flex-wrap gap-1.5">
                                {job.complaints.map((c: string) => (
                                    <span key={c} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(200,164,74,0.12)', color: '#C8A44A', border: '1px solid rgba(200,164,74,0.25)' }}>{c}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {job.customerComplaint && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Customer Complaint</p>
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{job.customerComplaint}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Inspection photos — show at inspection stage */}
            {(job.status === 'inspection' || (job.inspectionImages && job.inspectionImages.length > 0)) && (
                <InspectionPhotos
                    jobId={id}
                    images={job.inspectionImages ?? []}
                    refetch={refetch}
                />
            )}

            {/* Billing section */}
            <BillingSection jobId={id} job={job} />

            {/* Dates */}
            <div className="rounded-2xl overflow-hidden mb-4" style={cardStyle}>
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Created</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(job.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                {job.expectedDelivery && (
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-dim)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Expected Delivery</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(job.expectedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                )}
                {job.notifiedAt && (
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-dim)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Customer Notified</span>
                        <span className="text-xs text-green-400">
                            {new Date(job.notifiedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
