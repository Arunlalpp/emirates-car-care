import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import DemoResetButton from '@/components/DemoResetButton'

const ROLE_LABEL: Record<string, string> = {
    owner: 'Garage Owner',
    staff: 'Staff Member',
    technician: 'Technician',
}

export default async function ProfilePage() {
    const session = await auth()
    if (!session) redirect('/login')

    const user = session.user
    const role = (user as { role?: string }).role ?? 'staff'

    const cardStyle = { background: 'var(--surface-1)', border: '1px solid var(--border-dim)' } as const

    const rowStyle = { borderTop: '1px solid var(--border-dim)' } as const

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-6">
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Account</p>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Profile</h1>
            </div>

            {/* Avatar + name */}
            <div className="rounded-2xl p-6 mb-4 flex items-center gap-4" style={cardStyle}>
                {user?.image ? (
                    <Image
                        src={user.image}
                        alt={user.name ?? ''}
                        width={56}
                        height={56}
                        className="rounded-xl object-cover"
                    />
                ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,164,74,0.15)', border: '1px solid rgba(200,164,74,0.3)' }}>
                        <span className="font-bold text-xl" style={{ color: '#C8A44A' }}>
                            {user?.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                )}
                <div>
                    <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{user?.name ?? '—'}</p>
                    <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                        style={{ background: 'rgba(200,164,74,0.12)', color: '#C8A44A', border: '1px solid rgba(200,164,74,0.25)' }}
                    >
                        {ROLE_LABEL[role] ?? role}
                    </span>
                </div>
            </div>

            {/* Account details */}
            <div className="rounded-2xl mb-4 overflow-hidden" style={cardStyle}>
                {[
                    { label: 'Email', value: user?.email ?? '—' },
                    { label: 'Role', value: ROLE_LABEL[role] ?? role },
                    { label: 'Session', value: '30-day persistent' },
                ].map((row, i) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3.5" style={i > 0 ? rowStyle : {}}>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                ))}
            </div>

            {/* Settings */}
            <div className="rounded-2xl mb-4 overflow-hidden" style={cardStyle}>
                <p className="px-4 pt-3.5 pb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Workshop Settings</p>
                <Link
                    href="/settings/pricing"
                    className="flex items-center justify-between px-4 py-3.5 transition-colors"
                    style={rowStyle}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,164,74,0.12)' }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#C8A44A" strokeWidth={1.8}>
                                <path strokeLinecap="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Service Pricing</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage parts, labour & service catalog</p>
                        </div>
                    </div>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <ThemeToggle />
            </div>

            {/* App info */}
            <div className="rounded-2xl mb-6 overflow-hidden" style={cardStyle}>
                {[
                    { label: 'App', value: 'GarageOS' },
                    { label: 'Version', value: '1.0.0' },
                    { label: 'Platform', value: 'PWA · Web' },
                ].map((row, i) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3.5" style={i > 0 ? rowStyle : {}}>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                ))}
            </div>

            {/* Demo reset — owner only */}
            {role === 'owner' && (
                <div className="mb-4">
                    <p className="px-1 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Developer</p>
                    <DemoResetButton />
                </div>
            )}

            {/* Sign out */}
            <form action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
            }}>
                <button
                    type="submit"
                    className="w-full py-4 rounded-2xl text-sm font-semibold active:scale-[0.98] transition-transform"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
                >
                    Sign Out
                </button>
            </form>

            <p className="text-xs text-center mt-6 pb-4" style={{ color: 'var(--text-muted)' }}>
                Emirates Car Care · Workshop Management
            </p>
        </div>
    )
}
