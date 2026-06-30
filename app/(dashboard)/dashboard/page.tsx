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
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

        const [todayAppts, totalCustomers, pendingAppts, inProgressAppts] = await Promise.all([
            Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
            Customer.countDocuments(),
            Appointment.countDocuments({ status: 'pending' }),
            JobCard.countDocuments({ status: { $in: ['received', 'inspection', 'in_service', 'quality_check'] } }),
        ])

        // Today's appointment list
        const todayList = await Appointment.find({ date: { $gte: today, $lt: tomorrow } })
            .populate('customerId', 'name phone')
            .populate('vehicleId', 'regNumber brand model')
            .sort({ timeSlot: 1 })
            .limit(5)
            .lean()

        return { todayAppts, totalCustomers, pendingAppts, inProgressAppts, todayList, monthStart }
    } catch {
        return { todayAppts: 0, totalCustomers: 0, pendingAppts: 0, inProgressAppts: 0, todayList: [], monthStart: new Date() }
    }
}

const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-blue-500 text-white',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-500',
}

export default async function DashboardPage() {
    const session = await auth()
    const stats = await getStats()
    const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

    const STAT_CARDS = [
        { label: "Today's appointments", value: stats.todayAppts, icon: '📅', color: 'bg-blue-50', textColor: 'text-blue-700', href: '/appointments' },
        { label: 'Total customers', value: stats.totalCustomers, icon: '👥', color: 'bg-violet-50', textColor: 'text-violet-700', href: '/customers' },
        { label: 'Pending bookings', value: stats.pendingAppts, icon: '⏳', color: 'bg-amber-50', textColor: 'text-amber-700', href: '/appointments' },
        { label: 'Jobs in progress', value: stats.inProgressAppts, icon: '🔧', color: 'bg-slate-900', textColor: 'text-white', href: '/jobcards' },
    ]

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-6">
                <p className="text-sm text-slate-400 font-medium">Welcome back,</p>
                <h1 className="text-2xl font-bold text-slate-900">{firstName}</h1>
                <p className="text-xs mt-1 capitalize font-medium" style={{ color: '#C8A44A' }}>{session?.user?.role} · Emirates Car Care</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {STAT_CARDS.map(card => (
                    <Link key={card.label} href={card.href} className={`${card.color} rounded-2xl p-4 card-lift animate-fadeInUp`}>
                        <span className="text-2xl">{card.icon}</span>
                        <p className={`text-2xl font-bold mt-2 ${card.textColor}`}>{card.value}</p>
                        <p className={`text-xs mt-0.5 ${card.color === 'bg-slate-900' ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</p>
                    </Link>
                ))}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { href: '/appointments/new', label: 'New Booking', icon: '📅' },
                        { href: '/customers/new', label: 'Add Customer', icon: '👤' },
                        { href: '/jobcards', label: 'Job Cards', icon: '📋' },
                        { href: '/customers', label: 'All Customers', icon: '👥' },
                    ].map(action => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 active:scale-[0.97] transition-transform"
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
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Schedule</p>
                        <Link href="/appointments" className="text-xs font-semibold text-slate-900">View all →</Link>
                    </div>
                    <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {stats.todayList.map((appt: any) => (
                            <div key={appt._id.toString()} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                                <div className="text-center w-12 shrink-0">
                                    <p className="text-xs font-bold text-slate-900">{appt.timeSlot?.split(' ')[0]}</p>
                                    <p className="text-[10px] text-slate-400">{appt.timeSlot?.split(' ')[1]}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{appt.customerId?.name ?? '—'}</p>
                                    <p className="text-xs text-slate-400">{appt.serviceType}</p>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLE[appt.status]}`}>
                                    {appt.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-xs text-slate-300 text-center pb-4">Emirates Car Care · Workshop Management</div>
        </div>
    )
}
