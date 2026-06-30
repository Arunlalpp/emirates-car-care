import { notFound } from 'next/navigation'
import Link from 'next/link'
import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import Vehicle from '@/lib/models/Vehicle'
import Appointment from '@/lib/models/Appointment'

const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-blue-500 text-white',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-500',
}

const FUEL_ICON: Record<string, string> = {
    petrol: '⛽',
    diesel: '🛢️',
    electric: '⚡',
    cng: '💨',
    hybrid: '🔋',
}

async function getData(id: string) {
    await connectDB()
    const [customer, vehicles, appointments] = await Promise.all([
        Customer.findById(id).lean(),
        Vehicle.find({ customerId: id }).sort({ createdAt: -1 }).lean(),
        Appointment.find({ customerId: id })
            .populate('vehicleId', 'regNumber brand model')
            .sort({ date: -1 })
            .limit(10)
            .lean(),
    ])
    return { customer, vehicles, appointments }
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { customer, vehicles, appointments } = await getData(id)
    if (!customer) notFound()

    const c = customer as typeof customer & { name: string; phone: string; email?: string; address?: string; notes?: string; createdAt: Date }

    return (
        <div className="max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="pt-12 pb-6 flex items-center gap-3">
                <Link
                    href="/customers"
                    className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center"
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900">{c.name}</h1>
                    <p className="text-xs text-slate-400">Customer profile</p>
                </div>
                <Link
                    href={`/appointments/new?customerId=${id}`}
                    className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl"
                >
                    + Book
                </Link>
            </div>

            {/* Contact card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{c.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400">
                            Since {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <a href={`tel:${c.phone}`} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <span className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-600 text-base">📞</span>
                        {c.phone}
                    </a>
                    {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 text-sm text-slate-700">
                            <span className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-base">✉️</span>
                            {c.email}
                        </a>
                    )}
                    {c.address && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-700">
                            <span className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-base">📍</span>
                            {c.address}
                        </div>
                    )}
                </div>
                {c.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                        <p className="text-xs text-slate-400">{c.notes}</p>
                    </div>
                )}
            </div>

            {/* Vehicles */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicles</p>
                    <Link
                        href={`/customers/${id}/vehicles/new`}
                        className="text-xs font-semibold text-slate-900 flex items-center gap-1"
                    >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Vehicle
                    </Link>
                </div>

                {vehicles.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                        <p className="text-sm text-slate-400">No vehicles added yet</p>
                        <Link
                            href={`/customers/${id}/vehicles/new`}
                            className="mt-3 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2"
                        >
                            Add first vehicle
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {vehicles.map((v: any) => (
                            <div key={v._id.toString()} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
                                    {FUEL_ICON[v.fuelType ?? ''] ?? '🚗'}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 text-sm">{v.regNumber}</p>
                                    <p className="text-xs text-slate-400">{v.brand} {v.model} · {v.year}{v.color ? ` · ${v.color}` : ''}</p>
                                </div>
                                {v.odometer && (
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-slate-700">{v.odometer.toLocaleString()} km</p>
                                        <p className="text-[10px] text-slate-400">odometer</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Service History */}
            <div className="mb-8">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Service History</p>

                {appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                        <p className="text-sm text-slate-400">No service history yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {appointments.map((a: any) => (
                            <div key={a._id.toString()} className="bg-white rounded-2xl border border-slate-100 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{a.serviceType}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {' · '}{a.timeSlot}
                                        </p>
                                        {a.vehicleId && (
                                            <p className="text-xs text-slate-400 mt-0.5">{a.vehicleId.regNumber} · {a.vehicleId.brand} {a.vehicleId.model}</p>
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[a.status] ?? 'bg-slate-100 text-slate-500'}`}>
                                        {a.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
