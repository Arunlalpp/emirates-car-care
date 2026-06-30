'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function InvoicePage() {
    const { id } = useParams<{ id: string }>()

    const { data: job, isLoading } = useQuery({
        queryKey: ['jobcard', id],
        queryFn: async () => {
            const res = await fetch(`/api/jobcards/${id}`)
            if (!res.ok) throw new Error('Not found')
            return (await res.json()).data
        },
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--surface-0)' }}>
                <span className="w-8 h-8 border-2 border-[#C8A44A]/30 border-t-[#C8A44A] rounded-full animate-spin" />
            </div>
        )
    }

    if (!job) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--surface-0)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Job card not found.</p>
                <Link href="/jobcards" className="text-sm underline" style={{ color: '#C8A44A' }}>Back to Jobs</Link>
            </div>
        )
    }

    const customer   = job.customerId
    const vehicle    = job.vehicleId
    const lineItems  = job.lineItems ?? []
    const labor      = job.laborCharge ?? 0
    const discount   = job.discountAmount ?? 0
    const vatPct     = job.vatPercent ?? 5
    const subtotal   = lineItems.reduce((s: number, it: { total: number }) => s + it.total, 0) + labor
    const discounted = subtotal - discount
    const vatAmt     = +(discounted * vatPct / 100).toFixed(2)
    const total      = job.totalAmount ?? +(discounted + vatAmt).toFixed(2)
    const invoiceDate = new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <div style={{ background: 'var(--surface-0)', minHeight: '100vh' }}>
            {/* ── Action bar — hidden when printing ── */}
            <div
                className="print:hidden"
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                    background: 'var(--surface-1)',
                    borderBottom: '1px solid var(--border-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                }}
            >
                <Link
                    href={`/jobcards/${id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Invoice Preview</p>
                <button
                    onClick={() => window.print()}
                    className="btn-gold"
                    style={{ color: '#0D0D0D', fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / PDF
                </button>
            </div>

            {/* ── Screen preview card (hidden in print) ── */}
            <div
                className="print:hidden"
                style={{
                    maxWidth: 680, margin: '76px auto 40px',
                    padding: '32px 24px',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 20,
                }}
            >
                <InvoiceBody
                    job={job} customer={customer} vehicle={vehicle}
                    lineItems={lineItems} labor={labor} discount={discount}
                    vatPct={vatPct} vatAmt={vatAmt} subtotal={subtotal}
                    total={total} invoiceDate={invoiceDate}
                />
            </div>

            {/* ── Print-only: clean white page ── */}
            <div className="hidden print:block" style={{ padding: 40 }}>
                <InvoiceBody
                    job={job} customer={customer} vehicle={vehicle}
                    lineItems={lineItems} labor={labor} discount={discount}
                    vatPct={vatPct} vatAmt={vatAmt} subtotal={subtotal}
                    total={total} invoiceDate={invoiceDate}
                    print
                />
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InvoiceBody({ job, customer, vehicle, lineItems, labor, discount, vatPct, vatAmt, subtotal, total, invoiceDate, print: isPrint = false }: any) {
    const textPrimary   = isPrint ? '#111827' : 'var(--text-primary)'
    const textMuted     = isPrint ? '#6B7280' : 'var(--text-muted)'
    const textSecondary = isPrint ? '#374151' : 'var(--text-secondary)'
    const borderColor   = isPrint ? '#E5E7EB' : 'var(--border-dim)'
    const bgSurface     = isPrint ? '#F9FAFB' : 'var(--surface-2)'
    const gold          = '#C8A44A'

    return (
        <div style={{ fontFamily: 'sans-serif', color: textPrimary }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                                <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: textPrimary }}>Emirates Car Care</span>
                    </div>
                    <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>Professional Auto Workshop</p>
                    <p style={{ fontSize: 12, color: textMuted, margin: '2px 0 0' }}>Dubai, UAE</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 28, fontWeight: 900, color: gold, margin: 0 }}>INVOICE</p>
                    <p style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: textPrimary, marginTop: 4 }}>{job.jobNumber}</p>
                    <p style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{invoiceDate}</p>
                </div>
            </div>

            {/* Bill To + Vehicle */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
                marginBottom: 28, padding: 16, borderRadius: 12,
                background: bgSurface, border: `1px solid ${borderColor}`,
            }}>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: gold, marginBottom: 8 }}>Bill To</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: textPrimary, margin: 0 }}>{customer?.name ?? '—'}</p>
                    <p style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>{customer?.phone ?? ''}</p>
                    {customer?.email && <p style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{customer.email}</p>}
                </div>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: gold, marginBottom: 8 }}>Vehicle</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: textPrimary, margin: 0 }}>{vehicle ? `${vehicle.brand} ${vehicle.model}` : '—'}</p>
                    <p style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>Reg: {vehicle?.regNumber ?? '—'}</p>
                    <p style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>Year: {vehicle?.year ?? '—'}{vehicle?.fuelType ? ` · ${vehicle.fuelType}` : ''}</p>
                </div>
            </div>

            {/* Service / Complaints */}
            {(job.serviceType || job.complaints?.length > 0) && (
                <div style={{ marginBottom: 20 }}>
                    {job.serviceType && (
                        <p style={{ fontSize: 13, color: textSecondary, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: textPrimary }}>Service: </span>{job.serviceType}
                        </p>
                    )}
                    {job.complaints?.length > 0 && (
                        <p style={{ fontSize: 12, color: textMuted }}>Complaints: {job.complaints.join(', ')}</p>
                    )}
                </div>
            )}

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                <thead>
                    <tr style={{ borderBottom: `2px solid ${gold}` }}>
                        {['#', 'Description', 'Type', 'Qty', 'Unit Price', 'Total'].map(h => (
                            <th key={h} style={{
                                textAlign: h === '#' || h === 'Qty' ? 'center' : h === 'Unit Price' || h === 'Total' ? 'right' : 'left',
                                padding: '8px 6px', fontSize: 10, fontWeight: 700,
                                color: textMuted, textTransform: 'uppercase', letterSpacing: 1,
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {lineItems.map((it: { description: string; type: string; quantity: number; unitPrice: number; total: number }, i: number) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td style={{ textAlign: 'center', padding: '10px 6px', fontSize: 12, color: textMuted }}>{i + 1}</td>
                            <td style={{ padding: '10px 6px', fontSize: 13, color: textPrimary, fontWeight: 500 }}>{it.description}</td>
                            <td style={{ padding: '10px 6px', fontSize: 11, color: textMuted, textTransform: 'capitalize' }}>{it.type}</td>
                            <td style={{ textAlign: 'center', padding: '10px 6px', fontSize: 12, color: textSecondary }}>{it.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '10px 6px', fontSize: 12, color: textSecondary }}>₹{it.unitPrice.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '10px 6px', fontSize: 13, fontWeight: 700, color: isPrint ? '#111' : gold }}>₹{it.total.toFixed(2)}</td>
                        </tr>
                    ))}
                    {labor > 0 && (
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td style={{ textAlign: 'center', padding: '10px 6px', fontSize: 12, color: textMuted }}>{lineItems.length + 1}</td>
                            <td style={{ padding: '10px 6px', fontSize: 13, color: textPrimary, fontWeight: 500 }}>Labour Charge</td>
                            <td style={{ padding: '10px 6px', fontSize: 11, color: textMuted }}>labor</td>
                            <td style={{ textAlign: 'center', padding: '10px 6px', fontSize: 12, color: textSecondary }}>1</td>
                            <td style={{ textAlign: 'right', padding: '10px 6px', fontSize: 12, color: textSecondary }}>₹{labor.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '10px 6px', fontSize: 13, fontWeight: 700, color: isPrint ? '#111' : gold }}>₹{labor.toFixed(2)}</td>
                        </tr>
                    )}
                    {lineItems.length === 0 && labor === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px', fontSize: 12, color: textMuted }}>No items added yet</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals block */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
                <div style={{ minWidth: 280 }}>
                    {[
                        { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}`, green: false },
                        ...(discount > 0 ? [{ label: 'Discount', value: `−₹${discount.toFixed(2)}`, green: true }] : []),
                        ...(vatPct > 0  ? [{ label: `GST (${vatPct}%)`, value: `₹${vatAmt.toFixed(2)}`, green: false }] : []),
                    ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderColor}` }}>
                            <span style={{ fontSize: 13, color: textMuted }}>{row.label}</span>
                            <span style={{ fontSize: 13, color: row.green ? '#22c55e' : textSecondary }}>{row.value}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', marginTop: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: textPrimary }}>TOTAL</span>
                        <span style={{ fontSize: 24, fontWeight: 900, color: gold }}>₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: `2px solid ${gold}`, paddingTop: 18, textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>Thank you for choosing Emirates Car Care!</p>
                <p style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>For queries, please reference job number: {job.jobNumber}</p>
                <p style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>Emirates Car Care · Professional Auto Workshop · Dubai, UAE</p>
            </div>
        </div>
    )
}
