import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'

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

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="pt-12 pb-6">
                <p className="text-sm text-slate-400 font-medium">Account</p>
                <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
            </div>

            {/* Avatar + name */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-4 flex items-center gap-4">
                {user?.image ? (
                    <Image
                        src={user.image}
                        alt={user.name ?? ''}
                        width={56}
                        height={56}
                        className="rounded-xl object-cover"
                    />
                ) : (
                    <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                            {user?.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                )}
                <div>
                    <p className="font-bold text-slate-900 text-lg">{user?.name ?? '—'}</p>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full capitalize">
                        {ROLE_LABEL[role] ?? role}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
                {[
                    { label: 'Email', value: user?.email ?? '—' },
                    { label: 'Role', value: ROLE_LABEL[role] ?? role },
                    { label: 'Account', value: 'GarageOS Member' },
                ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-sm text-slate-400">{row.label}</span>
                        <span className="text-sm font-medium text-slate-900">{row.value}</span>
                    </div>
                ))}
            </div>

            {/* App info */}
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-6">
                {[
                    { label: 'App', value: 'GarageOS' },
                    { label: 'Version', value: '0.1.0' },
                    { label: 'Platform', value: 'PWA / Web' },
                ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-sm text-slate-400">{row.label}</span>
                        <span className="text-sm font-medium text-slate-900">{row.value}</span>
                    </div>
                ))}
            </div>

            {/* Sign out */}
            <form action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
            }}>
                <button
                    type="submit"
                    className="w-full bg-red-50 border border-red-100 text-red-600 py-4 rounded-2xl text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                    Sign Out
                </button>
            </form>
        </div>
    )
}
