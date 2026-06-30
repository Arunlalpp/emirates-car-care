import { connectDB } from '@/lib/mongodb'
import Appointment from '@/lib/models/Appointment'
import Link from 'next/link'

const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-violet-100 text-violet-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-500',
}

async function getAllAppointments() {
    try {
        await connectDB()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return await Appointment.find({ date: { $gte: today } })
            .populate('customerId', 'name phone _id')
            .populate('vehicleId', 'regNumber brand model')
            .sort({ date: 1, timeSlot: 1 })
            .lean()
    } catch {
        return []
    }
}

function formatDateLabel(date: Date): string {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const d = new Date(date)
    d.setHours(0, 0, 0, 0)

    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
    return new Date(date).toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function AppointmentsPage() {
    const appts = await getAllAppointments()

    // Group by date string (YYYY-MM-DD)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups: Record<string, any[]> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const appt of appts as any[]) {
        const key = new Date(appt.date).toISOString().split('T')[0]
        if (!groups[key]) groups[key] = []
        groups[key].push(appt)
    }
    const dateKeys = Object.keys(groups).sort()

    const headerDate = new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400 font-medium">{headerDate}</p>
                    <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
                </div>
                <Link
                    href="/appointments/new"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: '#C8A44A' }}
                >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </Link>
            </div>

            {appts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📅</span>
                    </div>
                    <p className="font-semibold text-slate-800">No upcoming appointments</p>
                    <p className="text-sm text-slate-400 mt-1">Tap + to book a new appointment</p>
                    <Link
                        href="/appointments/new"
                        className="mt-5 inline-block text-white px-6 py-3 rounded-2xl text-sm font-semibold"
                        style={{ background: '#C8A44A' }}
                    >
                        Book Appointment
                    </Link>
                </div>
            ) : (
                <div className="space-y-6 pb-24">
                    {dateKeys.map(dateKey => (
                        <div key={dateKey}>
                            {/* Date group header */}
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                                {formatDateLabel(new Date(dateKey + 'T00:00:00'))}
                            </p>

                            <div className="space-y-3">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {groups[dateKey].map((appt: any) => (
                                    <div key={appt._id.toString()} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-fadeInUp">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">{appt.timeSlot}</span>
                                                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLE[appt.status]}`}>
                                                    {appt.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400">{appt.estimatedDuration ?? 60} min</span>
                                        </div>
                                        <p className="font-semibold text-slate-900">{appt.customerId?.name ?? '—'}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {appt.vehicleId?.regNumber} · {appt.vehicleId?.brand} {appt.vehicleId?.model}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{appt.serviceType}</p>

                                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                            <Link
                                                href={`/jobcards/new?appointmentId=${appt._id}&customerId=${appt.customerId?._id}`}
                                                className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl"
                                                style={{ background: 'rgba(200,164,74,0.1)', color: '#A8843A', border: '1px solid rgba(200,164,74,0.25)' }}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Accept &amp; Create Job Card
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
