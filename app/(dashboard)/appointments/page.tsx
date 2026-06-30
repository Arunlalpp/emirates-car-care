import { Suspense } from 'react'
import { connectDB } from '@/lib/mongodb'
import Appointment from '@/lib/models/Appointment'
import Link from 'next/link'
import { DatePicker } from '@/components/DatePicker'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    pending:     { bg: 'rgba(245,158,11,0.15)',  color: '#FBBF24' },
    confirmed:   { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
    in_progress: { bg: 'rgba(139,92,246,0.15)',  color: '#C084FC' },
    completed:   { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80' },
    cancelled:   { bg: 'rgba(239,68,68,0.12)',   color: '#F87171' },
}

async function getAppointments(dateStr: string) {
    try {
        await connectDB()
        const day = new Date(dateStr + 'T00:00:00')
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)

        return await Appointment.find({ date: { $gte: day, $lt: nextDay } })
            .populate('customerId', 'name phone _id')
            .populate('vehicleId', 'regNumber brand model')
            .sort({ timeSlot: 1 })
            .lean()
    } catch {
        return []
    }
}

export default async function AppointmentsPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const { date } = await searchParams
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const selectedDate = date ?? todayStr

    const appts = await getAppointments(selectedDate)

    const headerDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{headerDate}</p>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Appointments</h1>
                </div>
                <Link
                    href="/appointments/new"
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#C8A44A' }}
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </Link>
            </div>

            {/* Date picker — client component needs Suspense in server page */}
            <Suspense fallback={
                <div className="rounded-2xl h-14 mb-4 animate-pulse" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-dim)' }} />
            }>
                <DatePicker />
            </Suspense>

            {appts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)' }}>
                        <span className="text-3xl">📅</span>
                    </div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No appointments on this day</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Use ← → to browse other dates</p>
                    <Link
                        href="/appointments/new"
                        className="mt-5 inline-block px-6 py-3 rounded-2xl text-sm font-semibold"
                        style={{ background: '#C8A44A', color: '#0D0D0D' }}
                    >
                        Book Appointment
                    </Link>
                </div>
            ) : (
                <div className="space-y-3 pb-24">
                    <p className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
                        {appts.length} appointment{appts.length !== 1 ? 's' : ''}
                    </p>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(appts as any[]).map((appt) => {
                        const sc = STATUS_STYLE[appt.status] ?? STATUS_STYLE.pending
                        return (
                            <div
                                key={appt._id.toString()}
                                className="rounded-2xl p-4 animate-fadeInUp"
                                style={{
                                    background: 'var(--surface-1)',
                                    border: '1px solid var(--border-dim)',
                                    borderLeft: selectedDate === todayStr ? '3px solid #C8A44A' : undefined,
                                }}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{appt.timeSlot}</span>
                                        <span
                                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                                            style={{ background: sc.bg, color: sc.color }}
                                        >
                                            {appt.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{appt.estimatedDuration ?? 60} min</span>
                                </div>

                                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{appt.customerId?.name ?? '—'}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                    {appt.vehicleId?.regNumber} · {appt.vehicleId?.brand} {appt.vehicleId?.model}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{appt.serviceType}</p>

                                {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                    <Link
                                        href={`/jobcards/new?appointmentId=${appt._id}&customerId=${appt.customerId?._id}`}
                                        className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl"
                                        style={{ background: 'rgba(200,164,74,0.1)', color: '#C8A44A', border: '1px solid rgba(200,164,74,0.25)' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Accept &amp; Create Job Card
                                    </Link>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* FAB */}
            <Link
                href="/appointments/new"
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
