import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Appointment from '@/lib/models/Appointment'
import Customer from '@/lib/models/Customer'
import JobCard from '@/lib/models/JobCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
    try {
        await connectDB()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const [todayAppts, totalCustomers, pendingAppts, inProgressAppts] = await Promise.all([
            Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
            Customer.countDocuments(),
            Appointment.countDocuments({ status: 'pending' }),
            JobCard.countDocuments({ status: { $in: ['received', 'inspection', 'in_service', 'quality_check'] } }),
        ])

        const todayList = await Appointment.find({ date: { $gte: today, $lt: tomorrow } })
            .populate('customerId', 'name phone')
            .populate('vehicleId', 'regNumber brand model')
            .sort({ timeSlot: 1 })
            .limit(5)
            .lean()

        // Jobs billed today (totalAmount saved today)
        const billedToday = await JobCard.find({ updatedAt: { $gte: today, $lt: tomorrow }, totalAmount: { $gt: 0 } })
            .populate('customerId', 'name')
            .populate('vehicleId', 'regNumber brand model')
            .select('jobNumber customerId vehicleId totalAmount status')
            .sort({ updatedAt: -1 })
            .lean()

        const todayRevenue = billedToday.reduce((sum, j) => sum + (j.totalAmount ?? 0), 0)

        return { todayAppts, totalCustomers, pendingAppts, inProgressAppts, todayList, billedToday, todayRevenue }
    } catch {
        return { todayAppts: 0, totalCustomers: 0, pendingAppts: 0, inProgressAppts: 0, todayList: [], billedToday: [], todayRevenue: 0 }
    }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending:       { bg: 'rgba(245,158,11,0.15)',  text: '#FBBF24' },
    confirmed:     { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA' },
    in_progress:   { bg: 'rgba(139,92,246,0.15)',  text: '#A78BFA' },
    completed:     { bg: 'rgba(34,197,94,0.15)',   text: '#4ADE80' },
    cancelled:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
    ready:         { bg: 'rgba(34,197,94,0.15)',   text: '#4ADE80' },
    delivered:     { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8' },
    received:      { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8' },
    inspection:    { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA' },
    in_service:    { bg: 'rgba(139,92,246,0.15)',  text: '#A78BFA' },
    quality_check: { bg: 'rgba(245,158,11,0.15)',  text: '#FBBF24' },
    booked:        { bg: 'rgba(99,102,241,0.15)',  text: '#818CF8' },
}

export default async function DashboardPage() {
    const session = await auth()
    const stats = await getStats()
    const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

    const STAT_CARDS = [
        {
            label: "Today's Appointments",
            value: stats.todayAppts,
            icon: '📅',
            bg: 'rgba(59,130,246,0.10)',
            border: 'rgba(59,130,246,0.20)',
            textColor: '#60A5FA',
            href: '/appointments',
        },
        {
            label: 'Total Customers',
            value: stats.totalCustomers,
            icon: '👥',
            bg: 'rgba(139,92,246,0.10)',
            border: 'rgba(139,92,246,0.20)',
            textColor: '#A78BFA',
            href: '/customers',
        },
        {
            label: 'Pending Bookings',
            value: stats.pendingAppts,
            icon: '⏳',
            bg: 'rgba(245,158,11,0.10)',
            border: 'rgba(245,158,11,0.20)',
            textColor: '#FBBF24',
            href: '/appointments',
        },
        {
            label: 'Jobs In Progress',
            value: stats.inProgressAppts,
            icon: '🔧',
            bg: 'rgba(200,164,74,0.10)',
            border: 'rgba(200,164,74,0.25)',
            textColor: '#C8A44A',
            href: '/jobcards',
        },
    ]

    const cardStyle = { background: 'var(--surface-1)', border: '1px solid var(--border-dim)' } as const

    return (
        <div className="max-w-2xl mx-auto px-4">
            {/* Greeting */}
            <div className="pt-12 pb-6">
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Welcome back,</p>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{firstName}</h1>
                <p className="text-xs mt-1 font-medium capitalize" style={{ color: '#C8A44A' }}>
                    {(session?.user as { role?: string })?.role} · Emirates Car Care
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {STAT_CARDS.map(card => (
                    <Link
                        key={card.label}
                        href={card.href}
                        className="rounded-2xl p-4 card-lift animate-fadeInUp"
                        style={{ background: card.bg, border: `1px solid ${card.border}` }}
                    >
                        <span className="text-2xl">{card.icon}</span>
                        <p className="text-3xl font-black mt-2" style={{ color: card.textColor }}>{card.value}</p>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: card.textColor, opacity: 0.7 }}>{card.label}</p>
                    </Link>
                ))}
            </div>

            {/* Today's Collections card */}
            <Link
                href="/jobcards"
                className="block rounded-2xl p-4 mb-6 card-lift animate-fadeInUp"
                style={{ background: 'linear-gradient(135deg, rgba(200,164,74,0.12), rgba(200,164,74,0.06))', border: '1px solid rgba(200,164,74,0.3)' }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(200,164,74,0.7)' }}>Today&apos;s Collections</p>
                        <p className="text-3xl font-black" style={{ color: '#C8A44A' }}>
                            ₹{stats.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(200,164,74,0.6)' }}>
                            {stats.billedToday.length} invoice{stats.billedToday.length !== 1 ? 's' : ''} billed today
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(200,164,74,0.15)' }}>
                        <span className="text-2xl">💰</span>
                    </div>
                </div>

                {stats.billedToday.length > 0 && (
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(200,164,74,0.15)' }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {stats.billedToday.slice(0, 3).map((job: any) => {
                            const sc = STATUS_COLORS[job.status] ?? STATUS_COLORS.delivered
                            return (
                                <div key={job._id.toString()} className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text }}>
                                        {job.status?.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                                        {job.customerId?.name ?? '—'} · {job.vehicleId?.regNumber ?? ''}
                                    </span>
                                    <span className="text-xs font-bold shrink-0" style={{ color: '#C8A44A' }}>
                                        ₹{(job.totalAmount ?? 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )
                        })}
                        {stats.billedToday.length > 3 && (
                            <p className="text-[11px]" style={{ color: 'rgba(200,164,74,0.5)' }}>+{stats.billedToday.length - 3} more →</p>
                        )}
                    </div>
                )}
            </Link>

            {/* Quick Actions */}
            <div className="rounded-2xl p-4 mb-6" style={cardStyle}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { href: '/appointments/new', label: 'New Booking', icon: '📅' },
                        { href: '/customers/new',    label: 'Add Customer', icon: '👤' },
                        { href: '/jobcards',         label: 'Job Cards',    icon: '📋' },
                        { href: '/settings/pricing', label: 'Pricing',      icon: '💰' },
                    ].map(action => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium active:scale-[0.97] transition-transform"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                        >
                            <span>{action.icon}</span>
                            {action.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Today's schedule */}
            {stats.todayList.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Today&apos;s Schedule</p>
                        <Link href="/appointments" className="text-xs font-semibold" style={{ color: '#C8A44A' }}>View all →</Link>
                    </div>
                    <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {stats.todayList.map((appt: any) => {
                            const sc = STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending
                            return (
                                <div key={appt._id.toString()} className="rounded-2xl p-4 flex items-center gap-3" style={cardStyle}>
                                    <div className="text-center w-12 shrink-0">
                                        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{appt.timeSlot?.split(' ')[0]}</p>
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{appt.timeSlot?.split(' ')[1]}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{appt.customerId?.name ?? '—'}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{appt.serviceType}</p>
                                    </div>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize" style={{ background: sc.bg, color: sc.text }}>
                                        {appt.status.replace('_', ' ')}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="text-xs text-center pb-4" style={{ color: 'var(--text-muted)' }}>Emirates Car Care · Workshop Management</div>
        </div>
    )
}
