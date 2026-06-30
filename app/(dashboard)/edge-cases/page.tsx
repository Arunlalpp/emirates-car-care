import Link from 'next/link'

type Severity = 'High' | 'Med' | 'Low'

interface EdgeCase {
    severity: Severity
    text: string
}

interface Category {
    label: string
    color: string
    items: EdgeCase[]
}

const CATEGORIES: Category[] = [
    {
        label: 'Appointments',
        color: 'bg-blue-500',
        items: [
            { severity: 'High', text: 'Double booking — two customers pick the same slot at the same time' },
            { severity: 'High', text: 'No-show handling — customer never arrives, slot stays blocked forever' },
            { severity: 'Med', text: 'Walk-in customer with no appointment needs instant job card' },
            { severity: 'Med', text: 'Customer reschedules last minute — old slot must free up immediately' },
            { severity: 'Low', text: 'Garage closed days/holidays should block booking on calendar' },
        ],
    },
    {
        label: 'Job cards and service status',
        color: 'bg-green-500',
        items: [
            { severity: 'High', text: 'Technician assigned is on leave or already has 5 active jobs' },
            { severity: 'High', text: 'Customer adds extra work mid-service — estimate needs revision and re-approval' },
            { severity: 'Med', text: 'Job paused waiting for a part — status needs "on hold" state, not just in-progress' },
            { severity: 'Med', text: "Vehicle ready but customer doesn't pick up for days — storage/reminder logic" },
            { severity: 'Low', text: 'Multiple technicians work on one job — who gets credited in KPI?' },
        ],
    },
    {
        label: 'Estimates and approval',
        color: 'bg-violet-500',
        items: [
            { severity: 'High', text: "Customer doesn't respond to estimate — car sits idle, no auto-escalation" },
            { severity: 'High', text: 'Customer partially approves (yes to brakes, no to AC) — estimate must split' },
            { severity: 'Med', text: 'Part price changes between estimate and invoice (vendor price update)' },
            { severity: 'Low', text: 'Customer has no smartphone — needs in-person approval fallback (signature)' },
        ],
    },
    {
        label: 'Billing and invoicing',
        color: 'bg-amber-500',
        items: [
            { severity: 'High', text: 'Partial payment — invoice must track paid vs due, not just paid/unpaid' },
            { severity: 'High', text: 'Invoice edited after generation — old PDF must stay valid for audit, new version tracked' },
            { severity: 'Med', text: 'Refund or discount applied after payment is already made' },
            { severity: 'Med', text: 'GST number missing or invalid for B2B customer invoices' },
            { severity: 'Low', text: 'Multiple payment methods for one invoice (part cash, part UPI)' },
        ],
    },
    {
        label: 'Inventory',
        color: 'bg-red-500',
        items: [
            { severity: 'High', text: 'Two job cards use the last unit of a part at the same time — stock goes negative' },
            { severity: 'Med', text: 'Part returned/unused after job completion — stock must be added back' },
            { severity: 'Low', text: 'Same part has different names/SKUs across vendors' },
        ],
    },
    {
        label: 'PWA and offline',
        color: 'bg-sky-500',
        items: [
            { severity: 'High', text: 'Technician updates job status offline — needs sync queue, not data loss' },
            { severity: 'High', text: 'Same record edited offline on two devices — conflict on reconnect' },
            { severity: 'Med', text: 'Photo uploads (inspection checklist) fail silently on weak signal' },
            { severity: 'Low', text: 'App installed on old Android — PWA install prompt may not trigger' },
        ],
    },
    {
        label: 'Customers and vehicles',
        color: 'bg-teal-500',
        items: [
            { severity: 'High', text: 'Same phone number used by two different customers (shared family phone)' },
            { severity: 'Med', text: 'Vehicle ownership transferred — service history should follow the car, not just the old owner' },
            { severity: 'Low', text: 'Duplicate customer entries from typos in phone/email' },
        ],
    },
    {
        label: 'Roles and permissions',
        color: 'bg-slate-500',
        items: [
            { severity: 'High', text: "Technician shouldn't see other customers' billing or pricing data" },
            { severity: 'Med', text: 'Staff member leaves — their assigned active jobs need reassignment' },
            { severity: 'Low', text: 'Owner wants to impersonate staff view for troubleshooting' },
        ],
    },
]

const BADGE: Record<Severity, string> = {
    High: 'bg-red-500 text-white',
    Med: 'bg-amber-500 text-white',
    Low: 'bg-blue-500 text-white',
}

export default function EdgeCasesPage() {
    return (
        <div className="min-h-screen bg-[#111] text-white pb-32">
            <div className="max-w-2xl mx-auto px-4 pt-10">
                {/* Legend */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">High</span>
                    <span className="text-slate-400 text-xs">breaks core flow</span>
                    <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Medium</span>
                    <span className="text-slate-400 text-xs">annoys users</span>
                    <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Low</span>
                    <span className="text-slate-400 text-xs">nice to handle</span>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {CATEGORIES.map(cat => (
                        <div key={cat.label} className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
                            {/* Category header */}
                            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cat.color}`} />
                                <span className="font-semibold text-sm text-white">{cat.label}</span>
                            </div>

                            {/* Items */}
                            <div className="divide-y divide-white/5">
                                {cat.items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 ${BADGE[item.severity]}`}>
                                            {item.severity}
                                        </span>
                                        <span className="text-sm text-slate-300 leading-snug">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom actions */}
                <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 lg:static lg:mt-6 lg:pb-0">
                    <div className="max-w-2xl mx-auto flex gap-3">
                        <Link
                            href="/edge-cases/schema"
                            className="flex-1 text-center bg-[#1c1c1e] border border-white/10 text-white text-sm font-medium py-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            Schema for high-severity cases ↗
                        </Link>
                        <Link
                            href="/edge-cases/offline-sync"
                            className="flex-1 text-center bg-[#1c1c1e] border border-white/10 text-white text-sm font-medium py-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            Offline sync strategy ↗
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
